"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldAlert, HeartPulse, History, AlertTriangle, ClipboardList, ExternalLink } from "lucide-react";
import {
  ClinicalQueuePatient,
  PatientTimelineEvent,
  getPatientTimeline,
} from "@/lib/clinical-flow-store";
import { PatientProfile, getPatientById } from "@/lib/patients-store";

/**
 * Precautions derived from allergies and medical conditions.
 * These are reminders for the clinician to check, not clinical decisions.
 */
export function derivePrecautions(allergies: string[], conditions: string[]): string[] {
  const out: string[] = [];
  const text = [...allergies, ...conditions].join(" ").toLowerCase();

  if (/penicillin|amoxicillin/.test(text)) {
    out.push("Penicillin allergy: check every antibiotic for cross-reactivity.");
  }
  if (/diabet/.test(text)) {
    out.push("Diabetes: check blood sugar before surgery; expect slower healing.");
  }
  if (/hypertens|blood pressure/.test(text)) {
    out.push("Hypertension: check BP; limit adrenaline in local anaesthetic.");
  }
  if (/cardiac|heart|valve|stent|angina/.test(text)) {
    out.push("Heart condition: consider antibiotic prophylaxis or a physician consult.");
  }
  if (/warfarin|anticoag|aspirin|clopidogrel|bleeding/.test(text)) {
    out.push("Bleeding risk: check INR/bleeding before extraction or surgery.");
  }
  if (/bisphosphonate|osteoporosis/.test(text)) {
    out.push("Bisphosphonates: osteonecrosis risk. Minimise surgical trauma.");
  }
  if (/asthma/.test(text)) {
    out.push("Asthma: use NSAIDs and aspirin with caution; keep the inhaler available.");
  }
  if (/pregnan/.test(text)) {
    out.push("Pregnancy: avoid non-urgent X-rays; check drug safety.");
  }
  if (/kidney|renal/.test(text)) {
    out.push("Kidney disease: adjust doses and avoid NSAIDs.");
  }
  if (/liver|hepat/.test(text)) {
    out.push("Liver disease: adjust or avoid drugs processed by the liver.");
  }
  return out;
}

/**
 * Merge allergy lists from the patient record and the booking, dropping
 * near-duplicates such as "Penicillin (Severe Anaphylaxis)" and
 * "Penicillin Allergy (Severe Anaphylaxis)". The longer wording wins.
 */
export function mergeAllergies(...lists: string[][]): string[] {
  const key = (a: string) =>
    a
      .toLowerCase()
      .replace(/\b(allergy|allergic|to|sensitivity)\b/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const byKey = new Map<string, string>();
  for (const a of lists.flat().map((x) => x.trim()).filter(Boolean)) {
    const k = key(a);
    const existing = byKey.get(k);
    if (!existing || a.length > existing.length) byKey.set(k, a);
  }
  return [...byKey.values()];
}

interface PatientContextPanelProps {
  visit: ClinicalQueuePatient | null | undefined;
  /** Hide today's summary (e.g. on the notes screen, where it's being entered). */
  hideTodaySummary?: boolean;
  className?: string;
}

function SectionTitle({ icon: Icon, children, tone }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; tone?: "danger" }) {
  return (
    <h3
      className={`flex items-center gap-1.5 text-xs font-medium ${
        tone === "danger" ? "text-red-700 dark:text-red-400" : "text-muted-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </h3>
  );
}

/** History, health issues and precautions, shown on every clinical stage of the visit. */
export function PatientContextPanel({ visit, hideTodaySummary, className }: PatientContextPanelProps) {
  const [record, setRecord] = useState<PatientProfile | undefined>();
  const [timeline, setTimeline] = useState<PatientTimelineEvent[]>([]);

  useEffect(() => {
    if (!visit) return;
    const load = () => {
      setRecord(getPatientById(visit.patientRecordId || visit.patientId));
      setTimeline(getPatientTimeline(visit.patientId));
    };
    load();
    window.addEventListener("dentalos1-patients-updated", load);
    window.addEventListener("dentai-timeline-updated", load);
    return () => {
      window.removeEventListener("dentalos1-patients-updated", load);
      window.removeEventListener("dentai-timeline-updated", load);
    };
  // Reload only when a different visit or patient is shown
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visit?.id, visit?.patientId, visit?.patientRecordId]);

  if (!visit) return null;

  const allergies = mergeAllergies(record?.allergies || [], visit.alerts || []);
  const conditions = record?.medicalConditions || [];
  const precautions = derivePrecautions(allergies, conditions);
  // Previous visits only: leave out anything logged for today's visit
  const pastEvents = timeline.filter((e) => !e.id.includes(visit.id)).slice(0, 5);
  const vitals = visit.vitals
    ? [
        visit.vitals.bp && `BP ${visit.vitals.bp}`,
        visit.vitals.pulse && `Pulse ${visit.vitals.pulse}`,
        visit.vitals.bloodSugar && `RBS ${visit.vitals.bloodSugar}`,
        visit.vitals.temp && `Temp ${visit.vitals.temp}`,
      ].filter(Boolean)
    : [];
  const showToday =
    !hideTodaySummary &&
    (visit.chiefComplaint || visit.provisionalDiagnosis || vitals.length > 0 || (visit.procedures?.length ?? 0) > 0);

  return (
    <Card className={`gap-0 py-0 shadow-xs ${className || ""}`}>
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate">{visit.patient}</span>
          {record && (
            <Link
              href={`/patients/${record.id}`}
              className="inline-flex items-center gap-1 text-xs font-normal text-primary hover:underline shrink-0"
            >
              Profile
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          <span className="font-mono">{visit.patientId}</span> · {visit.gender}, {visit.age} yrs
          {record?.bloodGroup ? ` · ${record.bloodGroup}` : ""} · {visit.phone}
        </CardDescription>
        {!record && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            No registry record linked. History may be incomplete.
          </p>
        )}
      </CardHeader>

      <CardContent className="px-4 py-3 space-y-3 text-sm">
        {/* Allergies & precautions */}
        <section className="space-y-2">
          <SectionTitle icon={ShieldAlert} tone={allergies.length > 0 ? "danger" : undefined}>
            Allergies & precautions
          </SectionTitle>
          {allergies.length === 0 ? (
            <p className="text-xs text-muted-foreground">No known allergies.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {allergies.map((a) => (
                <Badge key={a} variant="destructive" className="h-auto whitespace-normal text-left font-normal">
                  {a}
                </Badge>
              ))}
            </div>
          )}
          {precautions.length > 0 && (
            <ul className="space-y-1">
              {precautions.map((p) => (
                <li key={p} className="flex gap-1.5 text-xs leading-snug">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-px" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator />

        {/* Health issues */}
        <section className="space-y-1.5">
          <SectionTitle icon={HeartPulse}>Medical history</SectionTitle>
          {conditions.length === 0 ? (
            <p className="text-xs text-muted-foreground">None recorded.</p>
          ) : (
            <ul className="list-disc pl-4 space-y-0.5 text-xs">
              {conditions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </section>

        {showToday && (
          <>
            <Separator />
            <section className="space-y-1.5 text-xs">
              <SectionTitle icon={ClipboardList}>Today</SectionTitle>
              {visit.chiefComplaint && (
                <p>
                  <span className="text-muted-foreground">Complaint:</span> {visit.chiefComplaint}
                </p>
              )}
              {visit.provisionalDiagnosis && (
                <p>
                  <span className="text-muted-foreground">Diagnosis:</span> {visit.provisionalDiagnosis}
                </p>
              )}
              {vitals.length > 0 && <p className="text-muted-foreground">{vitals.join(" · ")}</p>}
              {visit.procedures && visit.procedures.length > 0 && (
                <p>
                  <span className="text-muted-foreground">Done:</span>{" "}
                  {visit.procedures.map((p) => p.name + (p.toothNumber ? ` (${p.toothNumber})` : "")).join(", ")}
                </p>
              )}
            </section>
          </>
        )}

        <Separator />

        {/* Previous visits */}
        <section className="space-y-2">
          <SectionTitle icon={History}>Previous visits</SectionTitle>
          {pastEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No previous visits on record.</p>
          ) : (
            <ol className="space-y-2">
              {pastEvents.map((e) => (
                <li key={e.id} className="border-l-2 border-border pl-2.5 text-xs">
                  <p className="font-medium leading-tight">{e.title}</p>
                  <p className="text-muted-foreground">
                    {e.date} · {e.doctor.split(",")[0]}
                  </p>
                  {e.provisionalDiagnosis && <p className="mt-0.5">Dx: {e.provisionalDiagnosis}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
