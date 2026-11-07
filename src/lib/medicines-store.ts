// ============================================================
// DENTALOS1 — Medicine catalog (browser side)
// The ~1,500-brand catalog is NOT bundled into pages (it was ~800 KB of
// JavaScript). It is fetched once from /api/medicines and cached in this
// browser's localStorage; it is the same for every clinic.
// The clinic's own changes (medicines it added, edited or removed) are kept
// as "overrides" with the rest of the clinic's data, so every computer in
// the clinic sees them.
// ============================================================

import { clinicStorage, getStorageMode } from "@/lib/clinic-storage";

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

/** A clinic change: a medicine it added or edited, or `removed` for a catalog medicine it deleted. */
type Override = CatalogMedicine & { removed?: boolean };

/** Shared catalog cache (this browser only; not clinic data). */
const BASE_KEY = "dentai_medications_catalog_v3";
/** The clinic's changes (saved with the clinic's data). */
const OVERRIDES_KEY = "dentalos1_medicine_overrides_v1";
const EVENT = "dentai-medications-updated";

function readBase(): CatalogMedicine[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(BASE_KEY) || "[]");
    // Older caches mixed in the clinic's own medicines; those now live in the overrides
    return Array.isArray(parsed) ? parsed.filter((m: CatalogMedicine) => !m.isCustomAdded) : [];
  } catch {
    return [];
  }
}

function writeBase(list: CatalogMedicine[]) {
  try {
    localStorage.setItem(BASE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Could not cache the medicine catalog:", err);
  }
}

function readOverrides(): Override[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(clinicStorage.getItem(OVERRIDES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOverrides(list: Override[]) {
  clinicStorage.setItem(OVERRIDES_KEY, JSON.stringify(list));
}

/** The catalog with the clinic's changes applied, or [] until it has been fetched (see ensureMedicineCatalog). */
export function getStoredMedicines(): CatalogMedicine[] {
  if (typeof window === "undefined") return [];
  const base = readBase();
  const overrides = readOverrides();
  const byId = new Map(overrides.map((o) => [o.id, o]));
  const baseIds = new Set(base.map((b) => b.id));
  const added = overrides.filter((o) => !o.removed && !baseIds.has(o.id));
  const merged = base
    .filter((b) => !byId.get(b.id)?.removed)
    .map((b) => {
      const o = byId.get(b.id);
      if (!o) return b;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { removed, ...rest } = o;
      return rest;
    });
  return [...added, ...merged];
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
  // A small cache is an old seed: top it up from the full catalog
  if (readBase().length >= 100) return Promise.resolve(getStoredMedicines());
  if (!inflight) {
    inflight = fetchDefaultCatalog()
      .then((defaults) => {
        writeBase(defaults);
        window.dispatchEvent(new Event(EVENT));
        return getStoredMedicines();
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Save the whole list: only the differences from the shared catalog are stored for the clinic. */
export function saveStoredMedicines(list: CatalogMedicine[]) {
  if (typeof window === "undefined") return;
  try {
    const base = readBase();
    const baseById = new Map(base.map((b) => [b.id, JSON.stringify(b)]));
    const keep = new Set(list.map((m) => m.id));
    const overrides: Override[] = [];
    for (const m of list) {
      const original = baseById.get(m.id);
      if (original === undefined || original !== JSON.stringify(m)) overrides.push(m);
    }
    for (const b of base) {
      if (!keep.has(b.id)) overrides.push({ id: b.id, brandName: b.brandName, removed: true });
    }
    writeOverrides(overrides);
    window.dispatchEvent(new Event(EVENT));
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

/** Back to the default catalog (drops the clinic's own additions and edits). */
export async function resetStoredMedicines(): Promise<CatalogMedicine[]> {
  const defaults = await fetchDefaultCatalog();
  writeBase(defaults);
  writeOverrides([]);
  window.dispatchEvent(new Event(EVENT));
  return defaults;
}

/**
 * Medicines this browser added before clinic data moved to the server were
 * kept inside the catalog cache. Move them into the clinic's overrides once.
 */
export function importBrowserMedicines(): number {
  if (typeof window === "undefined" || getStorageMode() === "loading") return 0;
  try {
    const parsed = JSON.parse(localStorage.getItem(BASE_KEY) || "[]");
    if (!Array.isArray(parsed)) return 0;
    const custom = parsed.filter((m: CatalogMedicine) => m.isCustomAdded);
    if (custom.length === 0) return 0;
    const overrides = readOverrides();
    const have = new Set(overrides.map((o) => o.id));
    const extra = custom.filter((m: CatalogMedicine) => !have.has(m.id));
    if (extra.length > 0) writeOverrides([...extra, ...overrides]);
    writeBase(parsed.filter((m: CatalogMedicine) => !m.isCustomAdded));
    return extra.length;
  } catch {
    return 0;
  }
}
