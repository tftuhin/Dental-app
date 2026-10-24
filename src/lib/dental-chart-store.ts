// ============================================================
// DENTALOS1 — DENTAL CHART PERSISTENCE STORE
// Manages local persistence and cross-view synchronization for:
// 1. Odontogram (Teeth 1-32, surfaces, conditions, FDI mapping)
// 2. Periodontal Chart (6-point probing depths, BOP, furcation, mobility)
// Keyed per patientId in localStorage
// ============================================================

export type SurfaceType = "mesial" | "distal" | "occlusal" | "buccal" | "lingual";
export type SurfaceCondition = "sound" | "caries" | "restoration" | "planned" | "fracture";
export type ToothCondition =
  | "present"
  | "missing"
  | "implant"
  | "crown"
  | "rct"
  | "impacted"
  | "extraction_indicated";

export interface ToothState {
  number: number;
  fdiNumber: number;
  condition: ToothCondition;
  surfaces: Record<SurfaceType, SurfaceCondition>;
  mobility?: 0 | 1 | 2 | 3;
  notes?: string;
}

export interface ToothPerioState {
  toothNumber: number;
  probingDepths: [number, number, number, number, number, number]; // [DB, B, MB, DL, L, ML]
  bop: [boolean, boolean, boolean, boolean, boolean, boolean]; // Bleeding on Probing
  recession?: [number, number, number, number, number, number];
  mobility: 0 | 1 | 2 | 3;
  furcation?: 0 | 1 | 2 | 3;
}

// Universal to FDI number mapping
export const FDI_MAP: Record<number, number> = {
  // Maxillary Right (Q1)
  1: 18, 2: 17, 3: 16, 4: 15, 5: 14, 6: 13, 7: 12, 8: 11,
  // Maxillary Left (Q2)
  9: 21, 10: 22, 11: 23, 12: 24, 13: 25, 14: 26, 15: 27, 16: 28,
  // Mandibular Left (Q3)
  17: 38, 18: 37, 19: 36, 20: 35, 21: 34, 22: 33, 23: 32, 24: 31,
  // Mandibular Right (Q4)
  25: 41, 26: 42, 27: 43, 28: 44, 29: 45, 30: 46, 31: 47, 32: 48,
};

export const CONDITION_COLORS: Record<SurfaceCondition, string> = {
  sound: "#ffffff",
  caries: "#ef4444",
  restoration: "#3b82f6",
  planned: "#f59e0b",
  fracture: "#8b5cf6",
};

const ODONTOGRAM_STORAGE_PREFIX = "dentai_odontogram_";
const PERIO_STORAGE_PREFIX = "dentai_perio_";

export function getDefaultOdontogram(): Record<number, ToothState> {
  const initial: Record<number, ToothState> = {};
  for (let i = 1; i <= 32; i++) {
    initial[i] = {
      number: i,
      fdiNumber: FDI_MAP[i] || i,
      condition: "present",
      surfaces: {
        mesial: "sound",
        distal: "sound",
        occlusal: "sound",
        buccal: "sound",
        lingual: "sound",
      },
    };
  }

  // Baseline clinical sample findings
  if (initial[3]) {
    initial[3].surfaces.occlusal = "restoration"; // #3 DO Amalgam
    initial[3].surfaces.distal = "restoration";
  }
  if (initial[14]) {
    initial[14].surfaces.occlusal = "caries"; // #14 Active Caries
  }
  if (initial[19]) {
    initial[19].condition = "rct"; // #19 RCT
    initial[19].surfaces.occlusal = "planned"; // Crown planned
  }
  if (initial[30]) {
    initial[30].condition = "crown"; // #30 PFM Crown
  }
  if (initial[1]) initial[1].condition = "missing";
  if (initial[16]) initial[16].condition = "missing";
  if (initial[17]) initial[17].condition = "missing";
  if (initial[32]) initial[32].condition = "impacted";

  return initial;
}

export function getStoredOdontogram(patientId: string = "DENT-2026-00042"): Record<number, ToothState> {
  if (typeof window === "undefined") return getDefaultOdontogram();
  try {
    const raw = localStorage.getItem(`${ODONTOGRAM_STORAGE_PREFIX}${patientId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load saved odontogram:", err);
  }
  return getDefaultOdontogram();
}

export function saveStoredOdontogram(
  patientId: string = "DENT-2026-00042",
  data: Record<number, ToothState>
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${ODONTOGRAM_STORAGE_PREFIX}${patientId}`, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("dentai-odontogram-updated", {
        detail: { patientId, timestamp: Date.now() },
      })
    );
  } catch (err) {
    console.error("Failed to save odontogram to storage:", err);
  }
}

export function resetStoredOdontogram(
  patientId: string = "DENT-2026-00042"
): Record<number, ToothState> {
  const fresh = getDefaultOdontogram();
  saveStoredOdontogram(patientId, fresh);
  return fresh;
}

// ─── PERIODONTAL CHART STORE ───

export function getDefaultPerioChart(): Record<number, ToothPerioState> {
  const data: Record<number, ToothPerioState> = {};
  for (let i = 1; i <= 32; i++) {
    data[i] = {
      toothNumber: i,
      probingDepths: [3, 2, 3, 2, 2, 3],
      bop: [false, false, false, false, false, false],
      mobility: 0,
      furcation: 0,
    };
  }

  // Realistic localized periodontitis baseline
  if (data[14]) {
    data[14] = {
      toothNumber: 14,
      probingDepths: [5, 3, 6, 4, 3, 5],
      bop: [true, false, true, true, false, false],
      mobility: 1,
      furcation: 1,
    };
  }
  if (data[19]) {
    data[19] = {
      toothNumber: 19,
      probingDepths: [6, 4, 7, 5, 3, 6],
      bop: [true, true, true, false, false, true],
      mobility: 2,
      furcation: 2,
    };
  }
  if (data[30]) {
    data[30] = {
      toothNumber: 30,
      probingDepths: [4, 3, 5, 3, 2, 4],
      bop: [true, false, true, false, false, false],
      mobility: 0,
      furcation: 0,
    };
  }

  return data;
}

export function getStoredPerioChart(
  patientId: string = "DENT-2026-00042"
): Record<number, ToothPerioState> {
  if (typeof window === "undefined") return getDefaultPerioChart();
  try {
    const raw = localStorage.getItem(`${PERIO_STORAGE_PREFIX}${patientId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load saved perio chart:", err);
  }
  return getDefaultPerioChart();
}

export function saveStoredPerioChart(
  patientId: string = "DENT-2026-00042",
  data: Record<number, ToothPerioState>
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PERIO_STORAGE_PREFIX}${patientId}`, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("dentai-perio-updated", {
        detail: { patientId, timestamp: Date.now() },
      })
    );
  } catch (err) {
    console.error("Failed to save perio chart to storage:", err);
  }
}

export function resetStoredPerioChart(
  patientId: string = "DENT-2026-00042"
): Record<number, ToothPerioState> {
  const fresh = getDefaultPerioChart();
  saveStoredPerioChart(patientId, fresh);
  return fresh;
}
