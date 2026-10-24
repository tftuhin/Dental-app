import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";


interface CopilotContext {
  patient: {
    age: number;
    gender: string;
    medicalAlerts: string[];
    currentMedications?: string;
  };
  symptoms: string[];
  customSymptoms?: string[];
  chiefComplaint?: string;
  clinicalNotes?: string;
  activeTooth?: string;
  odontogramSummary?: string;
}

function buildDentalCopilotPrompt(ctx: CopilotContext): string {
  const allergyList = ctx.patient.medicalAlerts
    .filter(
      (a) => a.toLowerCase().includes("allergy") || a.toLowerCase().includes("allergic")
    )
    .join(", ");

  const medicalConditions = ctx.patient.medicalAlerts
    .filter(
      (a) => !a.toLowerCase().includes("allergy") && !a.toLowerCase().includes("allergic")
    )
    .join(", ");

  const allSymptoms = [...(ctx.symptoms || []), ...(ctx.customSymptoms || [])];

  return `You are DentAI Copilot, an expert dental clinical decision support system. You provide evidence-based recommendations to dentists at the chairside.

## PATIENT CONTEXT
- Age: ${ctx.patient.age} years
- Gender: ${ctx.patient.gender}
- Drug Allergies: ${allergyList || "None reported"}
- Medical Conditions: ${medicalConditions || "None reported"}
- Current Medications: ${ctx.patient.currentMedications || "None reported"}

## PRESENTING COMPLAINTS / SYMPTOMS
${allSymptoms.length > 0 ? allSymptoms.map((s) => `- ${s}`).join("\n") : "No symptoms selected"}

## CHIEF COMPLAINT
${ctx.chiefComplaint || "Not specified"}

## CLINICAL NOTES
${ctx.clinicalNotes || "Not provided"}

## TOOTH/ODONTOGRAM CONTEXT
${ctx.odontogramSummary || ctx.activeTooth ? `Active tooth: ${ctx.activeTooth}\n${ctx.odontogramSummary || ""}` : "Not specified"}

---

Please provide a comprehensive clinical decision support response with EXACTLY these 4 sections in order:

### 1. DIFFERENTIAL DIAGNOSES
List 2-4 most likely diagnoses with rationale. Format each as:
**[Diagnosis Name] (ICD-10: [code])**
Rationale: [brief clinical reasoning]

### 2. RECOMMENDED DIAGNOSTIC TESTS
List specific tests needed. Format each as:
- **[Test Name]**: [clinical indication and urgency]

### 3. RECOMMENDED CDT PROCEDURES
List procedures by priority. Format each as:
- **[CDT Code] - [Procedure Name]**: [brief rationale]

### 4. PHARMACOTHERAPY RECOMMENDATIONS
⚠️ CRITICAL: Check ALL drug recommendations against the patient's allergies before suggesting.
${allergyList ? `PATIENT IS ALLERGIC TO: ${allergyList} — DO NOT prescribe these or cross-reactive drugs.` : "No known allergies on file."}

For each drug, format as:
- **[Brand/Generic Name] [Strength] [Form]** — [Frequency], [Duration], [Timing]
  Indication: [why prescribed]
  ${allergyList ? "Allergy check: ✅ Safe / ⚠️ CONTRAINDICATED" : ""}

End your response with a brief **Clinical Reasoning Summary** paragraph.`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const ctx = body as CopilotContext;

  const provider = process.env.AI_PROVIDER ?? "anthropic";

  const model =
    provider === "openai"
      ? openai("gpt-4o")
      : anthropic("claude-3-5-sonnet-20241022");

  const result = streamText({
    model,
    system: `You are DentAI Copilot, a specialized dental clinical decision support AI assistant. 
You provide evidence-based, safety-first recommendations. You NEVER suggest medications that contraindicate a patient's known allergies. 
You communicate clearly and concisely for busy clinicians.`,
    messages: [
      {
        role: "user",
        content: buildDentalCopilotPrompt(ctx),
      },
    ],
    temperature: 0.3,
  });

  return result.toTextStreamResponse();
}
