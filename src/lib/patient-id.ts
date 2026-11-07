// ============================================================
// DENTALOS1 — Patient ID formats
// A format is a pattern of fixed text and tokens, e.g. "DENT-{YYYY}-{SEQ:5}".
// The clinic picks a ready-made method or writes its own pattern in
// Settings → Services & Patient ID.
//
// Numbering ({SEQ:n}) continues from the highest number already used by an ID
// with the same date part, so a format with {YY} restarts every year, one with
// {MM} every month and one with {DD} every day. Patient-specific parts
// (initials, phone) don't restart it: numbers keep counting across patients.
// ============================================================

export interface PatientIdToken {
  token: string;
  label: string;
  example: string;
}

export const PATIENT_ID_TOKENS: PatientIdToken[] = [
  { token: "{SEQ:5}", label: "Running number (digits = width)", example: "00042" },
  { token: "{YYYY}", label: "Year", example: "2026" },
  { token: "{YY}", label: "Year, 2 digits", example: "26" },
  { token: "{MM}", label: "Month", example: "11" },
  { token: "{DD}", label: "Day", example: "08" },
  { token: "{CLINIC}", label: "Clinic code", example: "DDC" },
  { token: "{INIT}", label: "Patient's initials", example: "RB" },
  { token: "{PHONE4}", label: "Last 4 digits of phone", example: "4891" },
  { token: "{RAND:6}", label: "Random letters/digits (digits = length)", example: "7KQ2XA" },
];

export interface PatientIdMethod {
  key: string;
  name: string;
  pattern: string;
  description: string;
}

export const PATIENT_ID_METHODS: PatientIdMethod[] = [
  {
    key: "compound",
    name: "Compound (prefix + year + number)",
    pattern: "DENT-{YYYY}-{SEQ:5}",
    description: "The current format. Numbering restarts each year.",
  },
  { key: "serial", name: "Simple running number", pattern: "{SEQ:6}", description: "One number for every patient, never restarts." },
  {
    key: "clinic-serial",
    name: "Clinic code + number",
    pattern: "{CLINIC}-{SEQ:5}",
    description: "Useful when you have more than one branch.",
  },
  {
    key: "year-month",
    name: "Year + month + number",
    pattern: "{YY}{MM}-{SEQ:4}",
    description: "Shows when the patient registered. Numbering restarts each month.",
  },
  {
    key: "date",
    name: "Date + daily number",
    pattern: "{YY}{MM}{DD}-{SEQ:3}",
    description: "Registration date plus that day's count. Restarts every day.",
  },
  {
    key: "initials",
    name: "Initials + number",
    pattern: "{INIT}-{SEQ:5}",
    description: "Patient's initials, with one running number for everyone.",
  },
  {
    key: "phone",
    name: "Phone digits + number",
    pattern: "P{PHONE4}-{SEQ:4}",
    description: "Last 4 digits of the patient's phone, easy to say over the phone.",
  },
  {
    key: "random",
    name: "Random code",
    pattern: "PT-{RAND:6}",
    description: "Unguessable code. No running number.",
  },
];

export const CUSTOM_METHOD = "custom";

/** The method whose pattern matches, or "custom". */
export function methodForPattern(pattern: string): string {
  return PATIENT_ID_METHODS.find((m) => m.pattern === pattern)?.key || CUSTOM_METHOD;
}

export interface PatientIdContext {
  now?: Date;
  clinicCode?: string;
  patientName?: string;
  phone?: string;
}

const RAND_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

export function initialsOf(name = ""): string {
  const words = name
    .replace(/^(dr|mr|mrs|ms|md|mst|mohammad|muhammad)\.?\s+/i, "")
    .split(/\s+/)
    .filter((w) => /[a-z]/i.test(w));
  const init = words.map((w) => w.match(/[a-z]/i)![0].toUpperCase()).join("").slice(0, 3);
  return init || "XX";
}

/** Clinic code: the one set in settings, else the initials of the clinic's name. */
export function clinicCodeOf(code: string | undefined, clinicName = ""): string {
  const clean = (code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (clean) return clean;
  return (
    clinicName
      .split(/\s+/)
      .filter((w) => /^[a-z]/i.test(w) && !/^(and|of|the|&)$/i.test(w))
      .map((w) => w[0].toUpperCase())
      .join("")
      .slice(0, 4) || "CL"
  );
}

function fixedValues(ctx: PatientIdContext): Record<string, string> {
  const now = ctx.now || new Date();
  const yyyy = String(now.getFullYear());
  const digits = (ctx.phone || "").replace(/\D/g, "");
  return {
    YYYY: yyyy,
    YY: yyyy.slice(-2),
    MM: String(now.getMonth() + 1).padStart(2, "0"),
    DD: String(now.getDate()).padStart(2, "0"),
    CLINIC: clinicCodeOf(ctx.clinicCode),
    INIT: initialsOf(ctx.patientName),
    PHONE4: digits.length >= 4 ? digits.slice(-4) : "0000",
  };
}

const TOKEN_RE = /\{(YYYY|YY|MM|DD|CLINIC|INIT|PHONE4|SEQ:(\d{1,2})|RAND:(\d{1,2}))\}/g;

/** Problems with a pattern, or [] when it can be used. */
export function validatePattern(pattern: string): string[] {
  const problems: string[] = [];
  const p = pattern.trim();
  if (!p) return ["Enter a format."];
  if (p.length > 40) problems.push("Keep the format under 40 characters.");
  const seqs = p.match(/\{SEQ:\d{1,2}\}/g) || [];
  const rands = p.match(/\{RAND:\d{1,2}\}/g) || [];
  if (seqs.length + rands.length === 0) problems.push("Add {SEQ:5} or {RAND:6} so every patient gets a different ID.");
  if (seqs.length > 1) problems.push("Use {SEQ} only once.");
  for (const m of p.matchAll(/\{SEQ:(\d+)\}|\{RAND:(\d+)\}/g)) {
    const n = Number(m[1] || m[2]);
    if (n < 1 || n > 10) problems.push("Number widths must be 1 to 10.");
  }
  if (rands.some((r) => Number(r.match(/\d+/)![0]) < 4) && seqs.length === 0) {
    problems.push("A random code needs at least 4 characters to stay unique.");
  }
  const unknown = p.replace(TOKEN_RE, "").match(/\{[^}]*\}/g);
  if (unknown) problems.push(`Unknown part: ${unknown.join(", ")}`);
  if (/[^A-Za-z0-9\-_/.{}: ]/.test(p.replace(TOKEN_RE, ""))) problems.push("Use only letters, digits and - _ / . in fixed text.");
  return [...new Set(problems)];
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The next free ID for `pattern`, given the IDs already in use.
 * `sequenceStart` is the first number used when no ID of this kind exists yet.
 */
export function nextPatientId(
  pattern: string,
  existingIds: string[],
  ctx: PatientIdContext = {},
  sequenceStart = 1
): string {
  const fixed = fixedValues(ctx);
  const taken = new Set(existingIds);
  const seqWidth = Number(pattern.match(/\{SEQ:(\d+)\}/)?.[1] || 0);

  // Regex for IDs of this kind: date parts fixed, patient parts and random parts free
  let reSource = "";
  let last = 0;
  for (const m of pattern.matchAll(TOKEN_RE)) {
    reSource += escapeRe(pattern.slice(last, m.index));
    const tok = m[1];
    if (tok.startsWith("SEQ")) reSource += "(\\d+)";
    else if (tok.startsWith("RAND")) reSource += "[A-Z0-9]+";
    else if (tok === "INIT") reSource += "[A-Z]{1,3}";
    else if (tok === "PHONE4") reSource += "\\d{4}";
    else reSource += escapeRe(fixed[tok]);
    last = m.index + m[0].length;
  }
  reSource += escapeRe(pattern.slice(last));
  const re = new RegExp(`^${reSource}$`);

  let seq = Math.max(1, sequenceStart);
  if (seqWidth > 0) {
    for (const id of existingIds) {
      const m = id.match(re);
      if (m && m[1]) seq = Math.max(seq, parseInt(m[1], 10) + 1);
    }
  }

  const render = (n: number) =>
    pattern.replace(TOKEN_RE, (_, tok: string, w?: string, r?: string) => {
      if (w) return String(n).padStart(Number(w), "0");
      if (r) {
        let out = "";
        for (let i = 0; i < Number(r); i++) out += RAND_CHARS[Math.floor(Math.random() * RAND_CHARS.length)];
        return out;
      }
      return fixed[tok];
    });

  // Never hand out an ID that's already used
  for (let attempt = 0; attempt < 1000; attempt++) {
    const id = render(seq + (seqWidth > 0 ? attempt : 0));
    if (!taken.has(id)) return id;
  }
  return `${render(seq)}-${Date.now().toString(36).toUpperCase()}`;
}

/** What the next ID would look like, for the settings preview (no lookups). */
export function previewPatientId(pattern: string, ctx: PatientIdContext = {}, sequenceStart = 1): string {
  return nextPatientId(pattern, [], { patientName: "Rahima Begum", phone: "+880 1711-234891", ...ctx }, sequenceStart);
}
