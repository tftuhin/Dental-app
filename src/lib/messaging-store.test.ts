import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicalQueuePatient } from "./clinical-flow-store";

async function setup(visits: Partial<ClinicalQueuePatient>[] = []) {
  vi.resetModules();
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ mode: "local" }))));
  await (await import("./clinic-storage")).initClinicStorage("t");
  const flow = await import("./clinical-flow-store");
  const msg = await import("./messaging-store");
  const patients = await import("./patients-store");
  flow.saveStoredAppointments(visits.map((v, i) => ({ id: `v${i}`, token: "", fifoSerial: i + 1, bookingChannel: "walk_in", patient: "Rahima Begum", patientId: "P1", phone: "01711234891", age: 30, gender: "Female", address: "", chair: "", doctor: "Dr. Sarah Smith", time: "10:00 AM", duration: "30m", service: "", status: "completed", alerts: [], ...v }) as ClinicalQueuePatient));
  return { flow, msg, patients };
}

const visitInfo = {
  visitId: "v0",
  patientId: "P1",
  patientName: "Rahima Begum",
  phone: "01711234891",
  doctor: "Dr. Sarah Smith, BDS",
  fromDate: "2026-11-08",
};
const crown = { procedure: "Crown fitting", dueDate: "2026-12-01", note: "" };

beforeEach(() => vi.unstubAllGlobals());

describe("recall reminders", () => {
  it("drafts a reminder only after the date plus grace days", async () => {
    const { msg } = await setup([{ date: "2026-11-08" }]);
    msg.saveVisitPlan(visitInfo, [crown]);
    expect(msg.refreshRecalls("2026-12-03")).toBe(0); // within 3 grace days
    expect(msg.refreshRecalls("2026-12-05")).toBe(1);
    const r = msg.getRecalls()[0];
    expect(r.status).toBe("awaiting_approval");
    expect(r.draft!.body).toContain("Rahima");
    expect(r.draft!.body).toContain("Crown fitting");
    expect(r.draft!.body).toContain("1 Dec 2026");
    expect(r.draft!.body).not.toContain("{{");
  });

  it("closes the reminder when the patient came back or booked", async () => {
    const { msg } = await setup([{ date: "2026-11-08" }, { date: "2026-11-30", status: "checked_in" }]);
    msg.saveVisitPlan(visitInfo, [crown]);
    msg.refreshRecalls("2026-12-10");
    expect(msg.getRecalls()[0].status).toBe("returned");

    const again = await setup([{ date: "2026-11-08" }, { date: "2026-12-20", status: "scheduled" }]);
    again.msg.saveVisitPlan(visitInfo, [crown]);
    again.msg.refreshRecalls("2026-12-10");
    expect(again.msg.getRecalls()[0].status).toBe("returned");
  });

  it("asks the right doctor, never reception", async () => {
    const { msg } = await setup([{ date: "2026-11-08" }]);
    msg.saveVisitPlan(visitInfo, [crown]);
    msg.refreshRecalls("2026-12-31");
    expect(msg.recallsAwaitingFor({ name: "Dr. Sarah Smith, DDS", role: "clinic_owner" })).toHaveLength(1);
    expect(msg.recallsAwaitingFor({ name: "Dr. Tanvir Ahmed", role: "dentist" })).toHaveLength(0);
    expect(msg.recallsAwaitingFor({ name: "Rumana Akter", role: "receptionist" })).toHaveLength(0);
  });
});

describe("plans with several procedures", () => {
  it("keeps a reminder per procedure, each with its own date", async () => {
    // Came back after 2 weeks for the first procedure only
    const { msg } = await setup([{ date: "2026-11-08" }, { date: "2026-11-22", status: "completed" }]);
    msg.saveVisitPlan(visitInfo, [
      { procedure: "Suture removal", dueDate: "2026-11-22", note: "" },
      { procedure: "Implant crown", dueDate: "2027-05-08", note: "after healing" },
    ]);
    msg.refreshRecalls("2026-11-25");
    const byName = Object.fromEntries(msg.getRecallsForVisit("v0").map((r) => [r.procedure, r.status]));
    expect(byName).toEqual({ "Suture removal": "returned", "Implant crown": "planned" });
  });

  it("cancels items removed from the plan and keeps the rest", async () => {
    const { msg } = await setup([{ date: "2026-11-08" }]);
    const [a] = msg.saveVisitPlan(visitInfo, [crown, { procedure: "Scaling", dueDate: "2027-05-01", note: "" }]);
    const kept = msg.saveVisitPlan(visitInfo, [{ id: a.id, ...crown, dueDate: "2026-12-15" }]);
    expect(kept.map((r) => [r.procedure, r.dueDate])).toEqual([["Crown fitting", "2026-12-15"]]);
    expect(msg.getRecalls().find((r) => r.procedure === "Scaling")!.status).toBe("dismissed");
  });
});

describe("messages", () => {
  it("fills templates and counts SMS parts", async () => {
    const { msg } = await setup();
    expect(msg.fillMessage("Hi {{first_name}}, call {{clinic_phone}}.", { first_name: "Karim", clinic_phone: "" })).toBe("Hi Karim, call.");
    expect(msg.smsSegments("a".repeat(160)).segments).toBe(1);
    expect(msg.smsSegments("a".repeat(161)).segments).toBe(2);
    expect(msg.smsSegments("প্রিয়".repeat(20)).unicode).toBe(true);
    expect(msg.firstNameOf("Md. Karim Uddin")).toBe("Karim");
  });
});

describe("phone numbers", () => {
  it("normalises Bangladeshi numbers", async () => {
    const { normalisePhone, isValidPhone } = await import("./message-sender");
    expect(normalisePhone("01711-234891")).toBe("8801711234891");
    expect(normalisePhone("+880 1711-234891")).toBe("8801711234891");
    expect(isValidPhone("123")).toBe(false);
  });
});

describe("campaign audience", () => {
  it("filters by last visit and health issues", async () => {
    const { patients } = await setup([
      { patientId: "DENT-1", patientRecordId: "a", date: "2026-01-10" },
      { patientId: "DENT-2", patientRecordId: "b", date: "2026-11-01" },
    ]);
    const base = { dob: "", age: 40, gender: "Female", email: "", address: "", emergencyContact: "", bloodGroup: "", allergies: [], status: "active" as const, lastVisit: "", outstandingBalance: "৳0.00", tags: [] };
    patients.createPatient({ ...base, id: "a", customId: "DENT-1", name: "Old Visitor", phone: "01711000001", medicalConditions: ["Diabetes"] });
    patients.createPatient({ ...base, id: "b", customId: "DENT-2", name: "Recent Visitor", phone: "01711000002", medicalConditions: ["Hypertension"] });
    const audience = await import("./audience");
    // Only this test's patients (the local demo also has sample patients)
    const computeAudience = (f: Parameters<typeof audience.computeAudience>[0], d: string) =>
      audience.computeAudience(f, d).filter((r) => r.patient.id === "a" || r.patient.id === "b");
    const { EMPTY_FILTER } = audience;

    const notSince = computeAudience({ ...EMPTY_FILTER, lastVisit: "not_since", days: 182 }, "2026-11-08");
    expect(notSince.map((r) => r.patient.name)).toEqual(["Old Visitor"]);
    const diabetic = computeAudience({ ...EMPTY_FILTER, conditions: ["diabetes"] }, "2026-11-08");
    expect(diabetic.map((r) => r.patient.name)).toEqual(["Old Visitor"]);
    const recent = computeAudience({ ...EMPTY_FILTER, lastVisit: "within", days: 30 }, "2026-11-08");
    expect(recent.map((r) => r.patient.name)).toEqual(["Recent Visitor"]);
  });
});
