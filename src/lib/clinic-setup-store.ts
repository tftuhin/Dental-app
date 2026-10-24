"use client";

export interface DoctorProfile {
  id: string;
  name: string;
  designation: string;
  degree: string;
  bmdcReg: string;
  specialization: string;
  phone: string;
  email: string;
  visitingHours: string;
  room: string;
  status: "active" | "on_leave" | "inactive";
  avatar?: string;
}

export interface DentalChair {
  id: string;
  name: string;
  label: string;
  room: string;
  department: string;
  assignedDoctor?: string;
  status: "active" | "maintenance" | "occupied" | "reserved";
  equipment: string;
}

export interface ClinicSetupData {
  // Practice Profile
  name: string;
  tagline: string;
  logoUrl: string;
  address: string;
  phone: string;
  altPhone: string;
  email: string;
  website: string;
  bmdcLicense: string;
  emergencyPhone: string;

  // Operating Days & Hours
  openDays: string[];
  closedDays: string[];
  openingTime: string;
  closingTime: string;
  breakStartTime: string;
  breakEndTime: string;
  emergencyAvailable: boolean;

  // Brand Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  palettePreset: string;

  // Doctors & Chairs
  doctors: DoctorProfile[];
  chairs: DentalChair[];

  // Practice Defaults
  defaultCurrency: string;
  toothNotation: "universal" | "fdi";
}

export const ALL_DAYS_OF_WEEK = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export const COLOR_PALETTE_PRESETS = [
  {
    id: "dhaka-teal",
    label: "Dhaka Dental Teal (Default)",
    primary: "#0ea5e9",
    secondary: "#059669",
    accent: "#f59e0b",
  },
  {
    id: "royal-ocean",
    label: "Royal Ocean Blue",
    primary: "#2563eb",
    secondary: "#0891b2",
    accent: "#f97316",
  },
  {
    id: "surgical-emerald",
    label: "Surgical Emerald",
    primary: "#059669",
    secondary: "#0284c7",
    accent: "#e11d48",
  },
  {
    id: "modern-violet",
    label: "Modern Clinical Violet",
    primary: "#7c3aed",
    secondary: "#2563eb",
    accent: "#ec4899",
  },
  {
    id: "slate-executive",
    label: "Executive Slate & Navy",
    primary: "#334155",
    secondary: "#0284c7",
    accent: "#10b981",
  },
];

export const DEFAULT_DOCTORS: DoctorProfile[] = [
  {
    id: "doc-1",
    name: "Dr. Sarah Smith",
    designation: "Senior Consultant & Head of Oral Surgery",
    degree: "BDS (DU), FCPS (Oral & Maxillofacial Surgery)",
    bmdcReg: "A-84291",
    specialization: "Oral & Maxillofacial Surgery",
    phone: "+880 1711-842910",
    email: "dr.sarah@dhakadentalcare.com",
    visitingHours: "Sat - Thu: 10:00 AM - 02:00 PM, 05:00 PM - 09:00 PM",
    room: "Chamber 101, 1st Floor",
    status: "active",
  },
  {
    id: "doc-2",
    name: "Dr. Tanvir Ahmed",
    designation: "Consultant Orthodontist",
    degree: "BDS (DU), FCPS (Orthodontics & Dentofacial Orthopedics)",
    bmdcReg: "A-72154",
    specialization: "Orthodontics & Clear Aligners",
    phone: "+880 1712-721540",
    email: "dr.tanvir@dhakadentalcare.com",
    visitingHours: "Sun, Tue, Thu: 04:00 PM - 09:00 PM",
    room: "Chamber 102, 1st Floor",
    status: "active",
  },
  {
    id: "doc-3",
    name: "Dr. Nusrat Jahan",
    designation: "Specialist Endodontist",
    degree: "BDS (Chittagong), MS (Conservative Dentistry & Endodontics)",
    bmdcReg: "A-91302",
    specialization: "Microscopic Root Canal Therapy",
    phone: "+880 1713-913020",
    email: "dr.nusrat@dhakadentalcare.com",
    visitingHours: "Sat, Mon, Wed: 10:00 AM - 04:00 PM",
    room: "Chamber 103, 1st Floor",
    status: "active",
  },
  {
    id: "doc-4",
    name: "Dr. Kazi Mahfuzur Rahman",
    designation: "Prosthodontist & Implantologist",
    degree: "BDS, PGT (Dental Implantology, BSMU)",
    bmdcReg: "A-65819",
    specialization: "Crown & Bridge, Full Mouth Rehabilitation",
    phone: "+880 1714-658190",
    email: "dr.mahfuz@dhakadentalcare.com",
    visitingHours: "Sat - Thu: 05:00 PM - 09:30 PM",
    room: "Chamber 104, 1st Floor",
    status: "active",
  },
];

export const DEFAULT_CHAIRS: DentalChair[] = [
  {
    id: "chair-1",
    name: "Chair 01",
    label: "Main Operatory (Electric Hydraulic)",
    room: "Room 101, 1st Floor",
    department: "Oral Surgery & Implantology",
    assignedDoctor: "Dr. Sarah Smith",
    status: "active",
    equipment: "Digital Intraoral Sensor, Piezo Scaler, Surgical Light, Implant Motor",
  },
  {
    id: "chair-2",
    name: "Chair 02",
    label: "Orthodontic & Aesthetic Bay",
    room: "Room 102, 1st Floor",
    department: "Orthodontics & Clear Aligners",
    assignedDoctor: "Dr. Tanvir Ahmed",
    status: "active",
    equipment: "High-Speed Curing Light, Bracket Placement Station, Intraoral Camera",
  },
  {
    id: "chair-3",
    name: "Chair 03",
    label: "Endodontic & Microscopy Suite",
    room: "Room 103, 1st Floor",
    department: "Conservative Dentistry & Endodontics",
    assignedDoctor: "Dr. Nusrat Jahan",
    status: "active",
    equipment: "Dental Operating Microscope, Apex Locator, Rotary Endomotor, Warm Gutta Percha",
  },
  {
    id: "chair-4",
    name: "Chair 04",
    label: "Hygiene & Preventive Care Operatory",
    room: "Room 104, 1st Floor",
    department: "Periodontics & Preventive Dentistry",
    assignedDoctor: "Dr. Kazi Mahfuzur Rahman",
    status: "active",
    equipment: "Air-Flow Polishing Unit, Ultrasonic Scaler, Bleaching Lamp",
  },
];

export const DEFAULT_CLINIC_SETUP: ClinicSetupData = {
  name: "Dhaka Dental Care & Maxillofacial Implant Hospital",
  tagline: "Advanced Digital Dentistry, Specialized Implantology & Smile Design",
  logoUrl: "/icons/dental-care-logo.svg",
  address: "House 42, Road 9/A, Dhanmondi R/A, Dhaka-1209, Bangladesh",
  phone: "+880 1711-000000",
  altPhone: "+880 2-9661234",
  email: "contact@dhakadentalcare.com",
  website: "https://dhakadentalcare.com",
  bmdcLicense: "BMDC-DH-2024-842",
  emergencyPhone: "+880 1819-999999",

  openDays: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
  closedDays: ["Friday"],
  openingTime: "09:00 AM",
  closingTime: "09:00 PM",
  breakStartTime: "01:30 PM",
  breakEndTime: "02:30 PM",
  emergencyAvailable: true,

  primaryColor: "#0ea5e9",
  secondaryColor: "#059669",
  accentColor: "#f59e0b",
  palettePreset: "dhaka-teal",

  doctors: DEFAULT_DOCTORS,
  chairs: DEFAULT_CHAIRS,

  defaultCurrency: "BDT (৳)",
  toothNotation: "universal",
};

const STORAGE_KEY = "dentai_clinic_setup_v1";

export function getClinicSetup(): ClinicSetupData {
  if (typeof window === "undefined") {
    return DEFAULT_CLINIC_SETUP;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLINIC_SETUP));
      return DEFAULT_CLINIC_SETUP;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CLINIC_SETUP,
      ...parsed,
      doctors: parsed.doctors && parsed.doctors.length > 0 ? parsed.doctors : DEFAULT_DOCTORS,
      chairs: parsed.chairs && parsed.chairs.length > 0 ? parsed.chairs : DEFAULT_CHAIRS,
    };
  } catch {
    return DEFAULT_CLINIC_SETUP;
  }
}

export function saveClinicSetup(updates: Partial<ClinicSetupData>): ClinicSetupData {
  const current = getClinicSetup();
  const next: ClinicSetupData = {
    ...current,
    ...updates,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("dentai-clinic-setup-updated", { detail: next }));
  }
  return next;
}

// Doctor Management
export function addDoctor(doctor: Omit<DoctorProfile, "id">): DoctorProfile {
  const current = getClinicSetup();
  const newDoctor: DoctorProfile = {
    ...doctor,
    id: "doc-" + Date.now(),
  };
  const updatedDoctors = [...current.doctors, newDoctor];
  saveClinicSetup({ doctors: updatedDoctors });
  return newDoctor;
}

export function updateDoctor(id: string, updates: Partial<DoctorProfile>): DoctorProfile | null {
  const current = getClinicSetup();
  const index = current.doctors.findIndex((d) => d.id === id);
  if (index === -1) return null;

  const updatedDoctor = { ...current.doctors[index], ...updates };
  const updatedDoctors = [...current.doctors];
  updatedDoctors[index] = updatedDoctor;

  saveClinicSetup({ doctors: updatedDoctors });
  return updatedDoctor;
}

export function removeDoctor(id: string): boolean {
  const current = getClinicSetup();
  const filtered = current.doctors.filter((d) => d.id !== id);
  if (filtered.length === current.doctors.length) return false;
  saveClinicSetup({ doctors: filtered });
  return true;
}

// Chair Management
export function addChair(chair: Omit<DentalChair, "id">): DentalChair {
  const current = getClinicSetup();
  const newChair: DentalChair = {
    ...chair,
    id: "chair-" + Date.now(),
  };
  const updatedChairs = [...current.chairs, newChair];
  saveClinicSetup({ chairs: updatedChairs });
  return newChair;
}

export function updateChair(id: string, updates: Partial<DentalChair>): DentalChair | null {
  const current = getClinicSetup();
  const index = current.chairs.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const updatedChair = { ...current.chairs[index], ...updates };
  const updatedChairs = [...current.chairs];
  updatedChairs[index] = updatedChair;

  saveClinicSetup({ chairs: updatedChairs });
  return updatedChair;
}

export function removeChair(id: string): boolean {
  const current = getClinicSetup();
  const filtered = current.chairs.filter((c) => c.id !== id);
  if (filtered.length === current.chairs.length) return false;
  saveClinicSetup({ chairs: filtered });
  return true;
}
