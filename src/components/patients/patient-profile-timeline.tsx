"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  Stethoscope,
  Pill,
  Receipt,
  FileText,
  Calendar,
  AlertTriangle,
  FileCheck,
  Eye,
  Download,
  ExternalLink,
  Activity,
  Heart,
  Droplet,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
} from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import {
  PatientTimelineEvent,
  ClinicalSessionFile,
  getPatientTimeline,
} from "@/lib/clinical-flow-store";
import { downloadPrescriptionPdf } from "@/lib/prescription-pdf-generator";

interface PatientProfileTimelineProps {
  patientCustomId: string;
  patientName: string;
}

export function PatientProfileTimeline({
  patientCustomId,
  patientName,
}: PatientProfileTimelineProps) {
  const [events, setEvents] = useState<PatientTimelineEvent[]>([]);
  const [selectedFile, setSelectedFile] = useState<ClinicalSessionFile | null>(null);
  // Events are initially collapsed per user requirement
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadEvents = () => {
      const list = getPatientTimeline(patientCustomId);
      setEvents(list);
    };

    loadEvents();

    const handleSync = () => {
      loadEvents();
    };

    window.addEventListener("dentai-timeline-updated", handleSync);
    window.addEventListener("dentai-appointments-updated", handleSync);

    return () => {
      window.removeEventListener("dentai-timeline-updated", handleSync);
      window.removeEventListener("dentai-appointments-updated", handleSync);
    };
  }, [patientCustomId]);

  const toggleEvent = (id: string) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedEventIds(new Set(events.map((e) => e.id)));
  };

  const collapseAll = () => {
    setExpandedEventIds(new Set());
  };

  const getEventIcon = (type: PatientTimelineEvent["type"]) => {
    switch (type) {
      case "clinical_procedure":
        return Stethoscope;
      case "prescription":
        return Pill;
      case "invoice":
        return Receipt;
      case "appointment":
        return Calendar;
      default:
        return FileText;
    }
  };

  const handleDownloadPrescriptionPdf = (ev: PatientTimelineEvent) => {
    downloadPrescriptionPdf({
      rxNumber: ev.prescriptionPdfDoc?.rxNumber || "RX-" + ev.id.slice(-6),
      patientName: patientName,
      patientId: patientCustomId,
      age: 34,
      gender: "Female",
      phone: "+880 1712-345678",
      address: "House 42, Road 7A, Dhanmondi, Dhaka",
      date: ev.date,
      doctorName: ev.doctor,
      diagnosis: ev.provisionalDiagnosis || "Clinical Dental Consultation & Operatory Care",
      medicines: ev.prescribedMedicines || [],
      tests: ev.labProcedures || [],
      advice: "Take medications strictly as instructed. Maintain oral hygiene and return for next follow-up appointment.",
    });
  };

  return (
    <Card className="border shadow-sm p-6 bg-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Comprehensive Clinical History & Procedure Timeline
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Retains complete daily clinical briefing, operatory procedures, uploaded radiographs/PDFs, tests, prescriptions, and billing logs
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {events.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={expandedEventIds.size === events.length ? collapseAll : expandAll}
              className="h-7 text-xs font-medium gap-1.5 border-border hover:bg-muted"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              {expandedEventIds.size === events.length ? "Collapse All" : "Expand All"}
            </Button>
          )}
          <Badge variant="outline" className="text-xs font-mono">
            {events.length} Historical Records
          </Badge>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground space-y-2">
          <Clock className="h-8 w-8 mx-auto opacity-30" />
          <p className="text-xs">No clinical encounter or procedure logs found for this patient yet.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-primary/20 ml-3.5 space-y-6 pb-4">
          {events.map((ev) => {
            const Icon = getEventIcon(ev.type);
            const isExpanded = expandedEventIds.has(ev.id);

            return (
              <div key={ev.id} className="relative pl-6">
                {/* Timeline node icon */}
                <div className="absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-primary text-primary shadow-sm">
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="rounded-xl border bg-card hover:shadow-md transition-all p-5 space-y-4">
                  {/* Event Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm text-foreground">{ev.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.badgeColor}`}>
                          {ev.badge}
                        </span>
                        {ev.targetTooth && (
                          <Badge variant="secondary" className="text-[10px] font-mono flex items-center gap-1">
                            <ToothIcon className="h-3 w-3 text-primary" />
                            {ev.targetTooth}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Provider: <strong className="text-foreground">{ev.doctor}</strong> {ev.chair ? `· ${ev.chair}` : ""}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      <span className="text-xs font-medium text-muted-foreground">{ev.date}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEvent(ev.id)}
                        className={`h-7 px-2.5 text-xs font-semibold gap-1.5 transition-all ${
                          isExpanded
                            ? "bg-muted text-foreground border-border hover:bg-muted/80"
                            : "bg-primary/10 text-primary border-primary/25 hover:bg-primary hover:text-white"
                        }`}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            Expand Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Collapsed State Summary Chips Preview */}
                  {!isExpanded && (
                    <div
                      onClick={() => toggleEvent(ev.id)}
                      className="pt-1 cursor-pointer group space-y-2 select-none"
                    >
                      {ev.chiefComplaint && (
                        <p className="text-xs text-muted-foreground line-clamp-1 italic">
                          <strong className="not-italic font-medium text-foreground">Complaint:</strong> {ev.chiefComplaint}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {ev.provisionalDiagnosis && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium">
                            Dx: {ev.provisionalDiagnosis}
                          </Badge>
                        )}
                        {ev.uploadedFiles && ev.uploadedFiles.length > 0 && (
                          <Badge variant="outline" className="text-[10px] flex items-center gap-1 font-mono">
                            <FileCheck className="h-3 w-3 text-primary" />
                            {ev.uploadedFiles.length} File{ev.uploadedFiles.length > 1 ? "s" : ""} / Radiograph{ev.uploadedFiles.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {ev.prescribedMedicines && ev.prescribedMedicines.length > 0 && (
                          <Badge variant="outline" className="text-[10px] flex items-center gap-1 font-mono">
                            <Pill className="h-3 w-3 text-blue-600" />
                            {ev.prescribedMedicines.length} Medication{ev.prescribedMedicines.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {ev.billingDetails && (
                          <Badge variant="outline" className="text-[10px] flex items-center gap-1 font-mono text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                            <Receipt className="h-3 w-3" />
                            Paid ৳{ev.billingDetails.paidAmount.toLocaleString("en-BD")}
                          </Badge>
                        )}
                        {ev.followUpScheduled && (
                          <Badge variant="outline" className="text-[10px] flex items-center gap-1 font-mono text-teal-700 dark:text-teal-400">
                            <CalendarCheck2 className="h-3 w-3" />
                            Follow-up: {ev.followUpScheduled.date}
                          </Badge>
                        )}
                        <span className="text-[11px] text-primary font-medium ml-auto group-hover:underline flex items-center gap-1">
                          Click to expand details <ChevronDown className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Expanded Detailed Content */}
                  {isExpanded && (
                    <div className="space-y-4 pt-1 animate-in fade-in duration-200">

                  {/* 1. CLINICAL BRIEFING & DOCTOR'S NOTES */}
                  {(ev.chiefComplaint || ev.clinicalNotes || ev.provisionalDiagnosis) && (
                    <div className="space-y-2 rounded-lg bg-muted/30 p-3.5 border">
                      <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5" />
                        Clinical Briefing & Operatory Notes
                      </span>

                      {ev.chiefComplaint && (
                        <p className="text-xs text-foreground">
                          <strong>Chief Complaint:</strong> {ev.chiefComplaint}
                        </p>
                      )}

                      {ev.selectedSymptoms && ev.selectedSymptoms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-muted-foreground font-medium mr-1">Marked Symptoms:</span>
                          {ev.selectedSymptoms.map((sym, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] bg-background">
                              {sym}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {ev.provisionalDiagnosis && (
                        <p className="text-xs text-foreground pt-1">
                          <strong>Provisional Diagnosis:</strong>{" "}
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{ev.provisionalDiagnosis}</span>
                        </p>
                      )}

                      {ev.clinicalNotes && (
                        <p className="text-xs text-muted-foreground leading-relaxed pt-1 whitespace-pre-line border-t border-muted/50 mt-1">
                          {ev.clinicalNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 2. CLINICAL EXAMINATION & VITALS */}
                  {ev.examinationFindings && (
                    <div className="rounded-lg border p-3 bg-muted/10 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-primary" />
                        Examination Findings & Vitals
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {ev.examinationFindings.percussion && (
                          <div className="p-2 rounded bg-background border">
                            <span className="text-[10px] text-muted-foreground block">Percussion</span>
                            <span className="font-semibold text-foreground">{ev.examinationFindings.percussion}</span>
                          </div>
                        )}
                        {ev.examinationFindings.coldTest && (
                          <div className="p-2 rounded bg-background border">
                            <span className="text-[10px] text-muted-foreground block">Cold Vitality</span>
                            <span className="font-semibold text-foreground">{ev.examinationFindings.coldTest}</span>
                          </div>
                        )}
                        {ev.examinationFindings.mobility && (
                          <div className="p-2 rounded bg-background border">
                            <span className="text-[10px] text-muted-foreground block">Mobility</span>
                            <span className="font-semibold text-foreground">{ev.examinationFindings.mobility}</span>
                          </div>
                        )}
                        {ev.examinationFindings.vitals?.bp && (
                          <div className="p-2 rounded bg-background border">
                            <span className="text-[10px] text-muted-foreground block">Blood Pressure</span>
                            <span className="font-semibold text-foreground">{ev.examinationFindings.vitals.bp} mmHg</span>
                          </div>
                        )}
                        {ev.examinationFindings.vitals?.pulse && (
                          <div className="p-2 rounded bg-background border">
                            <span className="text-[10px] text-muted-foreground block">Pulse</span>
                            <span className="font-semibold text-foreground">{ev.examinationFindings.vitals.pulse} bpm</span>
                          </div>
                        )}
                        {ev.examinationFindings.vitals?.bloodSugar && (
                          <div className="p-2 rounded bg-background border">
                            <span className="text-[10px] text-muted-foreground block">Blood Sugar</span>
                            <span className="font-semibold text-foreground">{ev.examinationFindings.vitals.bloodSugar}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. UPLOADED RADIOGRAPHS & PDF TEST REPORTS */}
                  {ev.uploadedFiles && ev.uploadedFiles.length > 0 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
                          <FileCheck className="h-3.5 w-3.5" />
                          Diagnostic Radiographs & Uploaded Reports ({ev.uploadedFiles.length})
                        </span>
                        <span className="text-[10px] text-muted-foreground">Click to view full radiograph / report</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {ev.uploadedFiles.map((file) => {
                          const isImg = file.type === "image" || (typeof file.type === "string" && file.type.startsWith("image"));
                          const displaySize = typeof file.size === "number" ? `${Math.round(file.size / 1024)} KB` : file.size;

                          return (
                            <div
                              key={file.id}
                              onClick={() => setSelectedFile(file)}
                              className="group relative rounded-lg border bg-background overflow-hidden cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col"
                            >
                              {/* Preview Area */}
                              <div className="h-28 bg-muted/60 relative flex items-center justify-center overflow-hidden">
                                {isImg ? (
                                  <img
                                    src={file.url}
                                    alt={file.name}
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="text-center p-3 space-y-1">
                                    <FileText className="h-10 w-10 text-red-500 mx-auto" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">PDF Document</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                                  <Eye className="h-4 w-4" />
                                  <span className="text-xs font-semibold">Inspect</span>
                                </div>
                              </div>

                              {/* File info footer */}
                              <div className="p-2.5 space-y-0.5">
                                <span className="text-xs font-bold text-foreground block truncate" title={file.name}>
                                  {file.name}
                                </span>
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                  <span>{displaySize}</span>
                                  <span>{file.uploadedAt}</span>
                                </div>
                                {file.notes && (
                                  <p className="text-[10px] text-muted-foreground italic truncate pt-0.5">
                                    {file.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. ORDERED INVESTIGATIONS */}
                  {ev.labProcedures && ev.labProcedures.length > 0 && (
                    <div className="rounded-lg border p-3 bg-muted/20 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                        <FileCheck className="h-3.5 w-3.5 text-blue-600" />
                        Diagnostic Investigations Ordered
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ev.labProcedures.map((proc, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs bg-background border">
                            {proc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. PRESCRIBED PHARMACOTHERAPY */}
                  {ev.prescribedMedicines && ev.prescribedMedicines.length > 0 && (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider flex items-center gap-1.5">
                        <Pill className="h-3.5 w-3.5" />
                        Prescribed Dental Pharmacotherapy ({ev.prescribedMedicines.length} Medicines)
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {ev.prescribedMedicines.map((med, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg border bg-background space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground">{med.brandName}</span>
                              <Badge variant="outline" className="text-[9px] h-4">
                                {med.dosageForm || "Tablet"}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2 font-mono">
                              <span>Freq: {med.frequency || "1+0+1"}</span>
                              <span>·</span>
                              <span>Duration: {med.duration || "5 days"}</span>
                            </div>
                            {med.timing && (
                              <p className="text-[10px] text-muted-foreground italic">
                                Timing: {med.timing}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Download PDF Prescription File Card */}
                      <div className="pt-2 border-t border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-md bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold text-[10px] font-mono border border-red-200">
                            PDF
                          </div>
                          <div>
                            <span className="font-semibold text-xs text-foreground block">
                              {ev.prescriptionPdfDoc?.fileName || `e-Prescription_${patientName.replace(/\s+/g, "_")}.pdf`}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {ev.prescriptionPdfDoc?.fileSize || "142 KB"} · Digital SHA-256 Medical Record
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPrescriptionPdf(ev)}
                          className="h-7 text-xs font-semibold gap-1.5 bg-background hover:bg-primary hover:text-white border-blue-400/40 text-blue-700 dark:text-blue-300 shadow-xs"
                        >
                          <Download className="h-3 w-3" />
                          Download PDF Prescription
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 6. FINANCIAL & BILLING RECEIPT LOG */}
                  {ev.billingDetails && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                          <Receipt className="h-3.5 w-3.5" />
                          Official Billing Receipt & Payment Log
                        </span>
                        <p className="text-muted-foreground">
                          Invoice: <strong className="text-foreground">{ev.billingDetails.invoiceNumber}</strong> · Receipt:{" "}
                          <strong className="text-foreground">{ev.billingDetails.receiptNumber}</strong>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Paid via <span className="font-semibold text-emerald-700 dark:text-emerald-300">{ev.billingDetails.paymentMethod}</span> at {ev.billingDetails.paidAt}
                        </p>
                      </div>

                      <div className="text-right sm:border-l sm:pl-4 space-y-0.5 shrink-0">
                        <span className="text-[10px] text-muted-foreground block font-mono">Total Paid</span>
                        <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 font-mono">
                          ৳{ev.billingDetails.paidAmount.toLocaleString("en-BD")} BDT
                        </span>
                        <Badge className="bg-emerald-600 text-white text-[9px] block">Verified Settled</Badge>
                      </div>
                    </div>
                  )}

                  {/* 7. SCHEDULED FOLLOW-UP APPOINTMENT */}
                  {ev.followUpScheduled && (
                    <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <CalendarCheck2 className="h-4 w-4 text-teal-600 shrink-0" />
                        <div>
                          <span className="font-bold text-foreground block">
                            Follow-up Review Scheduled for {ev.followUpScheduled.date}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            {ev.followUpScheduled.reason}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-bold text-teal-700 bg-background font-mono">
                        Serial #{ev.followUpScheduled.serialNumber}
                      </Badge>
                    </div>
                  )}

                  {/* Quick Collapse Footer in Expanded View */}
                  <div className="pt-2 border-t border-muted/50 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEvent(ev.id)}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                      Collapse Details
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
          })}
        </div>
      )}

      {/* FULL-SIZE RADIOGRAPH / PDF FILE INSPECTION MODAL */}
      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background">
          {selectedFile && (
            <div className="flex flex-col max-h-[85vh]">
              <DialogHeader className="p-4 border-b">
                <div className="flex items-center justify-between pr-6">
                  <div>
                    <DialogTitle className="text-sm font-bold flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-primary" />
                      {selectedFile.name}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Uploaded at {selectedFile.uploadedAt} · {selectedFile.size}
                    </p>
                  </div>
                  {selectedFile.notes && (
                    <Badge variant="outline" className="text-xs">
                      {selectedFile.notes}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="p-4 overflow-auto flex items-center justify-center bg-black/5 dark:bg-black/40 min-h-[350px]">
                {selectedFile.type === "image" || (typeof selectedFile.type === "string" && selectedFile.type.startsWith("image")) ? (
                  <img
                    src={selectedFile.url}
                    alt={selectedFile.name}
                    className="max-h-[65vh] w-auto rounded-lg shadow-lg object-contain border"
                  />
                ) : (
                  <div className="text-center p-8 space-y-4 max-w-md">
                    <FileText className="h-16 w-16 text-red-500 mx-auto" />
                    <div>
                      <h4 className="font-bold text-sm">{selectedFile.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF Clinical Test Report / Laboratory Document
                      </p>
                    </div>
                    <Button size="sm" asChild className="gap-2 text-xs">
                      <a href={selectedFile.url} download={selectedFile.name} target="_blank" rel="noreferrer">
                        <Download className="h-3.5 w-3.5" />
                        Download / View Full PDF Report
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
