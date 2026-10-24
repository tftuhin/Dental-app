// ============================================================
// DENTALOS1 — INVESTIGATIONS & DIAGNOSTIC TESTS STORE
// Standard Dental Diagnostic & Laboratory Formulary (Bangladesh)
// Provides:
// 1. Full schema & typed definitions for dental tests & investigations
// 2. Default dental diagnostics (Radiology/X-Rays, Pathology/Blood, Biopsy, Study Casts)
// 3. Browser LocalStorage sync with custom window events
// 4. CRUD operations for investigations catalog
// ============================================================

export interface InvestigationItem {
  id: string;
  testName: string;
  name?: string; // alias for testName
  code?: string;
  category: "radiology" | "pathology" | "clinical" | "biopsy" | "other" | string;
  sampleOrModality: string; // e.g. "Digital X-Ray", "Blood Sample", "Tissue Specimen", "Intraoral Scan"
  turnaroundTime: string; // e.g. "Immediate (5 mins)", "Same Day", "24-48 Hours"
  defaultPriceBDT: number; // in BDT (৳)
  priceBDT?: number; // alias for defaultPriceBDT
  indication: string; // Diagnostic reason / indication
  defaultIndication?: string; // alias for indication
  instructions?: string; // Pre-test instructions
  isCustomAdded?: boolean;
  isActive?: boolean;
}

export const DEFAULT_INVESTIGATIONS: InvestigationItem[] = [
  {
    id: "inv-1",
    testName: "Digital IOPA Radiograph (Periapical X-Ray)",
    code: "RAD-IOPA",
    category: "radiology",
    sampleOrModality: "Digital RVG Sensor",
    turnaroundTime: "Immediate (3 mins)",
    defaultPriceBDT: 350,
    indication: "Periapical pathology, root canal anatomy, bone loss, pulp exposure",
    instructions: "Remove metal clips, glasses or removable appliances near area.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-2",
    testName: "OPG (Orthopantomogram / Panoramic X-Ray)",
    code: "RAD-OPG",
    category: "radiology",
    sampleOrModality: "Digital Panoramic Machine",
    turnaroundTime: "15 mins",
    defaultPriceBDT: 1200,
    indication: "Full mouth survey, third molar impactions, TMJ condyles, jaw cysts",
    instructions: "Remove all jewelry, earrings, dentures and hairpins.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-3",
    testName: "CBCT 3D Scan (Cone Beam Computed Tomography)",
    code: "RAD-CBCT",
    category: "radiology",
    sampleOrModality: "Cone Beam 3D Volume",
    turnaroundTime: "Same Day (2 hours)",
    defaultPriceBDT: 3500,
    indication: "Dental implant site assessment, nerve canal distance, root fracture, impacted canines",
    instructions: "Keep jaw still in bite-block for 20 seconds.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-4",
    testName: "Bitewing Radiographs (Right & Left)",
    code: "RAD-BW",
    category: "radiology",
    sampleOrModality: "Digital Bitewing Sensor",
    turnaroundTime: "Immediate (5 mins)",
    defaultPriceBDT: 500,
    indication: "Interproximal caries detection, alveolar crestal bone height, overhang margins",
    instructions: "Bite down gently on the bitewing tab.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-5",
    testName: "Lateral Cephalogram (Orthodontic Analysis)",
    code: "RAD-CEPH",
    category: "radiology",
    sampleOrModality: "Cephalostat Digital Scan",
    turnaroundTime: "15 mins",
    defaultPriceBDT: 1200,
    indication: "Skeletal Class I/II/III malocclusion, cephalometric angle tracing",
    instructions: "Ear rods will position head gently in natural head posture.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-6",
    testName: "Random Blood Sugar (RBS) Glucometer Pre-Op",
    code: "LAB-RBS",
    category: "pathology",
    sampleOrModality: "Capillary Blood Fingerstick",
    turnaroundTime: "Immediate (2 mins)",
    defaultPriceBDT: 150,
    indication: "Pre-extraction and pre-implant screening for uncontrolled diabetes mellitus",
    instructions: "Note time of last meal/intake.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-7",
    testName: "Complete Blood Count (CBC) with ESR",
    code: "LAB-CBC",
    category: "pathology",
    sampleOrModality: "Venous Blood (EDTA Tube)",
    turnaroundTime: "Same Day (3 hours)",
    defaultPriceBDT: 600,
    indication: "Systemic infection, odontogenic cellulitis, anemia, platelet count",
    instructions: "Fasting not strictly required.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-8",
    testName: "Bleeding Time & Clotting Time (BT/CT)",
    code: "LAB-BTCT",
    category: "pathology",
    sampleOrModality: "Capillary Blood",
    turnaroundTime: "Immediate (15 mins)",
    defaultPriceBDT: 300,
    indication: "Pre-surgical screening before surgical extractions and flap surgery",
    instructions: "Standard Duke's/Ivy method finger prick.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-9",
    testName: "Prothrombin Time & INR (PT-INR)",
    code: "LAB-INR",
    category: "pathology",
    sampleOrModality: "Citrated Plasma (Blue Top)",
    turnaroundTime: "Same Day (4 hours)",
    defaultPriceBDT: 800,
    indication: "Patients on anti-coagulant / warfarin therapy prior to dental surgery",
    instructions: "Report current anticoagulant dosage.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-10",
    testName: "Pulp Vitality Cold & Electric Diagnostic Test",
    code: "CLN-PULP",
    category: "clinical",
    sampleOrModality: "Endo-Ice (-50°C) & EPT",
    turnaroundTime: "Immediate chairside",
    defaultPriceBDT: 300,
    indication: "Differentiate reversible vs irreversible pulpitis vs pulpal necrosis",
    instructions: "Cotton pellet with refrigerant spray placed on middle third of buccal crown.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-11",
    testName: "3D Intraoral Digital Impression / Study Casts",
    code: "CLN-SCAN",
    category: "clinical",
    sampleOrModality: "Intraoral Scanner / Alginate",
    turnaroundTime: "Immediate / 24 hours",
    defaultPriceBDT: 1500,
    indication: "Prosthodontic smile design, crown/bridge diagnostic wax-up, aligners",
    instructions: "Moisture control and high-speed intraoral optical scan.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-12",
    testName: "Oral Biopsy & Histopathological Examination",
    code: "BIO-HISTO",
    category: "biopsy",
    sampleOrModality: "Tissue Specimen (10% Formalin)",
    turnaroundTime: "3 to 5 Days",
    defaultPriceBDT: 3000,
    indication: "Suspicious mucosal leukoplakia, erythroplakia, fibroma, odontogenic cyst",
    instructions: "Specimen sent immediately to Oral Pathology lab.",
    isCustomAdded: false,
    isActive: true,
  },
  {
    id: "inv-13",
    testName: "TMJ Open & Closed Mouth Radiographs",
    code: "RAD-TMJ",
    category: "radiology",
    sampleOrModality: "Digital Tomogram / X-Ray",
    turnaroundTime: "20 mins",
    defaultPriceBDT: 1500,
    indication: "Temporomandibular joint internal derangement, condylar subluxation, clicking",
    instructions: "Two exposures: maximum intercuspation and maximum mouth opening.",
    isCustomAdded: false,
    isActive: true,
  },
];

const STORAGE_KEY = "dentai_investigations_catalog_v2";

export function getStoredInvestigations(): InvestigationItem[] {
  if (typeof window === "undefined") {
    return DEFAULT_INVESTIGATIONS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INVESTIGATIONS));
      return DEFAULT_INVESTIGATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_INVESTIGATIONS;
  } catch (err) {
    console.error("Error reading stored investigations:", err);
    return DEFAULT_INVESTIGATIONS;
  }
}

export function saveStoredInvestigations(list: InvestigationItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("dentai-investigations-updated", { detail: list }));
  } catch (err) {
    console.error("Error saving stored investigations:", err);
  }
}

export function addStoredInvestigation(
  item: Omit<InvestigationItem, "id"> & { id?: string }
): InvestigationItem {
  const current = getStoredInvestigations();
  const newItem: InvestigationItem = {
    ...item,
    id: item.id || `inv-custom-${Date.now()}`,
    isCustomAdded: true,
    isActive: true,
  };
  const updated = [newItem, ...current];
  saveStoredInvestigations(updated);
  return newItem;
}

export function updateStoredInvestigation(
  id: string,
  updates: Partial<InvestigationItem>
): InvestigationItem | null {
  const current = getStoredInvestigations();
  const index = current.findIndex((i) => i.id === id);
  if (index === -1) return null;
  const updatedItem = { ...current[index], ...updates };
  current[index] = updatedItem;
  saveStoredInvestigations([...current]);
  return updatedItem;
}

export function deleteStoredInvestigation(id: string): boolean {
  const current = getStoredInvestigations();
  const filtered = current.filter((i) => i.id !== id);
  if (filtered.length !== current.length) {
    saveStoredInvestigations(filtered);
    return true;
  }
  return false;
}

export function resetStoredInvestigations(): InvestigationItem[] {
  saveStoredInvestigations(DEFAULT_INVESTIGATIONS);
  return DEFAULT_INVESTIGATIONS;
}
