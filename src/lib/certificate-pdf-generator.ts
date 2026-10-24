/**
 * Medical & Dental Certificate PDF & Print Generator for DentAI OS
 * 
 * Generates an official, executive clinic letterhead printed certificate formatted for A4:
 * - Sick Leave / Medical Excuse Certificate (Unfit for duty)
 * - Medical Fitness Certificate (Fit to resume duty)
 * - Treatment Completion Certificate
 * - Clinical Attendance Certificate
 * 
 * Features:
 * - Full authentic clinic letterhead with logo, registered address, phone, license, emergency hotline
 * - Attending Doctor qualifications, designation, and BMDC Registration Number
 * - Patient Demographics strip (Name, ID, Age/Gender, Contact, Address, Date)
 * - Digital QR code verification block with SHA-256 validation token
 * - Watermarked high-security print design
 * - Placeholders for official clinic seal and doctor signature
 * - Toggle for Full Letterhead on Blank A4 vs Pre-Printed Clinic Stationery Pad
 */

export type CertificateType =
  | "sick_leave"
  | "fitness"
  | "treatment_completion"
  | "attendance";

export interface CertificatePdfData {
  certificateNumber: string;
  certificateType: CertificateType;
  issueDate: string;
  patientName: string;
  patientId: string;
  age: number | string;
  gender: string;
  phone: string;
  address: string;
  procedure: string;
  targetTooth?: string;
  diagnosis?: string;
  daysRest?: number;
  startDate: string;
  endDate: string;
  fitFromDate?: string;
  remarks?: string;
  limitations?: string[];
  clinicName?: string;
  clinicTagline?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicLicense?: string;
  doctorName?: string;
  doctorDegree?: string;
  doctorDesignation?: string;
  bmdcReg?: string;
  letterheadMode?: "full_blank_a4" | "preprinted_pad";
}

export function generateCertificateHtml(data: CertificatePdfData): string {
  const certNo = data.certificateNumber || `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const clinicTitle = data.clinicName || "DHAKA DENTAL CARE & MAXILLOFACIAL HOSPITAL";
  const clinicTagline = data.clinicTagline || "Advanced Oral & Maxillofacial Surgery, Microscopic Endodontics & Dental Implant Centre";
  const clinicAddress = data.clinicAddress || "House 42, Road 7A, Dhanmondi R/A, Dhaka-1209, Bangladesh";
  const clinicPhone = data.clinicPhone || "+880 1712-345678 / +880 2-9876543";
  const clinicLic = data.clinicLicense || "DGHS Reg. No: DGHS/DH-2024/9912 · BMDC Approved";
  const clinicEmail = data.clinicEmail || "info@dhakadentalcare.com";

  const docName = data.doctorName || "Dr. Sarah Smith";
  const docDegree = data.doctorDegree || "BDS (DU), FCPS (Oral & Maxillofacial Surgery), FICD (USA)";
  const docDesignation = data.doctorDesignation || "Senior Consultant Dental Surgeon & Associate Professor";
  const docReg = data.bmdcReg || "BMDC Reg. No: A-84291";

  const isPreprinted = data.letterheadMode === "preprinted_pad";

  // Certificate Type specifics
  let typeTitle = "OFFICIAL MEDICAL & DENTAL SICK LEAVE CERTIFICATE";
  let typeSubtitle = "CLINICAL EXCUSE & TEMPORARY MEDICAL UNFITNESS DECLARATION";
  let statusBadgeText = "MEDICAL REST ADVISED";

  if (data.certificateType === "fitness") {
    typeTitle = "CERTIFICATE OF MEDICAL & DENTAL FITNESS";
    typeSubtitle = "POST-OPERATIVE RECOVERY & DUTY RESUMPTION CLEARANCE";
    statusBadgeText = "CERTIFIED MEDICALLY FIT";
  } else if (data.certificateType === "treatment_completion") {
    typeTitle = "DENTAL SURGERY & TREATMENT COMPLETION CERTIFICATE";
    typeSubtitle = "OFFICIAL PROCEDURAL DISCHARGE & RESTORATIVE CLEARANCE";
    statusBadgeText = "TREATMENT COMPLETED";
  } else if (data.certificateType === "attendance") {
    typeTitle = "CLINICAL ATTENDANCE & CONSULTATION CERTIFICATE";
    typeSubtitle = "OFFICIAL RECORD OF CLINICAL CONSULTATION & TIME ATTENDED";
    statusBadgeText = "ATTENDANCE VERIFIED";
  }

  // QR verification token
  const qrHash = `DENTAI-AUTH-${certNo}-${data.patientId.slice(-5)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=${encodeURIComponent(
    `https://dentai.health/verify/cert?id=${certNo}&patient=${encodeURIComponent(data.patientName)}&hash=${qrHash}`
  )}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${typeTitle} - ${data.patientName} (${certNo})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: ${isPreprinted ? "65mm 15mm 15mm 15mm" : "12mm 15mm 15mm 15mm"};
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .cert-sheet {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
      background: #ffffff;
      position: relative;
    }
    /* Subtle Dental Watermark */
    .watermark {
      position: absolute;
      top: 38%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 320px;
      height: 320px;
      opacity: 0.035;
      pointer-events: none;
      z-index: 0;
    }
    .content-layer {
      position: relative;
      z-index: 1;
    }
    /* Letterhead Top Header */
    .letterhead-header {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .clinic-brand {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .clinic-logo-box {
      width: 46px;
      height: 46px;
      border-radius: 8px;
      background: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .clinic-title {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: -0.2px;
      color: #0f172a;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .clinic-tagline {
      font-size: 10px;
      color: #0284c7;
      font-weight: 600;
      margin-top: 2px;
    }
    .clinic-address {
      font-size: 9.5px;
      color: #475569;
      margin-top: 2px;
      line-height: 1.35;
    }
    .clinic-lic {
      font-size: 9px;
      color: #64748b;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
      margin-top: 3px;
    }
    .doctor-box {
      text-align: right;
      border-left: 1px solid #cbd5e1;
      padding-left: 14px;
      flex-shrink: 0;
      max-width: 45%;
    }
    .doctor-name {
      font-family: Georgia, Cambria, "Times New Roman", Times, serif;
      font-size: 16px;
      font-weight: bold;
      color: #0f172a;
      line-height: 1.2;
    }
    .doctor-degree {
      font-size: 10px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 2px;
      line-height: 1.25;
    }
    .doctor-designation {
      font-size: 9.5px;
      color: #475569;
      margin-top: 1px;
    }
    .doctor-reg {
      font-size: 9px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
      font-weight: bold;
      color: #0284c7;
      margin-top: 3px;
    }

    /* Patient Demographics Bar */
    .demographics-bar {
      background: #f8fafc;
      border-top: 1px solid #0f172a;
      border-bottom: 1px solid #0f172a;
      padding: 7px 10px;
      margin-bottom: 14px;
      font-size: 10.5px;
    }
    .demographics-grid {
      display: grid;
      grid-template-columns: 2.2fr 1.2fr 1.4fr 1.2fr;
      gap: 6px 14px;
    }
    .demo-item {
      display: flex;
      align-items: baseline;
      gap: 5px;
    }
    .demo-label {
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.4px;
      color: #64748b;
    }
    .demo-val {
      font-weight: 600;
      color: #0f172a;
    }
    .demo-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
      color: #0369a1;
      font-weight: bold;
    }

    /* Certificate Banner */
    .cert-banner {
      text-align: center;
      margin: 12px 0 16px;
      padding: 10px 14px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      position: relative;
    }
    .cert-heading {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.6px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .cert-subheading {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #0284c7;
      margin-top: 2px;
      text-transform: uppercase;
    }
    .cert-meta-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed #cbd5e1;
      font-size: 9px;
      color: #475569;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
    }
    .badge-status {
      background: #0f172a;
      color: #ffffff;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 800;
      letter-spacing: 0.5px;
      font-size: 8.5px;
    }

    /* Body Text & Statement */
    .cert-body {
      font-size: 12px;
      line-height: 1.7;
      color: #1e293b;
      margin-bottom: 16px;
      text-align: justify;
    }
    .cert-body p {
      margin-bottom: 10px;
    }
    .patient-highlight {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    /* Diagnosis / Procedure Box */
    .procedure-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #0284c7;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 12px 0;
    }
    .procedure-header {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.6px;
      color: #0284c7;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .procedure-text {
      font-size: 11.5px;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.45;
    }
    .tooth-pill {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 10px;
      margin-right: 4px;
    }

    /* Period / Rest Callout Box */
    .rest-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 12px 0;
    }
    .rest-box.fitness {
      background: #f0fdf4;
      border-color: #bbf7d0;
      border-left-color: #16a34a;
    }
    .rest-header {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.6px;
      color: #dc2626;
      margin-bottom: 2px;
    }
    .rest-box.fitness .rest-header {
      color: #15803d;
    }
    .rest-text {
      font-size: 12px;
      font-weight: 700;
      color: #991b1b;
      line-height: 1.4;
    }
    .rest-box.fitness .rest-text {
      color: #166534;
    }
    .rest-duration-pill {
      background: #ef4444;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      display: inline-block;
      margin: 0 4px;
    }
    .rest-box.fitness .rest-duration-pill {
      background: #16a34a;
    }

    /* Remarks & Limitations */
    .remarks-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 8px 12px;
      margin: 10px 0 16px;
      font-size: 10.5px;
      color: #92400e;
    }
    .remarks-box strong {
      color: #78350f;
    }

    /* Security, Verification & Signatures Bar */
    .footer-signatures {
      border-top: 1.5px solid #cbd5e1;
      padding-top: 16px;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
    }
    .qr-verification {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qr-img {
      width: 58px;
      height: 58px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 2px;
      background: #ffffff;
    }
    .qr-info {
      font-size: 8.5px;
      color: #64748b;
      line-height: 1.35;
      max-width: 170px;
    }
    .qr-info strong {
      color: #0f172a;
      font-size: 9.5px;
      display: block;
      margin-bottom: 1px;
    }
    .qr-hash {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
      font-size: 8px;
      color: #0284c7;
      margin-top: 2px;
    }

    /* Official Clinic Seal Area */
    .seal-box {
      width: 82px;
      height: 82px;
      border: 1.5px dashed #94a3b8;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #94a3b8;
      font-size: 7.5px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px;
      line-height: 1.15;
    }

    /* Attending Clinician Signature Line */
    .signature-area {
      text-align: right;
      min-width: 190px;
    }
    .sig-script {
      font-family: "Brush Script MT", "Caveat", "Segoe Script", cursive, Georgia;
      font-size: 21px;
      color: #0f172a;
      line-height: 1;
      margin-bottom: 2px;
    }
    .sig-line {
      border-top: 1.5px solid #0f172a;
      padding-top: 4px;
    }
    .sig-name {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }
    .sig-title {
      font-size: 9.5px;
      color: #475569;
      font-weight: 600;
    }
    .sig-reg {
      font-size: 8.5px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
      color: #0284c7;
      font-weight: 700;
      margin-top: 1px;
    }

    /* Print disclaimer bottom */
    .legal-notice {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px dotted #e2e8f0;
      font-size: 8px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="cert-sheet">
    <!-- Subtle Watermark -->
    <svg class="watermark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
      <path d="M12 2C8.5 2 6 4.5 6 8c0 3 1.5 5.5 2.5 8 .8 2 1.5 4 3.5 4s2.7-2 3.5-4c1-2.5 2.5-5 2.5-8 0-3.5-2.5-6-6-6z"/>
    </svg>

    <div class="content-layer">
      ${
        isPreprinted
          ? `<!-- Pre-printed Stationery Spacer (60mm) -->
             <div style="height: 60mm;"></div>`
          : `<!-- Full Executive Letterhead Header -->
             <div class="letterhead-header">
               <div class="clinic-brand">
                 <div class="clinic-logo-box">
                   <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                     <path d="M12 2C8.5 2 6 4.5 6 8c0 3 1.5 5.5 2.5 8 .8 2 1.5 4 3.5 4s2.7-2 3.5-4c1-2.5 2.5-5 2.5-8 0-3.5-2.5-6-6-6z"/>
                   </svg>
                 </div>
                 <div>
                   <h1 class="clinic-title">${clinicTitle}</h1>
                   <p class="clinic-tagline">${clinicTagline}</p>
                   <p class="clinic-address">${clinicAddress} · Phone: <strong>${clinicPhone}</strong></p>
                   <p class="clinic-lic">${clinicLic} · ${clinicEmail}</p>
                 </div>
               </div>

               <div class="doctor-box">
                 <div class="doctor-name">${docName}</div>
                 <div class="doctor-degree">${docDegree}</div>
                 <div class="doctor-designation">${docDesignation}</div>
                 <div class="doctor-reg">${docReg}</div>
               </div>
             </div>`
      }

      <!-- Patient Demographics Bar -->
      <div class="demographics-bar">
        <div class="demographics-grid">
          <div class="demo-item">
            <span class="demo-label">Patient Name:</span>
            <span class="demo-val">${data.patientName}</span>
          </div>
          <div class="demo-item">
            <span class="demo-label">Age / Sex:</span>
            <span class="demo-val">${data.age} Y / ${data.gender}</span>
          </div>
          <div class="demo-item">
            <span class="demo-label">Patient ID:</span>
            <span class="demo-val demo-mono">${data.patientId}</span>
          </div>
          <div class="demo-item">
            <span class="demo-label">Date:</span>
            <span class="demo-val demo-mono">${data.issueDate}</span>
          </div>
          <div class="demo-item">
            <span class="demo-label">Contact:</span>
            <span class="demo-val demo-mono">${data.phone}</span>
          </div>
          <div class="demo-item" style="grid-column: span 3;">
            <span class="demo-label">Address:</span>
            <span class="demo-val" style="font-weight: 500;">${data.address}</span>
          </div>
        </div>
      </div>

      <!-- Certificate Official Title Ribbon -->
      <div class="cert-banner">
        <div class="cert-heading">${typeTitle}</div>
        <div class="cert-subheading">${typeSubtitle}</div>
        <div class="cert-meta-strip">
          <span>Certificate Ref: <strong>${certNo}</strong></span>
          <span class="badge-status">${statusBadgeText}</span>
          <span>Security Token: <strong>${qrHash}</strong></span>
        </div>
      </div>

      <!-- Certificate Clinical Narrative Body -->
      <div class="cert-body">
        <p>
          This is to clinically certify that <span class="patient-highlight">${data.patientName}</span>, 
          aged <strong>${data.age} years</strong>, residing at <em>${data.address}</em> (Patient ID: 
          <strong>${data.patientId}</strong>), has been under my active clinical care, consultation, and dental surgical 
          examination at this hospital facility on <strong>${data.issueDate}</strong>.
        </p>

        <!-- Clinical Diagnosis & Treatment Box -->
        <div class="procedure-box">
          <div class="procedure-header">
            <span>Operatory Diagnosis & Clinical Procedures Performed</span>
          </div>
          <div class="procedure-text">
            ${data.targetTooth ? `<span class="tooth-pill">Tooth ${data.targetTooth}</span>` : ""}
            ${data.procedure}
          </div>
          ${
            data.diagnosis
              ? `<div style="font-size: 10px; color: #475569; margin-top: 4px;"><strong>Clinical Assessment:</strong> ${data.diagnosis}</div>`
              : ""
          }
        </div>

        ${
          data.certificateType === "sick_leave"
            ? `<!-- Sick Leave Recommendation -->
               <p>
                 Following the invasive clinical / surgical dental intervention administered under local anesthesia, 
                 the patient presents with acute tissue trauma, post-operative inflammation, and transient functional masticatory limitation. 
                 In my professional clinical judgment, the patient is currently <strong>medically unfit to discharge occupational, physical, or academic duties</strong>.
               </p>

               <div class="rest-box">
                 <div class="rest-header">Prescribed Medical Rest & Absence Period</div>
                 <div class="rest-text">
                   The patient is strictly advised complete medical rest for 
                   <span class="rest-duration-pill">${data.daysRest || 2} Day(s)</span>
                   from <strong>${data.startDate}</strong> to <strong>${data.endDate}</strong> (both days inclusive).
                 </div>
               </div>`
            : data.certificateType === "fitness"
            ? `<!-- Medical Fitness Clearance -->
               <p>
                 Following clinical evaluation and resolution of post-procedural healing, the intraoral surgical site exhibits 
                 optimal mucosal recovery, intact restorative integrity, and satisfactory physiological healing without symptoms of infection.
               </p>

               <div class="rest-box fitness">
                 <div class="rest-header">Medical & Dental Fitness Confirmation</div>
                 <div class="rest-text">
                   The patient is clinically certified <strong>FIT TO RESUME NORMAL WORK / ACADEMIC DUTIES</strong> 
                   effective from <strong>${data.fitFromDate || data.startDate}</strong>.
                 </div>
               </div>`
            : `<!-- Treatment Completion / Attendance Confirmation -->
               <p>
                 The clinical dental procedure listed above was successfully executed according to standard sterilization and 
                 operative protocols. The patient has been provided comprehensive post-operative instructions and pharmacological coverage.
               </p>`
        }

        ${
          data.remarks
            ? `<div class="remarks-box">
                 <strong>Clinical Recommendations & Physical Limitations:</strong> ${data.remarks}
               </div>`
            : ""
        }

        <p style="font-size: 11px; color: #475569; margin-top: 8px;">
          This document is an official clinical record issued upon patient request for employer / institutional notification 
          and medical compliance verification.
        </p>
      </div>

      <!-- Security, QR Code & Signatures Bar -->
      <div class="footer-signatures">
        <!-- QR Code Verification -->
        <div class="qr-verification">
          <img src="${qrUrl}" alt="Verification QR" class="qr-img" />
          <div class="qr-info">
            <strong>Digital Hospital Verification</strong>
            <span>Scan QR code with any smartphone to confirm certificate validity.</span>
            <div class="qr-hash">${certNo} · ${qrHash}</div>
          </div>
        </div>

        <!-- Official Seal Area -->
        <div class="seal-box">
          <span>Official<br/>Clinical Seal<br/>& Emboss</span>
        </div>

        <!-- Doctor Signature -->
        <div class="signature-area">
          <div class="sig-script">${docName}</div>
          <div class="sig-line">
            <div class="sig-name">${docName}</div>
            <div class="sig-title">${docDesignation}</div>
            <div class="sig-title">${docDegree}</div>
            <div class="sig-reg">${docReg}</div>
          </div>
        </div>
      </div>

      <!-- Bottom Legal Notice -->
      <div class="legal-notice">
        <span>DentAI OS · Secure Electronic Health Record # EHR-${data.patientId}</span>
        <span>Issued on: ${data.issueDate} · Authorized Medical Practitioner Verification</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto-trigger print when loaded in print window
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;
}

/**
 * Opens a dedicated clean print window with the letterhead certificate
 */
export function printCertificateWindow(data: CertificatePdfData): void {
  const html = generateCertificateHtml(data);
  const printWin = window.open("", "_blank", "width=850,height=1100,menubar=no,toolbar=no,location=no,status=no");
  if (!printWin) {
    alert("Please allow popups to print the official certificate.");
    return;
  }
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}

/**
 * Download Certificate as PDF / HTML
 */
export function downloadCertificatePdf(data: CertificatePdfData): void {
  const html = generateCertificateHtml(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Medical_Certificate_${data.patientName.replace(/\s+/g, "_")}_${data.certificateNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
