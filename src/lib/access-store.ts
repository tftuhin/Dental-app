"use client";

// ============================================================
// DENTALOS1 — Staff access (browser side)
// The server decides what each person receives (see
// src/lib/server/access-control.ts). Records a user may only partly see
// arrive with a "_view" marker:
//   "desk"         front desk: booking, check-in and billing fields
//   "private"      another doctor's patient (doctor privacy is on)
//   "private_desk" the same, for the clinic owner, with billing fields
// This file holds the clinic-wide privacy switch and the access requests
// doctors send each other.
// ============================================================

import { useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { clinicStorage } from "@/lib/clinic-storage";

export type RecordView = "desk" | "private" | "private_desk";

export interface Restricted {
  _view?: RecordView;
  /** Doctors who treat the patient (shown when access is private). */
  _owners?: string[];
}

/** True when the record is another doctor's private patient. */
export function isPrivate(r: Restricted | null | undefined): boolean {
  return r?._view === "private" || r?._view === "private_desk";
}

// ─── Roles ──────────────────────────────────────────────────

export interface StaffRole {
  role: string;
  isDesk: boolean;
  isOwner: boolean;
  isDoctor: boolean;
  name: string;
  email: string;
}

export function useStaffRole(): StaffRole {
  const { data } = useSession();
  const role = data?.user?.role || "";
  return {
    role,
    isDesk: role === "receptionist",
    isOwner: role === "clinic_owner" || role === "super_admin",
    isDoctor: role === "clinic_owner" || role === "dentist" || role === "hygienist" || role === "super_admin",
    name: data?.user?.name || "",
    email: (data?.user?.email || "").toLowerCase(),
  };
}

/** Pages the front desk can't open (also enforced in src/proxy.ts). */
export const DESK_BLOCKED_PATHS = ["/procedures", "/prescriptions", "/lab-orders", "/certificates", "/analytics", "/settings", "/enquiries"];

// ─── Clinic-wide privacy switch ─────────────────────────────

const CONTROL_KEY = "dentalos1_access_control_v1";
export const ACCESS_CONTROL_EVENT = "dentalos1-access-control-updated";

export interface AccessControl {
  /** Doctors see only their own patients' details unless given access. */
  doctorPrivacy: boolean;
}

let cachedRaw: string | null | undefined;
let cached: AccessControl = { doctorPrivacy: false };

export function getAccessControl(): AccessControl {
  if (typeof window === "undefined") return { doctorPrivacy: false };
  const raw = clinicStorage.getItem(CONTROL_KEY);
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    cached = { doctorPrivacy: false, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    cached = { doctorPrivacy: false };
  }
  return cached;
}

export function saveAccessControl(patch: Partial<AccessControl>) {
  clinicStorage.setItem(CONTROL_KEY, JSON.stringify({ ...getAccessControl(), ...patch }));
  window.dispatchEvent(new Event(ACCESS_CONTROL_EVENT));
}

function subscribeControl(cb: () => void) {
  window.addEventListener(ACCESS_CONTROL_EVENT, cb);
  return () => window.removeEventListener(ACCESS_CONTROL_EVENT, cb);
}

export function useAccessControl(): AccessControl {
  return useSyncExternalStore(subscribeControl, getAccessControl, () => ({ doctorPrivacy: false }));
}

// ─── Access requests ────────────────────────────────────────

export type AccessRequestStatus = "pending" | "approved" | "denied" | "revoked" | "cancelled";

export interface AccessRequest {
  id: string;
  /** Patient ID (e.g. DENT-2026-00042). */
  patientKey: string;
  patientRecordId?: string;
  patientName: string;
  requesterEmail: string;
  requesterName: string;
  /** Filled in by the server: the doctors who treat the patient. */
  ownerNames: string[];
  ownerKeys: string[];
  reason?: string;
  status: AccessRequestStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

const REQUESTS_KEY = "dentalos1_access_requests_v1";
export const ACCESS_REQUESTS_EVENT = "dentalos1-access-requests-updated";

export function getAccessRequests(): AccessRequest[] {
  try {
    const parsed = JSON.parse(clinicStorage.getItem(REQUESTS_KEY) || "[]");
    return (Array.isArray(parsed) ? (parsed as AccessRequest[]) : []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function saveRequests(list: AccessRequest[]) {
  clinicStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(ACCESS_REQUESTS_EVENT));
}

export function doctorKey(name = ""): string {
  return name.split(",")[0].replace(/^dr\.?\s+/i, "").trim().toLowerCase();
}

/** Ask the treating doctor for access to a patient. */
export function requestAccess(input: {
  patientKey: string;
  patientRecordId?: string;
  patientName: string;
  owners: string[];
  reason: string;
  me: { name: string; email: string };
}): AccessRequest {
  const req: AccessRequest = {
    id: `acr-${Date.now()}`,
    patientKey: input.patientKey,
    patientRecordId: input.patientRecordId,
    patientName: input.patientName,
    requesterEmail: input.me.email,
    requesterName: input.me.name,
    ownerNames: input.owners,
    ownerKeys: input.owners.map(doctorKey),
    reason: input.reason.trim() || undefined,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  saveRequests([req, ...getAccessRequests()]);
  return req;
}

export function setRequestStatus(id: string, status: AccessRequestStatus, by: string) {
  saveRequests(
    getAccessRequests().map((r) => (r.id === id ? { ...r, status, decidedAt: new Date().toISOString(), decidedBy: by } : r))
  );
}

/** The latest request this user made for a patient, if any. */
export function myRequestFor(patientKeys: Array<string | undefined>, email: string): AccessRequest | undefined {
  return getAccessRequests().find(
    (r) => r.requesterEmail.toLowerCase() === email && patientKeys.some((k) => k && (k === r.patientKey || k === r.patientRecordId))
  );
}

/** Requests from other doctors that this doctor can decide (they treat the patient). */
export function requestsForMe(me: { name: string; email: string }): AccessRequest[] {
  const key = doctorKey(me.name);
  return getAccessRequests().filter((r) => r.requesterEmail.toLowerCase() !== me.email && r.ownerKeys.includes(key));
}

export function useAccessRequests(): AccessRequest[] {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(ACCESS_REQUESTS_EVENT, cb);
      return () => window.removeEventListener(ACCESS_REQUESTS_EVENT, cb);
    },
    getAccessRequestsSnapshot,
    () => EMPTY
  );
}

const EMPTY: AccessRequest[] = [];
let snapRaw: string | null | undefined;
let snap: AccessRequest[] = EMPTY;
function getAccessRequestsSnapshot(): AccessRequest[] {
  const raw = clinicStorage.getItem(REQUESTS_KEY);
  if (raw !== snapRaw) {
    snapRaw = raw;
    snap = getAccessRequests();
  }
  return snap;
}
