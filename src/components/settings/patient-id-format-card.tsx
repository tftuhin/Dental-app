"use client";

import { useRef, useState } from "react";
import { IdCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClinicServicesSettings } from "@/lib/services-store";
import { getClinicSetup } from "@/lib/clinic-setup-store";
import { getAllPatients } from "@/lib/patients-store";
import {
  CUSTOM_METHOD,
  PATIENT_ID_METHODS,
  PATIENT_ID_TOKENS,
  clinicCodeOf,
  methodForPattern,
  nextPatientId,
  previewPatientId,
  validatePattern,
} from "@/lib/patient-id";

interface Props {
  settings: ClinicServicesSettings;
  updateSetting: <K extends keyof ClinicServicesSettings>(key: K, value: ClinicServicesSettings[K]) => void;
}

/** Settings → Services & Patient ID: choose how new patients are numbered. */
export function PatientIdFormatCard({ settings, updateSetting }: Props) {
  const [method, setMethod] = useState(() => methodForPattern(settings.patientIdPattern));
  const inputRef = useRef<HTMLInputElement>(null);

  const pattern = settings.patientIdPattern;
  const problems = validatePattern(pattern);
  const clinicName = getClinicSetup().name;
  const clinicCode = clinicCodeOf(settings.patientIdClinicCode, clinicName);
  const start = Math.max(1, parseInt(settings.patientIdSequenceStart, 10) || 1);
  const usesSeq = /\{SEQ:\d+\}/.test(pattern);

  // The real next ID, counting from the patients already registered
  const nextId =
    problems.length === 0
      ? nextPatientId(pattern, getAllPatients().map((p) => p.customId), {
          clinicCode,
          patientName: "Rahima Begum",
          phone: "+880 1711-234891",
        }, start)
      : "";

  const choose = (key: string) => {
    setMethod(key);
    const m = PATIENT_ID_METHODS.find((x) => x.key === key);
    if (m) updateSetting("patientIdPattern", m.pattern);
  };

  const insertToken = (token: string) => {
    const el = inputRef.current;
    const from = el?.selectionStart ?? pattern.length;
    const to = el?.selectionEnd ?? pattern.length;
    updateSetting("patientIdPattern", pattern.slice(0, from) + token + pattern.slice(to));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(from + token.length, from + token.length);
    });
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader className="border-b bg-muted/20 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <IdCard className="h-4 w-4 text-primary" />
          5. Patient ID format
        </CardTitle>
        <CardDescription className="text-xs">
          How new patients are numbered. Existing patients keep their IDs; the new format applies to patients registered after
          you save.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 text-xs sm:p-6">
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="ID method">
          {[...PATIENT_ID_METHODS, { key: CUSTOM_METHOD, name: "Your own format", pattern: "", description: "Build it from the parts below." }].map(
            (m) => {
              const active = method === m.key;
              const example = m.pattern ? previewPatientId(m.pattern, { clinicCode }, start) : "";
              return (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => (m.key === CUSTOM_METHOD ? setMethod(CUSTOM_METHOD) : choose(m.key))}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{m.name}</span>
                    {example && <span className="font-mono text-[11px] font-bold text-primary">{example}</span>}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{m.description}</span>
                </button>
              );
            }
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="patient-id-pattern" className="text-xs font-semibold">
                Format {method !== CUSTOM_METHOD && <span className="font-normal text-muted-foreground">(edit it to make your own)</span>}
              </Label>
              <Input
                id="patient-id-pattern"
                ref={inputRef}
                value={pattern}
                onChange={(e) => {
                  updateSetting("patientIdPattern", e.target.value);
                  setMethod(methodForPattern(e.target.value));
                }}
                className="h-8 font-mono text-xs font-semibold"
                aria-invalid={problems.length > 0}
              />
              <div className="flex flex-wrap gap-1">
                {PATIENT_ID_TOKENS.map((t) => (
                  <button
                    key={t.token}
                    type="button"
                    title={`${t.label}, e.g. ${t.example}`}
                    onClick={() => {
                      setMethod(CUSTOM_METHOD);
                      insertToken(t.token);
                    }}
                    className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] hover:border-primary hover:text-primary"
                  >
                    {t.token}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Click a part to insert it. Change the number inside {"{SEQ:5}"} or {"{RAND:6}"} to set its length. Anything else
                is printed as typed (letters, digits, - _ / .).
              </p>
            </div>

            {pattern.includes("{CLINIC}") && (
              <div className="space-y-1.5">
                <Label htmlFor="patient-id-clinic" className="text-xs font-semibold">
                  Clinic code
                </Label>
                <Input
                  id="patient-id-clinic"
                  value={settings.patientIdClinicCode}
                  onChange={(e) => updateSetting("patientIdClinicCode", e.target.value.toUpperCase().slice(0, 8))}
                  placeholder={clinicCodeOf("", clinicName)}
                  className="h-8 w-40 font-mono text-xs uppercase"
                />
                <p className="text-[10px] text-muted-foreground">Leave blank to use the clinic name&apos;s initials ({clinicCodeOf("", clinicName)}).</p>
              </div>
            )}

            {usesSeq && (
              <div className="space-y-1.5">
                <Label htmlFor="patient-id-start" className="text-xs font-semibold">
                  Start numbering at
                </Label>
                <Input
                  id="patient-id-start"
                  type="number"
                  min={1}
                  value={settings.patientIdSequenceStart}
                  onChange={(e) => updateSetting("patientIdSequenceStart", e.target.value)}
                  className="h-8 w-40 font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Used when no patient has an ID in this format yet. After that, numbers continue from the highest one used.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">Next patient ID</span>
              <div className="break-all font-mono text-xl font-black tracking-tight text-foreground sm:text-2xl">{nextId || "—"}</div>
              <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
                Example for a patient named Rahima Begum, phone ending 4891, registered today.
              </p>
            </div>
            {problems.length > 0 ? (
              <ul className="space-y-1 text-[11px] font-medium text-destructive">
                {problems.map((p) => (
                  <li key={p} className="flex items-start gap-1.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Never repeats an ID already in this clinic&apos;s records
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
