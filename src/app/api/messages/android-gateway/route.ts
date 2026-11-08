import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { isDatabaseConfigured } from "@/db";
import {
  getAndroidGateway,
  registerInboundWebhook,
  removeInboundWebhooks,
  saveAndroidGateway,
  testAndroidGateway,
} from "@/lib/server/android-gateway";

// Connect the clinic's Android phone (SMS Gateway for Android, cloud mode).
// GET: status. PUT {username, password, phone}: check the login, set up
// receiving, and save. DELETE: disconnect. Only the clinic owner can change it.

export const dynamic = "force-dynamic";

async function owner() {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isDatabaseConfigured || !session.user.clinicId) {
    return { error: NextResponse.json({ error: "Needs the clinic database." }, { status: 409 }) };
  }
  return { session, clinicId: session.user.clinicId };
}

/** The site's public address, for the gateway to post received SMS to. Localhost can't be reached from outside. */
function publicOrigin(request: Request): string | null {
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  if (!host || /^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.)/.test(host)) return null;
  return `${proto}://${host}`;
}

export async function GET() {
  const o = await owner();
  if ("error" in o) return o.error;
  const g = await getAndroidGateway(o.clinicId);
  return NextResponse.json({ connected: !!g, phone: g?.phone || "", username: g?.username || "" });
}

const bodySchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
  phone: z.string().trim().max(30).default(""),
});

export async function PUT(request: Request) {
  const o = await owner();
  if ("error" in o) return o.error;
  if (o.session.user.role !== "clinic_owner" && o.session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Only the clinic owner can connect the phone." }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the username and password from the app." }, { status: 400 });

  const test = await testAndroidGateway(parsed.data);
  if (!test.ok) return NextResponse.json({ error: test.error }, { status: 400 });

  const gateway = { username: parsed.data.username, password: parsed.data.password, phone: parsed.data.phone };
  await saveAndroidGateway(o.clinicId, gateway);

  const origin = publicOrigin(request);
  const receiving = origin
    ? await registerInboundWebhook(gateway, origin, o.clinicId)
    : { ok: false, error: "Replies can only be received on the hosted (internet) site, not on a local copy. Sending works." };

  return NextResponse.json({ connected: true, devices: test.devices, receiving: receiving.ok, receivingError: receiving.error });
}

export async function DELETE() {
  const o = await owner();
  if ("error" in o) return o.error;
  if (o.session.user.role !== "clinic_owner" && o.session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Only the clinic owner can disconnect the phone." }, { status: 403 });
  }
  const g = await getAndroidGateway(o.clinicId);
  if (g) await removeInboundWebhooks(g).catch(() => undefined);
  await saveAndroidGateway(o.clinicId, null);
  return NextResponse.json({ connected: false });
}
