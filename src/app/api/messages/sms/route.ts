import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { isDatabaseConfigured } from "@/db";
import { getAndroidGateway, sendViaAndroid } from "@/lib/server/android-gateway";

// Sends SMS automatically, by one of two routes (chosen in Settings → Messages):
//  • "android": the clinic's Android phone running SMS Gateway for Android
//    (connected from Settings; see /api/messages/android-gateway).
//  • "provider": a bulk SMS gateway set in the server environment:
//      SMS_PROVIDER=bulksmsbd   SMS_API_KEY=...   SMS_SENDER_ID=...     (BulkSMSBD, Bangladesh)
//      SMS_PROVIDER=http        SMS_API_URL=...   SMS_API_KEY=...  SMS_SENDER_ID=...
//        (POST JSON {to, message, sender} with "Authorization: Bearer <key>")
// The third choice, "this computer's SMS app", never calls the server.

export const dynamic = "force-dynamic";

const provider = (process.env.SMS_PROVIDER || "").toLowerCase();
const apiKey = process.env.SMS_API_KEY || "";
const senderId = process.env.SMS_SENDER_ID || "";
const apiUrl = process.env.SMS_API_URL || "";

function providerConfigured(): boolean {
  if (provider === "bulksmsbd") return !!apiKey && !!senderId;
  if (provider === "http") return !!apiUrl && !!apiKey;
  return false;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clinicId = session.user.clinicId;
  const android = clinicId && isDatabaseConfigured ? await getAndroidGateway(clinicId).catch(() => null) : null;
  return NextResponse.json({
    configured: providerConfigured(),
    provider: providerConfigured() ? provider : undefined,
    android: { connected: !!android, phone: android?.phone || "" },
  });
}

const bodySchema = z.object({
  via: z.enum(["android", "provider"]).default("provider"),
  messages: z
    .array(z.object({ to: z.string().regex(/^\d{10,15}$/), body: z.string().min(1).max(1000) }))
    .min(1)
    .max(200),
});

async function sendViaProvider(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (provider === "bulksmsbd") {
      const form = new URLSearchParams({ api_key: apiKey, type: "text", number: to, senderid: senderId, message });
      const res = await fetch("http://bulksmsbd.net/api/smsapi", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      // BulkSMSBD answers response_code 202 when the SMS is accepted
      const ok = res.ok && Number(data.response_code) === 202;
      return ok ? { ok } : { ok, error: data.error_message || data.success_message || `Gateway error (${res.status})` };
    }
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ to, message, sender: senderId }),
    });
    return res.ok ? { ok: true } : { ok: false, error: `Gateway error (${res.status})` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Gateway unreachable" };
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid messages." }, { status: 400 });
  const { via, messages } = parsed.data;

  let send: (to: string, body: string) => Promise<{ ok: boolean; error?: string }>;
  if (via === "android") {
    const clinicId = session.user.clinicId;
    const gateway = clinicId && isDatabaseConfigured ? await getAndroidGateway(clinicId).catch(() => null) : null;
    if (!gateway) return NextResponse.json({ error: "No Android phone is connected." }, { status: 501 });
    send = (to, body) => sendViaAndroid(gateway, to, body);
  } else {
    if (!providerConfigured()) return NextResponse.json({ error: "No SMS gateway is set up." }, { status: 501 });
    send = sendViaProvider;
  }

  // A few at a time, to stay within the gateway's limits (the phone queues them itself)
  const results = [];
  const queue = [...messages];
  while (queue.length > 0) {
    const chunk = queue.splice(0, 5);
    results.push(...(await Promise.all(chunk.map((m) => send(m.to, m.body).then((r) => ({ to: m.to, ...r }))))));
  }
  return NextResponse.json({ results });
}
