// ============================================================
// DENTALOS1 — Patient ID Atomic Generator
// Uses PostgreSQL UPSERT for concurrency-safe sequence generation
// ============================================================

import { db } from "@/db";
import { patientIdCounters, clinicSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Parse a patient ID pattern and generate the next ID atomically.
 * Pattern tokens: {YYYY}, {YY}, {MM}, {SEQ:N}
 * Example: "DENT-{YYYY}-{SEQ:5}" => "DENT-2024-00042"
 */
export async function generatePatientId(clinicId: string): Promise<string> {
  // Fetch clinic's ID pattern
  const [settings] = await db
    .select({ pattern: clinicSettings.patientIdPattern })
    .from(clinicSettings)
    .where(eq(clinicSettings.clinicId, clinicId))
    .limit(1);

  const pattern = settings?.pattern ?? "DENT-{YYYY}-{SEQ:5}";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Extract prefix from pattern (everything before the first {SEQ})
  const prefixMatch = pattern.match(/^([^{]*)/);
  const rawPrefix = prefixMatch ? prefixMatch[1].replace(/-$/, "") : "DENT";

  // Resolve date tokens in prefix for the key
  const resolvedPrefix = rawPrefix
    .replace("{YYYY}", String(year))
    .replace("{YY}", String(year).slice(-2))
    .replace("{MM}", String(month).padStart(2, "0"));

  // Atomic UPSERT to get next sequence
  const result = await db.execute(sql`
    INSERT INTO patient_id_counters (clinic_id, prefix, current_year, current_month, last_sequence)
    VALUES (${clinicId}, ${resolvedPrefix}, ${year}, ${month}, 1)
    ON CONFLICT (clinic_id, prefix, current_year, current_month)
    DO UPDATE SET last_sequence = patient_id_counters.last_sequence + 1
    RETURNING last_sequence
  `);

  const sequence = Number((result.rows[0] as { last_sequence: number }).last_sequence);

  // Build the final ID by replacing all tokens
  const seqMatch = pattern.match(/\{SEQ:(\d+)\}/);
  const seqPadding = seqMatch ? parseInt(seqMatch[1]) : 5;

  let finalId = pattern
    .replace("{YYYY}", String(year))
    .replace("{YY}", String(year).slice(-2))
    .replace("{MM}", String(month).padStart(2, "0"))
    .replace(/\{SEQ:\d+\}/, String(sequence).padStart(seqPadding, "0"));

  return finalId;
}

/**
 * Preview what the next patient ID will look like (without consuming the sequence)
 */
export async function previewPatientId(clinicId: string): Promise<string> {
  const [settings] = await db
    .select({ pattern: clinicSettings.patientIdPattern })
    .from(clinicSettings)
    .where(eq(clinicSettings.clinicId, clinicId))
    .limit(1);

  const pattern = settings?.pattern ?? "DENT-{YYYY}-{SEQ:5}";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const prefixMatch = pattern.match(/^([^{]*)/);
  const rawPrefix = prefixMatch ? prefixMatch[1].replace(/-$/, "") : "DENT";
  const resolvedPrefix = rawPrefix
    .replace("{YYYY}", String(year))
    .replace("{YY}", String(year).slice(-2))
    .replace("{MM}", String(month).padStart(2, "0"));

  const [existing] = await db
    .select({ lastSeq: patientIdCounters.lastSequence })
    .from(patientIdCounters)
    .where(
      and(
        eq(patientIdCounters.clinicId, clinicId),
        eq(patientIdCounters.prefix, resolvedPrefix),
        eq(patientIdCounters.currentYear, year),
        eq(patientIdCounters.currentMonth, month)
      )
    )
    .limit(1);

  const nextSeq = (existing?.lastSeq ?? 0) + 1;
  const seqMatch = pattern.match(/\{SEQ:(\d+)\}/);
  const seqPadding = seqMatch ? parseInt(seqMatch[1]) : 5;

  return pattern
    .replace("{YYYY}", String(year))
    .replace("{YY}", String(year).slice(-2))
    .replace("{MM}", String(month).padStart(2, "0"))
    .replace(/\{SEQ:\d+\}/, String(nextSeq).padStart(seqPadding, "0"));
}
