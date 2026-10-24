// ============================================================
// DENTAI OS — MEDICATIONS CATALOG & PHARMACOPEIA STORE
// Comprehensive dental medications catalog tailored for Bangladesh clinics
// Provides:
// 1. Full schema & typed definitions for medications
// 2. Default Bangladeshi dental drugs (Square, Beximco, Renata, Incepta)
// 3. Browser LocalStorage sync with custom window events
// 4. Search and category filtering
// ============================================================

export interface CatalogMedicine {
  id: string;
  brandName: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string; // tablet, capsule, syrup, oral_rinse, topical_gel, injection, drops, powder, other
  manufacturer?: string; // e.g. Square Pharmaceuticals, Beximco, Renata, Incepta
  category?: string; // Analgesic, Antibiotic, Antiseptic Rinse, Topical Gel, PPI, etc.
  defaultFrequency?: string; // 1+0+1, 1+1+1, 0+0+1, 1+0+0
  defaultDuration?: string; // 3 days, 5 days, 7 days
  defaultTiming?: string; // After food, 30 mins before food, At bedtime
  specialInstructions?: string;
  isCustomAdded?: boolean;
  isActive?: boolean;
  notes?: string;
}

export const DEFAULT_BANGLA_MEDICINES: CatalogMedicine[] = [
  {
    id: "med-bd-1",
    brandName: "Napa Extra",
    genericName: "Paracetamol + Caffeine",
    strength: "500 mg + 65 mg",
    dosageForm: "Tablet",
    manufacturer: "Beximco Pharmaceuticals",
    category: "Analgesic & Antipyretic",
    defaultFrequency: "1+0+1",
    defaultDuration: "3 days",
    defaultTiming: "After food",
    specialInstructions: "Take for mild to moderate dental pain. Do not exceed 8 tablets in 24 hours.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-2",
    brandName: "Torax",
    genericName: "Ketorolac Tromethamine",
    strength: "10 mg",
    dosageForm: "Tablet",
    manufacturer: "Square Pharmaceuticals",
    category: "NSAID Analgesic",
    defaultFrequency: "1+0+1",
    defaultDuration: "3 days",
    defaultTiming: "After food",
    specialInstructions: "Potent acute post-op dental analgesic. Maximum continuous therapy 5 days.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-3",
    brandName: "Moxacil",
    genericName: "Amoxicillin Trihydrate",
    strength: "500 mg",
    dosageForm: "Capsule",
    manufacturer: "Square Pharmaceuticals",
    category: "Penicillin Antibiotic",
    defaultFrequency: "1+1+1",
    defaultDuration: "5 days",
    defaultTiming: "After food",
    specialInstructions: "Complete full 5-day course. CONTRAINDICATED in penicillin allergy.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-4",
    brandName: "Amodis",
    genericName: "Metronidazole",
    strength: "400 mg",
    dosageForm: "Tablet",
    manufacturer: "Square Pharmaceuticals",
    category: "Anaerobic Antimicrobial",
    defaultFrequency: "1+1+1",
    defaultDuration: "5 days",
    defaultTiming: "After food",
    specialInstructions: "Primary drug for acute necrotizing gingivitis and pericoronitis. Avoid alcohol.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-5",
    brandName: "Cef-3",
    genericName: "Cefixime Trihydrate",
    strength: "200 mg",
    dosageForm: "Capsule",
    manufacturer: "Square Pharmaceuticals",
    category: "Cephalosporin Antibiotic",
    defaultFrequency: "1+0+1",
    defaultDuration: "5 days",
    defaultTiming: "After food",
    specialInstructions: "Broad spectrum 3rd gen cephalosporin for resistant dental cellulitis.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-6",
    brandName: "Maxpro",
    genericName: "Esomeprazole Magnesium",
    strength: "20 mg",
    dosageForm: "Capsule",
    manufacturer: "Renata Limited",
    category: "Proton Pump Inhibitor (PPI)",
    defaultFrequency: "1+0+1",
    defaultDuration: "5 days",
    defaultTiming: "30 mins before food",
    specialInstructions: "Gastric mucosal protection during concurrent NSAID analgesic therapy.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-7",
    brandName: "Clohex",
    genericName: "Chlorhexidine Gluconate 0.2%",
    strength: "100 ml",
    dosageForm: "Oral Rinse",
    manufacturer: "Square Pharmaceuticals",
    category: "Antiseptic Mouthwash",
    defaultFrequency: "1+0+1",
    defaultDuration: "7 days",
    defaultTiming: "After tooth brushing",
    specialInstructions: "Swish 10ml vigorously for 60 seconds then spit out. Do not swallow or rinse with water for 30 mins.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-8",
    brandName: "Flamyd",
    genericName: "Metronidazole 1%",
    strength: "15 g",
    dosageForm: "Topical Gel",
    manufacturer: "Square Pharmaceuticals",
    category: "Periodontal Topical Gel",
    defaultFrequency: "1+0+1",
    defaultDuration: "5 days",
    defaultTiming: "Apply on affected gum after food",
    specialInstructions: "Apply clean fingertip or cotton swab directly into periodontal pocket after brushing.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-9",
    brandName: "Kenalog in Orabase",
    genericName: "Triamcinolone Acetonide 0.1%",
    strength: "5 g",
    dosageForm: "Topical Gel",
    manufacturer: "Bristol-Myers Squibb",
    category: "Corticosteroid Gel",
    defaultFrequency: "0+0+1",
    defaultDuration: "5 days",
    defaultTiming: "Apply at bedtime after food",
    specialInstructions: "Dab a small film onto aphthous ulcer without rubbing until smooth paste forms.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-10",
    brandName: "Clindacin",
    genericName: "Clindamycin Hydrochloride",
    strength: "300 mg",
    dosageForm: "Capsule",
    manufacturer: "Renata Limited",
    category: "Lincosamide Antibiotic",
    defaultFrequency: "1+1+1+1",
    defaultDuration: "5 days",
    defaultTiming: "With full glass of water",
    specialInstructions: "Excellent bone penetration for jaw osteitis. Penicillin allergy safe.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-11",
    brandName: "Rolac",
    genericName: "Ketorolac Tromethamine",
    strength: "10 mg",
    dosageForm: "Tablet",
    manufacturer: "Incepta Pharmaceuticals",
    category: "NSAID Analgesic",
    defaultFrequency: "1+0+1",
    defaultDuration: "3 days",
    defaultTiming: "After food",
    specialInstructions: "For severe pulpitis / post-surgical tooth extraction discomfort.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-12",
    brandName: "Ace Plus",
    genericName: "Paracetamol + Caffeine",
    strength: "500 mg + 65 mg",
    dosageForm: "Tablet",
    manufacturer: "Square Pharmaceuticals",
    category: "Analgesic & Antipyretic",
    defaultFrequency: "1+0+1",
    defaultDuration: "3 days",
    defaultTiming: "After food",
    specialInstructions: "Fast-acting analgesic for routine scaling soreness and gingival tenderness.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-13",
    brandName: "Sensolin",
    genericName: "Potassium Nitrate 5% + Monofluorophosphate",
    strength: "50 g",
    dosageForm: "Topical Gel",
    manufacturer: "Square Pharmaceuticals",
    category: "Desensitizing Agent",
    defaultFrequency: "1+0+1",
    defaultDuration: "14 days",
    defaultTiming: "Brush gently twice daily",
    specialInstructions: "Clinically seals dentinal tubules to relieve thermal sensitivity after crown preparation.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-14",
    brandName: "Mycostatin",
    genericName: "Nystatin",
    strength: "100,000 IU/ml",
    dosageForm: "Syrup",
    manufacturer: "Beximco Pharmaceuticals",
    category: "Antifungal Oral Suspension",
    defaultFrequency: "1+1+1+1",
    defaultDuration: "7 days",
    defaultTiming: "After meals",
    specialInstructions: "Swish around mouth for as long as possible before swallowing. Denture stomatitis treatment.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "med-bd-15",
    brandName: "Myospas",
    genericName: "Baclofen",
    strength: "10 mg",
    dosageForm: "Tablet",
    manufacturer: "Square Pharmaceuticals",
    category: "Muscle Relaxant",
    defaultFrequency: "0+0+1",
    defaultDuration: "5 days",
    defaultTiming: "At bedtime after food",
    specialInstructions: "Relieves masseter muscle spasm and nocturnal bruxism / TMJ pain.",
    isCustomAdded: false,
    isActive: true,
  },
];

const STORAGE_KEY = "dentai_medications_catalog_v2";

export function getStoredMedicines(): CatalogMedicine[] {
  if (typeof window === "undefined") {
    return DEFAULT_BANGLA_MEDICINES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BANGLA_MEDICINES));
      return DEFAULT_BANGLA_MEDICINES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_BANGLA_MEDICINES;
  } catch (err) {
    console.error("Error reading stored medicines:", err);
    return DEFAULT_BANGLA_MEDICINES;
  }
}

export function saveStoredMedicines(list: CatalogMedicine[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("dentai-medications-updated", { detail: list }));
  } catch (err) {
    console.error("Error saving stored medicines:", err);
  }
}

export function addStoredMedicine(
  med: Omit<CatalogMedicine, "id"> & { id?: string }
): CatalogMedicine {
  const current = getStoredMedicines();
  const newMed: CatalogMedicine = {
    ...med,
    id: med.id || `med-custom-${Date.now()}`,
    isCustomAdded: true,
    isActive: true,
  };
  const updated = [newMed, ...current];
  saveStoredMedicines(updated);
  return newMed;
}

export function updateStoredMedicine(
  id: string,
  updates: Partial<CatalogMedicine>
): CatalogMedicine | null {
  const current = getStoredMedicines();
  const index = current.findIndex((m) => m.id === id);
  if (index === -1) return null;
  const updatedItem = { ...current[index], ...updates };
  current[index] = updatedItem;
  saveStoredMedicines([...current]);
  return updatedItem;
}

export function deleteStoredMedicine(id: string): boolean {
  const current = getStoredMedicines();
  const filtered = current.filter((m) => m.id !== id);
  if (filtered.length !== current.length) {
    saveStoredMedicines(filtered);
    return true;
  }
  return false;
}

export function resetStoredMedicines(): CatalogMedicine[] {
  saveStoredMedicines(DEFAULT_BANGLA_MEDICINES);
  return DEFAULT_BANGLA_MEDICINES;
}
