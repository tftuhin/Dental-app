"use client";

// ============================================================
// DENTALOSBD — Dues & payments
// A bill can be paid in parts. Each visit's invoice keeps every
// payment; the balance due is carried until it is collected from
// the billing page. The patient's outstanding balance is always
// recomputed from their unpaid bills, so it can't drift.
// ============================================================

import {
  BillSegment,
  ClinicalQueuePatient,
  VisitInvoice,
  VisitPayment,
  VisitRefund,
  getStoredAppointments,
  getVisit,
  updateVisit,
  logPatientActivity,
  toISODate,
} from "@/lib/clinical-flow-store";
import { CatalogItem, getCatalog } from "@/lib/procedures-catalog-store";
import { getPatientById, updatePatient } from "@/lib/patients-store";
import { getClinicSetup } from "@/lib/clinic-setup-store";
import { formatBDT } from "@/lib/currency";
import type { ReceiptPdfData } from "@/lib/receipt-pdf-generator";

/** Round to paisa to avoid floating-point leftovers like 0.000001 due. */
const money = (n: number) => Math.round(n * 100) / 100;

/** Payments on an invoice, including the first payment on bills created before payment history existed. */
export function getPayments(inv: VisitInvoice): VisitPayment[] {
  if (inv.payments && inv.payments.length > 0) return inv.payments;
  if (inv.paidAmount > 0) {
    return [
      {
        id: "pay-initial",
        amount: inv.paidAmount,
        method: inv.paymentMethod,
        paidAt: inv.paidAt,
        receiptNumber: inv.receiptNumber,
      },
    ];
  }
  return [];
}

/** All visits with money still owed, oldest first. */
export function getOutstandingVisits(): ClinicalQueuePatient[] {
  return getStoredAppointments()
    .filter((a) => a.invoice && a.invoice.balanceDue > 0.009)
    .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.fifoSerial || 0) - (b.fifoSerial || 0));
}

/** Set the patient's outstanding balance to the sum of their unpaid bills. */
export function recalcPatientOutstanding(visit: ClinicalQueuePatient): void {
  const record = getPatientById(visit.patientRecordId || visit.patientId);
  if (!record) return;
  const totalDue = getStoredAppointments()
    .filter(
      (a) =>
        a.invoice &&
        ((a.patientRecordId && a.patientRecordId === record.id) || a.patientId === record.customId)
    )
    .reduce((sum, a) => sum + (a.invoice?.balanceDue || 0), 0);
  updatePatient(record.id, { outstandingBalance: formatBDT(money(totalDue)) });
}

/**
 * Collect a payment against a bill's balance due.
 * Returns the updated visit and the payment, or an error message.
 */
export function recordDuePayment(
  visitId: string,
  input: { amount: number; method: string; trxId?: string }
): { visit: ClinicalQueuePatient; payment: VisitPayment } | { error: string } {
  const visit = getVisit(visitId);
  const inv = visit?.invoice;
  if (!visit || !inv) return { error: "Bill not found." };

  const amount = money(Number(input.amount));
  if (!(amount > 0)) return { error: "Enter an amount greater than zero." };
  if (amount > money(inv.balanceDue)) {
    return { error: `Amount is more than the balance due (${formatBDT(inv.balanceDue)}).` };
  }

  const previous = getPayments(inv);
  const payment: VisitPayment = {
    id: `pay-${Date.now()}`,
    amount,
    method: input.method,
    trxId: input.trxId?.trim() || undefined,
    paidAt: new Date().toISOString(),
    receiptNumber: `${inv.receiptNumber}-${previous.length + 1}`,
  };
  const paidAmount = money(inv.paidAmount + amount);
  const balanceDue = money(Math.max(0, inv.total - paidAmount));

  const updated = updateVisit(visit.id, {
    invoice: { ...inv, payments: [...previous, payment], paidAmount, balanceDue },
  });
  if (!updated) return { error: "Could not save the payment." };

  recalcPatientOutstanding(updated);

  logPatientActivity({
    id: `ev-${visit.id}-${payment.id}`,
    patientId: visit.patientId,
    date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
    timestamp: Date.now(),
    type: "invoice",
    title: `Due payment received (${inv.invoiceNumber})`,
    doctor: visit.doctor,
    billingDetails: {
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.total,
      discountAmount: inv.discountAmount,
      paidAmount: amount,
      paymentMethod: payment.method.toUpperCase(),
      paidAt: new Date(payment.paidAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" }),
      receiptNumber: payment.receiptNumber,
    },
    badge: balanceDue > 0 ? `Due ${formatBDT(balanceDue)}` : "Fully Paid",
    badgeColor:
      balanceDue > 0
        ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
        : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  });

  return { visit: updated, payment };
}

/**
 * Receipt for a bill. With `payment`, the receipt is for that one payment and
 * shows what was paid before it; without, it covers all payments so far.
 */
export function buildReceiptFromInvoice(
  visit: ClinicalQueuePatient,
  payment?: VisitPayment,
  invoice: VisitInvoice | undefined = visit.invoice
): ReceiptPdfData | null {
  const inv = invoice;
  if (!inv) return null;
  const clinic = getClinicSetup();
  const record = getPatientById(visit.patientRecordId || visit.patientId);
  const doctorName = visit.doctor?.split(",")[0]?.trim() || "";
  const doctor = clinic.doctors?.find((d) => d.name === doctorName);

  const payments = getPayments(inv);
  const idx = payment ? payments.findIndex((p) => p.id === payment.id) : -1;
  const before = idx >= 0 ? payments.slice(0, idx) : [];
  const previouslyPaid = money(before.reduce((s, p) => s + p.amount, 0));
  const paidThrough = payment ? money(previouslyPaid + payment.amount) : inv.paidAmount;
  const paidAt = new Date(payment?.paidAt || Date.now());
  const items = (inv.items || []).map((it, i) => ({
    id: `r-${i}`,
    sl: i + 1,
    cdtCode: it.code,
    description: it.description,
    toothNumber: it.toothNumber,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    total: it.quantity * it.unitPrice,
  }));

  return {
    invoiceNumber: inv.invoiceNumber,
    receiptNumber: payment?.receiptNumber || inv.receiptNumber,
    date: paidAt.toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
    time: paidAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    clinicName: clinic.name,
    clinicTagline: clinic.tagline,
    clinicAddress: clinic.address,
    clinicPhone: clinic.phone,
    clinicLicense: clinic.bmdcLicense,
    doctorName,
    doctorDegree: doctor?.degree || "",
    bmdcReg: doctor?.bmdcReg || "",
    patientName: visit.patient,
    patientId: visit.patientId,
    age: visit.age,
    gender: visit.gender || record?.gender || "",
    phone: visit.phone,
    address: visit.address,
    diagnosis: inv.diagnosis || visit.prescription?.diagnosis || visit.provisionalDiagnosis || "",
    items,
    subtotal: inv.subtotal,
    discountAmount: inv.discountAmount,
    discountType: inv.discountType,
    taxAmount: inv.taxAmount || 0,
    taxRate: inv.taxRate || 0,
    grandTotal: inv.total,
    paidAmount: paidThrough,
    balanceDue: money(Math.max(0, inv.total - paidThrough)),
    paymentMethod: payment?.method || inv.paymentMethod,
    trxId: payment?.trxId,
    previouslyPaid: payment && previouslyPaid > 0 ? previouslyPaid : undefined,
    thisPayment: payment && previouslyPaid > 0 ? payment.amount : undefined,
  };
}

// ─── Refunds ─────────────────────────────────────────────────

export type BillKind = "invoice" | "checkInInvoice";

/** Money the clinic has kept on a bill: paid minus refunded. */
export function netPaid(inv: VisitInvoice): number {
  return money(Math.max(0, (inv.paidAmount || 0) - (inv.refundedAmount || 0)));
}

/** A bill that can still be refunded, for the refund search list. */
export interface RefundableBill {
  visit: ClinicalQueuePatient;
  kind: BillKind;
  invoice: VisitInvoice;
  refundable: number;
}

/** Paid bills (final bills and check-in consultation fees), newest first. */
export function getRefundableBills(visits: ClinicalQueuePatient[] = getStoredAppointments()): RefundableBill[] {
  const out: RefundableBill[] = [];
  for (const visit of visits) {
    for (const kind of ["invoice", "checkInInvoice"] as BillKind[]) {
      const invoice = visit[kind];
      if (!invoice) continue;
      const refundable = netPaid(invoice);
      if (refundable > 0 || (invoice.refunds?.length ?? 0) > 0) out.push({ visit, kind, invoice, refundable });
    }
  }
  return out.sort(
    (a, b) => (b.visit.date || "").localeCompare(a.visit.date || "") || (b.visit.fifoSerial || 0) - (a.visit.fifoSerial || 0)
  );
}

/**
 * Give money back on a paid bill. The refund comes off both the bill and
 * what was paid, so the balance due stays the same. Returns the updated
 * visit and the refund, or an error message.
 */
export function recordRefund(
  visitId: string,
  kind: BillKind,
  input: { amount: number; method: string; trxId?: string; reason: string; by?: string }
): { visit: ClinicalQueuePatient; refund: VisitRefund } | { error: string } {
  const visit = getVisit(visitId);
  const inv = visit?.[kind];
  if (!visit || !inv) return { error: "Bill not found." };

  const amount = money(Number(input.amount));
  const available = netPaid(inv);
  if (!(amount > 0)) return { error: "Enter an amount greater than zero." };
  if (amount > available) return { error: `You can refund at most ${formatBDT(available)} on this bill.` };
  if (!input.reason.trim()) return { error: "Enter the reason for the refund." };
  if ((input.method === "bkash" || input.method === "nagad") && !input.trxId?.trim()) {
    return { error: "Enter the transaction ID of the mobile refund." };
  }

  const previous = inv.refunds || [];
  const refund: VisitRefund = {
    id: `ref-${Date.now()}`,
    amount,
    method: input.method,
    trxId: input.trxId?.trim() || undefined,
    reason: input.reason.trim(),
    refundedAt: new Date().toISOString(),
    refundNumber: `${inv.receiptNumber.replace(/^REC-/, "RFD-")}-R${previous.length + 1}`,
    by: input.by,
  };
  const updated = updateVisit(visit.id, {
    [kind]: { ...inv, refunds: [...previous, refund], refundedAmount: money((inv.refundedAmount || 0) + amount) },
  });
  if (!updated) return { error: "Could not save the refund." };

  logPatientActivity({
    id: `ev-${visit.id}-${refund.id}`,
    patientId: visit.patientId,
    date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
    timestamp: Date.now(),
    type: "invoice",
    title: `Refund of ${formatBDT(amount)} (${inv.invoiceNumber}): ${refund.reason}`,
    doctor: visit.doctor,
    billingDetails: {
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.total,
      discountAmount: inv.discountAmount,
      paidAmount: -amount,
      paymentMethod: refund.method.toUpperCase(),
      paidAt: new Date(refund.refundedAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" }),
      receiptNumber: refund.refundNumber,
    },
    badge: "Refunded",
    badgeColor: "bg-rose-500/10 text-rose-700 border-rose-500/30",
  });

  return { visit: updated, refund };
}

// ─── Collection reports ──────────────────────────────────────

export const BILL_SEGMENTS: BillSegment[] = ["consultation", "examination", "procedure", "surgery", "consumable"];

/** Revenue group of a bill line. Older bills didn't store it, so it's worked out from the price list or the code. */
export function segmentOfLine(
  item: { code?: string; description?: string; category?: BillSegment },
  catalog: CatalogItem[] = getCatalog()
): BillSegment {
  if (item.category) return item.category;
  const code = (item.code || "").trim().toUpperCase();
  const listed = code ? catalog.find((c) => c.code.trim().toUpperCase() === code) : undefined;
  if (listed) return listed.category;
  const name = item.description || "";
  if (/^D93/.test(code) || /consult|counsel/i.test(name)) return "consultation";
  if (/^(MED|DSP|RX)/.test(code) || /medicine|disposable|anaesthe|suture/i.test(name)) return "consumable";
  if (/^D0/.test(code) || /x-?ray|radiograph|exam|opg|cbct|test/i.test(name)) return "examination";
  if (/^D[67]/.test(code) || /extraction|surg|implant|incision/i.test(name)) return "surgery";
  return "procedure";
}

/** Each group's share of a bill (shares add up to 1). A discount reduces every group in proportion. */
function invoiceShares(inv: VisitInvoice, catalog: CatalogItem[]): Array<[BillSegment, number]> {
  const gross = new Map<BillSegment, number>();
  for (const it of inv.items || []) {
    const seg = segmentOfLine(it, catalog);
    gross.set(seg, (gross.get(seg) || 0) + it.quantity * it.unitPrice);
  }
  const sum = [...gross.values()].reduce((s, n) => s + n, 0);
  if (sum <= 0) return [["procedure", 1]];
  return [...gross.entries()].filter(([, n]) => n > 0).map(([seg, n]) => [seg, n / sum]);
}

export interface CollectionEntry {
  /** Day the money was received, YYYY-MM-DD. */
  date: string;
  doctor: string;
  segment: BillSegment;
  amount: number;
  visitId: string;
  paymentKey: string;
  /** True for money given back (the amount is negative). */
  refund?: boolean;
}

/** Day a payment was received. Very old payments have no readable time, so they count on the visit day. */
function paymentDay(p: VisitPayment, visit: ClinicalQueuePatient): string {
  const d = new Date(p.paidAt);
  return isNaN(d.getTime()) ? visit.date || toISODate() : toISODate(d);
}

/** Every payment received (check-in fees, bills and due payments), split by doctor and revenue group. */
export function getCollectionEntries(visits: ClinicalQueuePatient[] = getStoredAppointments()): CollectionEntry[] {
  const catalog = getCatalog();
  const entries: CollectionEntry[] = [];
  for (const visit of visits) {
    const doctor = visit.doctor?.split(",")[0]?.trim() || "Unassigned";
    for (const inv of [visit.checkInInvoice, visit.invoice]) {
      if (!inv) continue;
      const shares = invoiceShares(inv, catalog);
      for (const p of getPayments(inv)) {
        if (!(p.amount > 0)) continue;
        const date = paymentDay(p, visit);
        const paymentKey = `${visit.id}:${inv.invoiceNumber}:${p.id}`;
        let left = money(p.amount);
        shares.forEach(([segment, share], i) => {
          const amount = i === shares.length - 1 ? left : money(p.amount * share);
          left = money(left - amount);
          entries.push({ date, doctor, segment, amount, visitId: visit.id, paymentKey });
        });
      }
      // Refunds count against the day they were given, split the same way
      for (const r of inv.refunds || []) {
        if (!(r.amount > 0)) continue;
        const d = new Date(r.refundedAt);
        const date = isNaN(d.getTime()) ? visit.date || toISODate() : toISODate(d);
        const paymentKey = `${visit.id}:${inv.invoiceNumber}:${r.id}`;
        let left = money(r.amount);
        shares.forEach(([segment, share], i) => {
          const amount = i === shares.length - 1 ? left : money(r.amount * share);
          left = money(left - amount);
          entries.push({ date, doctor, segment, amount: -amount, visitId: visit.id, paymentKey, refund: true });
        });
      }
    }
  }
  return entries;
}

export type SegmentTotals = Record<BillSegment, number>;

const emptyTotals = (): SegmentTotals => ({ consultation: 0, examination: 0, procedure: 0, surgery: 0, consumable: 0 });

export interface DoctorCollection {
  doctor: string;
  total: number;
  patients: number;
  bySegment: SegmentTotals;
}

export interface CollectionSummary {
  /** Money received minus refunds given. */
  total: number;
  payments: number;
  /** Refunds given in the period (a positive amount). */
  refunded: number;
  bySegment: SegmentTotals;
  doctors: DoctorCollection[];
}

/** Money received between two days (inclusive, YYYY-MM-DD), by doctor and revenue group. */
export function summariseCollections(
  from: string,
  to: string,
  entries: CollectionEntry[] = getCollectionEntries()
): CollectionSummary {
  const bySegment = emptyTotals();
  const doctors = new Map<string, DoctorCollection & { visits: Set<string> }>();
  const payments = new Set<string>();
  let total = 0;
  let refunded = 0;
  for (const e of entries) {
    if (e.date < from || e.date > to) continue;
    total += e.amount;
    bySegment[e.segment] += e.amount;
    if (e.refund) refunded -= e.amount;
    else payments.add(e.paymentKey);
    let row = doctors.get(e.doctor);
    if (!row) {
      row = { doctor: e.doctor, total: 0, patients: 0, bySegment: emptyTotals(), visits: new Set() };
      doctors.set(e.doctor, row);
    }
    row.total += e.amount;
    row.bySegment[e.segment] += e.amount;
    row.visits.add(e.visitId);
  }
  const round = (t: SegmentTotals) => {
    for (const k of BILL_SEGMENTS) t[k] = money(t[k]);
    return t;
  };
  return {
    total: money(total),
    payments: payments.size,
    refunded: money(refunded),
    bySegment: round(bySegment),
    doctors: [...doctors.values()]
      .map(({ visits, ...row }) => ({ ...row, total: money(row.total), patients: visits.size, bySegment: round(row.bySegment) }))
      .sort((a, b) => b.total - a.total),
  };
}

// ─── Check-in ────────────────────────────────────────────────

/** True when the consultation fee is collected at check-in (Settings → Procedures & Fees). */
export function isPrepaidConsultationOn(): boolean {
  return getClinicSetup().prepaidConsultation !== false;
}

export interface CheckInFee {
  code: string;
  name: string;
  amount: number;
  method: string;
  trxId?: string;
}

/**
 * Mark a booked patient as arrived. With `fee`, the consultation fee is
 * collected now as its own paid bill, and the final bill leaves it out.
 */
export function checkInVisit(
  visitId: string,
  fee?: CheckInFee
): { visit: ClinicalQueuePatient } | { error: string } {
  const visit = getVisit(visitId);
  if (!visit) return { error: "Appointment not found." };
  if (visit.status !== "scheduled") {
    return {
      error: visit.status === "no_show" ? "This visit is marked as a no-show." : `${visit.patient} is already checked in.`,
    };
  }

  const now = new Date();
  let checkInInvoice: VisitInvoice | undefined;
  if (fee) {
    const amount = money(Number(fee.amount));
    if (!(amount > 0)) return { error: "Enter the consultation fee." };
    if ((fee.method === "bkash" || fee.method === "nagad") && !fee.trxId?.trim()) {
      return { error: "Enter the transaction ID." };
    }
    const day = (visit.date || toISODate(now)).replace(/-/g, "");
    const invoiceNumber = `INV-${day}-${String(visit.fifoSerial || 0).padStart(3, "0")}-C`;
    const receiptNumber = invoiceNumber.replace(/^INV-/, "REC-");
    checkInInvoice = {
      invoiceNumber,
      receiptNumber,
      subtotal: amount,
      discountAmount: 0,
      total: amount,
      paidAmount: amount,
      balanceDue: 0,
      paymentMethod: fee.method,
      paidAt: now.toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" }),
      items: [{ code: fee.code, description: fee.name, quantity: 1, unitPrice: amount, category: "consultation" }],
      payments: [
        {
          id: "pay-checkin",
          amount,
          method: fee.method,
          trxId: fee.trxId?.trim() || undefined,
          paidAt: now.toISOString(),
          receiptNumber,
        },
      ],
    };
  }

  const updated = updateVisit(visit.id, {
    status: "checked_in",
    checkedInAt: now.toISOString(),
    ...(checkInInvoice ? { checkInInvoice } : {}),
  });
  if (!updated) return { error: "Could not save the check-in." };

  if (checkInInvoice && fee) {
    logPatientActivity({
      id: `ev-${visit.id}-checkin`,
      patientId: visit.patientId,
      date: now.toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
      timestamp: now.getTime(),
      type: "invoice",
      title: `Consultation fee paid at check-in (${checkInInvoice.invoiceNumber})`,
      doctor: visit.doctor,
      billingDetails: {
        invoiceNumber: checkInInvoice.invoiceNumber,
        totalAmount: checkInInvoice.total,
        paidAmount: checkInInvoice.paidAmount,
        paymentMethod: fee.method.toUpperCase(),
        paidAt: checkInInvoice.paidAt,
        receiptNumber: checkInInvoice.receiptNumber,
      },
      badge: "Paid",
      badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    });
  }
  return { visit: updated };
}
