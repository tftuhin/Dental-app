import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { getClinicalModel } from "@/lib/ai-model";

// Drafts a prescription from the visit record. The doctor reviews and edits
// every line before signing; nothing here is saved automatically.

const requestSchema = z.object({
  patient: z.object({
    age: z.number().optional(),
    gender: z.string().optional(),
    allergies: z.array(z.string()).default([]),
    medicalConditions: z.array(z.string()).default([]),
  }),
  chiefComplaint: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  clinicalNotes: z.string().optional(),
  diagnosis: z.string().optional(),
  findings: z.record(z.string(), z.unknown()).optional(),
  vitals: z.record(z.string(), z.unknown()).optional(),
  procedures: z.array(z.string()).optional(),
  procedureNotes: z.string().optional(),
  catalog: z
    .array(
      z.object({
        brandName: z.string(),
        genericName: z.string().optional(),
        strength: z.string().optional(),
        dosageForm: z.string().optional(),
      })
    )
    .max(300)
    .optional(),
});

const draftSchema = z.object({
  diagnosis: z.string().describe("Working diagnosis for today, with tooth number if relevant"),
  medicines: z
    .array(
      z.object({
        brandName: z.string().describe("Brand from the clinic catalog when one fits"),
        genericName: z.string(),
        strength: z.string(),
        dosageForm: z.string().describe("Tablet, Capsule, Syrup, Oral Rinse, Gel…"),
        frequency: z.string().describe("Bangladeshi notation, e.g. 1+0+1"),
        duration: z.string().describe("e.g. 5 days"),
        timing: z.string().describe("e.g. After food"),
        instructions: z.string(),
      })
    )
    .max(8),
  tests: z.array(z.string()).max(6).describe("Investigations still needed (not ones already done today)"),
  advice: z.string().describe("Short post-visit advice for the patient, as sentences"),
  rationale: z
    .string()
    .describe("2-4 sentences: why these drugs, and how allergies and medical conditions were taken into account"),
});

function line(label: string, value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.length ? `${label}: ${value.join(", ")}\n` : "";
  if (typeof value === "object") {
    const parts = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== "" && v != null)
      .map(([k, v]) => `${k} ${v}`);
    return parts.length ? `${label}: ${parts.join(", ")}\n` : "";
  }
  const s = String(value).trim();
  return s ? `${label}: ${s}\n` : "";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const v = parsed.data;

  const catalogText = (v.catalog || [])
    .map((m) => `- ${m.brandName}${m.genericName ? ` (${m.genericName})` : ""} ${m.strength || ""} ${m.dosageForm || ""}`.trim())
    .join("\n");

  const prompt =
    `PATIENT\n` +
    line("Age", v.patient.age) +
    line("Gender", v.patient.gender) +
    `Drug allergies: ${v.patient.allergies.length ? v.patient.allergies.join(", ") : "none recorded"}\n` +
    `Medical conditions: ${v.patient.medicalConditions.length ? v.patient.medicalConditions.join(", ") : "none recorded"}\n\n` +
    `TODAY'S VISIT\n` +
    line("Chief complaint", v.chiefComplaint) +
    line("Symptoms", v.symptoms) +
    line("Examination", v.findings) +
    line("Vitals", v.vitals) +
    line("Doctor's notes", v.clinicalNotes) +
    line("Working diagnosis", v.diagnosis) +
    line("Procedures done today", v.procedures) +
    line("Procedure notes", v.procedureNotes) +
    (catalogText ? `\nCLINIC MEDICINE CATALOG (prefer these brands)\n${catalogText}\n` : "");

  try {
    const { object } = await generateObject({
      model: getClinicalModel(),
      schema: draftSchema,
      temperature: 0.2,
      system:
        "You draft dental prescriptions for a clinic in Bangladesh, for a dentist to review and edit before signing. " +
        "Base the draft only on the visit details given. Prescribe the minimum appropriate medicines for the procedures and diagnosis. " +
        "Never include a drug the patient is allergic to or a cross-reacting drug, and account for every medical condition " +
        "(e.g. NSAID caution in asthma, kidney disease or anticoagulant use; dose limits in liver disease; pregnancy safety). " +
        "If antibiotics are not indicated, do not add them. Use Bangladeshi frequency notation like 1+0+1. " +
        "If information is missing, keep the draft conservative and say so in the rationale.",
      prompt,
    });
    return NextResponse.json(object);
  } catch (err) {
    console.error("AI prescription draft failed:", err);
    const message = err instanceof Error ? err.message : "AI request failed";
    const status = /api key|apikey|unauthor/i.test(message) ? 503 : 500;
    return NextResponse.json(
      { error: status === 503 ? "AI is not configured (missing or invalid API key)." : "AI draft failed. Try again." },
      { status }
    );
  }
}
