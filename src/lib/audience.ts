"use client";

// ============================================================
// DENTALOSBD — Choosing patients for a campaign
// Filters patients by last visit, health issues, treatment received,
// demographics, dues, birthdays and pending recalls.
// ============================================================

import { getAllPatients, PatientProfile } from "@/lib/patients-store";
import { getStoredAppointments, shiftISODate, toISODate } from "@/lib/clinical-flow-store";
import { getRecalls } from "@/lib/messaging-store";

export type LastVisitRule = "any" | "within" | "not_since" | "never" | "range";

export interface AudienceFilter {
  lastVisit: LastVisitRule;
  /** "within": visited in the last N days. "not_since": no visit for N days or more. */
  days: number;
  from: string;
  to: string;
  /** Health issues (medical conditions or allergies); a patient matches if they have any of them. */
  conditions: string[];
  /** Text found in any visit's diagnosis, procedures or reason for visit. */
  treatment: string;
  gender: "any" | "Male" | "Female";
  ageMin: string;
  ageMax: string;
  status: "any" | PatientProfile["status"];
  hasDues: boolean;
  birthdayThisMonth: boolean;
  pendingRecall: boolean;
  search: string;
}

export const EMPTY_FILTER: AudienceFilter = {
  lastVisit: "any",
  days: 180,
  from: "",
  to: "",
  conditions: [],
  treatment: "",
  gender: "any",
  ageMin: "",
  ageMax: "",
  status: "any",
  hasDues: false,
  birthdayThisMonth: false,
  pendingRecall: false,
  search: "",
};

export interface AudienceRow {
  patient: PatientProfile;
  /** YYYY-MM-DD of the last visit the patient attended, or "" if none. */
  lastVisit: string;
  dues: number;
}

const attended = new Set(["checked_in", "in_progress", "completed"]);

function amountOf(text: string): number {
  const n = parseFloat((text || "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

/** All health issues recorded across patients, for the filter's choices. */
export function knownConditions(patients: PatientProfile[] = getAllPatients()): string[] {
  const set = new Map<string, string>();
  for (const p of patients) {
    for (const c of [...(p.medicalConditions || []), ...(p.allergies || [])]) {
      const t = c.trim();
      if (t && !set.has(t.toLowerCase())) set.set(t.toLowerCase(), t);
    }
  }
  return [...set.values()].sort((a, b) => a.localeCompare(b));
}

export function computeAudience(filter: AudienceFilter, today: string = toISODate()): AudienceRow[] {
  const patients = getAllPatients();
  const visits = getStoredAppointments();

  // Last attended visit and visit texts, per patient
  const last = new Map<string, string>();
  const texts = new Map<string, string>();
  for (const v of visits) {
    const keys = [v.patientRecordId, v.patientId].filter(Boolean) as string[];
    const text = [v.provisionalDiagnosis, v.service, v.chiefComplaint, v.prescription?.diagnosis, ...(v.procedures || []).map((p) => p.name)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    for (const k of keys) {
      texts.set(k, `${texts.get(k) || ""} ${text}`);
      if (v.date && (attended.has(v.status) || v.stage === "done") && v.date > (last.get(k) || "")) last.set(k, v.date);
    }
  }

  const pendingRecall = new Set(
    getRecalls()
      .filter((r) => r.status === "planned" || r.status === "awaiting_approval")
      .flatMap((r) => [r.patientId, r.patientRecordId].filter(Boolean) as string[])
  );

  const month = Number(today.slice(5, 7));
  const wanted = filter.conditions.map((c) => c.toLowerCase());
  const q = filter.search.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  const treatment = filter.treatment.trim().toLowerCase();
  const ageMin = filter.ageMin ? Number(filter.ageMin) : undefined;
  const ageMax = filter.ageMax ? Number(filter.ageMax) : undefined;

  const rows: AudienceRow[] = [];
  for (const p of patients) {
    const lastVisit = [last.get(p.id), last.get(p.customId)].filter(Boolean).sort().pop() || "";
    const dues = amountOf(p.outstandingBalance);

    switch (filter.lastVisit) {
      case "within":
        if (!lastVisit || lastVisit < shiftISODate(today, -filter.days)) continue;
        break;
      case "not_since":
        // Patients who have been before but not recently (never-attended is its own choice)
        if (!lastVisit || lastVisit > shiftISODate(today, -filter.days)) continue;
        break;
      case "never":
        if (lastVisit) continue;
        break;
      case "range":
        if (!lastVisit || (filter.from && lastVisit < filter.from) || (filter.to && lastVisit > filter.to)) continue;
        break;
    }
    if (wanted.length > 0) {
      const has = [...(p.medicalConditions || []), ...(p.allergies || [])].map((c) => c.toLowerCase());
      if (!wanted.some((w) => has.includes(w))) continue;
    }
    if (treatment && !`${texts.get(p.id) || ""} ${texts.get(p.customId) || ""}`.includes(treatment)) continue;
    if (filter.gender !== "any" && (p.gender || "").toLowerCase() !== filter.gender.toLowerCase()) continue;
    if (ageMin !== undefined && !(p.age >= ageMin)) continue;
    if (ageMax !== undefined && !(p.age > 0 && p.age <= ageMax)) continue;
    if (filter.status !== "any" && p.status !== filter.status) continue;
    if (filter.hasDues && dues <= 0) continue;
    if (filter.birthdayThisMonth) {
      const m = /^\d{4}-(\d{2})-\d{2}$/.exec(p.dob || "");
      if (!m || Number(m[1]) !== month) continue;
    }
    if (filter.pendingRecall && !pendingRecall.has(p.id) && !pendingRecall.has(p.customId)) continue;
    if (q) {
      const hit =
        p.name.toLowerCase().includes(q) ||
        p.customId.toLowerCase().includes(q) ||
        (qDigits.length >= 4 && (p.phone || "").replace(/\D/g, "").includes(qDigits));
      if (!hit) continue;
    }
    rows.push({ patient: p, lastVisit, dues });
  }
  return rows.sort((a, b) => (b.lastVisit || "").localeCompare(a.lastVisit || "") || a.patient.name.localeCompare(b.patient.name));
}
