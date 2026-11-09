"use client";

// ============================================================
// DENTALOSBD — Patient messages: recalls, templates, campaigns, log
//
// Recall: when the doctor releases a prescription they can note the next
// procedure the patient should have and a tentative date. If the patient
// hasn't come back by then (plus a few grace days), a reminder is drafted
// from the clinic's template and waits for the doctor to review, approve
// and send it (SMS or WhatsApp).
// ============================================================

import { clinicStorage } from "@/lib/clinic-storage";
import { getStoredAppointments, logPatientActivity, toISODate, shiftISODate } from "@/lib/clinical-flow-store";
import { getClinicSetup } from "@/lib/clinic-setup-store";

export type MessageChannel = "sms" | "whatsapp";

export const CHANNEL_LABELS: Record<MessageChannel, string> = { sms: "SMS", whatsapp: "WhatsApp" };

// ─── Templates ──────────────────────────────────────────────

export interface MessageTemplate {
  id: string;
  name: string;
  /** "recall": drafted for overdue next-visit plans. "campaign": presets for bulk messages. */
  kind: "recall" | "campaign";
  body: string;
  isActive: boolean;
}

export const MESSAGE_PLACEHOLDERS: Array<{ key: string; label: string }> = [
  { key: "patient_name", label: "Patient's full name" },
  { key: "first_name", label: "Patient's first name" },
  { key: "patient_id", label: "Patient ID" },
  { key: "procedure", label: "Planned procedure (recall)" },
  { key: "due_date", label: "Tentative date (recall)" },
  { key: "last_visit", label: "Last visit date" },
  { key: "doctor_name", label: "Doctor's name" },
  { key: "clinic_name", label: "Clinic name" },
  { key: "clinic_phone", label: "Clinic phone" },
  { key: "clinic_whatsapp", label: "Clinic WhatsApp number" },
  { key: "booking_link", label: "Online booking link" },
];

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl-recall",
    name: "Recall reminder",
    kind: "recall",
    isActive: true,
    body: "Dear {{first_name}}, {{doctor_name}} advised {{procedure}} around {{due_date}}. Please call {{clinic_phone}} or book at {{booking_link}} to set a time. - {{clinic_name}}",
  },
  {
    id: "tpl-recall-bn",
    name: "Recall reminder (Bangla)",
    kind: "recall",
    isActive: true,
    body: "প্রিয় {{first_name}}, {{doctor_name}} আপনাকে {{due_date}} এর মধ্যে {{procedure}} করানোর পরামর্শ দিয়েছিলেন। সময় নিতে {{clinic_phone}} নম্বরে কল করুন। - {{clinic_name}}",
  },
  {
    id: "tpl-checkup",
    name: "6-month check-up",
    kind: "campaign",
    isActive: true,
    body: "Dear {{first_name}}, it's time for your routine dental check-up and cleaning. Book at {{booking_link}} or call {{clinic_phone}}. - {{clinic_name}}",
  },
  {
    id: "tpl-unfinished",
    name: "Unfinished treatment",
    kind: "campaign",
    isActive: true,
    body: "Dear {{first_name}}, your dental treatment at {{clinic_name}} isn't finished yet. Please call {{clinic_phone}} to book your next visit.",
  },
  {
    id: "tpl-gum",
    name: "Gum care for diabetes",
    kind: "campaign",
    isActive: true,
    body: "Dear {{first_name}}, diabetes can affect your gums. A gum check-up every 6 months helps prevent problems. Call {{clinic_phone}} to book. - {{clinic_name}}",
  },
  {
    id: "tpl-birthday",
    name: "Birthday wishes",
    kind: "campaign",
    isActive: true,
    body: "Happy birthday, {{first_name}}! Wishing you a year full of healthy smiles. - {{clinic_name}}",
  },
  {
    id: "tpl-eid",
    name: "Eid greetings",
    kind: "campaign",
    isActive: true,
    body: "Eid Mubarak, {{first_name}}! Warm wishes from all of us at {{clinic_name}}. We are open again from the day after Eid: {{clinic_phone}}.",
  },
];

const TEMPLATES_KEY = "dentalos1_message_templates_v1";
export const TEMPLATES_EVENT = "dentalos1-message-templates-updated";

export function getMessageTemplates(): MessageTemplate[] {
  try {
    const raw = clinicStorage.getItem(TEMPLATES_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MESSAGE_TEMPLATES;
  } catch {
    return DEFAULT_MESSAGE_TEMPLATES;
  }
}

export function saveMessageTemplates(list: MessageTemplate[]) {
  clinicStorage.setItem(TEMPLATES_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(TEMPLATES_EVENT));
}

// ─── Settings ───────────────────────────────────────────────

export interface MessagingSettings {
  /** Days after the tentative date before a recall reminder is drafted. */
  recallGraceDays: number;
  defaultChannel: MessageChannel;
  recallTemplateId: string;
  /** Link used for {{booking_link}}; blank = this clinic's online booking page. */
  bookingLink: string;
  /** The clinic's (personal or business) WhatsApp number, signed in on the clinic computers. */
  whatsappNumber: string;
  /** Where WhatsApp messages open: the WhatsApp desktop/phone app, or WhatsApp Web in the browser. */
  whatsappOpenWith: "app" | "web";
  /**
   * How SMS are sent:
   *  "device": open this computer's SMS app (Windows Phone Link / phone) with the text filled in; staff press Send.
   *  "android": automatically, from the clinic's Android phone (SMS Gateway for Android). Replies come into the Inbox.
   *  "provider": automatically, through a bulk SMS gateway set on the server.
   */
  smsMode: SmsMode;
}

export type SmsMode = "device" | "android" | "provider";

export const SMS_MODE_LABELS: Record<SmsMode, string> = {
  device: "This computer's SMS app (Phone Link)",
  android: "Android phone, automatic",
  provider: "SMS gateway service",
};

export const DEFAULT_MESSAGING_SETTINGS: MessagingSettings = {
  recallGraceDays: 3,
  defaultChannel: "sms",
  recallTemplateId: "tpl-recall",
  bookingLink: "",
  whatsappNumber: "",
  whatsappOpenWith: "web",
  smsMode: "device",
};

const SETTINGS_KEY = "dentalos1_messaging_settings_v1";
export const MESSAGING_SETTINGS_EVENT = "dentalos1-messaging-settings-updated";

export function getMessagingSettings(): MessagingSettings {
  try {
    const raw = clinicStorage.getItem(SETTINGS_KEY);
    return { ...DEFAULT_MESSAGING_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return DEFAULT_MESSAGING_SETTINGS;
  }
}

export function saveMessagingSettings(patch: Partial<MessagingSettings>) {
  clinicStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getMessagingSettings(), ...patch }));
  window.dispatchEvent(new Event(MESSAGING_SETTINGS_EVENT));
}

let clinicSlug = "";
/** Set by the app shell so {{booking_link}} can point at /book/<slug>. */
export function setBookingSlug(slug: string | undefined) {
  clinicSlug = slug || "";
}

export function bookingLink(): string {
  const custom = getMessagingSettings().bookingLink.trim();
  if (custom) return custom;
  if (typeof window === "undefined" || !clinicSlug) return "";
  return `${window.location.origin}/book/${clinicSlug}`;
}

// ─── Filling a template ─────────────────────────────────────

export type MessageValues = Partial<Record<string, string>>;

/** Clinic-wide values ({{clinic_name}}, {{booking_link}}...). */
export function clinicMessageValues(): MessageValues {
  const clinic = getClinicSetup();
  const wa = getMessagingSettings().whatsappNumber.trim();
  return { clinic_name: clinic.name, clinic_phone: clinic.phone, clinic_whatsapp: wa || clinic.phone, booking_link: bookingLink() };
}

export function firstNameOf(name = ""): string {
  const parts = name.replace(/^(md|mst|mohammad|muhammad|mr|mrs|ms|dr)\.?\s+/i, "").trim().split(/\s+/);
  return parts[0] || name;
}

/** Replace {{placeholders}}; empty ones are removed and spacing tidied. */
export function fillMessage(body: string, values: MessageValues): string {
  return body
    .replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) => (values[k.toLowerCase()] || "").trim())
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
}

/** SMS parts a message needs: 160 characters per part, or 70 when it has Bangla or other non-Latin text. */
export function smsSegments(text: string): { chars: number; segments: number; unicode: boolean } {
  const unicode = /[^\x00-\x7F]/.test(text);
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  const chars = [...text].length;
  return { chars, unicode, segments: chars === 0 ? 0 : chars <= single ? 1 : Math.ceil(chars / multi) };
}

export function formatDisplayDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Recalls ────────────────────────────────────────────────

export type RecallStatus =
  /** Waiting for the patient to come back. */
  | "planned"
  /** Overdue: a reminder is drafted and waits for the doctor. */
  | "awaiting_approval"
  | "sent"
  /** The patient came back (or booked), so nothing to send. */
  | "returned"
  | "dismissed";

export interface Recall {
  id: string;
  visitId: string;
  patientId: string;
  patientRecordId?: string;
  patientName: string;
  phone: string;
  doctor: string;
  procedure: string;
  /** Tentative date, YYYY-MM-DD. */
  dueDate: string;
  /** Doctor's note for the patient's record. */
  note: string;
  /** Visit day the plan was made, YYYY-MM-DD. */
  fromDate: string;
  status: RecallStatus;
  createdAt: string;
  draft?: { body: string; channel: MessageChannel; draftedAt: string };
  sentAt?: string;
  sentBy?: string;
  closedReason?: string;
}

const RECALLS_KEY = "dentalos1_recalls_v1";
export const RECALLS_EVENT = "dentalos1-recalls-updated";

export function getRecalls(): Recall[] {
  try {
    const parsed = JSON.parse(clinicStorage.getItem(RECALLS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecalls(list: Recall[]) {
  clinicStorage.setItem(RECALLS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(RECALLS_EVENT));
}

/** The next-treatment plan for a visit: one recall per planned procedure, earliest first. */
export function getRecallsForVisit(visitId: string): Recall[] {
  return getRecalls()
    .filter((r) => r.visitId === visitId && r.status !== "dismissed")
    .sort((x, y) => x.dueDate.localeCompare(y.dueDate));
}

export interface PlanItem {
  /** Set when editing an item already saved. */
  id?: string;
  procedure: string;
  dueDate: string;
  note: string;
}

export interface PlanVisit {
  visitId: string;
  patientId: string;
  patientRecordId?: string;
  patientName: string;
  phone: string;
  doctor: string;
  /** Visit day, YYYY-MM-DD. */
  fromDate: string;
}

/**
 * Save the doctor's next-treatment plan for a visit. Each procedure becomes
 * its own recall with its own date. Items removed from the plan are cancelled
 * (unless their reminder was already sent).
 */
export function saveVisitPlan(visit: PlanVisit, items: PlanItem[]): Recall[] {
  const list = getRecalls();
  const now = new Date().toISOString();
  const keep = new Set(items.map((i) => i.id).filter(Boolean));
  const saved: Recall[] = [];

  let next = list.map((r) => {
    if (r.visitId !== visit.visitId || r.status === "dismissed") return r;
    if (!keep.has(r.id)) {
      return r.status === "sent" || r.status === "returned" ? r : { ...r, status: "dismissed" as const, closedReason: "Removed from plan" };
    }
    const item = items.find((i) => i.id === r.id)!;
    const changed = item.dueDate !== r.dueDate || item.procedure !== r.procedure;
    const updated: Recall = {
      ...r,
      ...visit,
      procedure: item.procedure,
      dueDate: item.dueDate,
      note: item.note,
      // A new date or procedure starts the wait again
      ...(changed && r.status === "awaiting_approval" ? { status: "planned" as const, draft: undefined } : {}),
    };
    saved.push(updated);
    return updated;
  });

  items
    .filter((i) => !i.id)
    .forEach((i, n) => {
      const r: Recall = {
        ...visit,
        id: `rcl-${Date.now()}-${n}`,
        procedure: i.procedure,
        dueDate: i.dueDate,
        note: i.note,
        status: "planned",
        createdAt: now,
      };
      saved.push(r);
      next = [r, ...next];
    });
  saveRecalls(next);

  const ordered = [...saved].sort((x, y) => x.dueDate.localeCompare(y.dueDate));
  if (ordered.length > 0) {
    logPatientActivity({
      id: `ev-${visit.visitId}-plan`,
      patientId: visit.patientId,
      date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
      timestamp: Date.now(),
      type: "clinical_procedure",
      title: `Next: ${ordered.map((r) => `${r.procedure} by ${formatDisplayDate(r.dueDate)}`).join("; ")}`,
      doctor: visit.doctor,
      clinicalNotes: ordered.filter((r) => r.note).map((r) => `${r.procedure}: ${r.note}`).join("\n") || undefined,
      badge: "Next visit plan",
      badgeColor: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
    });
  }
  return ordered;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000);
}

function samePatient(r: Recall, a: { patientId: string; patientRecordId?: string }) {
  return a.patientId === r.patientId || (!!r.patientRecordId && a.patientRecordId === r.patientRecordId);
}

/**
 * Move recalls along: patients who came back (or booked a visit) are closed,
 * and overdue ones get a drafted reminder for the doctor. Returns how many
 * reminders were newly drafted.
 */
export function refreshRecalls(today: string = toISODate()): number {
  const list = getRecalls();
  if (list.length === 0) return 0;
  const visits = getStoredAppointments();
  const settings = getMessagingSettings();
  const templates = getMessageTemplates();
  const template =
    templates.find((t) => t.id === settings.recallTemplateId && t.isActive) || templates.find((t) => t.kind === "recall" && t.isActive);
  const base = clinicMessageValues();
  let drafted = 0;
  let changed = false;

  const next = list.map((r) => {
    if (r.status !== "planned" && r.status !== "awaiting_approval") return r;
    // A visit counts for this plan only from halfway to its date, so coming back in
    // two weeks for one procedure doesn't close the reminder for one due in six months
    const from = r.fromDate > r.dueDate ? r.dueDate : r.fromDate;
    const halfway = shiftISODate(from, Math.floor(daysBetween(from, r.dueDate) / 2));
    const mine = visits.filter(
      (a) => samePatient(r, a) && a.id !== r.visitId && (a.date || "") > r.fromDate && (a.date || "") >= halfway
    );
    const cameBack = mine.some((a) => a.status === "checked_in" || a.status === "in_progress" || a.status === "completed");
    const booked = mine.some((a) => a.status === "scheduled" && (a.date || "") >= today);
    if (cameBack || booked) {
      changed = true;
      return { ...r, status: "returned" as const, closedReason: cameBack ? "Came back" : "Booked a visit", draft: undefined };
    }
    if (r.status === "planned" && today > shiftISODate(r.dueDate, settings.recallGraceDays)) {
      changed = true;
      drafted++;
      const body = template
        ? fillMessage(template.body, {
            ...base,
            patient_name: r.patientName,
            first_name: firstNameOf(r.patientName),
            patient_id: r.patientId,
            procedure: r.procedure,
            due_date: formatDisplayDate(r.dueDate),
            doctor_name: r.doctor.split(",")[0].trim(),
          })
        : "";
      return {
        ...r,
        status: "awaiting_approval" as const,
        draft: { body, channel: settings.defaultChannel, draftedAt: new Date().toISOString() },
      };
    }
    return r;
  });

  if (changed) saveRecalls(next);
  return drafted;
}

export function updateRecall(id: string, patch: Partial<Recall>) {
  saveRecalls(getRecalls().map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

/** Normalised doctor name for matching "Dr. Sarah Smith, BDS" with "Dr. Sarah Smith". */
export function doctorKey(name = ""): string {
  return name.split(",")[0].replace(/^dr\.?\s+/i, "").trim().toLowerCase();
}

/** Reminders this user should review: their own patients, or (for the clinic owner) any doctor's not in the clinic list. */
export function recallsAwaitingFor(user: { name?: string | null; role?: string | null }): Recall[] {
  const pending = getRecalls().filter((r) => r.status === "awaiting_approval");
  if (!user.role || user.role === "receptionist") return [];
  const me = doctorKey(user.name || "");
  const doctors = new Set((getClinicSetup().doctors || []).map((d) => doctorKey(d.name)));
  return pending.filter((r) => doctorKey(r.doctor) === me || (user.role === "clinic_owner" && !doctors.has(doctorKey(r.doctor))));
}

// ─── Message log ────────────────────────────────────────────

export interface MessageLogEntry {
  id: string;
  patientId?: string;
  patientName: string;
  phone: string;
  channel: MessageChannel;
  body: string;
  kind: "recall" | "campaign" | "direct";
  campaign?: string;
  /** "sent": accepted by the SMS gateway. "handed_over": opened in WhatsApp / the phone's SMS app for staff to send. */
  status: "sent" | "handed_over" | "failed";
  error?: string;
  sentAt: string;
  by?: string;
}

const LOG_KEY = "dentalos1_message_log_v1";
export const MESSAGE_LOG_EVENT = "dentalos1-message-log-updated";
const LOG_MAX = 2000;

export function getMessageLog(): MessageLogEntry[] {
  try {
    const parsed = JSON.parse(clinicStorage.getItem(LOG_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function logMessages(entries: Array<Omit<MessageLogEntry, "id" | "sentAt">>) {
  if (entries.length === 0) return;
  const now = new Date().toISOString();
  const stamped = entries.map((e, i) => ({ ...e, id: `msg-${Date.now()}-${i}`, sentAt: now }));
  clinicStorage.setItem(LOG_KEY, JSON.stringify([...stamped, ...getMessageLog()].slice(0, LOG_MAX)));
  window.dispatchEvent(new Event(MESSAGE_LOG_EVENT));
}

// ─── Inbox (SMS received by the clinic's Android phone) ─────

export interface InboxMessage {
  id: string;
  /** Sender's number as the phone reported it, e.g. "+8801711234891". */
  from: string;
  body: string;
  receivedAt: string;
  read: boolean;
  sim?: string;
}

const INBOX_KEY = "dentalos1_message_inbox_v1";
export const INBOX_EVENT = "dentalos1-message-inbox-updated";

export function getInbox(): InboxMessage[] {
  try {
    const parsed = JSON.parse(clinicStorage.getItem(INBOX_KEY) || "[]");
    return (Array.isArray(parsed) ? (parsed as InboxMessage[]) : []).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  } catch {
    return [];
  }
}

export function markInboxRead(ids: string[]) {
  if (ids.length === 0) return;
  const set = new Set(ids);
  const list = getInbox();
  if (!list.some((m) => set.has(m.id) && !m.read)) return;
  clinicStorage.setItem(INBOX_KEY, JSON.stringify(list.map((m) => (set.has(m.id) ? { ...m, read: true } : m))));
  window.dispatchEvent(new Event(INBOX_EVENT));
}

/** Last 10 digits, to match "+8801711234891", "01711-234891" and "1711234891" as the same number. */
export function phoneKey(phone: string): string {
  return (phone || "").replace(/\D/g, "").slice(-10);
}
