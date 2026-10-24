/**
 * Money Receipt / Cash Memo PDF & Print Generator for DentalOS1
 * 
 * Generates an official, executive 2-copy Money Receipt formatted for A4 portrait:
 * - Top Half: PATIENT COPY
 * - Perforation Divider (✂ Cut Here)
 * - Bottom Half: OFFICE / CLINIC COPY
 * Both copies feature full clinic letterhead, patient demographics, clinical diagnosis,
 * itemized procedures table, financial ledger, and placeholders for manual signatures.
 */

import { formatBDT, numberToWordsBDT } from "@/lib/currency";

export interface ReceiptItemData {
  id?: string;
  sl?: number;
  cdtCode?: string;
  description: string;
  toothNumber?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface ReceiptPdfData {
  invoiceNumber: string;
  receiptNumber?: string;
  date: string;
  time?: string;
  clinicName?: string;
  clinicTagline?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicLicense?: string;
  doctorName?: string;
  doctorDegree?: string;
  bmdcReg?: string;
  patientName: string;
  patientId: string;
  age?: number | string;
  gender?: string;
  phone?: string;
  address?: string;
  diagnosis?: string;
  items: ReceiptItemData[];
  subtotal: number;
  discountAmount: number;
  discountType?: string;
  taxAmount: number;
  taxRate?: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: string;
  trxId?: string;
  notes?: string;
}

function renderReceiptSlip(
  copyTitle: "PATIENT COPY" | "OFFICE / CLINIC COPY",
  badgeBg: string,
  badgeText: string,
  data: ReceiptPdfData
): string {
  const receiptNo = data.receiptNumber || `REC-${data.invoiceNumber.replace(/^INV-/, "")}`;
  const docName = data.doctorName || "Dr. Sarah Smith";
  const docDegree = data.doctorDegree || "BDS (DU), FCPS (Oral & Maxillofacial Surgery)";
  const docReg = data.bmdcReg || "BMDC-DS-18492";
  const clinicTitle = data.clinicName || "DHAKA DENTAL CARE & MAXILLOFACIAL HOSPITAL";
  const clinicSub = data.clinicTagline || "Advanced Microscopic Endodontics, Oral Surgery & Dental Implantology Centre";
  const clinicAddr = data.clinicAddress || "House 42, Road 7A, Dhanmondi R/A, Dhaka-1209, Bangladesh";
  const clinicPhoneNo = data.clinicPhone || "+880 1712-345678 / +880 2-9876543";
  const clinicLic = data.clinicLicense || "DGHS/DH-2024/9912 · BMDC Approved";

  const isFullSettlement = data.paidAmount >= data.grandTotal;
  const statusBadge = isFullSettlement
    ? `<span class="status-badge paid">PAID IN FULL</span>`
    : `<span class="status-badge due">PARTIAL / DUE: ${formatBDT(data.balanceDue)}</span>`;

  const rowsHtml = data.items.length === 0
    ? `<tr><td colspan="6" style="text-align: center; color: #64748b; font-style: italic; padding: 6px;">No billable procedures listed</td></tr>`
    : data.items.map((it, idx) => `
      <tr>
        <td class="col-center font-mono">${idx + 1}</td>
        <td>
          <strong class="item-title">${it.description}</strong>
          ${it.cdtCode ? `<span class="item-sub font-mono">(${it.cdtCode})</span>` : ""}
        </td>
        <td class="col-center font-mono">${it.toothNumber || "—"}</td>
        <td class="col-center font-mono">${it.quantity}</td>
        <td class="col-right font-mono">${formatBDT(it.unitPrice)}</td>
        <td class="col-right font-mono font-bold">${formatBDT(it.total || (it.unitPrice * it.quantity))}</td>
      </tr>
    `).join("");

  const inWords = numberToWordsBDT(data.paidAmount > 0 ? data.paidAmount : data.grandTotal);

  return `
    <div class="receipt-slip">
      <!-- Header -->
      <div class="slip-header">
        <div class="clinic-brand">
          <div class="crest-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crest-svg">
              <path d="M12 2C8.5 2 6 4.5 6 7.5c0 2 .5 4 1.5 6 .8 1.6 1.5 3.5 1.5 5.5 0 1.5 1 2 2 2s1.5-1 1-3c-.5-2 .5-3 1-3s1.5 1 1 3c-.5 2 0 3 1 3s2-.5 2-2c0-2 .7-3.9 1.5-5.5 1-2 1.5-4 1.5-6C20 4.5 17.5 2 12 2z"/>
            </svg>
          </div>
          <div>
            <h1 class="clinic-title">${clinicTitle}</h1>
            <p class="clinic-tagline">${clinicSub}</p>
            <p class="clinic-meta">${clinicAddr} · Hotline: <strong>${clinicPhoneNo}</strong></p>
            <p class="clinic-lic font-mono">Lic: ${clinicLic}</p>
          </div>
        </div>

        <div class="receipt-badge-block">
          <div class="copy-badge" style="background: ${badgeBg}; color: ${badgeText};">${copyTitle}</div>
          <div class="receipt-title">OFFICIAL MONEY RECEIPT</div>
          <div class="receipt-no font-mono">Receipt #: <strong>${receiptNo}</strong></div>
          <div class="receipt-date font-mono">Date: ${data.date}${data.time ? ` · ${data.time}` : ""}</div>
        </div>
      </div>

      <!-- Patient & Clinical Details Strip -->
      <div class="patient-strip">
        <div class="p-cell">
          <span class="p-lbl">Patient Name:</span>
          <strong class="p-val">${data.patientName}</strong>
        </div>
        <div class="p-cell">
          <span class="p-lbl">Patient ID:</span>
          <strong class="p-val font-mono">${data.patientId}</strong>
        </div>
        <div class="p-cell">
          <span class="p-lbl">Age / Sex:</span>
          <span class="p-val">${data.age ? `${data.age} Y` : "—"} / ${data.gender || "—"}</span>
        </div>
        <div class="p-cell">
          <span class="p-lbl">Contact Phone:</span>
          <span class="p-val font-mono">${data.phone || "—"}</span>
        </div>
        <div class="p-cell span-2">
          <span class="p-lbl">Attending Clinician:</span>
          <span class="p-val"><strong>${docName}</strong>, ${docDegree} <span class="font-mono">(${docReg})</span></span>
        </div>
        <div class="p-cell span-2">
          <span class="p-lbl">Clinical Diagnosis:</span>
          <span class="p-val">${data.diagnosis || "Specialized Dental Examination & Restorative Therapy"}</span>
        </div>
      </div>

      <!-- Table -->
      <table class="receipt-table">
        <thead>
          <tr>
            <th style="width: 28px;">Sl</th>
            <th>Service / Operatory Procedure Description</th>
            <th style="width: 50px;">Tooth</th>
            <th style="width: 38px;">Qty</th>
            <th style="width: 80px;" class="col-right">Rate (BDT)</th>
            <th style="width: 85px;" class="col-right">Total (BDT)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Financial & Settlement Ledger -->
      <div class="financial-block">
        <div class="fin-left">
          <div class="mode-box">
            <span class="lbl">Payment Method:</span>
            <span class="val font-mono"><strong>${data.paymentMethod.toUpperCase()}</strong>${data.trxId ? ` (TrxID: ${data.trxId})` : ""}</span>
            ${statusBadge}
          </div>
          <div class="in-words-box">
            <span class="lbl">In Words:</span>
            <span class="in-words-val">${inWords}</span>
          </div>
        </div>

        <div class="fin-right">
          <div class="ledger-row">
            <span>Subtotal Fee:</span>
            <span class="font-mono">${formatBDT(data.subtotal)}</span>
          </div>
          ${data.discountAmount > 0 ? `
            <div class="ledger-row text-discount">
              <span>Discount (${data.discountType || "Privilege"}):</span>
              <span class="font-mono">-${formatBDT(data.discountAmount)}</span>
            </div>` : ""}
          ${data.taxAmount > 0 ? `
            <div class="ledger-row">
              <span>VAT / Tax (${data.taxRate || 0}%):</span>
              <span class="font-mono">+${formatBDT(data.taxAmount)}</span>
            </div>` : ""}
          <div class="ledger-row grand-total">
            <span>Net Payable Total:</span>
            <span class="font-mono font-bold">${formatBDT(data.grandTotal)}</span>
          </div>
          <div class="ledger-row text-paid">
            <span>Amount Received:</span>
            <span class="font-mono font-bold">${formatBDT(data.paidAmount)}</span>
          </div>
          <div class="ledger-row ${data.balanceDue > 0 ? "text-due font-bold" : "text-settled"}">
            <span>Balance Due:</span>
            <span class="font-mono">${formatBDT(data.balanceDue)}</span>
          </div>
        </div>
      </div>

      <!-- Manual Signature Placeholders -->
      <div class="signature-section">
        <div class="sig-col">
          <div class="sig-line"></div>
          <span class="sig-title">Patient / Depositor's Signature</span>
          <span class="sig-subtitle">Date: ________________________</span>
        </div>

        <div class="seal-col">
          <div class="seal-box">
            <span>OFFICIAL SEAL</span>
          </div>
        </div>

        <div class="sig-col sig-right">
          <div class="sig-line"></div>
          <span class="sig-title">Authorized Cashier / Accounts</span>
          <span class="sig-subtitle">Dhaka Dental Care (BMDC Reg)</span>
        </div>
      </div>

      <!-- Micro Notice -->
      <div class="slip-notice">
        Computer-generated official money receipt under DentalOS1. Dental restorations carry standard clinic warranty. Keep this receipt for corporate insurance & tax filing.
      </div>
    </div>
  `;
}

export function generateReceiptHtml(data: ReceiptPdfData): string {
  const receiptNo = data.receiptNumber || `REC-${data.invoiceNumber.replace(/^INV-/, "")}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Money Receipt — ${data.patientName} (${receiptNo})</title>
  <style>
    @page { 
      size: A4 portrait; 
      margin: 6mm 10mm 6mm 10mm; 
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
      color: #0f172a; 
      background: #ffffff; 
      margin: 0; 
      padding: 0; 
      font-size: 10px; 
      line-height: 1.35; 
      -webkit-font-smoothing: antialiased;
    }

    .a4-sheet {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 284mm; /* Perfectly fits single A4 portrait page */
      overflow: hidden;
    }

    /* Receipt Slip Box (Top / Bottom) */
    .receipt-slip {
      border: 1.5px solid #0f172a;
      border-radius: 6px;
      padding: 8px 10px;
      background: #ffffff;
      height: 135mm;
      max-height: 135mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    /* Perforation Cut Line */
    .cut-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 9mm;
      gap: 10px;
      color: #64748b;
      font-size: 9px;
      font-family: monospace;
      font-weight: 700;
      user-select: none;
    }
    .cut-line {
      flex: 1;
      border-top: 1.5px dashed #94a3b8;
    }
    .cut-text {
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Slip Header */
    .slip-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 5px;
      margin-bottom: 4px;
    }
    .clinic-brand {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      max-width: 65%;
    }
    .crest-box {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #047857;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .crest-svg {
      width: 20px;
      height: 20px;
    }
    .clinic-title {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
      line-height: 1.15;
      text-transform: uppercase;
      letter-spacing: -0.2px;
    }
    .clinic-tagline {
      font-size: 8.5px;
      font-weight: 600;
      color: #047857;
      margin: 1px 0;
      line-height: 1.2;
    }
    .clinic-meta {
      font-size: 8px;
      color: #475569;
      margin: 0;
      line-height: 1.2;
    }
    .clinic-lic {
      font-size: 7.5px;
      color: #64748b;
      margin: 0;
    }

    /* Receipt Badge Block */
    .receipt-badge-block {
      text-align: right;
    }
    .copy-badge {
      display: inline-block;
      font-size: 8.5px;
      font-weight: 900;
      padding: 1.5px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .receipt-title {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.4px;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .receipt-no {
      font-size: 9px;
      color: #0f172a;
      margin-bottom: 1px;
    }
    .receipt-date {
      font-size: 8px;
      color: #475569;
    }

    /* Patient Strip */
    .patient-strip {
      display: grid;
      grid-template-columns: 2fr 1.2fr 1fr 1.2fr;
      gap: 3px 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px 6px;
      margin-bottom: 4px;
      font-size: 8.5px;
    }
    .p-cell {
      display: flex;
      align-items: baseline;
      gap: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .p-cell.span-2 {
      grid-column: span 2;
    }
    .p-lbl {
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7.5px;
      flex-shrink: 0;
    }
    .p-val {
      color: #0f172a;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Table */
    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
      margin-bottom: 4px;
    }
    .receipt-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 7.5px;
      letter-spacing: 0.4px;
      padding: 3px 5px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    .receipt-table td {
      padding: 3px 5px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    .receipt-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .item-title {
      font-weight: 700;
      color: #0f172a;
    }
    .item-sub {
      font-size: 7.5px;
      color: #64748b;
      margin-left: 3px;
    }
    .col-center {
      text-align: center;
    }
    .col-right {
      text-align: right;
    }

    /* Financial Block */
    .financial-block {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
      margin-bottom: 4px;
    }
    .fin-left {
      width: 55%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 3px;
    }
    .mode-box {
      font-size: 8.5px;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .status-badge {
      display: inline-block;
      font-size: 7.5px;
      font-weight: 900;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .status-badge.paid {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .status-badge.due {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .in-words-box {
      font-size: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 2.5px 6px;
      border-radius: 4px;
    }
    .in-words-val {
      font-style: italic;
      font-weight: 700;
      color: #0f172a;
    }

    .fin-right {
      width: 42%;
      font-size: 8.5px;
    }
    .ledger-row {
      display: flex;
      justify-content: space-between;
      padding: 1px 0;
      color: #334155;
    }
    .ledger-row.grand-total {
      border-top: 1px solid #0f172a;
      margin-top: 1.5px;
      padding-top: 2px;
      font-size: 9.5px;
      color: #0f172a;
    }
    .text-discount {
      color: #047857;
      font-weight: 600;
    }
    .text-paid {
      color: #065f46;
      font-weight: 700;
    }
    .text-due {
      color: #b45309;
    }
    .text-settled {
      color: #64748b;
    }

    /* Signatures Section */
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 90px 1fr;
      align-items: end;
      gap: 8px;
      margin-top: 4px;
      padding-top: 14px;
      border-top: 1px solid #cbd5e1;
    }
    .sig-col {
      text-align: left;
    }
    .sig-col.sig-right {
      text-align: right;
    }
    .sig-line {
      border-top: 1.5px dotted #0f172a;
      width: 85%;
      margin-bottom: 2px;
    }
    .sig-right .sig-line {
      margin-left: auto;
    }
    .sig-title {
      font-size: 8px;
      font-weight: 800;
      color: #0f172a;
      display: block;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .sig-subtitle {
      font-size: 7.5px;
      color: #64748b;
      display: block;
    }

    /* Seal Box */
    .seal-col {
      text-align: center;
    }
    .seal-box {
      display: inline-block;
      border: 1px dashed #94a3b8;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 7px;
      color: #94a3b8;
      font-weight: 800;
      letter-spacing: 0.8px;
    }

    /* Notice */
    .slip-notice {
      text-align: center;
      font-size: 6.5px;
      color: #94a3b8;
      margin-top: 2px;
    }

    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .font-bold {
      font-weight: 800;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .a4-sheet {
        height: 284mm;
      }
    }
  </style>
</head>
<body>
  <div class="a4-sheet">
    <!-- TOP HALF: PATIENT COPY -->
    ${renderReceiptSlip("PATIENT COPY", "#047857", "#ffffff", data)}

    <!-- PERFORATION DIVIDER -->
    <div class="cut-divider">
      <div class="cut-line"></div>
      <div class="cut-text">
        <span>✂</span>
        <span>CUT OR TEAR HERE · PATIENT COPY (TOP) / OFFICE COPY (BOTTOM)</span>
        <span>✂</span>
      </div>
      <div class="cut-line"></div>
    </div>

    <!-- BOTTOM HALF: OFFICE / CLINIC COPY -->
    ${renderReceiptSlip("OFFICE / CLINIC COPY", "#1e293b", "#ffffff", data)}
  </div>
</body>
</html>`;
}

/**
 * Open a dedicated print window with the 2-copy duplicate Money Receipt and trigger window.print()
 */
export function printReceiptWindow(data: ReceiptPdfData): void {
  const html = generateReceiptHtml(data);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  } else {
    // Fallback if popup blocker intercepted
    const blob = new Blob([html], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Money_Receipt_${data.patientName.replace(/\s+/g, "_")}_${data.invoiceNumber}.html`;
    link.click();
  }
}

/**
 * Download Money Receipt HTML file
 */
export function downloadReceiptPdf(data: ReceiptPdfData): void {
  printReceiptWindow(data);
}
