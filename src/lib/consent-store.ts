"use client";

// ============================================================
// DENTALOSBD — Consent forms
// Before a patient goes on to a procedure or surgery, a consent form is
// filled from the visit, printed, and signed on paper by the patient (or
// guardian) and the doctor. The wording is edited in Settings → Consent
// Forms; {{placeholders}} are replaced with the patient's details.
// ============================================================

import { clinicStorage } from "@/lib/clinic-storage";

export type ConsentKind = "procedure" | "surgery";

export interface ConsentTemplate {
  id: string;
  name: string;
  /** Which hand-off it is offered for first. "any" templates are offered for both. */
  appliesTo: ConsentKind | "any";
  /** Heading printed on the form. */
  title: string;
  /** Plain text. Blank lines separate paragraphs; lines starting with "- " are bullet points. */
  body: string;
  isActive: boolean;
  updatedAt?: string;
}

export const CONSENT_PLACEHOLDERS: Array<{ key: string; label: string }> = [
  { key: "patient_name", label: "Patient's full name" },
  { key: "patient_id", label: "Patient ID" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "guardian_name", label: "Guardian (for a minor), else blank" },
  { key: "procedure", label: "Planned procedure or surgery" },
  { key: "teeth", label: "Tooth / teeth" },
  { key: "diagnosis", label: "Provisional diagnosis" },
  { key: "anaesthesia", label: "Anaesthesia" },
  { key: "estimated_cost", label: "Estimated cost" },
  { key: "allergies", label: "Known allergies" },
  { key: "medical_conditions", label: "Medical conditions" },
  { key: "doctor_name", label: "Doctor's name" },
  { key: "doctor_degree", label: "Doctor's degrees" },
  { key: "doctor_bmdc", label: "Doctor's BMDC registration" },
  { key: "clinic_name", label: "Clinic name" },
  { key: "clinic_address", label: "Clinic address" },
  { key: "clinic_phone", label: "Clinic phone" },
  { key: "date", label: "Today's date" },
];

export const DEFAULT_CONSENT_TEMPLATES: ConsentTemplate[] = [
  {
    id: "consent-procedure",
    name: "Dental procedure",
    appliesTo: "procedure",
    title: "Informed Consent for Dental Treatment",
    isActive: true,
    body: `I, {{patient_name}} (Patient ID {{patient_id}}, age {{age}}), give my consent to {{doctor_name}} ({{doctor_degree}}, BMDC Reg. {{doctor_bmdc}}) and the staff of {{clinic_name}} to carry out the following treatment:

Treatment: {{procedure}}
Tooth / teeth: {{teeth}}
Diagnosis: {{diagnosis}}
Anaesthesia: {{anaesthesia}}
Estimated cost: {{estimated_cost}}

The doctor has explained to me, in words I understand, the nature and purpose of this treatment, the other options available (including no treatment), and the expected benefits.

I understand that, as with any treatment, there are risks. These may include:
- Pain, swelling, bruising or sensitivity after treatment
- Bleeding or infection
- Reaction to the local anaesthetic or medicines
- Numbness of the lip, tongue or chin, which is usually temporary
- The need for further treatment if the result is not as expected

I have told the doctor about my medical history, medicines and allergies (known allergies: {{allergies}}; medical conditions: {{medical_conditions}}). I agree to follow the care instructions given to me after treatment.

If something unexpected is found during treatment, I agree that the doctor may do what is necessary in my best interest.

I have had the chance to ask questions and all my questions have been answered. I am signing this form of my own free will.`,
  },
  {
    id: "consent-surgery",
    name: "Oral surgery / extraction",
    appliesTo: "surgery",
    title: "Informed Consent for Oral Surgery",
    isActive: true,
    body: `I, {{patient_name}} (Patient ID {{patient_id}}, age {{age}}), give my consent for the following oral surgery to be performed by {{doctor_name}} ({{doctor_degree}}, BMDC Reg. {{doctor_bmdc}}) at {{clinic_name}}:

Surgery: {{procedure}}
Tooth / site: {{teeth}}
Diagnosis: {{diagnosis}}
Anaesthesia: {{anaesthesia}}
Estimated cost: {{estimated_cost}}

The doctor has explained the reason for the surgery, how it will be done, the other options available, and what may happen if I choose not to have it.

I understand the risks of oral surgery, which include:
- Pain, swelling, bruising and limited mouth opening for a few days
- Bleeding during or after surgery
- Infection or dry socket, which may need further care
- Damage to nearby teeth, fillings or crowns
- Numbness or tingling of the lip, chin or tongue from nerve injury, which is usually temporary but can rarely be permanent
- An opening into the sinus (for upper back teeth), or fracture of the tooth root or jaw in rare cases
- Reaction to the anaesthetic or medicines

I have disclosed my full medical history, current medicines and allergies (known allergies: {{allergies}}; medical conditions: {{medical_conditions}}). I agree to follow all instructions before and after surgery and to return for review.

If an unexpected condition is found during surgery, I authorise the doctor to do what is medically necessary.

I have read (or had read to me) and understood this form, my questions have been answered, and I give my consent freely.`,
  },
  {
    id: "consent-ortho",
    name: "Orthodontic treatment",
    appliesTo: "procedure",
    title: "Informed Consent for Orthodontic Treatment",
    isActive: true,
    body: `I, {{patient_name}} (Patient ID {{patient_id}}, age {{age}}), or I as parent / guardian {{guardian_name}}, consent to orthodontic treatment by {{doctor_name}} ({{doctor_degree}}, BMDC Reg. {{doctor_bmdc}}) at {{clinic_name}}.

Treatment: {{procedure}}
Estimated cost: {{estimated_cost}}

I understand that orthodontic treatment takes many months, that the result depends on regular visits, good oral hygiene and wearing appliances or elastics as instructed, and that the treatment time may be longer than first estimated.

Possible risks include:
- Discomfort or ulcers for a few days after adjustments
- Decay or white marks on teeth if brushing and diet are poor
- Gum problems or shortening of tooth roots
- Teeth moving back after treatment if retainers are not worn as advised
- Jaw joint (TMJ) discomfort

I agree to attend all appointments, to look after my teeth and appliances, and to wear retainers after treatment as instructed.

My questions have been answered and I give my consent freely.`,
  },
  {
    id: "consent-prostho",
    name: "Crown, bridge, denture or implant",
    appliesTo: "procedure",
    title: "Informed Consent for Prosthodontic Treatment",
    isActive: true,
    body: `I, {{patient_name}} (Patient ID {{patient_id}}, age {{age}}), consent to the following prosthodontic treatment by {{doctor_name}} ({{doctor_degree}}, BMDC Reg. {{doctor_bmdc}}) at {{clinic_name}}:

Treatment: {{procedure}}
Tooth / teeth: {{teeth}}
Estimated cost: {{estimated_cost}}

The doctor has explained the treatment, the materials to be used, the number of visits needed (including laboratory work), and the other options available.

I understand that:
- Teeth may need to be reshaped, and may become sensitive or need root canal treatment later
- Temporary crowns or dentures may come loose and need re-fixing
- The colour and shape are matched as closely as possible but may differ slightly from natural teeth
- New dentures take time to get used to and may need adjustments
- Crowns, bridges, dentures and implants can chip, loosen or wear over time and may need repair or replacement

I agree to attend all visits and to look after the work as instructed. My questions have been answered and I give my consent freely.`,
  },
];

const KEY = "dentalos1_consent_templates_v1";
export const CONSENT_TEMPLATES_EVENT = "dentalos1-consent-templates-updated";

export function getConsentTemplates(): ConsentTemplate[] {
  if (typeof window === "undefined") return DEFAULT_CONSENT_TEMPLATES;
  try {
    const raw = clinicStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONSENT_TEMPLATES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CONSENT_TEMPLATES;
  } catch {
    return DEFAULT_CONSENT_TEMPLATES;
  }
}

export function saveConsentTemplates(list: ConsentTemplate[]): void {
  clinicStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CONSENT_TEMPLATES_EVENT));
}

/** Active templates, those for `kind` first. */
export function templatesFor(kind: ConsentKind): ConsentTemplate[] {
  const active = getConsentTemplates().filter((t) => t.isActive);
  const rank = (t: ConsentTemplate) => (t.appliesTo === kind ? 0 : t.appliesTo === "any" ? 1 : 2);
  return [...active].sort((a, b) => rank(a) - rank(b));
}

export type ConsentValues = Partial<Record<string, string>>;

/** Replace {{placeholders}}; anything left empty becomes a line to fill in by hand. */
export function fillConsentText(text: string, values: ConsentValues): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key: string) => {
    const v = values[key.toLowerCase()];
    return v && v.trim() ? v.trim() : "____________";
  });
}

/** Placeholders in a template that aren't in the list above (likely typos). */
export function unknownPlaceholders(text: string): string[] {
  const known = new Set(CONSENT_PLACEHOLDERS.map((p) => p.key));
  const found = [...text.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)].map((m) => m[1].toLowerCase());
  return [...new Set(found.filter((k) => !known.has(k)))];
}
