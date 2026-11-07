"use client";

// ============================================================
// DENTALOS1 — Sending a message
//  • WhatsApp: opens the chat in the clinic's own WhatsApp (the number signed
//    in on this computer, in WhatsApp Web or the desktop app) with the text
//    filled in; staff press Send. WhatsApp doesn't allow apps to send from a
//    personal number on their own.
//  • SMS: sent through the clinic's SMS gateway (/api/messages/sms) when one
//    is configured on the server; otherwise the phone/computer's SMS app opens
//    with the text filled in.
// ============================================================

import { getMessagingSettings, MessageChannel } from "@/lib/messaging-store";

/** Bangladeshi numbers in international form without "+": "01711-234891" → "8801711234891". */
export function normalisePhone(phone: string): string {
  let d = (phone || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("01")) d = `88${d}`;
  if (d.length === 10 && d.startsWith("1")) d = `880${d}`;
  return d;
}

export function isValidPhone(phone: string): boolean {
  const d = normalisePhone(phone);
  return d.length >= 10 && d.length <= 15;
}

/** Link that opens a WhatsApp chat with `phone`, the text filled in. */
export function whatsappLink(phone: string, text: string): string {
  const to = normalisePhone(phone);
  const msg = encodeURIComponent(text);
  return getMessagingSettings().whatsappOpenWith === "app"
    ? `whatsapp://send?phone=${to}&text=${msg}`
    : `https://web.whatsapp.com/send?phone=${to}&text=${msg}`;
}

/** Open the WhatsApp chat. Returns false if the browser blocked the window. */
export function openWhatsApp(phone: string, text: string): boolean {
  const link = whatsappLink(phone, text);
  if (link.startsWith("whatsapp:")) {
    window.location.href = link;
    return true;
  }
  // Reuse one tab for WhatsApp Web so a campaign doesn't open dozens of tabs
  const win = window.open(link, "dentalos1-whatsapp");
  return !!win;
}

/** Open the device's SMS app with the text filled in. */
export function openSmsApp(phone: string, text: string) {
  window.location.href = `sms:+${normalisePhone(phone)}?body=${encodeURIComponent(text)}`;
}

export interface GatewayStatus {
  configured: boolean;
  provider?: string;
}

let statusCache: Promise<GatewayStatus> | null = null;

/** Whether the server has an SMS gateway set up. */
export function getSmsGatewayStatus(): Promise<GatewayStatus> {
  if (!statusCache) {
    statusCache = fetch("/api/messages/sms")
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .catch(() => ({ configured: false }));
  }
  return statusCache;
}

export interface SmsResult {
  to: string;
  ok: boolean;
  error?: string;
}

/** Send SMS through the gateway. Throws "not-configured" when there is none. */
export async function sendSmsViaGateway(messages: Array<{ to: string; body: string }>): Promise<SmsResult[]> {
  const res = await fetch("/api/messages/sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.map((m) => ({ to: normalisePhone(m.to), body: m.body })) }),
  });
  if (res.status === 501) throw new Error("not-configured");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `SMS gateway error (${res.status})`);
  return data.results as SmsResult[];
}

export type SendOutcome = { status: "sent" | "handed_over" | "failed"; error?: string };

/** Send one message on `channel`, falling back to the device's SMS app when there is no gateway. */
export async function sendOne(phone: string, body: string, channel: MessageChannel): Promise<SendOutcome> {
  if (!isValidPhone(phone)) return { status: "failed", error: "No valid phone number" };
  if (channel === "whatsapp") {
    return openWhatsApp(phone, body)
      ? { status: "handed_over" }
      : { status: "failed", error: "The browser blocked the WhatsApp window. Allow pop-ups for this site." };
  }
  try {
    const [r] = await sendSmsViaGateway([{ to: phone, body }]);
    return r?.ok ? { status: "sent" } : { status: "failed", error: r?.error || "Not sent" };
  } catch (err) {
    if ((err as Error).message === "not-configured") {
      openSmsApp(phone, body);
      return { status: "handed_over" };
    }
    return { status: "failed", error: (err as Error).message };
  }
}
