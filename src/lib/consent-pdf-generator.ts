// ============================================================
// DENTALOSBD — Printable consent form (A4)
// Clinic letterhead, patient details, the filled consent text, and
// signature blocks for the patient (or guardian) and the doctor.
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

/** The form as a full HTML page. With `autoPrint`, the print dialog opens once it has loaded. */
export function generateConsentHtml(d: ConsentPrintData, { autoPrint = true }: { autoPrint?: boolean } = {}): string {
  const logo = d.logoUrl ? `<img src="${esc(d.logoUrl)}" alt="" class="logo"/>` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${esc(d.title)} · ${esc(d.patientName)}</title>
<style>
  /* One A4 page: 10 mm top/bottom, 12 mm sides leaves 277 x 186 mm */
  @page { size: A4; margin: 10mm 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: "Segoe UI", "Noto Sans Bengali", Arial, sans-serif; color: #111827; font-size: 10.5pt; line-height: 1.4; }
  .page { width: 186mm; margin: 0 auto; }
  .head { display: flex; align-items: center; gap: 1em; border-bottom: 3px double #0f766e; padding-bottom: .5em; }
  .logo { height: 4.2em; width: auto; }
  .clinic h1 { font-size: 1.55em; margin: 0; color: #0f766e; letter-spacing: .3px; line-height: 1.2; }
  .clinic p { margin: 0; font-size: .8em; color: #374151; }
  .meta { display: flex; justify-content: space-between; font-size: .82em; color: #4b5563; margin: .45em 0 .3em; }
  h2 { text-align: center; font-size: 1.2em; margin: .2em 0 .55em; text-transform: uppercase; letter-spacing: .5px; }
  .patient { display: grid; grid-template-columns: repeat(3, 1fr); gap: .15em 1.2em; border: 1px solid #d1d5db; border-radius: 5px; padding: .4em .8em; font-size: .9em; margin-bottom: .7em; }
  .patient b { color: #374151; font-weight: 600; }
  .body p { margin: 0 0 .5em; text-align: justify; }
  .body ul { margin: 0 0 .5em 1.4em; padding: 0; }
  .body li { margin-bottom: .05em; }
  .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 4em; margin-top: 1.2em; break-inside: avoid; }
  .sign .line { border-bottom: 1px solid #111827; height: 2.8em; }
  .sign .who { font-weight: 600; margin-top: .25em; font-size: .9em; }
  .sign .sub { font-size: .8em; color: #4b5563; }
  .foot { margin-top: .9em; font-size: .72em; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: .3em; }
</style>
</head>
<body>
<div class="page" id="page">
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
      <div class="line"></div>
      <div class="who">Signature of patient${d.guardianName ? " / guardian" : ""}</div>
      <div class="sub">Name: ${esc(d.guardianName || d.patientName)}</div>
      <div class="sub">${d.guardianName ? "Relationship: ________ · " : ""}Date: __________</div>
    </div>
    <div class="sign">
      <div class="line"></div>
      <div class="who">Signature of doctor</div>
      <div class="sub">${esc(d.doctorName)}${d.doctorDegree ? `, ${esc(d.doctorDegree)}` : ""}</div>
      <div class="sub">${d.bmdcReg ? `BMDC Reg. ${esc(d.bmdcReg)} · ` : ""}Date: __________</div>
    </div>
  </div>
  <div class="foot">Keep the signed original in the patient's file. ${esc(d.clinicName)} · ${esc(d.consentNumber)}</div>
</div>
<script>
  // Shrink the text until the whole form fits on one A4 page (the wording is editable, so its length varies)
  (function () {
    var page = document.getElementById("page");
    var maxHeight = (277 / 25.4) * 96;
    var size = 10.5;
    while (page.scrollHeight > maxHeight && size > 7) {
      size -= 0.25;
      document.body.style.fontSize = size + "pt";
    }
  })();
  ${autoPrint ? 'window.onload = function () { setTimeout(function () { window.print(); }, 300); };' : ""}
</script>
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
