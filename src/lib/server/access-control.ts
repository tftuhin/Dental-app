import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clinicRecords } from "@/db/schema";

// ============================================================
// Who may see and change which clinic records (enforced on the server, in
// /api/clinic-data, so it holds even if someone inspects the browser).
//
// Front desk (role "receptionist"): booking, check-in and billing only.
//   Visits and patients come with front-desk and billing fields; clinical
//   notes, findings, charts, prescriptions and consent text are removed.
//   Their saves can only change front-desk and billing fields.
//
// Doctor privacy (clinic-wide switch, Settings → Patient Privacy):
//   a doctor sees full details only of patients they have treated, patients
//   no doctor has seen yet, and patients another doctor has given them access
//   to. Other doctors' patients appear with name and contact details only;
//   their charts, timeline and visit notes are not sent at all.
//   Access is asked for once and lasts until the treating doctor revokes it.
// ============================================================

export type Role = "super_admin" | "clinic_owner" | "dentist" | "hygienist" | "receptionist" | string;

/** How a record is shown: in full, with some fields only, or not at all. */
export type Access =
  | { level: "full" }
  | { level: "partial"; view: "desk" | "private" | "private_desk"; owners?: string[] }
  | { level: "none" };

const FULL: Access = { level: "full" };
const NONE: Access = { level: "none" };

// ─── Field lists ────────────────────────────────────────────

const VISIT_DESK = [
  "id", "token", "fifoSerial", "serialNumber", "bookingChannel", "patient", "patientId", "patientRecordId", "phone", "age",
  "gender", "address", "chair", "doctor", "time", "duration", "service", "status", "date", "stage", "isFollowUp",
  "onlineBookingId", "checkedInAt", "checkInInvoice", "noShowReason", "noShowAt", "rescheduledFromId", "rescheduledToId",
  "completedAt", "alerts", "followUpDate", "followUpSerial",
];
const VISIT_BILLING = ["procedures", "consumables", "invoice", "prescriptionDone", "billed", "suggestedFee"];
/** The reason for the visit, taken by the front desk when booking. */
const VISIT_INTAKE = ["chiefComplaint"];
/** Shown to front desk for receipts, never writable by them. */
const VISIT_BILLING_READONLY = ["provisionalDiagnosis"];

const PATIENT_DEMOGRAPHICS = [
  "id", "customId", "name", "dob", "age", "gender", "phone", "phone2", "email", "address", "city", "emergencyContact",
  "bloodGroup", "status", "lastVisit", "nextRecall", "outstandingBalance", "tags", "occupation",
];
/** Front desk records allergies and conditions at registration. */
const PATIENT_DESK_EXTRA = ["allergies", "medicalConditions"];

const RECALL_DESK = ["id", "visitId", "patientId", "patientRecordId", "patientName", "phone", "doctor", "procedure", "dueDate", "fromDate", "status", "createdAt", "sentAt", "sentBy", "closedReason"];

/** Collections that are entirely clinical (per patient). */
const CLINICAL_PER_PATIENT = new Set(["odontogram", "perio", "ortho", "prostho"]);

// ─── Context ────────────────────────────────────────────────

export function doctorKey(name = ""): string {
  return name.split(",")[0].replace(/^dr\.?\s+/i, "").trim().toLowerCase();
}

export interface AccessContext {
  role: Role;
  email: string;
  name: string;
  /** The signed-in doctor's key, matched against visit.doctor. */
  me: string;
  privacyOn: boolean;
  isDesk: boolean;
  isOwner: boolean;
  /** Patient key (patient ID or record ID) → keys of doctors who have treated them. */
  patientDoctors: Map<string, Set<string>>;
  /** Doctor key → display name. */
  doctorNames: Map<string, string>;
  /** Patient keys the signed-in doctor has been given access to. */
  granted: Set<string>;
}

export async function buildAccessContext(
  clinicId: string,
  user: { role?: string | null; email?: string | null; name?: string | null }
): Promise<AccessContext> {
  const role = user.role || "dentist";
  const email = (user.email || "").toLowerCase();
  const name = user.name || "";

  const [settingsRows, visitRows, grantRows, timelineRows] = await Promise.all([
    db
      .select({ id: clinicRecords.recordId, data: clinicRecords.data })
      .from(clinicRecords)
      .where(and(eq(clinicRecords.clinicId, clinicId), eq(clinicRecords.collection, "settings"), eq(clinicRecords.deleted, false))),
    db
      .select({
        doctor: sql<string>`${clinicRecords.data}->>'doctor'`,
        pid: sql<string>`${clinicRecords.data}->>'patientId'`,
        prid: sql<string>`${clinicRecords.data}->>'patientRecordId'`,
      })
      .from(clinicRecords)
      .where(and(eq(clinicRecords.clinicId, clinicId), eq(clinicRecords.collection, "appointments"), eq(clinicRecords.deleted, false))),
    db
      .select({ data: clinicRecords.data })
      .from(clinicRecords)
      .where(and(eq(clinicRecords.clinicId, clinicId), eq(clinicRecords.collection, "access_requests"), eq(clinicRecords.deleted, false))),
    // The timeline also records which doctor saw a patient (covers history whose visits were removed)
    db
      .select({
        doctor: sql<string>`${clinicRecords.data}->>'doctor'`,
        pid: sql<string>`${clinicRecords.data}->>'patientId'`,
        prid: sql<string>`null`,
      })
      .from(clinicRecords)
      .where(and(eq(clinicRecords.clinicId, clinicId), eq(clinicRecords.collection, "timeline"), eq(clinicRecords.deleted, false))),
  ]);

  const settings = new Map(settingsRows.map((r) => [r.id, r.data as Record<string, unknown> | null]));
  const privacyOn = !!(settings.get("access_control") as { doctorPrivacy?: boolean } | null)?.doctorPrivacy;

  // Which clinic doctor is this login? Email first, then name.
  const doctors = ((settings.get("clinic_setup") as { doctors?: Array<{ name: string; email?: string }> } | null)?.doctors || []);
  const byEmail = doctors.find((d) => d.email && d.email.toLowerCase() === email);
  const me = doctorKey(byEmail?.name || name);

  const patientDoctors = new Map<string, Set<string>>();
  const doctorNames = new Map<string, string>();
  for (const v of [...visitRows, ...timelineRows]) {
    if (!v.doctor) continue;
    const k = doctorKey(v.doctor);
    doctorNames.set(k, v.doctor.split(",")[0].trim());
    for (const p of [v.pid, v.prid]) {
      if (!p) continue;
      let set = patientDoctors.get(p);
      if (!set) patientDoctors.set(p, (set = new Set()));
      set.add(k);
    }
  }

  const granted = new Set<string>();
  for (const g of grantRows) {
    const r = g.data as AccessRequestData | null;
    if (r && r.status === "approved" && (r.requesterEmail || "").toLowerCase() === email) {
      if (r.patientKey) granted.add(r.patientKey);
      if (r.patientRecordId) granted.add(r.patientRecordId);
    }
  }

  return {
    role,
    email,
    name,
    me,
    privacyOn,
    isDesk: role === "receptionist",
    isOwner: role === "clinic_owner" || role === "super_admin",
    patientDoctors,
    doctorNames,
    granted,
  };
}

/** Doctors who have treated a patient (keys), looked up by patient ID or record ID. */
export function treatingDoctors(ctx: AccessContext, ...keys: Array<string | undefined>): Set<string> {
  const out = new Set<string>();
  for (const k of keys) if (k) ctx.patientDoctors.get(k)?.forEach((d) => out.add(d));
  return out;
}

/** True when the signed-in doctor may see this patient's clinical details. */
export function canSeePatient(ctx: AccessContext, ...keys: Array<string | undefined>): boolean {
  if (ctx.role === "super_admin" || !ctx.privacyOn) return true;
  const docs = treatingDoctors(ctx, ...keys);
  if (docs.size === 0 || docs.has(ctx.me)) return true;
  return keys.some((k) => !!k && ctx.granted.has(k));
}

function ownersOf(ctx: AccessContext, ...keys: Array<string | undefined>): string[] {
  return [...treatingDoctors(ctx, ...keys)].map((k) => ctx.doctorNames.get(k) || k);
}

// ─── Access to one record ───────────────────────────────────

type Data = Record<string, unknown>;

export function accessFor(ctx: AccessContext, collection: string, recordId: string, data: Data | null): Access {
  if (ctx.role === "super_admin") return FULL;
  const d = data || {};
  switch (collection) {
    case "appointments": {
      if (ctx.isDesk) return { level: "partial", view: "desk" };
      if (!ctx.privacyOn) return FULL;
      const pid = d.patientId as string | undefined;
      const prid = d.patientRecordId as string | undefined;
      if (doctorKey(String(d.doctor || "")) === ctx.me || canSeePatient(ctx, pid, prid)) return FULL;
      return { level: "partial", view: ctx.isOwner ? "private_desk" : "private", owners: ownersOf(ctx, pid, prid) };
    }
    case "patients": {
      if (ctx.isDesk) return { level: "partial", view: "desk" };
      const keys = [d.id as string, d.customId as string];
      if (canSeePatient(ctx, ...keys)) return FULL;
      return { level: "partial", view: "private", owners: ownersOf(ctx, ...keys) };
    }
    case "timeline": {
      if (ctx.isDesk) return d.type === "invoice" ? FULL : NONE;
      return canSeePatient(ctx, d.patientId as string) ? FULL : NONE;
    }
    case "recalls": {
      if (ctx.isDesk) return { level: "partial", view: "desk" };
      return canSeePatient(ctx, d.patientId as string, d.patientRecordId as string) ? FULL : NONE;
    }
    case "access_requests": {
      if (ctx.isDesk) return NONE;
      const r = d as unknown as AccessRequestData;
      if ((r.requesterEmail || "").toLowerCase() === ctx.email) return FULL;
      if (ctx.isOwner) return FULL;
      return treatingDoctors(ctx, r.patientKey, r.patientRecordId).has(ctx.me) ? FULL : NONE;
    }
    default:
      if (CLINICAL_PER_PATIENT.has(collection)) {
        if (ctx.isDesk) return NONE;
        return canSeePatient(ctx, recordId) ? FULL : NONE;
      }
      return FULL;
  }
}

function pick(d: Data, fields: string[]): Data {
  const out: Data = {};
  for (const f of fields) if (f in d) out[f] = d[f];
  return out;
}

/** Fields a partial view may read. */
function readableFields(collection: string, view: string): string[] {
  if (collection === "appointments") {
    if (view === "desk") return [...VISIT_DESK, ...VISIT_INTAKE, ...VISIT_BILLING, ...VISIT_BILLING_READONLY];
    if (view === "private_desk") return [...VISIT_DESK, ...VISIT_BILLING];
    return VISIT_DESK;
  }
  if (collection === "patients") return view === "desk" ? [...PATIENT_DEMOGRAPHICS, ...PATIENT_DESK_EXTRA] : PATIENT_DEMOGRAPHICS;
  if (collection === "recalls") return RECALL_DESK;
  return [];
}

/** Fields a partial view may change (the rest are kept from the saved record). */
function writableFields(collection: string, view: string): string[] {
  if (collection === "appointments") return view === "desk" ? [...VISIT_DESK, ...VISIT_INTAKE, ...VISIT_BILLING] : VISIT_DESK;
  if (collection === "patients") return view === "desk" ? [...PATIENT_DEMOGRAPHICS, ...PATIENT_DESK_EXTRA] : PATIENT_DEMOGRAPHICS;
  if (collection === "recalls") return ["status", "closedReason"];
  return [];
}

/** The version of a record this user receives. */
export function redact(collection: string, data: Data, access: Access): Data {
  if (access.level !== "partial") return data;
  const out = pick(data, readableFields(collection, access.view));
  // Receipts need the diagnosis line, nothing more of the prescription
  if (collection === "appointments" && access.view === "desk" && data.prescription && typeof data.prescription === "object") {
    const rx = data.prescription as Data;
    out.prescription = pick(rx, ["rxNumber", "issuedAt", "diagnosis"]);
  }
  out._view = access.view;
  if (access.owners?.length) out._owners = access.owners;
  return out;
}

/** Strip the markers the server adds before saving anything. */
export function stripMarkers(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const out: Data = {};
  for (const [k, v] of Object.entries(data as Data)) if (!k.startsWith("_")) out[k] = v;
  return out;
}

/** What to store when a user with partial access saves a record: their allowed fields over the saved record. */
export function mergePartialWrite(collection: string, existing: Data | null, incoming: Data, access: Access): Data {
  if (access.level !== "partial") return incoming;
  const allowed = pick(incoming, writableFields(collection, access.view));
  return existing ? { ...existing, ...allowed } : allowed;
}

// ─── Access requests ────────────────────────────────────────

export interface AccessRequestData {
  id: string;
  patientKey: string;
  patientRecordId?: string;
  patientName: string;
  requesterEmail: string;
  requesterName: string;
  ownerNames: string[];
  ownerKeys: string[];
  reason?: string;
  status: "pending" | "approved" | "denied" | "revoked" | "cancelled";
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

/**
 * Check a change to an access request. Returns the record to store, or an
 * error. Requests can only be created by the requester for themselves; only
 * a treating doctor of the patient can approve, deny or revoke.
 */
export function checkAccessRequestWrite(
  ctx: AccessContext,
  existing: AccessRequestData | null,
  incoming: AccessRequestData | null,
  deleted: boolean
): { ok: true; data: AccessRequestData } | { ok: false; error: string } {
  if (ctx.isDesk) return { ok: false, error: "Front desk accounts can't manage patient access." };
  if (deleted || !incoming) return { ok: false, error: "Access requests can't be deleted." };
  const now = new Date().toISOString();

  if (!existing) {
    if (incoming.status !== "pending") return { ok: false, error: "A new request must be pending." };
    const owners = treatingDoctors(ctx, incoming.patientKey, incoming.patientRecordId);
    if (owners.size === 0 || owners.has(ctx.me)) return { ok: false, error: "You already have access to this patient." };
    return {
      ok: true,
      data: {
        ...incoming,
        requesterEmail: ctx.email,
        requesterName: ctx.name,
        // Decided here, not by the browser, so nobody can name themselves as the approver
        ownerKeys: [...owners],
        ownerNames: [...owners].map((k) => ctx.doctorNames.get(k) || k),
        createdAt: now,
      },
    };
  }

  const isRequester = (existing.requesterEmail || "").toLowerCase() === ctx.email;
  const isTreating = treatingDoctors(ctx, existing.patientKey, existing.patientRecordId).has(ctx.me);
  const from = existing.status;
  const to = incoming.status;
  if (from === to) return { ok: true, data: existing };

  const ownerMoves: Record<string, string[]> = { pending: ["approved", "denied"], approved: ["revoked"], denied: ["approved"], revoked: ["approved"] };
  if (isTreating && ownerMoves[from]?.includes(to)) {
    return { ok: true, data: { ...existing, status: to, decidedAt: now, decidedBy: ctx.name } };
  }
  if (isRequester && from === "pending" && to === "cancelled") {
    return { ok: true, data: { ...existing, status: to, decidedAt: now } };
  }
  return { ok: false, error: "Only the patient's treating doctor can change this access." };
}
