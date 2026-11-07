// ============================================================
// DENTALOS1 — Refund voucher: patient copy and office copy on one landscape A4,
// signed by the patient on receipt of the money
// ============================================================

import { getClinicSetup } from "@/lib/clinic-setup-store";
import { formatBDT, numberToWordsBDT } from "@/lib/currency";
import type { ClinicalQueuePatient, VisitInvoice, VisitRefund } from "@/lib/clinical-flow-store";

const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const METHOD_LABELS: Record<string, string> = { cash: "Cash", bkash: "bKash", nagad: "Nagad", card: "Card (POS)" };

/** Two identical copies side by side on landscape A4: patient copy and office copy, with a cut line. */
export function refundVoucherHtml(visit: ClinicalQueuePatient, inv: VisitInvoice, r: VisitRefund): string {
  const clinic = getClinicSetup();
  const when = new Date(r.refundedAt);
  const kept = Math.max(0, (inv.paidAmount || 0) - (inv.refundedAmount || 0));
  const copy = (label: string) => `
  <section class="copy">
    <div class="tag">${label}</div>
    <div class="head">
      <h1>${esc(clinic.name)}</h1>
      <p>${esc([clinic.address, clinic.phone].filter(Boolean).join(" · "))}</p>
    </div>
    <h2>REFUND VOUCHER</h2>
    <table>
      <tr><td>Refund no.</td><td><b>${esc(r.refundNumber)}</b></td></tr>
      <tr><td>Date</td><td>${esc(when.toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" }))}</td></tr>
      <tr><td>Patient</td><td>${esc(visit.patient)} (${esc(visit.patientId)})</td></tr>
      <tr><td>Phone</td><td>${esc(visit.phone)}</td></tr>
      <tr><td>Against invoice</td><td>${esc(inv.invoiceNumber)} · bill ${esc(formatBDT(inv.total))}</td></tr>
      <tr><td>Amount refunded</td><td class="amount">${esc(formatBDT(r.amount))}</td></tr>
      <tr><td>In words</td><td>${esc(numberToWordsBDT(r.amount))}</td></tr>
      <tr><td>Paid back by</td><td>${esc(METHOD_LABELS[r.method] || r.method)}${r.trxId ? ` · TrxID ${esc(r.trxId)}` : ""}</td></tr>
      <tr><td>Reason</td><td>${esc(r.reason)}</td></tr>
      <tr><td>Paid on this bill after refund</td><td>${esc(formatBDT(kept))}</td></tr>
    </table>
    <div class="signs"><div>Received by (patient)</div><div>Authorised by${r.by ? ` (${esc(r.by)})` : ""}</div></div>
  </section>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>Refund ${esc(r.refundNumber)}</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 9.5pt; color: #111827; margin: 0; }
  .sheet { display: flex; width: 281mm; min-height: 190mm; margin: 0 auto; }
  .copy { flex: 1; padding: 4mm 7mm; position: relative; }
  .copy + .copy { border-left: 1px dashed #9ca3af; }
  .tag { position: absolute; top: 4mm; right: 7mm; font-size: 7.5pt; font-weight: 700; letter-spacing: .6px; color: #be123c; border: 1px solid #be123c; border-radius: 3px; padding: 1px 6px; }
  .head { border-bottom: 2px solid #be123c; padding-bottom: 5px; margin-bottom: 8px; padding-right: 26mm; }
  .head h1 { margin: 0; font-size: 13pt; color: #0f766e; }
  .head p { margin: 1px 0; font-size: 8pt; color: #4b5563; }
  h2 { text-align: center; margin: 2px 0 8px; font-size: 12pt; letter-spacing: .5px; color: #be123c; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 3.5px 5px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  td:first-child { color: #4b5563; width: 38%; }
  .amount { font-size: 12.5pt; font-weight: 700; }
  .signs { display: flex; justify-content: space-between; gap: 20px; margin-top: 30px; }
  .signs div { flex: 1; border-top: 1px solid #111827; padding-top: 4px; font-size: 8.5pt; text-align: center; }
</style></head>
<body>
  <div class="sheet">${copy("PATIENT COPY")}${copy("OFFICE COPY")}</div>
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 300); };</script>
</body></html>`;
}

export function printRefundVoucher(visit: ClinicalQueuePatient, inv: VisitInvoice, r: VisitRefund): boolean {
  const win = window.open("", "_blank", "width=1150,height=820,menubar=no,toolbar=no");
  if (!win) return false;
  win.document.open();
  win.document.write(refundVoucherHtml(visit, inv, r));
  win.document.close();
  return true;
}
