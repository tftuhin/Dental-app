"use client";

// ============================================================
// DENTALOS1 — Dues & payments
// A bill can be paid in parts. Each visit's invoice keeps every
// payment; the balance due is carried until it is collected from
// the billing page. The patient's outstanding balance is always
// recomputed from their unpaid bills, so it can't drift.
// ============================================================

import {
  ClinicalQueuePatient,
  VisitInvoice,
  VisitPayment,
  getStoredAppointments,
  getVisit,
  updateVisit,
  logPatientActivity,
} from "@/lib/clinical-flow-store";
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
  payment?: VisitPayment
): ReceiptPdfData | null {
  const inv = visit.invoice;
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
