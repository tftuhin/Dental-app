// ============================================================
// Bundled Bangladesh medicine catalog (server only).
// ~1,500 brands. Kept out of browser bundles: pages fetch it
// from /api/medicines and cache it (see medicines-store.ts).
// ============================================================
import rawMedicinesData from "./medicines-data.json";
import type { CatalogMedicine } from "./medicines-store";

interface RawMedicineItem {
  brand_name: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
  company_name: string;
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
