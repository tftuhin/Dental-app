import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { clinicRecords } from "@/db/schema";
import { isValidInboundToken } from "@/lib/server/android-gateway";

// SMS received by the clinic's Android phone, forwarded by SMS Gateway for
// Android ("sms:received" webhook). The address carries a per-clinic secret
// (see inboundToken). Each SMS is saved to the clinic's inbox
// (clinic_records, collection "message_inbox"), which every staff browser syncs.

export const dynamic = "force-dynamic";

const eventSchema = z.object({
  event: z.string(),
  id: z.string().optional(),
  payload: z
    .object({
      messageId: z.string().optional(),
      message: z.string().default(""),
      sender: z.string().default(""),
      recipient: z.string().nullish(),
      simNumber: z.number().nullish(),
      receivedAt: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  const clinicId = params.get("clinic") || "";
  if (!isDatabaseConfigured || !/^[0-9a-f-]{36}$/i.test(clinicId) || !isValidInboundToken(clinicId, params.get("token") || "")) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const { event, payload, id } = parsed.data;
  // Other events (sent, delivered...) aren't used yet; accept so the gateway doesn't retry
  if (event !== "sms:received" || !payload) return NextResponse.json({ ok: true });

  const received = payload.receivedAt ? new Date(payload.receivedAt) : new Date();
  const receivedAt = isNaN(received.getTime()) ? new Date().toISOString() : received.toISOString();
  const recordId = `in-${(payload.messageId || id || `${payload.sender}-${receivedAt}`).replace(/[^\w.-]/g, "").slice(0, 150)}`;
  const data = {
    id: recordId,
    from: payload.sender,
    body: payload.message.slice(0, 2000),
    receivedAt,
    read: false,
    sim: payload.recipient || undefined,
  };

  await db
    .insert(clinicRecords)
    .values({
      clinicId,
      collection: "message_inbox",
      recordId,
      data,
      // Newest first
      pos: -Math.floor(new Date(receivedAt).getTime() / 1000),
      deleted: false,
      version: sql`nextval('clinic_records_version_seq')`,
      updatedAt: sql`now()`,
    })
    // The gateway may resend the same SMS; keep the first copy
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}
