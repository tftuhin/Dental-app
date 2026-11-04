// ============================================================
// DENTALOS1 — Medicine catalog (browser side)
// The ~1,500-brand catalog is NOT bundled into pages (it was ~800 KB of
// JavaScript). It is fetched once from /api/medicines and cached in
// localStorage; the clinic's own additions live in the same cache.
// ============================================================

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

const STORAGE_KEY = "dentai_medications_catalog_v3";

/** The cached catalog, or [] until it has been fetched (see ensureMedicineCatalog). */
export function getStoredMedicines(): CatalogMedicine[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function fetchDefaultCatalog(): Promise<CatalogMedicine[]> {
  const res = await fetch("/api/medicines");
  if (!res.ok) throw new Error(`Medicine catalog request failed (${res.status})`);
  const data = await res.json();
  return Array.isArray(data.medicines) ? data.medicines : [];
}

let inflight: Promise<CatalogMedicine[]> | null = null;

/**
 * Make sure the catalog is cached, fetching it once if needed. Callers can
 * render immediately with getStoredMedicines() and update when this resolves
 * (it also fires "dentai-medications-updated").
 */
export function ensureMedicineCatalog(): Promise<CatalogMedicine[]> {
  const cached = getStoredMedicines();
  // A small cache is an old seed or only custom additions: top it up from the full catalog
  if (cached.length >= 100) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetchDefaultCatalog()
      .then((defaults) => {
        const custom = getStoredMedicines().filter((m) => m.isCustomAdded);
        const merged = [...custom, ...defaults.filter((d) => !custom.some((c) => c.brandName === d.brandName))];
        saveStoredMedicines(merged);
        return merged;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
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

/** Replace the cache with the default catalog (drops the clinic's own additions). */
export async function resetStoredMedicines(): Promise<CatalogMedicine[]> {
  const defaults = await fetchDefaultCatalog();
  saveStoredMedicines(defaults);
  return defaults;
}
