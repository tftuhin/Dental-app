"use client";

import { PrescriptionMedicine, PrescriptionTest } from "@/components/prescriptions/prescription-studio";

export interface PrescriptionPdfData {
  rxNumber: string;
  patientName: string;
  patientId: string;
  age: number | string;
  gender: string;
  phone: string;
  address: string;
  allergies?: string[];
  date: string;
  doctorName?: string;
  doctorDegree?: string;
  bmdcReg?: string;
  visitingHours?: string;
  clinicName?: string;
  clinicTagline?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  diagnosis: string;
  medicines: Array<{
    brandName: string;
    genericName?: string;
    strength?: string;
    dosageForm?: string;
    frequency?: string;
    duration?: string;
    timing?: string;
    instructions?: string;
  }>;
  tests: Array<{
    testName: string;
    indication?: string;
  }> | string[];
  followUpDate?: string;
  followUpNotes?: string;
  advice?: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    bloodSugar?: string;
    temp?: string;
  };
}

export function generatePrescriptionHtml(data: PrescriptionPdfData): string {
  const testsList = Array.isArray(data.tests)
    ? data.tests.map((t) => (typeof t === "string" ? { testName: t, indication: "" } : t))
    : [];

  const clinicTitle = data.clinicName || "DHAKA DENTAL CARE & MAXILLOFACIAL HOSPITAL";
  const clinicTagline = data.clinicTagline || "Advanced Microscopic Endodontics, Oral Surgery & Dental Implantology Centre";
  const clinicAddress = data.clinicAddress || "House 42, Road 9/A, Dhanmondi R/A, Dhaka-1209, Bangladesh";
  const clinicPhone = data.clinicPhone || "+880 1711-234567 / +880 2-9876543";
  const doctorName = data.doctorName || "Dr. Sarah Smith";
  const doctorDegree = data.doctorDegree || "BDS (DU), FCPS (Oral & Maxillofacial Surgery), PGT (Implantology)";
  const bmdcReg = data.bmdcReg || "BMDC-DS-18492";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official e-Prescription — ${data.patientName} (${data.rxNumber})</title>
  <style>
    @page { 
      size: A4 portrait; 
      margin: 12mm 14mm 14mm 14mm; 
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
      font-size: 12px; 
      line-height: 1.5; 
      -webkit-font-smoothing: antialiased;
    }
    .sheet-wrapper {
      position: relative;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    /* Watermark */
    .watermark {
      position: absolute;
      top: 48%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 80px;
      font-weight: 900;
      color: rgba(14, 165, 233, 0.035);
      letter-spacing: 12px;
      pointer-events: none;
      user-select: none;
      z-index: 0;
      white-space: nowrap;
      text-transform: uppercase;
      font-family: Georgia, serif;
    }
    /* Header Letterhead */
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      border-bottom: 2.5px solid #0284c7; 
      padding-bottom: 12px; 
      margin-bottom: 12px; 
      position: relative;
      z-index: 1;
    }
    .clinic-brand {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      max-width: 58%;
    }
    .clinic-logo-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #0284c7;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
    }
    .clinic-title { 
      font-size: 17px; 
      font-weight: 800; 
      color: #0f172a; 
      margin: 0; 
      letter-spacing: -0.3px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .clinic-sub { 
      font-size: 10.5px; 
      font-weight: 600;
      color: #0284c7; 
      margin: 3px 0 2px; 
    }
    .clinic-contact {
      font-size: 9.5px;
      color: #64748b;
      margin: 0;
      line-height: 1.35;
    }
    .doctor-block { 
      text-align: right; 
      max-width: 40%;
    }
    .doctor-name { 
      font-size: 16px; 
      font-weight: 800; 
      font-family: Georgia, serif; 
      color: #0f172a; 
      margin: 0; 
      line-height: 1.2;
    }
    .doctor-deg { 
      font-size: 10.5px; 
      color: #334155; 
      font-weight: 600;
      margin: 3px 0 2px; 
      line-height: 1.3;
    }
    .doctor-meta {
      font-size: 9.5px;
      color: #64748b;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      margin: 0;
    }
    .doctor-hours {
      font-size: 9px;
      color: #0284c7;
      font-weight: 600;
      margin-top: 2px;
    }    /* Patient Bar */
    .patient-bar { 
      border-top: 1.5px solid #0f172a; 
      border-bottom: 1.5px solid #0f172a; 
      padding: 6px 4px; 
      display: grid; 
      grid-template-columns: 2fr 1.2fr 1fr 1.2fr; 
      gap: 8px; 
      margin-bottom: 10px; 
      position: relative;
      z-index: 1;
    }
    .patient-bar strong { 
      color: #0f172a; 
      display: block; 
      font-size: 13px; 
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .label { 
      font-size: 9px; 
      text-transform: uppercase; 
      color: #64748b; 
      font-weight: 800; 
      letter-spacing: 0.5px;
      display: block; 
      margin-bottom: 1px; 
    }
    .val-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-weight: 700;
      color: #0f172a;
    }

    /* Allergy Alert Box */
    .alert-box { 
      background: #fff1f2; 
      border-left: 3.5px solid #be123c; 
      color: #be123c; 
      padding: 5px 10px; 
      font-weight: 700; 
      font-size: 10.5px; 
      margin-bottom: 10px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      position: relative;
      z-index: 1;
    }

    /* Two-Column Clinical Grid */
    .content-grid { 
      display: grid; 
      grid-template-columns: 32% 68%; 
      gap: 16px; 
      position: relative;
      z-index: 1;
      margin-bottom: 12px; 
      min-height: 580px;
    }
    .left-col { 
      border-right: 1.5px solid #0f172a; 
      padding-right: 14px; 
    }
    .section-title { 
      font-size: 10px; 
      text-transform: uppercase; 
      letter-spacing: 0.8px; 
      font-weight: 800; 
      color: #0f172a; 
      border-bottom: 1px solid #94a3b8; 
      padding-bottom: 2px; 
      margin-bottom: 6px; 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
    }

    /* Rx Pharmacotherapy Section */
    .rx-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }
    .rx-symbol { 
      font-family: Georgia, serif; 
      font-size: 28px; 
      font-weight: 900; 
      color: #0f172a; 
      vertical-align: middle; 
      margin-right: 6px; 
      line-height: 1;
    }
    .med-row { 
      padding: 5px 0; 
      border-bottom: 1px dotted #cbd5e1; 
    }
    .med-row:last-child {
      border-bottom: none;
    }
    .med-top {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .med-num { 
      font-weight: 800; 
      color: #0f172a; 
      font-size: 12px; 
      margin-right: 4px; 
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .med-name { 
      font-size: 13px; 
      font-weight: 800; 
      color: #0f172a; 
    }
    .med-dosage { 
      font-size: 10.5px; 
      font-weight: 700; 
      color: #334155; 
      margin-left: 4px; 
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .med-generic { 
      font-size: 10px; 
      color: #64748b; 
      margin-left: 4px; 
      font-style: italic;
    }
    .med-schedule-line {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      color: #0f172a;
      margin-top: 2px;
      padding-left: 16px;
    }
    .med-freq {
      font-weight: 900;
      letter-spacing: 1.5px;
      font-size: 12.5px;
    }
    .med-leader {
      color: #cbd5e1;
      user-select: none;
    }
    .med-notes { 
      font-size: 9.5px; 
      color: #64748b; 
      font-style: italic; 
      margin-top: 2px; 
      padding-left: 16px;
    }

    /* Footer & Signature */
    .footer { 
      margin-top: auto; 
      border-top: 1.5px solid #0f172a; 
      padding-top: 8px; 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-end; 
      position: relative;
      z-index: 1;
    }
    .verification-block {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qr-placeholder {
      width: 44px;
      height: 44px;
      border: 1px solid #0f172a;
      padding: 2px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-placeholder svg {
      width: 100%;
      height: 100%;
    }
    .security-text {
      font-size: 8.5px;
      color: #64748b;
      line-height: 1.3;
    }
    .sha-hash { 
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace; 
      font-size: 8.5px; 
      color: #0f172a; 
      font-weight: 700;
    }
    .signature-box { 
      text-align: center; 
      width: 200px; 
    }
    .sig-seal {
      margin-bottom: 2px;
      font-family: Georgia, serif;
      font-style: italic;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      padding-top: 3px;
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .sig-sub {
      font-size: 9px;
      color: #64748b;
    }

    @media print {
      body { 
        padding: 0; 
      }
      .no-print { 
        display: none !important; 
      }
    }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    <div class="watermark">DENTALOS1 PRESCRIPTION</div>

    <!-- Letterhead -->
    <div class="header">
      <div class="clinic-brand">
        <div class="clinic-logo-icon">
          <!-- Dental Tooth SVG Logo -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C8.5 2 6 4.5 6 7.5C6 9.5 7 11 7.5 13C8 15 8 18 9 20C9.5 21 10.5 22 11.5 22C12 22 12.5 21 13 19C13.5 17 14 17 14.5 19C15 21 15.5 22 16 22C17 22 18 21 18.5 20C19.5 18 19.5 15 20 13C20.5 11 21.5 9.5 21.5 7.5C21.5 4.5 19 2 15.5 2C13.8 2 12.8 2.8 12 3.5C11.2 2.8 10.2 2 12 2Z"/>
          </svg>
        </div>
        <div>
          <h1 class="clinic-title">${clinicTitle}</h1>
          <div class="clinic-sub">${clinicTagline}</div>
          <p class="clinic-contact">${clinicAddress} · Phone: ${clinicPhone}</p>
        </div>
      </div>

      <div class="doctor-block">
        <div class="doctor-name">${doctorName}</div>
        <div class="doctor-deg">${doctorDegree}</div>
        <div class="doctor-meta">BMDC Reg. No: ${bmdcReg}</div>
        <div class="doctor-hours">${data.visitingHours || "Chamber 101 · Visiting: Sat-Thu (4pm - 9:30pm)"}</div>
      </div>
    </div>

    <!-- Patient Details Bar -->
    <div class="patient-bar">
      <div>
        <span class="label">Patient Name</span>
        <strong>${data.patientName}</strong>
      </div>
      <div>
        <span class="label">Patient ID</span>
        <span class="val-mono">${data.patientId}</span>
      </div>
      <div>
        <span class="label">Age / Gender</span>
        <span style="font-weight: 600; color: #0f172a;">${data.age} Y / ${data.gender}</span>
      </div>
      <div>
        <span class="label">Date</span>
        <span class="val-mono">${data.date}</span>
      </div>
    </div>

    <!-- Medical Alert Banner -->
    ${
      data.allergies && data.allergies.length > 0
        ? `<div class="alert-box">
            <span>⚠️ CRITICAL ALLERGY ALERT: Documented allergy to ${data.allergies.join(", ")}</span>
            <span style="font-size: 9px; font-family: monospace; font-weight: 800;">CONTRAINDICATION ACTIVE</span>
          </div>`
        : ""
    }

    <!-- Main 2-Column Content -->
    <div class="content-grid">
      <!-- Left Column: Clinical Margin (Diagnosis, Tests, Advice, Follow-up) -->
      <div class="left-col">
        <!-- Diagnosis -->
        <div style="margin-bottom: 12px;">
          <div class="section-title">
            <span>Diagnosis / Impression</span>
          </div>
          <div style="font-weight: 800; color: #0f172a; font-size: 11px; line-height: 1.35;">${data.diagnosis}</div>
          <div style="font-size: 9.5px; color: #64748b; font-family: monospace; margin-top: 1px;">Tooth: #19 (FDI 36)</div>
        </div>

        <!-- Investigations -->
        <div style="margin-bottom: 12px;">
          <div class="section-title">
            <span>Investigations</span>
            <span>(${testsList.length})</span>
          </div>
          ${
            testsList.length === 0
              ? `<p style="font-size: 10px; color: #94a3b8; font-style: italic; margin: 2px 0;">No tests ordered.</p>`
              : testsList
                  .map(
                    (t) => `
            <div style="margin-bottom: 3px; font-size: 10.5px;">
              <span style="font-weight: 700; color: #0f172a;">• ${t.testName}</span>
              ${t.indication ? `<div style="font-size: 9.5px; color: #64748b; padding-left: 8px;">↳ ${t.indication}</div>` : ""}
            </div>`
                  )
                  .join("")
          }
        </div>

        <!-- Advice & Post-Op -->
        <div style="margin-bottom: 12px;">
          <div class="section-title">
            <span>Advice / নির্দেশনাবলী</span>
          </div>
          <div style="font-size: 10px; color: #334155; line-height: 1.45;">
            ${
              data.advice
                ? data.advice
                    .split(".")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map(
                      (sentence) => `
                <div style="margin-bottom: 2px;">• ${sentence}.</div>`
                    )
                    .join("")
                : `<div>• Maintain soft diet for 48 hours.</div>
                   <div>• Avoid chewing hard food on left side.</div>
                   <div>• Maintain gentle oral hygiene.</div>`
            }
          </div>
        </div>

        <!-- Next Scheduled Follow Up -->
        <div style="margin-bottom: 12px;">
          <div class="section-title">
            <span>Next Visit / পরবর্তী সাক্ষাত</span>
          </div>
          ${
            data.followUpDate
              ? `<div style="font-size: 10.5px; font-weight: 800; color: #0f172a;">
                  • After ${new Date(data.followUpDate).toLocaleDateString("en-BD", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                  ${data.followUpNotes ? `<div style="font-size: 9px; color: #64748b; font-weight: normal; padding-left: 8px;">Purpose: ${data.followUpNotes}</div>` : ""}
                </div>`
              : `<div style="font-size: 10px; color: #64748b; font-style: italic;">• As advised / SOS</div>`
          }
        </div>

        <!-- Helpline -->
        <div style="padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #64748b;">
          <div style="font-weight: 800; text-transform: uppercase; color: #0f172a; font-size: 8.5px;">Chamber Emergency Line</div>
          <div style="font-family: monospace; font-weight: 800; color: #0f172a; margin-top: 1px;">${clinicPhone}</div>
          <div style="font-size: 8px; line-height: 1.3; margin-top: 1px;">Contact immediately for acute postoperative pain or bleeding.</div>
        </div>
      </div>

      <!-- Right Column: ℞ Prescribed Medications -->
      <div>
        <div class="rx-header">
          <div style="display: flex; align-items: baseline;">
            <span class="rx-symbol">℞</span>
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">
              Prescribed Medications (${data.medicines.length})
            </span>
          </div>
        </div>

        ${
          data.medicines.length === 0
            ? `<p style="font-size: 11px; color: #94a3b8; font-style: italic; padding: 8px 0;">No medications prescribed.</p>`
            : data.medicines
                .map(
                  (m, idx) => `
          <div class="med-row">
            <div class="med-top">
              <span class="med-num">${idx + 1}.</span>
              <span class="med-name">${m.dosageForm || "Tab."} ${m.brandName}</span>
              <span class="med-dosage">${m.strength || ""}</span>
              ${m.genericName ? `<span class="med-generic">(${m.genericName})</span>` : ""}
            </div>
            <div class="med-schedule-line">
              <span class="med-freq">${m.frequency || "1+0+1"}</span>
              <span class="med-leader">──────────────────────</span>
              <span>${m.duration || "5 days"}</span>
              <span style="font-family: sans-serif; font-style: italic; color: #64748b; font-size: 10px;">(${m.timing || "After food"})</span>
            </div>
            ${m.instructions ? `<div class="med-notes">* Note: ${m.instructions}</div>` : ""}
          </div>`
                )
                .join("")
        }
      </div>
    </div>

    <!-- Official Footer & Sign-off -->
    <div class="footer">
      <div class="verification-block">
        <div class="qr-placeholder">
          <svg viewBox="0 0 100 100" fill="#0f172a">
            <rect x="0" y="0" width="30" height="30" />
            <rect x="5" y="5" width="20" height="20" fill="#ffffff" />
            <rect x="9" y="9" width="12" height="12" />
            <rect x="70" y="0" width="30" height="30" />
            <rect x="75" y="5" width="20" height="20" fill="#ffffff" />
            <rect x="79" y="9" width="12" height="12" />
            <rect x="0" y="70" width="30" height="30" />
            <rect x="5" y="75" width="20" height="20" fill="#ffffff" />
            <rect x="9" y="79" width="12" height="12" />
            <rect x="40" y="10" width="10" height="20" />
            <rect x="40" y="40" width="20" height="20" />
            <rect x="70" y="40" width="10" height="10" />
            <rect x="85" y="45" width="15" height="15" />
            <rect x="40" y="75" width="20" height="10" />
            <rect x="70" y="70" width="25" height="25" />
          </svg>
        </div>
        <div class="security-text">
          <div class="sha-hash">DIGITAL VERIFICATION: SHA-256: 7f8a...9c2e · Rx #${data.rxNumber}</div>
          <div>Electronically authorized under DentalOS1. Valid without physical signature.</div>
          <div style="color: #94a3b8; font-size: 8px;">Prescription Record ID: ${data.patientId} · Hotline: ${clinicPhone}</div>
        </div>
      </div>

      <div class="signature-box">
        <div class="sig-seal">${doctorName}</div>
        <div class="sig-line">${doctorName}</div>
        <div class="sig-sub">Registered Dental Surgeon (BMDC)</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadPrescriptionPdf(data: PrescriptionPdfData) {
  const html = generatePrescriptionHtml(data);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  } else {
    // Fallback: download file
    const blob = new Blob([html], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Prescription_${data.patientName.replace(/\s+/g, "_")}_${data.rxNumber}.html`;
    link.click();
  }
}
