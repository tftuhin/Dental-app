// ============================================================
// DENTALOS1 — Printable consent form (A4)
// Clinic letterhead, patient details, the filled consent text, and
// signature blocks for the patient (or guardian), the doctor and a witness.
// ============================================================

export interface ConsentPrintData {
  consentNumber: string;
  title: string;
  /** Consent text with the placeholders already filled. */
  body: string;
  date: string;
  clinicName: string;
  clinicTagline?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicLicense?: string;
  logoUrl?: string;
  patientName: string;
  patientId: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
  guardianName?: string;
  doctorName: string;
  doctorDegree?: string;
  bmdcReg?: string;
}

const esc = (s: string) =>
  (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Plain text → paragraphs and bullet lists. */
function bodyHtml(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").filter((l) => l.trim());
      if (lines.length === 0) return "";
      const bullets = lines.filter((l) => /^\s*[-•]\s+/.test(l));
      if (bullets.length === lines.length) {
        return `<ul>${lines.map((l) => `<li>${esc(l.replace(/^\s*[-•]\s+/, ""))}</li>`).join("")}</ul>`;
      }
      // A lead-in line followed by bullets
      if (bullets.length > 0 && !/^\s*[-•]\s+/.test(lines[0]) && bullets.length === lines.length - 1) {
        return `<p>${esc(lines[0])}</p><ul>${lines
          .slice(1)
          .map((l) => `<li>${esc(l.replace(/^\s*[-•]\s+/, ""))}</li>`)
          .join("")}</ul>`;
      }
      return `<p>${lines.map(esc).join("<br/>")}</p>`;
    })
    .join("\n");
}

export function generateConsentHtml(d: ConsentPrintData): string {
  const logo = d.logoUrl ? `<img src="${esc(d.logoUrl)}" alt="" class="logo"/>` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${esc(d.title)} · ${esc(d.patientName)}</title>
<style>
  @page { size: A4; margin: 14mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", "Noto Sans Bengali", Arial, sans-serif; color: #111827; font-size: 11.5pt; line-height: 1.5; margin: 0; }
  .head { display: flex; align-items: center; gap: 14px; border-bottom: 3px double #0f766e; padding-bottom: 10px; }
  .logo { height: 56px; width: auto; }
  .clinic h1 { font-size: 18pt; margin: 0; color: #0f766e; letter-spacing: .3px; }
  .clinic p { margin: 1px 0; font-size: 9pt; color: #374151; }
  .meta { display: flex; justify-content: space-between; font-size: 9pt; color: #4b5563; margin: 8px 0 12px; }
  h2 { text-align: center; font-size: 14pt; margin: 6px 0 12px; text-transform: uppercase; letter-spacing: .6px; }
  .patient { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 16px; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 12px; font-size: 10pt; margin-bottom: 14px; }
  .patient b { color: #374151; font-weight: 600; }
  .body p { margin: 0 0 9px; text-align: justify; }
  .body ul { margin: 0 0 9px 18px; padding: 0; }
  .body li { margin-bottom: 2px; }
  .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 26px 40px; margin-top: 26px; page-break-inside: avoid; }
  .sign .line { border-bottom: 1px solid #111827; height: 44px; }
  .sign .who { font-weight: 600; margin-top: 4px; font-size: 10pt; }
  .sign .sub { font-size: 9pt; color: #4b5563; }
  .thumb { border: 1px dashed #9ca3af; height: 70px; width: 70px; display: inline-flex; align-items: flex-end; justify-content: center; font-size: 7.5pt; color: #6b7280; padding-bottom: 3px; float: right; margin-left: 10px; }
  .foot { margin-top: 18px; font-size: 8pt; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 6px; }
  @media print { .noprint { display: none; } }
</style>
</head>
<body>
  <div class="head">
    ${logo}
    <div class="clinic">
      <h1>${esc(d.clinicName)}</h1>
      ${d.clinicTagline ? `<p>${esc(d.clinicTagline)}</p>` : ""}
      <p>${esc([d.clinicAddress, d.clinicPhone].filter(Boolean).join(" · "))}</p>
      ${d.clinicLicense ? `<p>${esc(d.clinicLicense)}</p>` : ""}
    </div>
  </div>
  <div class="meta"><span>Consent No: <b>${esc(d.consentNumber)}</b></span><span>Date: <b>${esc(d.date)}</b></span></div>
  <h2>${esc(d.title)}</h2>
  <div class="patient">
    <div><b>Patient:</b> ${esc(d.patientName)}</div>
    <div><b>ID:</b> ${esc(d.patientId)}</div>
    <div><b>Age / Sex:</b> ${esc(d.age)} / ${esc(d.gender)}</div>
    <div><b>Phone:</b> ${esc(d.phone)}</div>
    <div style="grid-column: span 2"><b>Address:</b> ${esc(d.address)}</div>
  </div>
  <div class="body">${bodyHtml(d.body)}</div>
  <div class="signs">
    <div class="sign">
      <span class="thumb">Thumb</span>
      <div class="line"></div>
      <div class="who">Signature of patient${d.guardianName ? " / guardian" : ""}</div>
      <div class="sub">Name: ${esc(d.guardianName || d.patientName)}</div>
      <div class="sub">${d.guardianName ? "Relationship: ____________ · " : ""}Date: ____________</div>
    </div>
    <div class="sign">
      <div class="line"></div>
      <div class="who">Signature of doctor</div>
      <div class="sub">${esc(d.doctorName)}${d.doctorDegree ? `, ${esc(d.doctorDegree)}` : ""}</div>
      <div class="sub">${d.bmdcReg ? `BMDC Reg. ${esc(d.bmdcReg)} · ` : ""}Date: ____________</div>
    </div>
    <div class="sign">
      <div class="line"></div>
      <div class="who">Signature of witness</div>
      <div class="sub">Name: ______________________</div>
    </div>
    <div class="sign">
      <div class="line"></div>
      <div class="who">Interpreter (if used)</div>
      <div class="sub">Name: ______________________</div>
    </div>
  </div>
  <div class="foot">Keep the signed original in the patient's file. ${esc(d.clinicName)} · ${esc(d.consentNumber)}</div>
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 300); };</script>
</body>
</html>`;
}

/** Open the form in a new window and start printing. Returns false if pop-ups are blocked. */
export function printConsentWindow(d: ConsentPrintData): boolean {
  const win = window.open("", "_blank", "width=850,height=1100,menubar=no,toolbar=no,location=no,status=no");
  if (!win) return false;
  win.document.open();
  win.document.write(generateConsentHtml(d));
  win.document.close();
  return true;
}
