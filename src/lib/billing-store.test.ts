import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicalQueuePatient } from "./clinical-flow-store";

// Local (no database) mode: the stores read and write this browser's storage.
async function setup(visits: ClinicalQueuePatient[]) {
  vi.resetModules();
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ mode: "local" }))));
  const storage = await import("./clinic-storage");
  await storage.initClinicStorage("test");
  const flow = await import("./clinical-flow-store");
  const billing = await import("./billing-store");
  flow.saveStoredAppointments(visits);
  return { flow, billing };
}

const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

function paidVisit(overrides: Partial<ClinicalQueuePatient> = {}): ClinicalQueuePatient {
  return {
    id: "v1",
    token: "A-001",
    fifoSerial: 1,
    bookingChannel: "walk_in",
    patient: "Karim Uddin",
    patientId: "DENT-2026-00001",
    phone: "+880 1711-000001",
    age: 40,
    gender: "Male",
    address: "Dhaka",
    chair: "Chair 1",
    doctor: "Dr. Sarah Smith",
    time: "10:00 AM",
    duration: "30m",
    service: "RCT",
    status: "completed",
    stage: "done",
    date: today,
    alerts: [],
    invoice: {
      invoiceNumber: "INV-1",
      receiptNumber: "REC-1",
      subtotal: 10000,
      discountAmount: 0,
      total: 10000,
      paidAmount: 6000,
      balanceDue: 4000,
      paymentMethod: "cash",
      paidAt: new Date().toISOString(),
      items: [
        { code: "D3330", description: "RCT Molar", quantity: 1, unitPrice: 8000, category: "procedure" },
        { code: "D7140", description: "Extraction", quantity: 1, unitPrice: 2000, category: "surgery" },
      ],
      payments: [{ id: "pay-1", amount: 6000, method: "cash", paidAt: new Date().toISOString(), receiptNumber: "REC-1" }],
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("refunds", () => {
  it("refuses more than was paid, and needs a reason", async () => {
    const { billing } = await setup([paidVisit()]);
    expect(billing.recordRefund("v1", "invoice", { amount: 7000, method: "cash", reason: "Cancelled" })).toEqual({
      error: expect.stringContaining("at most"),
    });
    expect(billing.recordRefund("v1", "invoice", { amount: 1000, method: "cash", reason: " " })).toEqual({
      error: "Enter the reason for the refund.",
    });
    expect(billing.recordRefund("v1", "invoice", { amount: 1000, method: "bkash", reason: "x" })).toEqual({
      error: expect.stringContaining("transaction ID"),
    });
  });

  it("records the refund without changing what is still owed", async () => {
    const { billing, flow } = await setup([paidVisit()]);
    const res = billing.recordRefund("v1", "invoice", { amount: 2000, method: "cash", reason: "Extraction not done" });
    if ("error" in res) throw new Error(res.error);

    const inv = flow.getVisit("v1")!.invoice!;
    expect(inv.refundedAmount).toBe(2000);
    expect(inv.refunds).toHaveLength(1);
    expect(inv.refunds![0].refundNumber).toBe("RFD-1-R1");
    expect(inv.balanceDue).toBe(4000);
    expect(billing.netPaid(inv)).toBe(4000);

    // A second refund can only take what's left
    expect(billing.recordRefund("v1", "invoice", { amount: 4500, method: "cash", reason: "x" })).toHaveProperty("error");
  });

  it("subtracts refunds from the day's collections, by revenue group", async () => {
    const { billing } = await setup([paidVisit()]);
    billing.recordRefund("v1", "invoice", { amount: 1000, method: "cash", reason: "Overcharge" });

    const s = billing.summariseCollections(today, today);
    expect(s.total).toBe(5000);
    expect(s.refunded).toBe(1000);
    expect(s.payments).toBe(1);
    // Bill was 80% procedure / 20% surgery
    expect(s.bySegment.procedure).toBe(4000);
    expect(s.bySegment.surgery).toBe(1000);
  });

  it("can refund a consultation fee paid at check-in", async () => {
    const { billing } = await setup([
      paidVisit({
        invoice: undefined,
        checkInInvoice: {
          invoiceNumber: "INV-C",
          receiptNumber: "REC-C",
          subtotal: 800,
          discountAmount: 0,
          total: 800,
          paidAmount: 800,
          balanceDue: 0,
          paymentMethod: "cash",
          paidAt: "",
          items: [{ code: "D9310", description: "Consultation", quantity: 1, unitPrice: 800, category: "consultation" }],
          payments: [{ id: "pay-checkin", amount: 800, method: "cash", paidAt: new Date().toISOString(), receiptNumber: "REC-C" }],
        },
      }),
    ]);
    expect(billing.getRefundableBills().map((b) => b.kind)).toEqual(["checkInInvoice"]);
    const res = billing.recordRefund("v1", "checkInInvoice", { amount: 800, method: "cash", reason: "Doctor unavailable" });
    expect(res).not.toHaveProperty("error");
    expect(billing.summariseCollections(today, today).total).toBe(0);
  });
});

describe("late arrivals", () => {
  it("marks booked patients as no-shows three hours after their time", async () => {
    const now = new Date();
    now.setHours(15, 0, 0, 0);
    const { flow } = await setup([
      paidVisit({ id: "late", status: "scheduled", stage: "waiting", time: "11:30 AM", invoice: undefined }),
      paidVisit({ id: "soon", status: "scheduled", stage: "waiting", time: "01:00 PM", invoice: undefined }),
      paidVisit({ id: "here", status: "checked_in", stage: "waiting", time: "09:00 AM", invoice: undefined }),
    ]);
    const changed = flow.markLateNoShows(now);
    expect(changed.map((v) => v.id)).toEqual(["late"]);
    expect(flow.getVisit("late")!.noShowReason).toBe("late");
    expect(flow.getVisit("soon")!.status).toBe("scheduled");
    expect(flow.getVisit("here")!.status).toBe("checked_in");
  });
});
