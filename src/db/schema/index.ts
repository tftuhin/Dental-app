// ============================================================
// DENTALOS1 — COMPLETE DATABASE SCHEMA
// Phase 1: Full Neon PostgreSQL + Drizzle ORM Schema
// ============================================================

import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  decimal,
  pgEnum,
  serial,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "clinic_owner",
  "dentist",
  "hygienist",
  "receptionist",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
]);

export const patientStatusEnum = pgEnum("patient_status", [
  "active",
  "inactive",
  "recall_due",
  "in_treatment",
  "new",
]);

export const toothNotationEnum = pgEnum("tooth_notation", [
  "universal",
  "fdi",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "mobile_money",
  "insurance",
  "bank_transfer",
  "other",
]);

export const smsStatusEnum = pgEnum("sms_status", [
  "queued",
  "sent",
  "delivered",
  "failed",
  "undelivered",
]);

export const dosageFormEnum = pgEnum("dosage_form", [
  "tablet",
  "capsule",
  "syrup",
  "oral_rinse",
  "topical_gel",
  "injection",
  "drops",
  "inhaler",
  "powder",
  "other",
]);

export const labOrderStatusEnum = pgEnum("lab_order_status", [
  "pending",
  "sent_to_lab",
  "in_progress",
  "completed",
  "delivered",
  "cancelled",
]);

export const documentCategoryEnum = pgEnum("document_category", [
  "xray_iopa",
  "xray_opg",
  "xray_bitewing",
  "xray_cbct",
  "lab_report",
  "consent_form",
  "prescription_pdf",
  "invoice_pdf",
  "medical_certificate",
  "other",
]);

export const discountTypeEnum = pgEnum("discount_type", [
  "fixed",
  "percentage",
  "birthday_privilege",
  "none",
]);

export const smsEventEnum = pgEnum("sms_event", [
  "appointment_booked",
  "queue_reminder",
  "visit_followup",
  "missed_appointment",
  "next_visit_reminder",
  "campaign",
  "custom",
]);

// ─── CLINICS ──────────────────────────────────────────────────────────────────

export const clinics = pgTable("clinics", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  logoUrl: text("logo_url"),
  letterheadUrl: text("letterhead_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clinicSettings = pgTable("clinic_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" })
    .unique(),
  // Patient ID Engine
  patientIdPattern: varchar("patient_id_pattern", { length: 100 }).default(
    "DENT-{YYYY}-{SEQ:5}"
  ),
  // Tooth notation preference
  defaultToothNotation: toothNotationEnum("default_tooth_notation").default(
    "universal"
  ),
  // Branding
  primaryColor: varchar("primary_color", { length: 7 }).default("#0d9488"),
  accentColor: varchar("accent_color", { length: 7 }).default("#059669"),
  // SMS
  smsProvider: varchar("sms_provider", { length: 50 }),
  smsApiKey: text("sms_api_key"),
  smsApiSecret: text("sms_api_secret"),
  smsFromNumber: varchar("sms_from_number", { length: 30 }),
  smsEnabled: boolean("sms_enabled").default(false),
  // AI
  aiProvider: varchar("ai_provider", { length: 50 }).default("anthropic"),
  // Billing
  currency: varchar("currency", { length: 10 }).default("USD"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── PATIENT ID COUNTER (Atomic) ───────────────────────────────────────────────

export const patientIdCounters = pgTable(
  "patient_id_counters",
  {
    id: serial("id").primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    prefix: varchar("prefix", { length: 50 }).notNull(),
    currentYear: integer("current_year").notNull(),
    currentMonth: integer("current_month").notNull(),
    lastSequence: integer("last_sequence").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("patient_id_counters_unique").on(
      table.clinicId,
      table.prefix,
      table.currentYear,
      table.currentMonth
    ),
  ]
);

// ─── USERS ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id").references(() => clinics.id, {
    onDelete: "set null",
  }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").default("receptionist").notNull(),
  title: varchar("title", { length: 50 }), // "Dr.", "Dr. (BDS)", "RDH"
  specialty: varchar("specialty", { length: 100 }),
  licenseNumber: varchar("license_number", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  avatarUrl: text("avatar_url"),
  scannedSignatureUrl: text("scanned_signature_url"),
  bio: text("bio"),
  isActive: boolean("is_active").default(true).notNull(),
  emailVerified: timestamp("email_verified"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// NextAuth.js required tables
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(),
  provider: varchar("provider", { length: 100 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 100 }),
  scope: varchar("scope", { length: 255 }),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires").notNull(),
});

// ─── PATIENTS ─────────────────────────────────────────────────────────────────

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    customPatientId: varchar("custom_patient_id", { length: 100 }),
    // Demographics
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    dateOfBirth: timestamp("date_of_birth"),
    gender: varchar("gender", { length: 20 }),
    phone: varchar("phone", { length: 30 }),
    phone2: varchar("phone2", { length: 30 }),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    occupation: varchar("occupation", { length: 100 }),
    // Emergency Contact
    emergencyContactName: varchar("emergency_contact_name", { length: 200 }),
    emergencyContactPhone: varchar("emergency_contact_phone", { length: 30 }),
    emergencyContactRelation: varchar("emergency_contact_relation", {
      length: 50,
    }),
    // Medical
    bloodGroup: varchar("blood_group", { length: 10 }),
    medicalAlerts: text("medical_alerts").array(), // ["Penicillin Allergy", "Hypertension", "Diabetes"]
    currentMedications: text("current_medications"),
    medicalHistory: text("medical_history"),
    dentalHistory: text("dental_history"),
    // Status & Balance
    status: patientStatusEnum("status").default("new").notNull(),
    outstandingBalance: decimal("outstanding_balance", {
      precision: 10,
      scale: 2,
    }).default("0"),
    tags: text("tags").array(),
    // Recall
    nextRecallDate: timestamp("next_recall_date"),
    referredBy: varchar("referred_by", { length: 200 }),
    avatarUrl: text("avatar_url"),
    notes: text("notes"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("patients_clinic_id_idx").on(table.clinicId),
    index("patients_custom_id_idx").on(table.customPatientId),
    index("patients_phone_idx").on(table.phone),
    uniqueIndex("patients_clinic_custom_id_unique").on(
      table.clinicId,
      table.customPatientId
    ),
  ]
);

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id),
    scheduledAt: timestamp("scheduled_at").notNull(),
    scheduledEndAt: timestamp("scheduled_end_at"),
    tokenSerial: integer("token_serial"),
    chair: varchar("chair", { length: 50 }),
    reason: text("reason"),
    status: appointmentStatusEnum("status").default("scheduled").notNull(),
    notes: text("notes"),
    isPublicBooking: boolean("is_public_booking").default(false),
    reminderSent: boolean("reminder_sent").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("appointments_clinic_idx").on(table.clinicId),
    index("appointments_patient_idx").on(table.patientId),
    index("appointments_doctor_idx").on(table.doctorId),
    index("appointments_scheduled_at_idx").on(table.scheduledAt),
  ]
);

// ─── CLINICAL ENCOUNTERS ──────────────────────────────────────────────────────

export const clinicalEncounters = pgTable(
  "clinical_encounters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id),
    encounterDate: timestamp("encounter_date").defaultNow().notNull(),
    // Vitals
    vitalSigns: jsonb("vital_signs").$type<{
      bloodPressure?: string;
      pulse?: number;
      temperature?: number;
      weight?: number;
    }>(),
    // Chief Complaint
    chiefComplaint: text("chief_complaint"),
    symptomsChecklist: jsonb("symptoms_checklist").$type<string[]>(),
    customSymptoms: text("custom_symptoms").array(),
    // SOAP Notes
    subjective: text("subjective"),
    objective: text("objective"),
    assessment: text("assessment"),
    plan: text("plan"),
    // Diagnoses (ICD-10 codes)
    diagnoses: jsonb("diagnoses").$type<
      Array<{ code: string; description: string; toothNumbers?: string[] }>
    >(),
    // AI Suggestions
    aiGeneratedSuggestions: jsonb("ai_generated_suggestions").$type<{
      differentialDiagnoses?: Array<{ diagnosis: string; rationale: string }>;
      recommendedTests?: Array<{ test: string; indication: string }>;
      recommendedProcedures?: Array<{ cdtCode: string; description: string }>;
      recommendedPharmacotherapy?: Array<{
        drug: string;
        note: string;
        allergyWarning?: boolean;
      }>;
    }>(),
    isLocked: boolean("is_locked").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("encounters_patient_idx").on(table.patientId),
    index("encounters_clinic_idx").on(table.clinicId),
    index("encounters_date_idx").on(table.encounterDate),
  ]
);

// ─── ODONTOGRAM ───────────────────────────────────────────────────────────────

export const odontogramStates = pgTable(
  "odontogram_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => clinicalEncounters.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    notation: toothNotationEnum("notation").default("universal").notNull(),
    // Full chart stored as JSONB: { "14": { mesial: "caries", distal: "filling", occlusal: "sound", ... }, ... }
    chartData: jsonb("chart_data")
      .$type<
        Record<
          string,
          {
            mesial?: string;
            distal?: string;
            occlusal?: string;
            buccal?: string;
            lingual?: string;
            toothStatus?: string; // missing, extracted, implant, rct, impacted, crown
            notes?: string;
          }
        >
      >()
      .default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("odontogram_encounter_idx").on(table.encounterId),
    index("odontogram_patient_idx").on(table.patientId),
  ]
);

// ─── PERIODONTAL CHART ────────────────────────────────────────────────────────

export const periodontalCharts = pgTable(
  "periodontal_charts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => clinicalEncounters.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    // chartData: { "14": { probingDepths: [3,2,3,2,2,3], bop: [false,true,false,false,true,false], mobility: 0, furcation: 0 } }
    chartData: jsonb("chart_data")
      .$type<
        Record<
          string,
          {
            probingDepths: number[]; // 6 values
            bop: boolean[]; // 6 values
            mobility: number; // 0-3
            furcation: number; // 0-3
            recession?: number[];
            notes?: string;
          }
        >
      >()
      .default({}),
    clinicianNotes: text("clinician_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("perio_encounter_idx").on(table.encounterId)]
);

// ─── MEDICINES CATALOG ────────────────────────────────────────────────────────

export const medicinesCatalog = pgTable(
  "medicines_catalog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id").references(() => clinics.id, {
      onDelete: "cascade",
    }),
    brandName: varchar("brand_name", { length: 255 }).notNull(),
    genericName: varchar("generic_name", { length: 255 }),
    strength: varchar("strength", { length: 100 }),
    dosageForm: varchar("dosage_form", { length: 100 }),
    manufacturer: varchar("manufacturer", { length: 255 }),
    defaultFrequency: varchar("default_frequency", { length: 100 }),
    defaultDuration: varchar("default_duration", { length: 100 }),
    defaultTiming: varchar("default_timing", { length: 100 }),
    category: varchar("category", { length: 100 }),
    isCustomAdded: boolean("is_custom_added").default(false),
    isActive: boolean("is_active").default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("medicines_clinic_idx").on(table.clinicId),
    index("medicines_brand_idx").on(table.brandName),
  ]
);

// ─── PRESCRIPTIONS ────────────────────────────────────────────────────────────

export const prescriptions = pgTable(
  "prescriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    encounterId: uuid("encounter_id").references(() => clinicalEncounters.id),
    prescribedById: uuid("prescribed_by_id")
      .notNull()
      .references(() => users.id),
    prescribedAt: timestamp("prescribed_at").defaultNow().notNull(),
    diagnosis: text("diagnosis"),
    additionalInstructions: text("additional_instructions"),
    nextFollowUpDate: timestamp("next_follow_up_date"),
    pdfUrl: text("pdf_url"),
    pdfHash: varchar("pdf_hash", { length: 64 }), // SHA-256
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("prescriptions_patient_idx").on(table.patientId),
    index("prescriptions_clinic_idx").on(table.clinicId),
  ]
);

export const prescriptionItems = pgTable("prescription_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionId: uuid("prescription_id")
    .notNull()
    .references(() => prescriptions.id, { onDelete: "cascade" }),
  medicineId: uuid("medicine_id").references(() => medicinesCatalog.id),
  brandName: varchar("brand_name", { length: 255 }).notNull(),
  genericName: varchar("generic_name", { length: 255 }),
  strength: varchar("strength", { length: 100 }),
  dosageForm: varchar("dosage_form", { length: 100 }),
  frequency: varchar("frequency", { length: 100 }), // "1+0+1", "1+1+1", "PRN"
  duration: varchar("duration", { length: 100 }),
  timing: varchar("timing", { length: 100 }), // "After meal", "Before meal"
  quantity: integer("quantity"),
  instructions: text("instructions"),
  sortOrder: integer("sort_order").default(0),
});

export const prescriptionTests = pgTable("prescription_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionId: uuid("prescription_id")
    .notNull()
    .references(() => prescriptions.id, { onDelete: "cascade" }),
  testType: varchar("test_type", { length: 100 }).notNull(),
  toothNumbers: text("tooth_numbers").array(),
  indications: text("indications"),
  urgency: varchar("urgency", { length: 50 }).default("routine"),
  sortOrder: integer("sort_order").default(0),
});

// ─── DENTAL PROCEDURES CATALOG ────────────────────────────────────────────────

export const dentalProceduresCatalog = pgTable(
  "dental_procedures_catalog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id").references(() => clinics.id, {
      onDelete: "cascade",
    }),
    cdtCode: varchar("cdt_code", { length: 10 }),
    icd10Code: varchar("icd10_code", { length: 20 }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    standardFee: decimal("standard_fee", { precision: 10, scale: 2 }).default(
      "0"
    ),
    consumablesCost: decimal("consumables_cost", {
      precision: 10,
      scale: 2,
    }).default("0"),
    durationMinutes: integer("duration_minutes"),
    isActive: boolean("is_active").default(true),
    isCustom: boolean("is_custom").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("procedures_clinic_idx").on(table.clinicId),
    index("procedures_cdt_idx").on(table.cdtCode),
  ]
);

// ─── INVOICES ─────────────────────────────────────────────────────────────────

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    encounterId: uuid("encounter_id").references(() => clinicalEncounters.id),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    invoiceDate: timestamp("invoice_date").defaultNow().notNull(),
    dueDate: timestamp("due_date"),
    status: invoiceStatusEnum("status").default("draft").notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0"),
    discountType: discountTypeEnum("discount_type").default("none"),
    discountValue: decimal("discount_value", {
      precision: 10,
      scale: 2,
    }).default("0"),
    discountAmount: decimal("discount_amount", {
      precision: 10,
      scale: 2,
    }).default("0"),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default(
      "0"
    ),
    paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default(
      "0"
    ),
    dueAmount: decimal("due_amount", { precision: 10, scale: 2 }).default("0"),
    paymentMethod: paymentMethodEnum("payment_method"),
    paymentDate: timestamp("payment_date"),
    notes: text("notes"),
    pdfUrl: text("pdf_url"),
    createdById: uuid("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("invoices_patient_idx").on(table.patientId),
    index("invoices_clinic_idx").on(table.clinicId),
    index("invoices_number_idx").on(table.invoiceNumber),
  ]
);

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  itemType: varchar("item_type", { length: 50 }).notNull(), // "procedure", "consultation", "medicine", "equipment", "other"
  procedureId: uuid("procedure_id").references(() => dentalProceduresCatalog.id),
  description: varchar("description", { length: 255 }).notNull(),
  toothNumbers: text("tooth_numbers").array(),
  cdtCode: varchar("cdt_code", { length: 10 }),
  quantity: integer("quantity").default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).default("0"),
  sortOrder: integer("sort_order").default(0),
});

// ─── DENTAL LAB ORDERS ────────────────────────────────────────────────────────

export const dentalLabOrders = pgTable("dental_lab_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  encounterId: uuid("encounter_id").references(() => clinicalEncounters.id),
  labName: varchar("lab_name", { length: 255 }),
  prosthesisType: varchar("prosthesis_type", { length: 100 }),
  toothNumbers: text("tooth_numbers").array(),
  shade: varchar("shade", { length: 50 }), // shade guide
  material: varchar("material", { length: 100 }),
  instructions: text("instructions"),
  sentDate: timestamp("sent_date"),
  expectedReturnDate: timestamp("expected_return_date"),
  actualReturnDate: timestamp("actual_return_date"),
  labFee: decimal("lab_fee", { precision: 10, scale: 2 }),
  status: labOrderStatusEnum("status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── MEDICAL CERTIFICATES ─────────────────────────────────────────────────────

export const medicalCertificates = pgTable("medical_certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  issuedById: uuid("issued_by_id")
    .notNull()
    .references(() => users.id),
  certificateType: varchar("certificate_type", { length: 50 }).default(
    "sick_leave"
  ),
  diagnosisReason: text("diagnosis_reason"),
  recommendedRestDays: integer("recommended_rest_days"),
  leaveStartDate: timestamp("leave_start_date"),
  leaveEndDate: timestamp("leave_end_date"),
  remarks: text("remarks"),
  fitToWork: boolean("fit_to_work").default(false),
  pdfUrl: text("pdf_url"),
  qrCode: text("qr_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── PATIENT DOCUMENTS ────────────────────────────────────────────────────────

export const patientDocuments = pgTable(
  "patient_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    encounterId: uuid("encounter_id").references(() => clinicalEncounters.id),
    category: documentCategoryEnum("category").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size"),
    mimeType: varchar("mime_type", { length: 100 }),
    toothNumbers: text("tooth_numbers").array(),
    description: text("description"),
    uploadedById: uuid("uploaded_by_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("documents_patient_idx").on(table.patientId),
    index("documents_clinic_idx").on(table.clinicId),
  ]
);

// ─── SMS ──────────────────────────────────────────────────────────────────────

export const smsTemplates = pgTable("sms_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" }),
  event: smsEventEnum("event").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  // Supports template vars: {{patient_name}}, {{doctor_name}}, {{token}}, {{time}}, {{clinic_name}}
  templateBody: text("template_body").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const smsCampaigns = pgTable("sms_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  templateId: uuid("template_id").references(() => smsTemplates.id),
  messageBody: text("message_body").notNull(),
  audienceFilter: jsonb("audience_filter").$type<{
    procedureType?: string;
    monthsSinceLastVisit?: number;
    birthdayMonth?: boolean;
    treatmentType?: string;
    customQuery?: string;
  }>(),
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  failedCount: integer("failed_count").default(0),
  totalCost: decimal("total_cost", { precision: 10, scale: 4 }).default("0"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  status: varchar("status", { length: 50 }).default("draft"),
  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const smsDeliveryLogs = pgTable(
  "sms_delivery_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id").references(() => patients.id),
    campaignId: uuid("campaign_id").references(() => smsCampaigns.id),
    event: smsEventEnum("event"),
    toNumber: varchar("to_number", { length: 30 }).notNull(),
    messageBody: text("message_body"),
    providerMessageId: varchar("provider_message_id", { length: 255 }),
    status: smsStatusEnum("status").default("queued"),
    errorMessage: text("error_message"),
    cost: decimal("cost", { precision: 8, scale: 6 }),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sms_logs_clinic_idx").on(table.clinicId),
    index("sms_logs_patient_idx").on(table.patientId),
    index("sms_logs_campaign_idx").on(table.campaignId),
  ]
);

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id").references(() => clinics.id),
    actorId: uuid("actor_id").references(() => users.id),
    actorEmail: varchar("actor_email", { length: 255 }),
    action: varchar("action", { length: 100 }).notNull(), // "create", "update", "delete", "view"
    resource: varchar("resource", { length: 100 }).notNull(), // "patient", "encounter", "prescription"
    resourceId: varchar("resource_id", { length: 255 }),
    changes: jsonb("changes"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_clinic_idx").on(table.clinicId),
    index("audit_actor_idx").on(table.actorId),
    index("audit_created_at_idx").on(table.createdAt),
  ]
);

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const clinicsRelations = relations(clinics, ({ one, many }) => ({
  settings: one(clinicSettings, {
    fields: [clinics.id],
    references: [clinicSettings.clinicId],
  }),
  users: many(users),
  patients: many(patients),
  appointments: many(appointments),
}));

export const usersRelations = relations(users, ({ one }) => ({
  clinic: one(clinics, {
    fields: [users.clinicId],
    references: [clinics.id],
  }),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [patients.clinicId],
    references: [clinics.id],
  }),
  appointments: many(appointments),
  encounters: many(clinicalEncounters),
  prescriptions: many(prescriptions),
  invoices: many(invoices),
  documents: many(patientDocuments),
  medicalCertificates: many(medicalCertificates),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
  }),
  clinic: one(clinics, {
    fields: [appointments.clinicId],
    references: [clinics.id],
  }),
}));

export const encountersRelations = relations(
  clinicalEncounters,
  ({ one, many }) => ({
    patient: one(patients, {
      fields: [clinicalEncounters.patientId],
      references: [patients.id],
    }),
    doctor: one(users, {
      fields: [clinicalEncounters.doctorId],
      references: [users.id],
    }),
    appointment: one(appointments, {
      fields: [clinicalEncounters.appointmentId],
      references: [appointments.id],
    }),
    prescriptions: many(prescriptions),
    invoices: many(invoices),
    odontogramStates: many(odontogramStates),
    periodontalCharts: many(periodontalCharts),
  })
);

export const prescriptionsRelations = relations(
  prescriptions,
  ({ one, many }) => ({
    patient: one(patients, {
      fields: [prescriptions.patientId],
      references: [patients.id],
    }),
    prescribedBy: one(users, {
      fields: [prescriptions.prescribedById],
      references: [users.id],
    }),
    items: many(prescriptionItems),
    tests: many(prescriptionTests),
  })
);

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  patient: one(patients, {
    fields: [invoices.patientId],
    references: [patients.id],
  }),
  items: many(invoiceItems),
}));
