"use client";

import { useState } from "react";
import { FileSignature, ShieldCheck, AlertTriangle, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClinicalQueuePatient, VisitConsent, logPatientActivity, updateVisit } from "@/lib/clinical-flow-store";
import { useClinicalModules } from "@/lib/clinical-modules-store";
import { getClinicSetup } from "@/lib/clinic-setup-store";
import { printConsentWindow } from "@/lib/consent-pdf-generator";
import { ConsentDialog } from "./consent-dialog";

/** Saves a consent on the visit and notes it on the patient's timeline. */
export function recordConsent(visit: ClinicalQueuePatient, consent: VisitConsent): ClinicalQueuePatient | undefined {
  const updated = updateVisit(visit.id, { consents: [...(visit.consents || []), consent] });
  logPatientActivity({
    id: `ev-${visit.id}-${consent.id}`,
    patientId: visit.patientId,
    date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
    timestamp: Date.now(),
    type: "clinical_procedure",
    title: `${consent.status === "signed" ? "Consent signed" : "Consent declined"}: ${consent.procedureName}`,
    doctor: visit.doctor,
    targetTooth: consent.teeth,
    clinicalNotes: `${consent.title} (${consent.consentNumber})`,
    badge: consent.status === "signed" ? "Consent" : "Declined",
    badgeColor:
      consent.status === "signed"
        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  });
  return updated;
}

/** Reprint a consent exactly as it was signed. */
export function reprintConsent(visit: ClinicalQueuePatient, consent: VisitConsent) {
  const clinic = getClinicSetup();
  const doctorName = consent.doctor?.split(",")[0]?.trim() || consent.doctor;
  const doctor = clinic.doctors?.find((d) => d.name === doctorName);
  const ok = printConsentWindow({
    consentNumber: consent.consentNumber,
    title: consent.title,
    body: consent.text,
    date: new Date(consent.recordedAt).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" }),
    clinicName: clinic.name,
    clinicTagline: clinic.tagline,
    clinicAddress: clinic.address,
    clinicPhone: clinic.phone,
    clinicLicense: clinic.bmdcLicense,
    logoUrl: clinic.logoUrl,
    patientName: visit.patient,
    patientId: visit.patientId,
    age: String(visit.age || ""),
    gender: visit.gender,
    phone: visit.phone,
    address: visit.address,
    guardianName: consent.guardianName,
    doctorName,
    doctorDegree: doctor?.degree,
    bmdcReg: doctor?.bmdcReg,
  });
  if (!ok) toast.error("The browser blocked the print window. Allow pop-ups for this site and try again.");
}

/**
 * On the Procedure page: shows the signed consent for this visit, or asks for
 * one when the patient arrived without it (e.g. sent here before consent was switched on).
 */
export function ConsentStatus({
  visit,
  onUpdated,
}: {
  visit: ClinicalQueuePatient;
  onUpdated: (visit: ClinicalQueuePatient) => void;
}) {
  const modules = useClinicalModules();
  const [open, setOpen] = useState(false);
  const signed = (visit.consents || []).filter((c) => c.status === "signed");
  const latest = signed[signed.length - 1];

  if (!modules.consentForms && !latest) return null;

  if (latest) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>
            <b>Consent signed</b> for {latest.procedureName}
            {latest.teeth ? ` (${latest.teeth})` : ""} · {latest.title} · {latest.consentNumber}
          </span>
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-7 gap-1 bg-background text-[11px]" onClick={() => reprintConsent(visit, latest)}>
            <Printer className="h-3 w-3" />
            Reprint
          </Button>
          {modules.consentForms && (
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setOpen(true)}>
              Another consent
            </Button>
          )}
        </div>
        <ConsentDialog
          open={open}
          onOpenChange={setOpen}
          visit={visit}
          onSigned={(c) => {
            setOpen(false);
            const updated = recordConsent(visit, c);
            if (updated) onUpdated(updated);
            toast.success("Consent saved.");
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        No signed consent for this visit yet. Print the consent form and have it signed before starting treatment.
      </span>
      <Button size="sm" className="h-7 gap-1 text-[11px]" onClick={() => setOpen(true)}>
        <FileSignature className="h-3 w-3" />
        Get consent
      </Button>
      <ConsentDialog
        open={open}
        onOpenChange={setOpen}
        visit={visit}
        onSigned={(c) => {
          setOpen(false);
          const updated = recordConsent(visit, c);
          if (updated) onUpdated(updated);
          toast.success("Consent signed. You can start the treatment.");
        }}
        onDeclined={(c) => {
          setOpen(false);
          const updated = recordConsent(visit, c);
          if (updated) onUpdated(updated);
          toast.warning("The patient's refusal is saved on the visit.");
        }}
      />
    </div>
  );
}
