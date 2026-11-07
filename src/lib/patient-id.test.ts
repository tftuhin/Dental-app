import { describe, expect, it } from "vitest";
import { PATIENT_ID_METHODS, clinicCodeOf, initialsOf, methodForPattern, nextPatientId, validatePattern } from "./patient-id";

const now = new Date(2026, 10, 8); // 8 Nov 2026
const ctx = { now, clinicCode: "DDC", patientName: "Rahima Begum", phone: "+880 1711-234891" };

describe("patient ID formats", () => {
  it("keeps the current compound format as the default method", () => {
    expect(PATIENT_ID_METHODS[0].pattern).toBe("DENT-{YYYY}-{SEQ:5}");
    expect(nextPatientId("DENT-{YYYY}-{SEQ:5}", [], ctx, 42)).toBe("DENT-2026-00042");
  });

  it("continues from the highest ID of the same kind", () => {
    const ids = ["DENT-2026-00007", "DENT-2026-00012", "DENT-2025-00099", "OTHER-1"];
    expect(nextPatientId("DENT-{YYYY}-{SEQ:5}", ids, ctx)).toBe("DENT-2026-00013");
  });

  it("restarts numbering per day for a date format", () => {
    const ids = ["261107-001", "261107-002", "261108-001"];
    expect(nextPatientId("{YY}{MM}{DD}-{SEQ:3}", ids, ctx)).toBe("261108-002");
  });

  it("keeps one running number across patients for initials and phone formats", () => {
    expect(nextPatientId("{INIT}-{SEQ:5}", ["KU-00004", "RB-00002"], ctx)).toBe("RB-00005");
    expect(nextPatientId("P{PHONE4}-{SEQ:4}", ["P1111-0009"], ctx)).toBe("P4891-0010");
  });

  it("uses the clinic code", () => {
    expect(nextPatientId("{CLINIC}-{SEQ:5}", [], ctx)).toBe("DDC-00001");
    expect(clinicCodeOf("", "Dhaka Dental Care & Maxillofacial Hospital")).toBe("DDCM");
    expect(clinicCodeOf("br-2", "x")).toBe("BR2");
  });

  it("makes random codes without repeating a taken one", () => {
    const id = nextPatientId("PT-{RAND:6}", [], ctx);
    expect(id).toMatch(/^PT-[A-Z2-9]{6}$/);
  });

  it("skips an ID that is already used", () => {
    expect(nextPatientId("{SEQ:3}", ["005"], ctx, 5)).toBe("006");
  });

  it("reads initials sensibly", () => {
    expect(initialsOf("Md. Karim Uddin")).toBe("KU");
    expect(initialsOf("Rahima Begum")).toBe("RB");
    expect(initialsOf("")).toBe("XX");
  });

  it("rejects formats that can't give unique IDs", () => {
    expect(validatePattern("DENT-{YYYY}")[0]).toContain("{SEQ:5}");
    expect(validatePattern("{SEQ:3}-{SEQ:3}")).toContain("Use {SEQ} only once.");
    expect(validatePattern("A-{FOO}-{SEQ:4}").join()).toContain("{FOO}");
    expect(validatePattern("A#{SEQ:4}").join()).toContain("letters, digits");
    for (const m of PATIENT_ID_METHODS) expect(validatePattern(m.pattern)).toEqual([]);
  });

  it("recognises a ready-made method from its pattern", () => {
    expect(methodForPattern("{SEQ:6}")).toBe("serial");
    expect(methodForPattern("X-{SEQ:6}")).toBe("custom");
  });
});
