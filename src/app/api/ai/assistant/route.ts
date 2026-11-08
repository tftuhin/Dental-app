import { streamText } from "ai";
import { auth } from "@/auth";
import { getClinicalModel } from "@/lib/ai-model";


interface AssistantContext {
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

function buildDentalAssistantPrompt(ctx: AssistantContext): string {
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

  return `You are the DentalOS1 AI Assistant, an expert dental clinical decision support system. You provide evidence-based recommendations to dentists at the chairside.

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
  // AI calls cost money: only signed-in staff may use them
  const session = await auth();
  if (!session?.user) {
    return new Response("Not signed in", { status: 401 });
  }

  const body = await req.json();
  const ctx = body as AssistantContext;

  const model = getClinicalModel();

  const result = streamText({
    model,
    system: `You are the DentalOS1 AI Assistant, a specialized dental clinical decision support assistant. 
You provide evidence-based, safety-first recommendations. You NEVER suggest medications that contraindicate a patient's known allergies. 
You communicate clearly and concisely for busy clinicians.`,
    messages: [
      {
        role: "user",
        content: buildDentalAssistantPrompt(ctx),
      },
    ],
    temperature: 0.3,
  });

  return result.toTextStreamResponse();
}
