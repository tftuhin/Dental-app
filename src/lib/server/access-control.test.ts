import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {}, isDatabaseConfigured: true }));

import {
  AccessContext,
  AccessRequestData,
  accessFor,
  checkAccessRequestWrite,
  mergePartialWrite,
  redact,
} from "./access-control";

function ctx(over: Partial<AccessContext> = {}): AccessContext {
  return {
    role: "dentist",
    email: "dr.a@clinic.com",
    name: "Dr. Arif Hasan",
    me: "arif hasan",
    privacyOn: true,
    isDesk: false,
    isOwner: false,
    // P1 is treated by Dr. Bina; P2 by Dr. Arif; P3 by nobody yet
    patientDoctors: new Map([
      ["P1", new Set(["bina rahman"])],
      ["rec-1", new Set(["bina rahman"])],
      ["P2", new Set(["arif hasan"])],
    ]),
    doctorNames: new Map([
      ["bina rahman", "Dr. Bina Rahman"],
      ["arif hasan", "Dr. Arif Hasan"],
    ]),
    granted: new Set(),
    ...over,
  };
}

const visitP1 = {
  id: "v1",
  patient: "Karim",
  patientId: "P1",
  patientRecordId: "rec-1",
  doctor: "Dr. Bina Rahman",
  status: "completed",
  clinicalNotes: "Deep caries #36",
  provisionalDiagnosis: "Pulpitis",
  chiefComplaint: "Pain",
  invoice: { total: 1000 },
  prescription: { rxNumber: "RX-1", diagnosis: "Pulpitis", medicines: [{ brandName: "Napa" }] },
};

describe("front desk", () => {
  const desk = ctx({ role: "receptionist", isDesk: true });

  it("gets booking and billing fields of visits, not clinical notes", () => {
    const a = accessFor(desk, "appointments", "v1", visitP1);
    const out = redact("appointments", visitP1, a);
    expect(out._view).toBe("desk");
    expect(out.invoice).toEqual({ total: 1000 });
    expect(out.chiefComplaint).toBe("Pain");
    expect(out.clinicalNotes).toBeUndefined();
    expect(out.prescription).toEqual({ rxNumber: "RX-1", diagnosis: "Pulpitis" });
  });

  it("can't overwrite clinical fields when saving a visit", () => {
    const a = accessFor(desk, "appointments", "v1", visitP1);
    const saved = mergePartialWrite("appointments", visitP1, { ...visitP1, status: "checked_in", clinicalNotes: "", invoice: { total: 2000 } }, a);
    expect(saved.status).toBe("checked_in");
    expect(saved.invoice).toEqual({ total: 2000 });
    expect(saved.clinicalNotes).toBe("Deep caries #36");
  });

  it("sees no charts and only payment entries on the timeline", () => {
    expect(accessFor(desk, "odontogram", "P1", {}).level).toBe("none");
    expect(accessFor(desk, "timeline", "e1", { type: "prescription", patientId: "P1" }).level).toBe("none");
    expect(accessFor(desk, "timeline", "e2", { type: "invoice", patientId: "P1" }).level).toBe("full");
  });
});

describe("doctor privacy", () => {
  it("off: every doctor sees everything", () => {
    const c = ctx({ privacyOn: false });
    expect(accessFor(c, "appointments", "v1", visitP1).level).toBe("full");
    expect(accessFor(c, "odontogram", "P1", {}).level).toBe("full");
  });

  it("on: another doctor's patient shows contact details only", () => {
    const c = ctx();
    const a = accessFor(c, "appointments", "v1", visitP1);
    expect(a).toMatchObject({ level: "partial", view: "private", owners: ["Dr. Bina Rahman"] });
    const out = redact("appointments", visitP1, a);
    expect(out.patient).toBe("Karim");
    expect(out.clinicalNotes).toBeUndefined();
    expect(out.invoice).toBeUndefined();
    expect(accessFor(c, "odontogram", "P1", {}).level).toBe("none");
    expect(accessFor(c, "timeline", "e", { patientId: "P1", type: "appointment" }).level).toBe("none");
    expect(accessFor(c, "patients", "rec-1", { id: "rec-1", customId: "P1" }).level).toBe("partial");
  });

  it("on: own patients and not-yet-seen patients are full", () => {
    const c = ctx();
    expect(accessFor(c, "odontogram", "P2", {}).level).toBe("full");
    expect(accessFor(c, "patients", "rec-3", { id: "rec-3", customId: "P3" }).level).toBe("full");
  });

  it("on: access given by the treating doctor opens the record", () => {
    const c = ctx({ granted: new Set(["P1"]) });
    expect(accessFor(c, "appointments", "v1", visitP1).level).toBe("full");
    expect(accessFor(c, "odontogram", "P1", {}).level).toBe("full");
  });

  it("the clinic owner still sees billing for other doctors' visits", () => {
    const c = ctx({ role: "clinic_owner", isOwner: true });
    const a = accessFor(c, "appointments", "v1", visitP1);
    expect(a).toMatchObject({ level: "partial", view: "private_desk" });
    const out = redact("appointments", visitP1, a);
    expect(out.invoice).toEqual({ total: 1000 });
    expect(out.clinicalNotes).toBeUndefined();
  });
});

describe("access requests", () => {
  const base: AccessRequestData = {
    id: "acr-1",
    patientKey: "P1",
    patientRecordId: "rec-1",
    patientName: "Karim",
    requesterEmail: "dr.a@clinic.com",
    requesterName: "Dr. Arif Hasan",
    ownerNames: [],
    ownerKeys: ["arif hasan"], // a requester trying to name themselves as approver
    status: "pending",
    createdAt: "",
  };

  it("the server decides who approves, not the browser", () => {
    const res = checkAccessRequestWrite(ctx(), null, base, false);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.ownerKeys).toEqual(["bina rahman"]);
  });

  it("only the treating doctor can approve or revoke", () => {
    const stored = { ...base, ownerKeys: ["bina rahman"] };
    expect(checkAccessRequestWrite(ctx(), stored, { ...stored, status: "approved" }, false).ok).toBe(false);
    const bina = ctx({ email: "dr.b@clinic.com", name: "Dr. Bina Rahman", me: "bina rahman" });
    const approved = checkAccessRequestWrite(bina, stored, { ...stored, status: "approved" }, false);
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(checkAccessRequestWrite(bina, approved.data, { ...approved.data, status: "revoked" }, false).ok).toBe(true);
  });

  it("front desk can't take part, and requests can't be deleted", () => {
    expect(checkAccessRequestWrite(ctx({ isDesk: true, role: "receptionist" }), null, base, false).ok).toBe(false);
    expect(checkAccessRequestWrite(ctx(), { ...base }, null, true).ok).toBe(false);
  });
});
