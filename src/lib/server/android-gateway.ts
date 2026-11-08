import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clinicSettings } from "@/db/schema";

// ============================================================
// Android phone as SMS gateway (SMS Gateway for Android, sms-gate.app,
// cloud mode). The clinic installs the app on an Android phone with a SIM;
// the app's cloud username/password are stored here (server only, never
// sent to browsers). Messages go out from the phone's SIM, and SMS the
// phone receives are forwarded to /api/messages/inbound.
// API: https://capcom6.github.io/android-sms-gateway/ (swagger.json)
// ============================================================

const API = "https://api.sms-gate.app/3rdparty/v1";
export const ANDROID_PROVIDER = "sms-gate";

export interface AndroidGateway {
  username: string;
  password: string;
  /** The SIM's number, shown to staff. */
  phone: string;
}

function authHeader(g: Pick<AndroidGateway, "username" | "password">) {
  return `Basic ${Buffer.from(`${g.username}:${g.password}`).toString("base64")}`;
}

export async function getAndroidGateway(clinicId: string): Promise<AndroidGateway | null> {
  const [row] = await db
    .select({ provider: clinicSettings.smsProvider, key: clinicSettings.smsApiKey, secret: clinicSettings.smsApiSecret, phone: clinicSettings.smsFromNumber })
    .from(clinicSettings)
    .where(eq(clinicSettings.clinicId, clinicId))
    .limit(1);
  if (!row || row.provider !== ANDROID_PROVIDER || !row.key || !row.secret) return null;
  return { username: row.key, password: row.secret, phone: row.phone || "" };
}

export async function saveAndroidGateway(clinicId: string, g: AndroidGateway | null): Promise<void> {
  const values = g
    ? { smsProvider: ANDROID_PROVIDER, smsApiKey: g.username, smsApiSecret: g.password, smsFromNumber: g.phone, smsEnabled: true }
    : { smsProvider: null, smsApiKey: null, smsApiSecret: null, smsFromNumber: null };
  await db
    .insert(clinicSettings)
    .values({ clinicId, ...values, updatedAt: new Date() })
    .onConflictDoUpdate({ target: clinicSettings.clinicId, set: { ...values, updatedAt: new Date() } });
}

async function call(g: Pick<AndroidGateway, "username" | "password">, path: string, init: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: authHeader(g), "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });
}

/** Checks the login and returns how many phones are registered on it. */
export async function testAndroidGateway(g: Pick<AndroidGateway, "username" | "password">): Promise<{ ok: true; devices: number } | { ok: false; error: string }> {
  try {
    const res = await call(g, "/devices");
    if (res.status === 401 || res.status === 403) return { ok: false, error: "The username or password is wrong." };
    if (!res.ok) return { ok: false, error: `The gateway answered ${res.status}.` };
    const list = await res.json().catch(() => []);
    const devices = Array.isArray(list) ? list.length : 0;
    if (devices === 0) return { ok: false, error: "No phone is connected to this account. Open the app on the phone and turn on the cloud server." };
    return { ok: true, devices };
  } catch {
    return { ok: false, error: "Could not reach the SMS gateway service." };
  }
}

/** Send one text to one number (international digits, e.g. 8801711234891). */
export async function sendViaAndroid(g: AndroidGateway, to: string, text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await call(g, "/messages", {
      method: "POST",
      body: JSON.stringify({ textMessage: { text }, phoneNumbers: [`+${to}`], withDeliveryReport: true }),
    });
    if (res.status === 202 || res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body?.message || `Phone gateway error (${res.status})` };
  } catch {
    return { ok: false, error: "Could not reach the SMS gateway service." };
  }
}

// ─── Incoming SMS ───────────────────────────────────────────

/** Secret in the webhook address, so only the gateway can post replies for this clinic. */
export function inboundToken(clinicId: string): string {
  const key = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dentalos1-local-development-only-secret-0000";
  return createHmac("sha256", key).update(`inbound-sms:${clinicId}`).digest("hex").slice(0, 40);
}

export function isValidInboundToken(clinicId: string, token: string): boolean {
  const expected = Buffer.from(inboundToken(clinicId));
  const given = Buffer.from(token || "");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

const INBOUND_PATH = "/api/messages/inbound";

/** Point the gateway's "SMS received" events at this clinic's inbox (replacing earlier DentalOS1 hooks). */
export async function registerInboundWebhook(g: AndroidGateway, origin: string, clinicId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await removeInboundWebhooks(g);
    const url = `${origin}${INBOUND_PATH}?clinic=${clinicId}&token=${inboundToken(clinicId)}`;
    const res = await call(g, "/webhooks", { method: "POST", body: JSON.stringify({ url, event: "sms:received" }) });
    return res.ok || res.status === 201 ? { ok: true } : { ok: false, error: `Could not set up receiving (${res.status}).` };
  } catch {
    return { ok: false, error: "Could not set up receiving." };
  }
}

export async function removeInboundWebhooks(g: Pick<AndroidGateway, "username" | "password">): Promise<void> {
  const res = await call(g, "/webhooks");
  if (!res.ok) return;
  const hooks = (await res.json().catch(() => [])) as Array<{ id: string; url: string }>;
  for (const h of Array.isArray(hooks) ? hooks : []) {
    if (h.url?.includes(INBOUND_PATH)) await call(g, `/webhooks/${h.id}`, { method: "DELETE" });
  }
}
