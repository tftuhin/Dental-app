"use client";

/**
 * DentalOS1 Commercial Cloud Services & Automation Settings Store
 * 
 * Manages user-facing toggles for cloud-managed clinic services (SMS, Mail, AI, Backup).
 * In a commercial deployment, all third-party vendors (AI LLM gateways, SMS carriers,
 * SMTP mail pipelines) are managed seamlessly by DentalOS1 infrastructure.
 * 
 * The clinic user simply turns features ON or OFF without needing API keys or vendor configurations.
 */

export interface ClinicServicesSettings {
  // 1. AI Clinical Copilot & Intelligence
  aiEnabled: boolean;
  aiDrugAllergyAlerts: boolean;
  aiDiffDiagnosis: boolean;
  aiVoiceDictation: boolean;
  aiRadiographAssistant: boolean;
  aiSmartPrescriptions: boolean;

  // 2. Automated SMS Notification Service
  smsEnabled: boolean;
  smsAppointmentConfirmation: boolean;
  smsAppointmentReminder: boolean;
  smsTreatmentRecall: boolean;
  smsQueueUpdates: boolean;
  smsBillingReceipt: boolean;
  smsSenderName: string;

  // 3. Automated Email Notification Service
  emailEnabled: boolean;
  emailAppointmentConfirmation: boolean;
  emailPrescriptionPdf: boolean;
  emailBillingInvoice: boolean;
  emailDailyDoctorReport: boolean;
  emailRecallCampaigns: boolean;
  emailSenderAlias: string;

  // 4. Automated Cloud Backup & Multi-Chair Sync
  cloudBackupEnabled: boolean;
  cloudDailySnapshot: boolean;
  cloudRealtimeSync: boolean;

  // 5. Patient ID Custom Pattern
  patientIdPattern: string;
  patientIdSequenceStart: string;
}

export const DEFAULT_SERVICES_SETTINGS: ClinicServicesSettings = {
  // AI
  aiEnabled: true,
  aiDrugAllergyAlerts: true,
  aiDiffDiagnosis: true,
  aiVoiceDictation: true,
  aiRadiographAssistant: true,
  aiSmartPrescriptions: true,

  // SMS
  smsEnabled: true,
  smsAppointmentConfirmation: true,
  smsAppointmentReminder: true,
  smsTreatmentRecall: true,
  smsQueueUpdates: true,
  smsBillingReceipt: true,
  smsSenderName: "DHAKA-DENTAL",

  // Email
  emailEnabled: true,
  emailAppointmentConfirmation: true,
  emailPrescriptionPdf: true,
  emailBillingInvoice: true,
  emailDailyDoctorReport: false,
  emailRecallCampaigns: true,
  emailSenderAlias: "Dhaka Dental Care",

  // Cloud Backup
  cloudBackupEnabled: true,
  cloudDailySnapshot: true,
  cloudRealtimeSync: true,

  // Patient ID
  patientIdPattern: "DENT-{YYYY}-{SEQ:5}",
  patientIdSequenceStart: "42",
};

const STORAGE_KEY = "dentalos1-services-settings";

export function getServicesSettings(): ClinicServicesSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SERVICES_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES_SETTINGS));
      return DEFAULT_SERVICES_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SERVICES_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SERVICES_SETTINGS;
  }
}

export function saveServicesSettings(
  updates: Partial<ClinicServicesSettings>
): ClinicServicesSettings {
  const current = getServicesSettings();
  const next: ClinicServicesSettings = {
    ...current,
    ...updates,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent("dentalos1-services-updated", { detail: next })
    );
  }
  return next;
}
