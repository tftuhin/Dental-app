// ============================================================
// DENTALOS1 — MEDICATIONS CATALOG & PHARMACOPEIA STORE
// Comprehensive real dental medications catalog tailored for Bangladesh clinics
// Provides:
// 1. Full schema & typed definitions for medications
// 2. Real Bangladeshi pharmaceuticals catalog (Square, Incepta, Beximco, Renata, etc.)
// 3. Browser LocalStorage sync with custom window events
// 4. Search and category filtering
// ============================================================

import rawMedicinesData from "./medicines-data.json";

export interface CatalogMedicine {
  id: string;
  brandName: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string; // Tablet, Capsule, Oral Suspension, Syrup, Injection, Mouthwash, etc.
  manufacturer?: string; // e.g. Square Pharmaceuticals PLC, Incepta, Beximco, Renata
  category?: string; // Analgesic / NSAID, Antibiotic, Antifungal (Oral), Dental / Oral care, Gastroprotective, Haemostatic, Local Anaesthetic
  defaultFrequency?: string; // 1+0+1, 1+1+1, 1+0+0, 1+1+1+1
  defaultDuration?: string; // 3 days, 5 days, 7 days, 14 days
  defaultTiming?: string; // After meal, Before meal (30 min), Empty stomach (1 hr before meal)
  specialInstructions?: string;
  isCustomAdded?: boolean;
  isActive?: boolean;
  notes?: string;
}

interface RawMedicineItem {
  brand_name: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
  company_name: string;
  popularity_rank?: number | null;
  default_frequency?: string | null;
  default_duration?: string | null;
  default_timing?: string | null;
  category: string;
  is_custom_added?: boolean;
  is_active?: boolean;
  notes?: string | null;
}

export const DEFAULT_BANGLA_MEDICINES: CatalogMedicine[] = (rawMedicinesData as RawMedicineItem[]).map(
  (item, idx) => ({
    id: `med-real-${idx + 1}`,
    brandName: item.brand_name,
    genericName: item.generic_name || undefined,
    strength: item.strength || undefined,
    dosageForm: item.dosage_form || "Tablet",
    manufacturer: item.company_name || undefined,
    category: item.category || "General",
    defaultFrequency: item.default_frequency || undefined,
    defaultDuration: item.default_duration || undefined,
    defaultTiming: item.default_timing || undefined,
    specialInstructions: item.notes ? item.notes.split(" | ").slice(1, 3).join(" • ") : undefined,
    isCustomAdded: item.is_custom_added ?? false,
    isActive: item.is_active ?? true,
    notes: item.notes || undefined,
  })
);

const STORAGE_KEY = "dentai_medications_catalog_v3";

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
    // Upgrade if the user has an old small cache (<100 medicines)
    if (Array.isArray(parsed) && parsed.length >= 100) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BANGLA_MEDICINES));
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
