import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";

// Sends SMS through the clinic's gateway. Set these on the server (.env / Vercel):
//   SMS_PROVIDER=bulksmsbd   SMS_API_KEY=...   SMS_SENDER_ID=...     (BulkSMSBD, Bangladesh)
//   SMS_PROVIDER=http        SMS_API_URL=...   SMS_API_KEY=...  SMS_SENDER_ID=...
//     (any gateway that accepts POST JSON {to, message, sender} with "Authorization: Bearer <key>")
// Without a provider, GET says "not configured" and POST answers 501, and the
// app opens the device's SMS app instead.

export const dynamic = "force-dynamic";

const provider = (process.env.SMS_PROVIDER || "").toLowerCase();
const apiKey = process.env.SMS_API_KEY || "";
const senderId = process.env.SMS_SENDER_ID || "";
const apiUrl = process.env.SMS_API_URL || "";

function isConfigured(): boolean {
  if (provider === "bulksmsbd") return !!apiKey && !!senderId;
  if (provider === "http") return !!apiUrl && !!apiKey;
  return false;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ configured: isConfigured(), provider: isConfigured() ? provider : undefined });
}

const bodySchema = z.object({
  messages: z
    .array(z.object({ to: z.string().regex(/^\d{10,15}$/), body: z.string().min(1).max(1000) }))
    .min(1)
    .max(200),
});

async function sendOne(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
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
  if (!isConfigured()) return NextResponse.json({ error: "No SMS gateway is set up." }, { status: 501 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid messages." }, { status: 400 });

  const results = [];
  // A few at a time, to stay within gateway rate limits
  const queue = [...parsed.data.messages];
  while (queue.length > 0) {
    const chunk = queue.splice(0, 5);
    const done = await Promise.all(chunk.map((m) => sendOne(m.to, m.body).then((r) => ({ to: m.to, ...r }))));
    results.push(...done);
  }
  return NextResponse.json({ results });
}
