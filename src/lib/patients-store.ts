"use client";

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
  if (typeof window === "undefined") {
    return INITIAL_PATIENTS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PATIENTS));
      return INITIAL_PATIENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_PATIENTS;
  } catch {
    return INITIAL_PATIENTS;
  }
}

/**
 * Get a specific patient by ID (pat-1, pat-2, etc. or customId)
 */
export function getPatientById(idOrCustomId: string): PatientProfile | undefined {
  const all = getAllPatients();
  const found = all.find(
    (p) => p.id === idOrCustomId || p.customId === idOrCustomId
  );
  if (found) return found;
  // Fallback to first patient if looking for generic or test ID
  if (idOrCustomId === "pat-1" || !idOrCustomId) return all[0];
  return undefined;
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
    updatedPatient = {
      ...INITIAL_PATIENTS[0],
      ...updates,
      id: newId,
      name: updates.name || "Updated Patient",
    };
    nextList.push(updatedPatient);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
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
  const nextSeq = all.length + 43;
  const customId =
    patientData.customId || `DENT-2026-${String(nextSeq).padStart(5, "0")}`;
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    window.dispatchEvent(
      new CustomEvent("dentalos1-patients-updated", {
        detail: { patient: newPatient, list: nextList },
      })
    );
  }

  return newPatient;
}
