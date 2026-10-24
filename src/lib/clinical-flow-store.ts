// ============================================================
// DENTAI OS — CLINICAL FLOW STORE & PATIENT QUEUE
// Manages:
// 1. Patient booking (Online, Phone, Walk-in) with Daily Serials
// 2. Doctor session start, consultation, briefing, note taking & file uploads
// 3. Mark completed & handover to Rx and Billing
// 4. Dropdown for Today's Completed Patients
// 5. Automated Follow-up Appointment Scheduling
// 6. Complete Activity Logging under Patient History & Timeline
// ============================================================

export interface ClinicalSessionFile {
  id: string;
  name: string;
  size: number | string;
  type: string; // e.g. "image/jpeg", "image/png", "application/pdf", "image", "pdf"
  url: string; // data URL or preview link
  uploadedAt: string;
  notes?: string;
  category?: "xray" | "report" | "intraoral_photo" | "other" | string;
}

export interface ClinicalQueuePatient {
  id: string;
  token: string;
  fifoSerial: number; // kept for compatibility
  serialNumber?: number; // cleaner alias
  bookingChannel: "online" | "phone" | "walk_in";
  patient: string;
  patientId: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  chair: string;
  doctor: string;
  time: string;
  duration: string;
  service: string;
  status: "scheduled" | "checked_in" | "in_progress" | "completed" | "no_show";
  alerts: string[];
  chiefComplaint?: string;
  selectedSymptoms?: string[];
  clinicalNotes?: string;
  provisionalDiagnosis?: string;
  labProceduresRecommended?: string[];
  uploadedFiles?: ClinicalSessionFile[];
  vitals?: { bp: string; pulse: string; bloodSugar?: string; temp?: string };
  completedAt?: string;
  prescriptionDone?: boolean;
  billed?: boolean;
  suggestedFee?: number;
  followUpDate?: string;
  followUpSerial?: number;
}

export interface PatientTimelineEvent {
  id: string;
  patientId: string;
  date: string;
  timestamp: number;
  type: "clinical_procedure" | "prescription" | "invoice" | "appointment";
  title: string;
  doctor: string;
  chair?: string;
  chiefComplaint?: string;
  selectedSymptoms?: string[];
  targetTooth?: string;
  clinicalNotes?: string;
  examinationFindings?: {
    percussion?: string;
    coldTest?: string;
    mobility?: string;
    vitals?: { bp?: string; pulse?: string; bloodSugar?: string; temp?: string };
  };
  provisionalDiagnosis?: string;
  labProcedures?: string[];
  uploadedFiles?: ClinicalSessionFile[];
  prescribedMedicines?: Array<{
    brandName: string;
    genericName?: string;
    strength?: string;
    dosageForm?: string;
    frequency?: string;
    duration?: string;
    timing?: string;
    instructions?: string;
  }>;
  billingDetails?: {
    invoiceNumber: string;
    totalAmount: number;
    discountAmount?: number;
    paidAmount: number;
    paymentMethod: string;
    paidAt: string;
    receiptNumber: string;
  };
  followUpScheduled?: {
    date: string;
    serialNumber: number;
    reason: string;
  };
  prescriptionPdfDoc?: PrescriptionPdfDocument;
  badge: string;
  badgeColor: string;
}

export interface PrescriptionPdfDocument {
  id?: string;
  rxNumber: string;
  fileName: string;
  fileSize: string;
  generatedAt: string;
  patientName?: string;
  patientId?: string;
  doctor?: string;
  doctorName?: string;
  bmdcRegNo?: string;
  clinicName?: string;
  diagnosis?: string;
  medicines: Array<{
    brandName: string;
    genericName?: string;
    strength?: string;
    dosageForm?: string;
    frequency?: string;
    duration?: string;
    timing?: string;
    instructions?: string;
  }>;
  tests?: Array<{
    id?: string;
    testName: string;
    indication?: string;
  }> | string[];
  investigations?: string[];
  followUpDate?: string;
  advice?: string;
  downloadUrl?: string;
}

export interface HistoricalPrescription {
  id: string;
  rxNumber: string;
  date: string;
  patientName: string;
  patientId: string;
  phone: string;
  age: number;
  gender: string;
  doctorName: string;
  doctorQualifications: string;
  diagnosis: string;
  medicines: Array<{
    brandName: string;
    genericName: string;
    strength: string;
    dosageForm: string;
    frequency: string;
    duration: string;
    timing: string;
  }>;
  tests: string[];
  advice: string;
  pdfHash: string;
  followUpDate?: string;
}

export const INITIAL_APPOINTMENTS: ClinicalQueuePatient[] = [
  {
    id: "apt-1",
    token: "A-014",
    fifoSerial: 1,
    serialNumber: 1,
    bookingChannel: "walk_in",
    patient: "Anika Tabassum",
    patientId: "DENT-2026-00042",
    phone: "+880 1712-345678",
    age: 34,
    gender: "Female",
    address: "House 42, Road 7A, Dhanmondi R/A, Dhaka",
    chair: "Chair 1",
    doctor: "Dr. Sarah Smith, BDS, FCPS",
    time: "10:15 AM",
    duration: "45m",
    service: "Endodontic Pulpectomy (Tooth #19)",
    status: "in_progress",
    alerts: ["Penicillin Allergy (Severe Anaphylaxis)"],
    chiefComplaint: "Intense lingering pain in lower left molar, awakens patient at night, throbs constantly.",
    selectedSymptoms: [
      "Spontaneous Throbbing Toothache",
      "Severe Nocturnal Pain (Awakens at night)",
      "Pain upon Chewing / Biting",
      "Sharp Sensitivity to Cold/Hot",
    ],
    clinicalNotes: "Tooth #19 exhibits deep distal-occlusal carious cavitation into pulp chamber. Tenderness to axial percussion. Lingering cold response >30 sec. Root canal rotary instrumentation initiated to size #25 0.04 taper.",
    provisionalDiagnosis: "Symptomatic Irreversible Pulpitis with Apical Periodontitis (Tooth #19)",
    labProceduresRecommended: [
      "Digital IOPA Radiograph (Tooth #19 Post-Access)",
      "Complete Rotary Endodontic Therapy",
    ],
    uploadedFiles: [
      {
        id: "file-init-1",
        name: "IOPA_Tooth_19_PreOp.jpg",
        size: 142000,
        type: "image/jpeg",
        url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
        uploadedAt: "10:18 AM Today",
        category: "xray",
      },
      {
        id: "file-init-2",
        name: "Blood_RBS_Glucose_Report.pdf",
        size: 285000,
        type: "application/pdf",
        url: "#",
        uploadedAt: "10:20 AM Today",
        category: "report",
      },
    ],
    vitals: { bp: "120/80", pulse: "74", bloodSugar: "5.8 mmol/L" },
    suggestedFee: 8500,
  },
  {
    id: "apt-2",
    token: "A-015",
    fifoSerial: 2,
    serialNumber: 2,
    bookingChannel: "phone",
    patient: "Mohammad Tariqul Islam",
    patientId: "DENT-2026-00089",
    phone: "+880 1819-876543",
    age: 45,
    gender: "Male",
    address: "Section 10, Mirpur, Dhaka",
    chair: "Chair 2",
    doctor: "Dr. Tanvir Ahmed, BDS (DU), FCPS",
    time: "10:45 AM",
    duration: "30m",
    service: "Zirconia Crown Cementation (#30)",
    status: "checked_in",
    alerts: ["Hypertension (Controlled on Amlodipine)"],
    chiefComplaint: "Trial and final cementation of monolithic zirconia crown on root-canal treated tooth #30.",
    selectedSymptoms: [],
    clinicalNotes: "Margin fit checked with fit-checker paste. Proximal contacts verified with floss. Occlusion adjusted using 8μ articulating paper. Cemented with resin-modified glass ionomer.",
    provisionalDiagnosis: "Post-Endodontic Restoration (#30)",
    labProceduresRecommended: ["Crown Bite Verification & Periapical Check"],
    vitals: { bp: "128/84", pulse: "78" },
    suggestedFee: 12000,
  },
  {
    id: "apt-3",
    token: "A-016",
    fifoSerial: 3,
    serialNumber: 3,
    bookingChannel: "online",
    patient: "Nusrat Parveen",
    patientId: "DENT-2026-00104",
    phone: "+880 1914-112233",
    age: 28,
    gender: "Female",
    address: "Road 11, Block D, Banani, Dhaka",
    chair: "Chair 3",
    doctor: "Dr. Sarah Smith, BDS, FCPS",
    time: "11:00 AM",
    duration: "45m",
    service: "Ultrasonic Scaling & 6-Point Perio Charting",
    status: "scheduled",
    alerts: [],
    chiefComplaint: "Gum bleeding during morning brushing and unpleasant taste in mouth.",
    selectedSymptoms: [
      "Gingival Bleeding during Brushing",
      "Foul Odor / Halitosis",
      "Localized Gum Swelling / Abscess",
    ],
    clinicalNotes: "Supragingival and subgingival calculus deposits in mandibular anterior region. Generalized marginal erythema.",
    provisionalDiagnosis: "Generalized Plaque-Induced Marginal Gingivitis",
    labProceduresRecommended: ["Full Mouth Ultrasonic Debridement", "Perio Probing Chart"],
    vitals: { bp: "115/75", pulse: "72" },
    suggestedFee: 2500,
  },
  {
    id: "apt-4",
    token: "A-017",
    fifoSerial: 4,
    serialNumber: 4,
    bookingChannel: "walk_in",
    patient: "Kazi Nazrul Haque",
    patientId: "DENT-2026-00122",
    phone: "+880 1611-998877",
    age: 58,
    gender: "Male",
    address: "Sector 7, Uttara, Dhaka",
    chair: "Chair 1",
    doctor: "Dr. Tanvir Ahmed, BDS (DU), FCPS",
    time: "11:30 AM",
    duration: "30m",
    service: "Surgical Wisdom Tooth Consultation (#38)",
    status: "scheduled",
    alerts: ["Type 2 Diabetes (HbA1c: 6.8)"],
    chiefComplaint: "Painful swollen gum flap behind lower left wisdom tooth.",
    selectedSymptoms: [
      "Localized Gum Swelling / Abscess",
      "Pain upon Chewing / Biting",
      "Jaw Joint / TMJ Pain or Clicking",
    ],
    clinicalNotes: "Partially erupted mesioangular impacted #38 with inflamed operculum. Mild trismus noted.",
    provisionalDiagnosis: "Acute Pericoronitis of Impacted Tooth #38",
    labProceduresRecommended: ["Digital OPG Panoramic Radiograph", "Surgical Operculectomy"],
    vitals: { bp: "132/85", pulse: "76", bloodSugar: "7.1 mmol/L" },
    suggestedFee: 3500,
  },
  {
    id: "apt-5",
    token: "A-018",
    fifoSerial: 5,
    serialNumber: 5,
    bookingChannel: "online",
    patient: "Farhana Rahman",
    patientId: "DENT-2026-00145",
    phone: "+880 1715-443322",
    age: 24,
    gender: "Female",
    address: "Gulshan-2, Dhaka",
    chair: "Chair 2",
    doctor: "Dr. Tanvir Ahmed, BDS (DU), FCPS",
    time: "12:00 PM",
    duration: "30m",
    service: "Composite Aesthetic Restoration (#14 MO)",
    status: "scheduled",
    alerts: [],
    chiefComplaint: "Food catching between upper right teeth and dark shadow.",
    selectedSymptoms: ["Sharp Sensitivity to Cold/Hot"],
    clinicalNotes: "Mesio-occlusal class II dentinal cavity #14.",
    provisionalDiagnosis: "Dental Caries Enamel and Dentine (#14 MO)",
    labProceduresRecommended: ["Bitewing Radiograph", "Nano-hybrid Composite Restoration"],
    vitals: { bp: "118/76", pulse: "70" },
    suggestedFee: 2200,
  },
  {
    id: "apt-6",
    token: "A-012",
    fifoSerial: 0,
    serialNumber: 0,
    bookingChannel: "phone",
    patient: "Abdur Razzaq",
    patientId: "DENT-2026-00031",
    phone: "+880 1817-665544",
    age: 62,
    gender: "Male",
    address: "Nazimuddin Road, Old Dhaka",
    chair: "Chair 1",
    doctor: "Dr. Sarah Smith, BDS, FCPS",
    time: "09:00 AM",
    duration: "45m",
    service: "Full Mouth Dental Implant Consult (OPG Review)",
    status: "completed",
    alerts: ["Cardiac Stent (2023 - Aspirin 75mg)"],
    chiefComplaint: "Difficulty chewing food due to missing lower molars.",
    selectedSymptoms: ["Tooth Mobility / Looseness"],
    clinicalNotes: "Reviewed CBCT scan. Adequate bone volume (11mm height, 7mm width) in edentulous regions #36 and #46. Planned for dual titanium implants.",
    provisionalDiagnosis: "Bilateral Partial Edentulism of Mandible",
    labProceduresRecommended: ["CBCT 3D Surgical Guide", "Pre-op Blood Coagulation Profile"],
    vitals: { bp: "124/80", pulse: "68" },
    completedAt: "09:48 AM Today",
    prescriptionDone: true,
    billed: true,
    suggestedFee: 1500,
  },
];

// Alias for backwards compatibility
export const INITIAL_FIFO_APPOINTMENTS = INITIAL_APPOINTMENTS;

export const HISTORICAL_PRESCRIPTIONS: HistoricalPrescription[] = [
  {
    id: "rx-hist-1",
    rxNumber: "RX-2026-00381",
    date: "Today, Oct 24, 2026",
    patientName: "Anika Tabassum",
    patientId: "DENT-2026-00042",
    phone: "+880 1712-345678",
    age: 34,
    gender: "Female",
    doctorName: "Dr. Sarah Smith",
    doctorQualifications: "BDS, FCPS (Oral & Maxillofacial Surgery)",
    diagnosis: "Symptomatic Irreversible Pulpitis #19 (Penicillin Allergic Patient)",
    medicines: [
      {
        brandName: "Torax",
        genericName: "Ketorolac Tromethamine",
        strength: "10 mg",
        dosageForm: "Tablet",
        frequency: "1+0+1",
        duration: "3 days",
        timing: "After food",
      },
      {
        brandName: "Amodis",
        genericName: "Metronidazole",
        strength: "400 mg",
        dosageForm: "Tablet",
        frequency: "1+1+1",
        duration: "5 days",
        timing: "After food",
      },
      {
        brandName: "Maxpro",
        genericName: "Esomeprazole",
        strength: "20 mg",
        dosageForm: "Capsule",
        frequency: "1+0+1",
        duration: "5 days",
        timing: "30 mins before food",
      },
      {
        brandName: "Clohex",
        genericName: "Chlorhexidine 0.2%",
        strength: "100 ml",
        dosageForm: "Oral Rinse",
        frequency: "1+0+1",
        duration: "7 days",
        timing: "After tooth brushing",
      },
    ],
    tests: [
      "Digital IOPA Radiograph (Tooth #19 Post-Access)",
      "Cold & Electric Pulp Vitality Test",
    ],
    advice: "Soft diet for 48 hours. Avoid chewing hard food on left side. Call clinic if nocturnal pain persists.",
    pdfHash: "1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
    followUpDate: "Oct 31, 2026",
  },
  {
    id: "rx-hist-2",
    rxNumber: "RX-2026-00365",
    date: "Oct 18, 2026",
    patientName: "Mohammad Tariqul Islam",
    patientId: "DENT-2026-00089",
    phone: "+880 1819-876543",
    age: 45,
    gender: "Male",
    doctorName: "Dr. Tanvir Ahmed",
    doctorQualifications: "BDS (DU), FCPS (Prosthodontics)",
    diagnosis: "Post-Endodontic Restoration & Core Build-Up (Tooth #30)",
    medicines: [
      {
        brandName: "Napa Extra",
        genericName: "Paracetamol + Caffeine",
        strength: "500 mg + 65 mg",
        dosageForm: "Tablet",
        frequency: "1+0+1",
        duration: "3 days",
        timing: "After food",
      },
      {
        brandName: "Clohex",
        genericName: "Chlorhexidine 0.2%",
        strength: "100 ml",
        dosageForm: "Oral Rinse",
        frequency: "1+0+1",
        duration: "7 days",
        timing: "After tooth brushing",
      },
    ],
    tests: ["Digital Bitewing Radiograph (#30)"],
    advice: "Crown delivery scheduled. Maintain good interdental hygiene with dental floss.",
    pdfHash: "2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
  },
  {
    id: "rx-hist-3",
    rxNumber: "RX-2026-00340",
    date: "Oct 10, 2026",
    patientName: "Farhana Rahman",
    patientId: "DENT-2026-00145",
    phone: "+880 1715-443322",
    age: 24,
    gender: "Female",
    doctorName: "Dr. Tanvir Ahmed",
    doctorQualifications: "BDS (DU), FCPS (Conservative Dentistry)",
    diagnosis: "Dentin Hypersensitivity & Cervical Abrasion (#13, #14)",
    medicines: [
      {
        brandName: "Sensolin",
        genericName: "Potassium Nitrate 5%",
        strength: "50 g",
        dosageForm: "Topical Gel",
        frequency: "1+0+1",
        duration: "14 days",
        timing: "Brush gently twice daily",
      },
    ],
    tests: ["Cold Thermal Test (#13, #14)"],
    advice: "Use ultra-soft toothbrush with modified Bass brushing technique. Avoid aggressive horizontal scrubbing.",
    pdfHash: "3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
  },
];

export const INITIAL_TIMELINE_EVENTS: PatientTimelineEvent[] = [
  {
    id: "tl-init-1",
    patientId: "DENT-2026-00042",
    date: "Today, Oct 24, 2026 · 10:15 AM",
    timestamp: Date.now(),
    type: "clinical_procedure",
    title: "Clinical Procedure & Operatory Note: RCT Pulpectomy (#19)",
    doctor: "Dr. Sarah Smith, BDS, FCPS",
    chair: "Chair 1 (RCT)",
    chiefComplaint: "Intense lingering pain in lower left molar, awakens patient at night, throbs constantly.",
    selectedSymptoms: [
      "Spontaneous Throbbing Toothache",
      "Severe Nocturnal Pain (Awakens at night)",
      "Pain upon Chewing / Biting",
      "Sharp Sensitivity to Cold/Hot",
    ],
    targetTooth: "#19",
    clinicalNotes:
      "Tooth #19 exhibits deep distal-occlusal carious cavitation into pulp chamber. Tenderness to axial percussion. Lingering cold response >30 sec. Rotary instrumentation completed to size #25 0.04 taper under rubber dam isolation. Calcium hydroxide intra-canal medicament placed.",
    examinationFindings: {
      percussion: "(+) Tender to percussion",
      coldTest: "Lingering sharp pain (>30 sec)",
      mobility: "Gr-0 (Normal physiological)",
      vitals: { bp: "120/80", pulse: "74", bloodSugar: "5.8 mmol/L", temp: "98.6°F" },
    },
    provisionalDiagnosis: "Symptomatic Irreversible Pulpitis with Apical Periodontitis (Tooth #19)",
    labProcedures: [
      "Digital IOPA Radiograph (Tooth #19 Post-Access)",
      "Cold & Electric Pulp Vitality Test",
    ],
    uploadedFiles: [
      {
        id: "file-tl-1",
        name: "Tooth19_Periapical_PreOp.jpg",
        size: 142000,
        type: "image/jpeg",
        url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
        uploadedAt: "10:18 AM Today",
        category: "xray",
      },
      {
        id: "file-tl-2",
        name: "Blood_RBS_Glucose_Report.pdf",
        size: 285000,
        type: "application/pdf",
        url: "#",
        uploadedAt: "10:20 AM Today",
        category: "report",
      },
    ],
    prescribedMedicines: [
      {
        brandName: "Torax",
        genericName: "Ketorolac Tromethamine",
        strength: "10 mg",
        dosageForm: "Tablet",
        frequency: "1+0+1",
        duration: "3 days",
        timing: "After food",
        instructions: "Take for breakthrough pain. Do not exceed 5 days.",
      },
      {
        brandName: "Amodis",
        genericName: "Metronidazole",
        strength: "400 mg",
        dosageForm: "Tablet",
        frequency: "1+1+1",
        duration: "5 days",
        timing: "After food",
        instructions: "Anaerobic protection for necrotic pulp canals.",
      },
      {
        brandName: "Maxpro",
        genericName: "Esomeprazole Magnesium",
        strength: "20 mg",
        dosageForm: "Capsule",
        frequency: "1+0+1",
        duration: "5 days",
        timing: "30 mins before food",
        instructions: "Gastric mucosal protection during NSAID therapy.",
      },
      {
        brandName: "Clohex",
        genericName: "Chlorhexidine Gluconate 0.2%",
        strength: "100 ml",
        dosageForm: "Oral Rinse",
        frequency: "1+0+1",
        duration: "7 days",
        timing: "After tooth brushing",
        instructions: "Swish vigorously for 60 seconds. Do not swallow.",
      },
    ],
    billingDetails: {
      invoiceNumber: "INV-2026-00412",
      totalAmount: 9700,
      discountAmount: 1200,
      paidAmount: 8500,
      paymentMethod: "bKash Digital Payment",
      paidAt: "10:55 AM Today",
      receiptNumber: "REC-2026-9812",
    },
    followUpScheduled: {
      date: "Oct 31, 2026",
      serialNumber: 1,
      reason: "Root Canal Obturation & Core Build-Up (#19)",
    },
    badge: "Completed & Paid",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    id: "tl-init-2",
    patientId: "DENT-2026-00042",
    date: "Oct 12, 2026 · 02:30 PM",
    timestamp: Date.now() - 12 * 86400000,
    type: "appointment",
    title: "Routine Hygiene & Perio Charting",
    doctor: "Dr. Sarah Smith, BDS, FCPS",
    chair: "Chair 3",
    clinicalNotes:
      "Full mouth scaling and ultrasonic debridement. Completed 6-point probing chart. Localized 5mm pocket noted distal of #14 and mesial of #19. Oral hygiene instructions delivered.",
    badge: "Completed",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    id: "tl-init-3",
    patientId: "DENT-2026-00042",
    date: "Apr 15, 2026 · 09:00 AM",
    timestamp: Date.now() - 192 * 86400000,
    type: "clinical_procedure",
    title: "Diagnostic Full Mouth Panoramic Radiograph (OPG)",
    doctor: "Radiology Tech",
    clinicalNotes: "Digital OPG captured. Normal condylar morphology. Early apical rarefaction tooth #19.",
    uploadedFiles: [
      {
        id: "file-tl-3",
        name: "FullMouth_Panoramic_OPG.jpg",
        size: 520000,
        type: "image/jpeg",
        url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
        uploadedAt: "Apr 15, 2026",
        category: "xray",
      },
    ],
    badge: "Attached",
    badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
];

const STORAGE_KEY = "dentai_appointments_patient_queue_v2";
const TIMELINE_STORAGE_KEY = "dentai_patient_timelines_v2";

// Helpers for localStorage sync across tabs and pages
export function getStoredAppointments(): ClinicalQueuePatient[] {
  if (typeof window === "undefined") return INITIAL_APPOINTMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
      return INITIAL_APPOINTMENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_APPOINTMENTS;
  } catch (e) {
    console.error("Failed to load appointments from localStorage:", e);
    return INITIAL_APPOINTMENTS;
  }
}

export function saveStoredAppointments(list: ClinicalQueuePatient[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("dentai-appointments-updated"));
  } catch (e) {
    console.error("Failed to save appointments:", e);
  }
}

// Helpers for Patient History & Unified Timeline Events
export function getPatientTimeline(patientId: string): PatientTimelineEvent[] {
  if (typeof window === "undefined") {
    return INITIAL_TIMELINE_EVENTS.filter((e) => e.patientId === patientId);
  }
  try {
    const raw = localStorage.getItem(TIMELINE_STORAGE_KEY);
    let allEvents: PatientTimelineEvent[] = INITIAL_TIMELINE_EVENTS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        allEvents = parsed;
      }
    } else {
      localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(INITIAL_TIMELINE_EVENTS));
    }
    return allEvents
      .filter((e) => e.patientId === patientId)
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error("Failed to load timeline events:", e);
    return INITIAL_TIMELINE_EVENTS.filter((e) => e.patientId === patientId);
  }
}

export function logPatientActivity(event: PatientTimelineEvent): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(TIMELINE_STORAGE_KEY);
    let allEvents: PatientTimelineEvent[] = INITIAL_TIMELINE_EVENTS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        allEvents = parsed;
      }
    }
    // Prepend new activity
    const updated = [event, ...allEvents];
    localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("dentai-timeline-updated", { detail: event }));
  } catch (e) {
    console.error("Failed to log patient activity:", e);
  }
}

// Automatically schedule a follow-up appointment on given date with next available serial
export function scheduleFollowUpAppointment(
  patientId: string,
  followUpDate: string,
  serviceOrReason = "Follow-up Consultation & Review"
): { appointment: ClinicalQueuePatient; serialNumber: number } {
  const appointments = getStoredAppointments();
  const patient = appointments.find((a) => a.patientId === patientId || a.id === patientId) || {
    patient: "Anika Tabassum",
    phone: "+880 1712-345678",
    age: 34,
    gender: "Female",
    address: "Dhaka",
    alerts: [],
  };

  // Calculate next available serial number on schedule
  const nextSerial =
    appointments.reduce((max, a) => Math.max(max, a.fifoSerial || a.serialNumber || 0), 0) + 1;

  const newAppointment: ClinicalQueuePatient = {
    id: `apt-followup-${Date.now()}`,
    token: `A-0${nextSerial + 15}`,
    fifoSerial: nextSerial,
    serialNumber: nextSerial,
    bookingChannel: "walk_in",
    patient: patient.patient,
    patientId: patientId,
    phone: patient.phone,
    age: patient.age,
    gender: patient.gender,
    address: patient.address,
    chair: "Chair 1",
    doctor: "Dr. Sarah Smith, BDS, FCPS",
    time: "10:30 AM",
    duration: "30m",
    service: serviceOrReason,
    status: "scheduled",
    alerts: patient.alerts || [],
    clinicalNotes: `Scheduled follow-up for ${followUpDate}.`,
    followUpDate: followUpDate,
  };

  saveStoredAppointments([...appointments, newAppointment]);
  return { appointment: newAppointment, serialNumber: nextSerial };
}

// Search historical prescriptions by query (Patient name, ID, or phone)
export function searchHistoricalPrescriptions(query: string): HistoricalPrescription[] {
  if (!query || !query.trim()) return HISTORICAL_PRESCRIPTIONS;
  const q = query.toLowerCase().trim();
  return HISTORICAL_PRESCRIPTIONS.filter(
    (rx) =>
      rx.patientName.toLowerCase().includes(q) ||
      rx.patientId.toLowerCase().includes(q) ||
      rx.phone.replace(/[^0-9]/g, "").includes(q.replace(/[^0-9]/g, "")) ||
      rx.rxNumber.toLowerCase().includes(q) ||
      rx.diagnosis.toLowerCase().includes(q)
  );
}
