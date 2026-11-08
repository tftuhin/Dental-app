"use client";

import { allowsDemoData, clinicStorage } from "@/lib/clinic-storage";
import { getServicesSettings } from "@/lib/services-store";
import { getClinicSetup } from "@/lib/clinic-setup-store";
import { clinicCodeOf, nextPatientId, validatePattern } from "@/lib/patient-id";

/**
 * DentalOS1 Centralized Patient Demographics & EHR Store
 * 
 * Manages full patient demographics, contact details, medical alerts,
 * and clinical tags with browser localStorage persistence and cross-component reactivity.
 */

export interface PatientProfile {
  id: string;
  customId: string;
  name: string;
  dob: string; // "YYYY-MM-DD" or formatted date
  age: number;
  gender: "Female" | "Male" | "Other" | string;
  phone: string;
  phone2?: string;
  email: string;
  address: string;
  city?: string;
  emergencyContact: string;
  bloodGroup: string;
  allergies: string[];
  medicalConditions: string[];
  status: "active" | "recall_due" | "in_treatment" | "new";
  lastVisit: string;
  nextRecall?: string;
  outstandingBalance: string;
  tags: string[];
  occupation?: string;
  notes?: string;
  /** Set by the server when this user may only see part of the record (see lib/access-store). */
  _view?: "desk" | "private" | "private_desk";
  _owners?: string[];
}

export const INITIAL_PATIENTS: PatientProfile[] = [
  {
    id: "pat-1",
    customId: "DENT-2026-00042",
    name: "Anika Tabassum",
    dob: "1992-10-14",
    age: 34,
    gender: "Female",
    phone: "+880 1711-234891",
    phone2: "+880 1911-552211",
    email: "anika.tabassum@gmail.com",
    address: "House 42, Road 9/A, Dhanmondi R/A, Dhaka-1209, Bangladesh",
    city: "Dhaka",
    emergencyContact: "Tariqul Islam (Spouse) · +880 1711-234892",
    bloodGroup: "O+",
    allergies: ["Penicillin (Severe Anaphylaxis)"],
    medicalConditions: ["Mild Asthma (Well-controlled)"],
    status: "in_treatment",
    lastVisit: "Today",
    nextRecall: "Oct 30, 2026",
    outstandingBalance: "৳1,200.00",
    tags: ["High Caries Risk", "Crown Candidate", "Recall: 6M"],
    occupation: "Software Architect",
    notes: "Prefers morning appointments before 11 AM.",
  },
  {
    id: "pat-2",
    customId: "DENT-2026-00089",
    name: "Nusrat Parveen",
    dob: "1998-03-22",
    age: 28,
    gender: "Female",
    phone: "+880 1819-872334",
    email: "nusrat.parveen@gmail.com",
    address: "Flat 4B, Green Road, Dhaka-1205, Bangladesh",
    city: "Dhaka",
    emergencyContact: "Rafiqul Islam (Father) · +880 1819-872335",
    bloodGroup: "B+",
    allergies: [],
    medicalConditions: ["None reported"],
    status: "active",
    lastVisit: "Oct 12, 2026",
    nextRecall: "Apr 12, 2027",
    outstandingBalance: "৳0.00",
    tags: ["Routine Recall", "Orthodontic Evaluation"],
    occupation: "Teacher",
  },
  {
    id: "pat-3",
    customId: "DENT-2026-00104",
    name: "Mohammad Tariqul Islam",
    dob: "1981-08-11",
    age: 45,
    gender: "Male",
    phone: "+880 1912-439019",
    email: "tariqul.islam@outlook.com",
    address: "Plot 12, Sector 4, Uttara, Dhaka-1230, Bangladesh",
    city: "Dhaka",
    emergencyContact: "Sharmin Akter (Wife) · +880 1912-439020",
    bloodGroup: "A+",
    allergies: ["Sulfa Drugs"],
    medicalConditions: ["Hypertension (Taking Amlodipine 5mg)"],
    status: "new",
    lastVisit: "First Visit",
    outstandingBalance: "৳800.00",
    tags: ["New Patient", "Periodontal Screening"],
    occupation: "Business Executive",
  },
  {
    id: "pat-4",
    customId: "DENT-2026-00122",
    name: "Tanvir Ahmed",
    dob: "1987-12-05",
    age: 39,
    gender: "Male",
    phone: "+880 1675-901443",
    email: "tanvir.ahmed@gmail.com",
    address: "House 18, Road 3, Banani, Dhaka-1213, Bangladesh",
    city: "Dhaka",
    emergencyContact: "Rehana Ahmed (Sister) · +880 1675-901445",
    bloodGroup: "AB+",
    allergies: ["Latex Allergy"],
    medicalConditions: ["Pre-diabetic"],
    status: "in_treatment",
    lastVisit: "Oct 05, 2026",
    nextRecall: "Nov 05, 2026",
    outstandingBalance: "৳4,500.00",
    tags: ["Implant Candidate", "Root Canal Therapy"],
    occupation: "Banker",
  },
  {
    id: "pat-5",
    customId: "DENT-2025-00812",
    name: "Kazi Nazrul Haque",
    dob: "1964-06-19",
    age: 62,
    gender: "Male",
    phone: "+880 1722-312778",
    email: "kazi.nazrul@yahoo.com",
    address: "House 7, Road 14, Gulshan-1, Dhaka-1212, Bangladesh",
    city: "Dhaka",
    emergencyContact: "Kazi Farhan (Son) · +880 1722-312780",
    bloodGroup: "O+",
    allergies: ["Aspirin Sensitivity"],
    medicalConditions: ["Osteoporosis (On Bisphosphonates)", "Type 2 Diabetes"],
    status: "recall_due",
    lastVisit: "Apr 15, 2026",
    nextRecall: "Oct 15, 2026 (Overdue)",
    outstandingBalance: "৳0.00",
    tags: ["Bisphosphonate Alert", "Geriatric Care", "Overdue Recall"],
    occupation: "Retired Civil Servant",
  },
];

const STORAGE_KEY = "dentalos1-patients-registry-v1";

const BLANK_PATIENT: Omit<PatientProfile, "id" | "customId" | "name"> = {
  dob: "",
  age: 0,
  gender: "",
  phone: "",
  email: "",
  address: "",
  emergencyContact: "",
  bloodGroup: "",
  allergies: [],
  medicalConditions: [],
  status: "new",
  lastVisit: "First Visit",
  outstandingBalance: "৳0.00",
  tags: [],
};

/**
 * Calculate age from YYYY-MM-DD birthdate string
 */
export function calculateAgeFromDob(dobString: string): number {
  if (!dobString) return 0;
  const birth = new Date(dobString);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Format date string (e.g. 1992-10-14) to friendly text (October 14, 1992)
 */
export function formatDobDisplay(dobString: string): string {
  if (!dobString) return "Not specified";
  const birth = new Date(dobString);
  if (isNaN(birth.getTime())) return dobString;
  return birth.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get all patients from localStorage or default seed
 */
export function getAllPatients(): PatientProfile[] {
  if (typeof window === "undefined") return [];
  // Sample patients only fill an empty local demo, never a real clinic's records
  const seed = allowsDemoData() ? INITIAL_PATIENTS : [];
  try {
    const raw = clinicStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (seed.length > 0) clinicStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seed;
  } catch {
    return seed;
  }
}

/**
 * Get a specific patient by ID (pat-1, pat-2, etc. or customId)
 */
export function getPatientById(idOrCustomId: string): PatientProfile | undefined {
  const all = getAllPatients();
  if (!idOrCustomId) return undefined;
  return all.find((p) => p.id === idOrCustomId || p.customId === idOrCustomId);
}

/** Normalise a phone number to its digits for matching ("+880 1711-234891" → "8801711234891"). */
function phoneDigits(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

/**
 * Search the registry by name, patient ID or phone. Used by the booking
 * desk to find a returning patient before creating a new record.
 */
export function searchPatients(query: string, limit = 8): PatientProfile[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const qDigits = phoneDigits(q);
  return getAllPatients()
    .filter((p) => {
      if (p.name.toLowerCase().includes(q)) return true;
      if (p.customId.toLowerCase().includes(q)) return true;
      if (qDigits.length >= 4) {
        const digits = [p.phone, p.phone2 || ""].map(phoneDigits);
        // Compare on the trailing digits so "01711..." matches "+880 1711..."
        const tail = qDigits.slice(-10);
        return digits.some((d) => d && (d.includes(qDigits) || d.endsWith(tail)));
      }
      return false;
    })
    .slice(0, limit);
}

/** Exact phone match, used to stop duplicate registrations. */
export function findPatientByPhone(phone: string): PatientProfile | undefined {
  const tail = phoneDigits(phone).slice(-10);
  if (tail.length < 10) return undefined;
  return getAllPatients().find((p) =>
    [p.phone, p.phone2 || ""].some((ph) => phoneDigits(ph).endsWith(tail))
  );
}

/**
 * The next patient ID in the clinic's chosen format (Settings → Services &
 * Patient ID; see lib/patient-id.ts). Numbers continue from the highest ID
 * already used, so deleting or reordering patients never produces a duplicate.
 */
export function generateNextPatientId(patient: { name?: string; phone?: string } = {}): string {
  const settings = getServicesSettings();
  const pattern = validatePattern(settings.patientIdPattern).length === 0 ? settings.patientIdPattern : "DENT-{YYYY}-{SEQ:5}";
  const start = parseInt(settings.patientIdSequenceStart, 10);
  return nextPatientId(
    pattern,
    getAllPatients().map((p) => p.customId),
    { clinicCode: clinicCodeOf(settings.patientIdClinicCode, getClinicSetup().name), patientName: patient.name, phone: patient.phone },
    isNaN(start) || start < 1 ? 1 : start
  );
}

/**
 * Update an existing patient record
 */
export function updatePatient(
  id: string,
  updates: Partial<PatientProfile>
): PatientProfile {
  const all = getAllPatients();
  let updatedPatient: PatientProfile | undefined;

  const nextList = all.map((p) => {
    if (p.id === id || p.customId === id) {
      // If dob updated and age wasn't explicitly supplied, recalculate age
      let age = updates.age !== undefined ? updates.age : p.age;
      if (updates.dob && updates.age === undefined) {
        const calculated = calculateAgeFromDob(updates.dob);
        if (calculated > 0) age = calculated;
      }

      // If name updated, also sync combined name
      const name = updates.name || p.name;

      updatedPatient = {
        ...p,
        ...updates,
        name,
        age,
      };
      return updatedPatient;
    }
    return p;
  });

  if (!updatedPatient) {
    // If patient was not in list, create one
    const newId = id.startsWith("pat-") ? id : `pat-${Date.now()}`;
    // Never copy another patient's clinical data into a new record
    updatedPatient = {
      ...BLANK_PATIENT,
      customId: generateNextPatientId({ name: updates.name, phone: updates.phone }),
      ...updates,
      id: newId,
      name: updates.name || "Unnamed Patient",
    };
    nextList.push(updatedPatient);
  }

  if (typeof window !== "undefined") {
    clinicStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    window.dispatchEvent(
      new CustomEvent("dentalos1-patients-updated", {
        detail: { patient: updatedPatient, list: nextList },
      })
    );
  }

  return updatedPatient;
}

/**
 * Add a new patient record
 */
export function createPatient(
  patientData: Omit<PatientProfile, "id" | "customId"> & {
    id?: string;
    customId?: string;
  }
): PatientProfile {
  const all = getAllPatients();
  const customId = patientData.customId || generateNextPatientId({ name: patientData.name, phone: patientData.phone });
  const id = patientData.id || `pat-${Date.now()}`;

  const age =
    patientData.age || (patientData.dob ? calculateAgeFromDob(patientData.dob) : 30);

  const newPatient: PatientProfile = {
    ...patientData,
    id,
    customId,
    age,
    allergies: patientData.allergies || [],
    medicalConditions: patientData.medicalConditions || [],
    tags: patientData.tags || ["New Patient"],
    status: patientData.status || "new",
    lastVisit: patientData.lastVisit || "First Visit",
    outstandingBalance: patientData.outstandingBalance || "৳0.00",
  };

  const nextList = [newPatient, ...all];

  if (typeof window !== "undefined") {
    clinicStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    window.dispatchEvent(
      new CustomEvent("dentalos1-patients-updated", {
        detail: { patient: newPatient, list: nextList },
      })
    );
  }

  return newPatient;
}
