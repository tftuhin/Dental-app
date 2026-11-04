"use client";

// ============================================================
// DENTALOS1 — Procedure, Examination & Fee Catalog
// The single price list used by the Examination & Procedure
// stage and by Billing. Edited from Settings → Procedures & Fees.
// Mirrors the `dental_procedures_catalog` table for a later DB move.
// ============================================================

export type CatalogCategory =
  | "consultation"
  | "examination"
  | "procedure"
  | "surgery"
  | "consumable";

export interface CatalogItem {
  id: string;
  code: string; // CDT code or internal code
  name: string;
  category: CatalogCategory;
  price: number; // BDT
  isActive: boolean;
}

export const CATEGORY_LABELS: Record<CatalogCategory, string> = {
  consultation: "Consultation / Counselling",
  examination: "Examination & Diagnostics",
  procedure: "Procedure",
  surgery: "Surgery",
  consumable: "Medicine & Disposables",
};

export const DEFAULT_CATALOG: CatalogItem[] = [
  // Consultation
  { id: "cat-cons-1", code: "D9310", name: "Consultation & Counselling Fee", category: "consultation", price: 800, isActive: true },
  { id: "cat-cons-2", code: "D9311", name: "Follow-up Consultation Fee", category: "consultation", price: 500, isActive: true },

  // Examination & diagnostics
  { id: "cat-exam-1", code: "D0150", name: "Comprehensive Oral Examination", category: "examination", price: 500, isActive: true },
  { id: "cat-exam-2", code: "D0140", name: "Limited / Problem-focused Examination", category: "examination", price: 300, isActive: true },
  { id: "cat-exam-3", code: "D0220", name: "Intraoral Periapical X-ray (IOPA)", category: "examination", price: 300, isActive: true },
  { id: "cat-exam-4", code: "D0330", name: "Panoramic X-ray (OPG)", category: "examination", price: 1200, isActive: true },
  { id: "cat-exam-5", code: "D0272", name: "Bitewing X-rays (2 films)", category: "examination", price: 500, isActive: true },
  { id: "cat-exam-6", code: "D0460", name: "Pulp Vitality Test", category: "examination", price: 300, isActive: true },

  // Procedures
  { id: "cat-proc-1", code: "D1110", name: "Scaling & Polishing (Full Mouth)", category: "procedure", price: 2500, isActive: true },
  { id: "cat-proc-2", code: "D1206", name: "Fluoride Varnish Application", category: "procedure", price: 800, isActive: true },
  { id: "cat-proc-3", code: "D2391", name: "Composite Filling (1 surface)", category: "procedure", price: 2000, isActive: true },
  { id: "cat-proc-4", code: "D2392", name: "Composite Filling (2 surfaces)", category: "procedure", price: 2800, isActive: true },
  { id: "cat-proc-5", code: "D3310", name: "Root Canal Treatment — Anterior", category: "procedure", price: 6000, isActive: true },
  { id: "cat-proc-6", code: "D3330", name: "Root Canal Treatment — Molar", category: "procedure", price: 8500, isActive: true },
  { id: "cat-proc-7", code: "D2750", name: "Porcelain-fused-to-metal Crown", category: "procedure", price: 8000, isActive: true },
  { id: "cat-proc-8", code: "D2740", name: "Zirconia Crown", category: "procedure", price: 12000, isActive: true },

  // Surgery
  { id: "cat-surg-1", code: "D7140", name: "Simple Extraction", category: "surgery", price: 1500, isActive: true },
  { id: "cat-surg-2", code: "D7210", name: "Surgical Extraction", category: "surgery", price: 4000, isActive: true },
  { id: "cat-surg-3", code: "D7240", name: "Impacted Wisdom Tooth Removal", category: "surgery", price: 6500, isActive: true },
  { id: "cat-surg-4", code: "D7510", name: "Incision & Drainage of Abscess", category: "surgery", price: 2000, isActive: true },
  { id: "cat-surg-5", code: "D6010", name: "Dental Implant Placement", category: "surgery", price: 60000, isActive: true },

  // Medicines & disposables used in the chair
  { id: "cat-cons-la", code: "MED-LA", name: "Local Anaesthetic Cartridge", category: "consumable", price: 150, isActive: true },
  { id: "cat-cons-gel", code: "DSP-GEL", name: "Haemostatic Gelatin Sponge", category: "consumable", price: 300, isActive: true },
  { id: "cat-cons-sut", code: "DSP-SUT", name: "Sutures (3-0 Silk)", category: "consumable", price: 400, isActive: true },
  { id: "cat-cons-tmp", code: "DSP-TMP", name: "Temporary Filling Material", category: "consumable", price: 300, isActive: true },
  { id: "cat-cons-dam", code: "DSP-DAM", name: "Rubber Dam Kit", category: "consumable", price: 200, isActive: true },
];

const STORAGE_KEY = "dentalos1_procedure_catalog_v1";
export const CATALOG_UPDATED_EVENT = "dentalos1-catalog-updated";

export function getCatalog(): CatalogItem[] {
  if (typeof window === "undefined") return DEFAULT_CATALOG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATALOG;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_CATALOG;
  } catch {
    return DEFAULT_CATALOG;
  }
}

export function saveCatalog(items: CatalogItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT));
}

export function getActiveCatalog(category?: CatalogCategory): CatalogItem[] {
  return getCatalog().filter((i) => i.isActive && (!category || i.category === category));
}

/** The default consultation fee that every visit's bill starts with. */
export function getDefaultConsultationItem(isFollowUp = false): CatalogItem | undefined {
  const consults = getActiveCatalog("consultation");
  if (isFollowUp) {
    return consults.find((c) => /follow/i.test(c.name)) || consults[0];
  }
  return consults.find((c) => !/follow/i.test(c.name)) || consults[0];
}
