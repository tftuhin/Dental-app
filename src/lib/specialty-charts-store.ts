"use client";

// ============================================================
// DENTALOSBD — Orthodontic and prosthodontic records
// One record of each per patient (keyed by the patient ID, like the
// odontogram), saved with the rest of the clinic's data.
// ============================================================

import { clinicStorage } from "@/lib/clinic-storage";

// ─── Orthodontics ───────────────────────────────────────────

export type AngleClass = "" | "I" | "II_div1" | "II_div2" | "III";

export const ANGLE_CLASS_LABELS: Record<Exclude<AngleClass, "">, string> = {
  I: "Class I",
  II_div1: "Class II div 1",
  II_div2: "Class II div 2",
  III: "Class III",
};

export type OrthoStatus = "assessment" | "planned" | "active" | "retention" | "completed";

export const ORTHO_STATUS_LABELS: Record<OrthoStatus, string> = {
  assessment: "Assessment",
  planned: "Plan agreed",
  active: "Active treatment",
  retention: "Retention",
  completed: "Completed",
};

export const ORTHO_APPLIANCES = [
  "Fixed: metal brackets",
  "Fixed: ceramic brackets",
  "Fixed: self-ligating brackets",
  "Fixed: lingual brackets",
  "Clear aligners",
  "Removable appliance",
  "Functional appliance (Twin Block / Activator)",
  "Rapid maxillary expander",
  "Space maintainer",
  "Retainer only",
];

export interface OrthoVisit {
  id: string;
  date: string;
  upperArchwire: string;
  lowerArchwire: string;
  procedure: string;
  notes: string;
  nextVisit: string;
}

export interface OrthoRecord {
  status: OrthoStatus;
  molarRight: AngleClass;
  molarLeft: AngleClass;
  canineRight: AngleClass;
  canineLeft: AngleClass;
  overjetMm: string;
  overbiteMm: string;
  crossbite: string[];
  openBite: "" | "anterior" | "posterior";
  crowdingUpperMm: string;
  crowdingLowerMm: string;
  spacing: string;
  midlineShift: string;
  profile: "" | "straight" | "convex" | "concave";
  habits: string[];
  assessmentNotes: string;
  appliance: string;
  extractions: string;
  anchorage: string;
  estimatedMonths: string;
  startDate: string;
  retainer: string;
  planNotes: string;
  visits: OrthoVisit[];
  updatedAt?: string;
}

export const CROSSBITE_OPTIONS = ["Anterior", "Posterior right", "Posterior left"];
export const HABIT_OPTIONS = ["Thumb sucking", "Tongue thrust", "Mouth breathing", "Bruxism", "Lip biting"];

export function emptyOrthoRecord(): OrthoRecord {
  return {
    status: "assessment",
    molarRight: "",
    molarLeft: "",
    canineRight: "",
    canineLeft: "",
    overjetMm: "",
    overbiteMm: "",
    crossbite: [],
    openBite: "",
    crowdingUpperMm: "",
    crowdingLowerMm: "",
    spacing: "",
    midlineShift: "",
    profile: "",
    habits: [],
    assessmentNotes: "",
    appliance: "",
    extractions: "",
    anchorage: "",
    estimatedMonths: "",
    startDate: "",
    retainer: "",
    planNotes: "",
    visits: [],
  };
}

const ORTHO_PREFIX = "dentalos1_ortho_";
export const ORTHO_EVENT = "dentalos1-ortho-updated";

export function getOrthoRecord(patientId: string): OrthoRecord {
  if (typeof window === "undefined" || !patientId) return emptyOrthoRecord();
  try {
    const raw = clinicStorage.getItem(`${ORTHO_PREFIX}${patientId}`);
    return raw ? { ...emptyOrthoRecord(), ...JSON.parse(raw) } : emptyOrthoRecord();
  } catch {
    return emptyOrthoRecord();
  }
}

export function saveOrthoRecord(patientId: string, record: OrthoRecord): void {
  if (typeof window === "undefined" || !patientId) return;
  clinicStorage.setItem(`${ORTHO_PREFIX}${patientId}`, JSON.stringify({ ...record, updatedAt: new Date().toISOString() }));
  window.dispatchEvent(new CustomEvent(ORTHO_EVENT, { detail: { patientId } }));
}

/** One-line summary for timelines and consent forms, e.g. "Class II div 1 · OJ 6 mm · Fixed: metal brackets". */
export function summariseOrtho(r: OrthoRecord): string {
  const parts: string[] = [];
  const molar = r.molarRight || r.molarLeft;
  if (molar) parts.push(`Molar ${ANGLE_CLASS_LABELS[molar]}`);
  if (r.overjetMm) parts.push(`OJ ${r.overjetMm} mm`);
  if (r.overbiteMm) parts.push(`OB ${r.overbiteMm} mm`);
  if (r.appliance) parts.push(r.appliance);
  return parts.join(" · ");
}

// ─── Prosthodontics ─────────────────────────────────────────

export type ProsthesisType =
  | "crown"
  | "bridge"
  | "veneer"
  | "inlay_onlay"
  | "post_core"
  | "complete_denture"
  | "partial_denture"
  | "implant_crown"
  | "implant_bridge"
  | "implant_overdenture"
  | "night_guard";

export const PROSTHESIS_LABELS: Record<ProsthesisType, string> = {
  crown: "Crown",
  bridge: "Bridge (fixed partial denture)",
  veneer: "Veneer",
  inlay_onlay: "Inlay / Onlay",
  post_core: "Post & core",
  complete_denture: "Complete denture",
  partial_denture: "Removable partial denture",
  implant_crown: "Implant-supported crown",
  implant_bridge: "Implant-supported bridge",
  implant_overdenture: "Implant overdenture",
  night_guard: "Night guard / occlusal splint",
};

export const PROSTHESIS_MATERIALS = [
  "Zirconia (monolithic)",
  "Zirconia (layered)",
  "Lithium disilicate (E.max)",
  "Porcelain-fused-to-metal (PFM)",
  "Full metal (Ni-Cr / Co-Cr)",
  "Gold alloy",
  "Composite",
  "Heat-cured acrylic",
  "Flexible (Valplast)",
  "Cobalt-chrome framework",
  "PMMA (temporary)",
];

export const VITA_SHADES = ["A1", "A2", "A3", "A3.5", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "D2", "D3", "D4", "BL1", "BL2"];

export type ProsthoStage =
  | "planned"
  | "preparation"
  | "impression"
  | "bite_registration"
  | "try_in"
  | "sent_to_lab"
  | "received"
  | "fitted"
  | "review";

export const PROSTHO_STAGES: Array<{ key: ProsthoStage; label: string }> = [
  { key: "planned", label: "Planned" },
  { key: "preparation", label: "Tooth preparation" },
  { key: "impression", label: "Impression / scan" },
  { key: "bite_registration", label: "Bite registration" },
  { key: "try_in", label: "Try-in" },
  { key: "sent_to_lab", label: "Sent to lab" },
  { key: "received", label: "Received from lab" },
  { key: "fitted", label: "Fitted / cemented" },
  { key: "review", label: "Review" },
];

export interface ProsthesisItem {
  id: string;
  type: ProsthesisType;
  /** Teeth involved, e.g. "#14-#16" or "Upper arch". */
  teeth: string;
  material: string;
  shade: string;
  lab: string;
  stage: ProsthoStage;
  /** Date each stage was reached (YYYY-MM-DD). */
  stageDates: Partial<Record<ProsthoStage, string>>;
  notes: string;
}

export type KennedyClass = "" | "I" | "II" | "III" | "IV" | "complete" | "dentate";

export const KENNEDY_LABELS: Record<Exclude<KennedyClass, "">, string> = {
  dentate: "Fully dentate",
  I: "Kennedy Class I (bilateral free-end)",
  II: "Kennedy Class II (unilateral free-end)",
  III: "Kennedy Class III (bounded)",
  IV: "Kennedy Class IV (anterior, across midline)",
  complete: "Completely edentulous",
};

export interface ProsthoRecord {
  kennedyUpper: KennedyClass;
  kennedyLower: KennedyClass;
  notes: string;
  items: ProsthesisItem[];
  updatedAt?: string;
}

export function emptyProsthoRecord(): ProsthoRecord {
  return { kennedyUpper: "", kennedyLower: "", notes: "", items: [] };
}

const PROSTHO_PREFIX = "dentalos1_prostho_";
export const PROSTHO_EVENT = "dentalos1-prostho-updated";

export function getProsthoRecord(patientId: string): ProsthoRecord {
  if (typeof window === "undefined" || !patientId) return emptyProsthoRecord();
  try {
    const raw = clinicStorage.getItem(`${PROSTHO_PREFIX}${patientId}`);
    return raw ? { ...emptyProsthoRecord(), ...JSON.parse(raw) } : emptyProsthoRecord();
  } catch {
    return emptyProsthoRecord();
  }
}

export function saveProsthoRecord(patientId: string, record: ProsthoRecord): void {
  if (typeof window === "undefined" || !patientId) return;
  clinicStorage.setItem(`${PROSTHO_PREFIX}${patientId}`, JSON.stringify({ ...record, updatedAt: new Date().toISOString() }));
  window.dispatchEvent(new CustomEvent(PROSTHO_EVENT, { detail: { patientId } }));
}

/** Move a prosthesis to a stage, noting today's date for it. */
export function withStage(item: ProsthesisItem, stage: ProsthoStage, date: string): ProsthesisItem {
  return { ...item, stage, stageDates: { ...item.stageDates, [stage]: item.stageDates[stage] || date } };
}
