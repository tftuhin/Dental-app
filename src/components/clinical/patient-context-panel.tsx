"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, HeartPulse, History, AlertTriangle, UserRound } from "lucide-react";
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

  for (const a of allergies) {
    out.push(`Allergy: ${a}. Avoid this drug and cross-reacting drugs.`);
  }
  if (/penicillin|amoxicillin/.test(text)) {
    out.push("Penicillin allergy: check every antibiotic for cross-reactivity before prescribing.");
  }
  if (/diabet/.test(text)) {
    out.push("Diabetes: check blood sugar before surgery; expect slower healing and higher infection risk.");
  }
  if (/hypertens|blood pressure/.test(text)) {
    out.push("Hypertension: check BP before treatment; limit adrenaline in local anaesthetic.");
  }
  if (/cardiac|heart|valve|stent|angina/.test(text)) {
    out.push("Heart condition: consider whether antibiotic prophylaxis or a physician consult is needed.");
  }
  if (/warfarin|anticoag|aspirin|clopidogrel|bleeding/.test(text)) {
    out.push("Bleeding risk (anticoagulant/antiplatelet): check INR/bleeding before extraction or surgery.");
  }
  if (/bisphosphonate|osteoporosis/.test(text)) {
    out.push("Bisphosphonates: risk of osteonecrosis of the jaw. Minimise surgical trauma.");
  }
  if (/asthma/.test(text)) {
    out.push("Asthma: use NSAIDs and aspirin with caution; keep the inhaler available.");
  }
  if (/pregnan/.test(text)) {
    out.push("Pregnancy: avoid non-urgent X-rays; check every drug for pregnancy safety.");
  }
  if (/kidney|renal/.test(text)) {
    out.push("Kidney disease: adjust drug doses and avoid NSAIDs.");
  }
  if (/liver|hepat/.test(text)) {
    out.push("Liver disease: adjust or avoid drugs processed by the liver (e.g. paracetamol dose).");
  }
  return out;
}

interface PatientContextPanelProps {
  visit: ClinicalQueuePatient | null | undefined;
  /** Hide today's summary (e.g. on the notes screen, where it's being entered). */
  hideTodaySummary?: boolean;
  className?: string;
}

/** History, health issues and precautions, shown on every stage of the visit. */
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
  }, [visit?.id, visit?.patientId, visit?.patientRecordId]);

  if (!visit) return null;

  const allergies = Array.from(
    new Set([...(record?.allergies || []), ...(visit.alerts || [])].filter(Boolean))
  );
  const conditions = record?.medicalConditions || [];
  const precautions = derivePrecautions(allergies, conditions);
  // Previous visits only: leave out anything logged for today's visit
  const pastEvents = timeline.filter((e) => !e.id.includes(visit.id)).slice(0, 6);

  return (
    <div className={`space-y-3 ${className || ""}`}>
      <Card className="border shadow-xs">
        <CardHeader className="py-2.5 px-3.5 border-b bg-muted/20">
          <CardTitle className="text-xs font-bold flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5 text-primary" />
              {visit.patient}
            </span>
            {record ? (
              <Link
                href={`/patients/${record.id}`}
                className="text-[10px] font-semibold text-primary hover:underline"
              >
                Open profile
              </Link>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 text-xs space-y-1">
          <p className="text-muted-foreground">
            <span className="font-mono text-foreground">{visit.patientId}</span> · {visit.gender},{" "}
            {visit.age} yrs{record?.bloodGroup ? ` · Blood ${record.bloodGroup}` : ""}
          </p>
          <p className="text-muted-foreground">{visit.phone}</p>
          {!record && (
            <p className="text-amber-700 dark:text-amber-400 text-[11px]">
              No registry record linked to this visit. History may be incomplete.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Allergies & precautions */}
      <Card className="border border-red-200 dark:border-red-900 shadow-xs">
        <CardHeader className="py-2.5 px-3.5 border-b bg-red-50/60 dark:bg-red-950/30">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-red-800 dark:text-red-300">
            <ShieldAlert className="h-3.5 w-3.5" />
            Alerts & Precautions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 text-xs space-y-2">
          <div className="flex flex-wrap gap-1">
            {allergies.length === 0 ? (
              <span className="text-muted-foreground">No known allergies recorded.</span>
            ) : (
              allergies.map((a) => (
                <Badge key={a} className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-[10px]">
                  {a}
                </Badge>
              ))
            )}
          </div>
          {precautions.length > 0 && (
            <ul className="space-y-1">
              {precautions.map((p) => (
                <li key={p} className="flex gap-1.5 text-[11px] leading-snug">
                  <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Health issues */}
      <Card className="border shadow-xs">
        <CardHeader className="py-2.5 px-3.5 border-b bg-muted/20">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
            Medical History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 text-xs">
          {conditions.length === 0 ? (
            <span className="text-muted-foreground">No medical conditions recorded.</span>
          ) : (
            <ul className="list-disc pl-4 space-y-0.5">
              {conditions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Today's summary */}
      {!hideTodaySummary && (visit.chiefComplaint || visit.provisionalDiagnosis || visit.vitals) && (
        <Card className="border shadow-xs">
          <CardHeader className="py-2.5 px-3.5 border-b bg-muted/20">
            <CardTitle className="text-xs font-bold">Today&apos;s Visit</CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 text-xs space-y-1.5">
            {visit.chiefComplaint && (
              <p>
                <span className="font-semibold">Complaint:</span> {visit.chiefComplaint}
              </p>
            )}
            {visit.selectedSymptoms && visit.selectedSymptoms.length > 0 && (
              <p>
                <span className="font-semibold">Symptoms:</span> {visit.selectedSymptoms.join(", ")}
              </p>
            )}
            {visit.provisionalDiagnosis && (
              <p>
                <span className="font-semibold">Diagnosis:</span> {visit.provisionalDiagnosis}
              </p>
            )}
            {visit.vitals && (visit.vitals.bp || visit.vitals.pulse) && (
              <p className="text-muted-foreground">
                {[
                  visit.vitals.bp && `BP ${visit.vitals.bp}`,
                  visit.vitals.pulse && `Pulse ${visit.vitals.pulse}`,
                  visit.vitals.bloodSugar && `Sugar ${visit.vitals.bloodSugar}`,
                  visit.vitals.temp && `Temp ${visit.vitals.temp}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {visit.procedures && visit.procedures.length > 0 && (
              <p>
                <span className="font-semibold">Done today:</span>{" "}
                {visit.procedures.map((p) => p.name + (p.toothNumber ? ` (${p.toothNumber})` : "")).join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Previous visits */}
      <Card className="border shadow-xs">
        <CardHeader className="py-2.5 px-3.5 border-b bg-muted/20">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-primary" />
            Previous Visits
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 text-xs">
          {pastEvents.length === 0 ? (
            <span className="text-muted-foreground">No previous visits on record.</span>
          ) : (
            <ol className="space-y-2">
              {pastEvents.map((e) => (
                <li key={e.id} className="border-l-2 border-primary/30 pl-2">
                  <p className="font-semibold leading-tight">{e.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {e.date} · {e.doctor}
                  </p>
                  {e.provisionalDiagnosis && (
                    <p className="text-[11px] mt-0.5">Dx: {e.provisionalDiagnosis}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
