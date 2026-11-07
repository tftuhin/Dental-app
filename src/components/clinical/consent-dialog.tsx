"use client";

import { useMemo, useState } from "react";
import { FileSignature, Printer, ShieldCheck, Ban, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClinicalQueuePatient, VisitConsent } from "@/lib/clinical-flow-store";
import { ConsentKind, fillConsentText, templatesFor, type ConsentValues } from "@/lib/consent-store";
import { printConsentWindow } from "@/lib/consent-pdf-generator";
import { getClinicSetup } from "@/lib/clinic-setup-store";
import { getPatientById } from "@/lib/patients-store";
import { getActiveCatalog } from "@/lib/procedures-catalog-store";
import { formatBDT } from "@/lib/currency";

const ANAESTHESIA = [
  "Local anaesthesia (2% lignocaine with adrenaline)",
  "Local anaesthesia (articaine)",
  "Topical anaesthesia only",
  "No anaesthesia",
  "Conscious sedation",
  "General anaesthesia",
];

export interface ConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The visit, with the latest notes (diagnosis, target tooth) from the session. */
  visit: ClinicalQueuePatient;
  defaultKind?: ConsentKind;
  /** Both signatures confirmed: carry on to treatment. */
  onSigned: (consent: VisitConsent) => void;
  /** The patient refused: the consent record says so. */
  onDeclined?: (consent: VisitConsent) => void;
}

/** Remounts each time it opens, so the form starts fresh from the visit. */
export function ConsentDialog(props: ConsentDialogProps) {
  if (!props.open) return null;
  return <ConsentDialogInner {...props} />;
}

function ConsentDialogInner({ open, onOpenChange, visit, defaultKind = "procedure", onSigned, onDeclined }: ConsentDialogProps) {
  const record = useMemo(() => getPatientById(visit.patientRecordId || visit.patientId), [visit.patientRecordId, visit.patientId]);
  const clinic = useMemo(() => getClinicSetup(), []);
  const doctorName = visit.doctor?.split(",")[0]?.trim() || visit.doctor || "";
  const doctor = clinic.doctors?.find((d) => d.name === doctorName);

  const [kind, setKind] = useState<ConsentKind>(defaultKind);
  const templates = useMemo(() => templatesFor(kind), [kind]);
  const [templateId, setTemplateId] = useState(() => templatesFor(defaultKind)[0]?.id || "");
  const template = templates.find((t) => t.id === templateId) || templates[0];

  const catalog = useMemo(
    () => getActiveCatalog().filter((c) => c.category === "procedure" || c.category === "surgery"),
    []
  );
  const [procedure, setProcedure] = useState(() => {
    const planned = (visit.procedures || []).map((p) => p.name).join(", ");
    return planned || visit.service || "";
  });
  const [teeth, setTeeth] = useState(visit.examinationFindings?.targetTooth || "");
  const [anaesthesia, setAnaesthesia] = useState(ANAESTHESIA[0]);
  const [cost, setCost] = useState("");
  const [guardian, setGuardian] = useState("");
  const [editedText, setEditedText] = useState<string | null>(null);
  const [printed, setPrinted] = useState(false);
  const [patientSigned, setPatientSigned] = useState(false);
  const [doctorSigned, setDoctorSigned] = useState(false);

  const isMinor = (visit.age || record?.age || 0) > 0 && (visit.age || record?.age || 0) < 18;
  const today = new Date().toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" });

  const values: ConsentValues = {
    patient_name: visit.patient,
    patient_id: visit.patientId,
    age: String(visit.age || record?.age || ""),
    gender: visit.gender || record?.gender || "",
    phone: visit.phone || record?.phone || "",
    address: visit.address || record?.address || "",
    guardian_name: guardian,
    procedure,
    teeth,
    diagnosis: visit.provisionalDiagnosis || "",
    anaesthesia,
    estimated_cost: cost,
    allergies: (record?.allergies || []).join(", ") || "None known",
    medical_conditions: (record?.medicalConditions || []).join(", ") || "None reported",
    doctor_name: doctorName,
    doctor_degree: doctor?.degree || "",
    doctor_bmdc: doctor?.bmdcReg || "",
    clinic_name: clinic.name,
    clinic_address: clinic.address,
    clinic_phone: clinic.phone,
    date: today,
  };
  const filled = template ? fillConsentText(template.body, values) : "";
  const text = editedText ?? filled;

  const pickProcedure = (name: string) => {
    setProcedure(name);
    const item = catalog.find((c) => c.name === name);
    if (item) {
      if (!cost) setCost(formatBDT(item.price));
      if (item.category === "surgery") setKind("surgery");
    }
  };

  const consentNumber = useMemo(() => {
    const day = (visit.date || "").replace(/-/g, "") || new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `CNS-${day}-${String(visit.fifoSerial || 0).padStart(3, "0")}-${(visit.consents?.length || 0) + 1}`;
  }, [visit.date, visit.fifoSerial, visit.consents?.length]);

  const handlePrint = () => {
    if (!template) return;
    if (!procedure.trim()) {
      toast.error("Enter the planned procedure or surgery first.");
      return;
    }
    const ok = printConsentWindow({
      consentNumber,
      title: template.title,
      body: text,
      date: today,
      clinicName: clinic.name,
      clinicTagline: clinic.tagline,
      clinicAddress: clinic.address,
      clinicPhone: clinic.phone,
      clinicLicense: clinic.bmdcLicense,
      logoUrl: clinic.logoUrl,
      patientName: visit.patient,
      patientId: visit.patientId,
      age: values.age || "",
      gender: values.gender || "",
      phone: values.phone || "",
      address: values.address || "",
      guardianName: guardian || undefined,
      doctorName,
      doctorDegree: doctor?.degree,
      bmdcReg: doctor?.bmdcReg,
    });
    if (!ok) {
      toast.error("The browser blocked the print window. Allow pop-ups for this site and try again.");
      return;
    }
    setPrinted(true);
  };

  const buildConsent = (status: VisitConsent["status"]): VisitConsent => ({
    id: `cns-${Date.now()}`,
    consentNumber,
    templateId: template?.id || "",
    title: template?.title || "Consent",
    kind,
    procedureName: procedure.trim(),
    teeth: teeth.trim() || undefined,
    text,
    guardianName: guardian.trim() || undefined,
    printedAt: printed ? new Date().toISOString() : undefined,
    signedByPatient: patientSigned,
    signedByDoctor: doctorSigned,
    status,
    recordedAt: new Date().toISOString(),
    doctor: visit.doctor,
  });

  const canConfirm = printed && patientSigned && doctorSigned && !!procedure.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <FileSignature className="h-5 w-5 text-primary" />
            Consent before {kind === "surgery" ? "surgery" : "procedure"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {visit.patient} ({visit.patientId}). Print the form, have the {isMinor ? "guardian" : "patient"} and the doctor sign it,
            then confirm below to send the patient on.
          </DialogDescription>
        </DialogHeader>

        {templates.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            No consent forms are switched on. Add or enable one in Settings → Consent Forms.
          </p>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Going to</Label>
                <div className="flex gap-1" role="radiogroup">
                  {(["procedure", "surgery"] as ConsentKind[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={kind === k}
                      onClick={() => {
                        setKind(k);
                        setTemplateId(templatesFor(k)[0]?.id || "");
                        setEditedText(null);
                      }}
                      className={`flex-1 rounded-md border px-3 py-1.5 font-semibold ${
                        kind === k ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                      }`}
                    >
                      {k === "procedure" ? "Procedure" : "Surgery"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Consent form</Label>
                <Select
                  value={template?.id || ""}
                  onValueChange={(v) => {
                    setTemplateId(v);
                    setEditedText(null);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold">Planned {kind} *</Label>
                <Input
                  list="consent-procedures"
                  value={procedure}
                  onChange={(e) => pickProcedure(e.target.value)}
                  placeholder="e.g. Root Canal Treatment — Molar"
                  className="h-8 text-xs"
                />
                <datalist id="consent-procedures">
                  {catalog.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tooth / site</Label>
                <Input value={teeth} onChange={(e) => setTeeth(e.target.value)} placeholder="#36" className="h-8 font-mono text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Estimated cost</Label>
                <Input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="৳ 8,500" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Anaesthesia</Label>
                <Select value={anaesthesia} onValueChange={setAnaesthesia}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANAESTHESIA.map((a) => (
                      <SelectItem key={a} value={a} className="text-xs">
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Guardian {isMinor ? "*" : "(if the patient is a minor)"}</Label>
                <Input value={guardian} onChange={(e) => setGuardian(e.target.value)} placeholder="Parent or guardian's name" className="h-8 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{template?.title}</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 text-[11px]"
                  onClick={() => setEditedText(editedText === null ? filled : null)}
                >
                  <Pencil className="h-3 w-3" />
                  {editedText === null ? "Edit wording for this patient" : "Undo edits"}
                </Button>
              </div>
              {editedText === null ? (
                <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 leading-relaxed">{filled}</div>
              ) : (
                <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="min-h-56 text-xs leading-relaxed" />
              )}
            </div>

            <div className="rounded-lg border bg-muted/20 p-3">
              <Button type="button" size="sm" variant={printed ? "outline" : "default"} className="gap-1.5 text-xs" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" />
                {printed ? "Print again" : "Print consent form"}
              </Button>
              <div className={`mt-3 space-y-2 ${printed ? "" : "opacity-50"}`}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    disabled={!printed}
                    checked={patientSigned}
                    onChange={(e) => setPatientSigned(e.target.checked)}
                  />
                  {isMinor || guardian ? "Guardian" : "Patient"} has signed the printed form
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    disabled={!printed}
                    checked={doctorSigned}
                    onChange={(e) => setDoctorSigned(e.target.checked)}
                  />
                  {doctorName || "The doctor"} has signed the printed form
                </label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {onDeclined ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-destructive"
              disabled={!template || !procedure.trim()}
              onClick={() => onDeclined(buildConsent("declined"))}
            >
              <Ban className="h-3.5 w-3.5" />
              Patient declined
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              disabled={!canConfirm || (isMinor && !guardian.trim())}
              onClick={() => onSigned(buildConsent("signed"))}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Signed: send to {kind === "surgery" ? "surgery" : "procedure"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
