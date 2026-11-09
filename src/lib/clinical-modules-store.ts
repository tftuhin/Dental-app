"use client";

// ============================================================
// DENTALOSBD — Clinical sections on/off (Settings → Clinical Modules)
// Each charting section of the visit and the patient profile can be
// switched off for clinics that don't use it.
// ============================================================

import { useSyncExternalStore } from "react";
import { clinicStorage } from "@/lib/clinic-storage";

export interface ClinicalModules {
  odontogram: boolean;
  perioChart: boolean;
  orthodontics: boolean;
  prosthodontics: boolean;
  aiAssistant: boolean;
  /** Ask for a signed consent form before a procedure or surgery. */
  consentForms: boolean;
}

export const DEFAULT_CLINICAL_MODULES: ClinicalModules = {
  odontogram: true,
  perioChart: true,
  orthodontics: true,
  prosthodontics: true,
  aiAssistant: true,
  consentForms: true,
};

export const CLINICAL_MODULE_INFO: Array<{ key: keyof ClinicalModules; label: string; description: string }> = [
  { key: "odontogram", label: "Odontogram", description: "32-tooth chart with surface conditions, in the visit and the patient profile." },
  { key: "perioChart", label: "Periodontal chart", description: "6-point probing depths, bleeding, mobility and furcation." },
  { key: "orthodontics", label: "Orthodontics", description: "Malocclusion assessment, treatment plan, appliance and adjustment visits." },
  { key: "prosthodontics", label: "Prosthodontics", description: "Crowns, bridges, dentures and implants with lab stages, shade and material." },
  {
    key: "aiAssistant",
    label: "AI assistant",
    description: "AI Assistant suggestions during the consultation, and AI prescription drafts. Visit details are sent to the AI provider only when a doctor asks.",
  },
  {
    key: "consentForms",
    label: "Consent before procedure or surgery",
    description: "Print a consent form for the patient and doctor to sign before treatment starts.",
  },
];

const KEY = "dentalos1_clinical_modules_v1";
export const CLINICAL_MODULES_EVENT = "dentalos1-modules-updated";

let cachedRaw: string | null | undefined;
let cached: ClinicalModules = DEFAULT_CLINICAL_MODULES;

export function getClinicalModules(): ClinicalModules {
  if (typeof window === "undefined") return DEFAULT_CLINICAL_MODULES;
  const raw = clinicStorage.getItem(KEY);
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const saved = raw ? JSON.parse(raw) : {};
    // Saved before the setting was renamed (old key "aiCopilot")
    if (saved.aiAssistant === undefined && typeof saved.aiCopilot === "boolean") saved.aiAssistant = saved.aiCopilot;
    delete saved.aiCopilot;
    cached = { ...DEFAULT_CLINICAL_MODULES, ...saved };
  } catch {
    cached = DEFAULT_CLINICAL_MODULES;
  }
  return cached;
}

export function saveClinicalModules(patch: Partial<ClinicalModules>): ClinicalModules {
  const next = { ...getClinicalModules(), ...patch };
  clinicStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CLINICAL_MODULES_EVENT));
  return next;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CLINICAL_MODULES_EVENT, onChange);
  return () => window.removeEventListener(CLINICAL_MODULES_EVENT, onChange);
}

/** The clinic's enabled sections, updated live when Settings change. */
export function useClinicalModules(): ClinicalModules {
  return useSyncExternalStore(subscribe, getClinicalModules, () => DEFAULT_CLINICAL_MODULES);
}
