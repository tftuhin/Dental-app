"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ToothIcon } from "@/components/icons/dental-icons";
import {
  Award,
  Printer,
  ShieldCheck,
  QrCode,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  User,
  Stethoscope,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  CertificatePdfData,
  CertificateType,
  printCertificateWindow,
  downloadCertificatePdf,
} from "@/lib/certificate-pdf-generator";
import { logPatientActivity } from "@/lib/clinical-flow-store";

interface PresetPatient {
  id: string;
  name: string;
  customId: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
}

const PRESET_PATIENTS: PresetPatient[] = [
  {
    id: "p-42",
    name: "Anika Tabassum",
    customId: "DENT-2026-00042",
    age: 34,
    gender: "Female",
    phone: "+880 1712-345678",
    address: "House 42, Road 7A, Dhanmondi, Dhaka",
  },
  {
    id: "p-88",
    name: "Rahat Chowdhury",
    customId: "DENT-2026-00088",
    age: 28,
    gender: "Male",
    phone: "+880 1819-876543",
    address: "Flat 4B, Plot 12, Banani DOHS, Dhaka",
  },
  {
    id: "p-105",
    name: "Sarah Begum",
    customId: "DENT-2026-00105",
    age: 45,
    gender: "Female",
    phone: "+880 1911-223344",
    address: "House 18, Road 3, Uttara Sector 4, Dhaka",
  },
];

const CLINICAL_CERT_TEMPLATES = [
  {
    label: "Surgical RCT (#19)",
    type: "sick_leave" as CertificateType,
    procedure: "Surgical Pulpectomy and Root Canal Therapy on Tooth #19 under Local Anesthesia.",
    tooth: "#19",
    days: 2,
    remarks: "Advised complete oral rest, soft non-chew diet on left quadrant, and avoidance of strenuous physical exertion. Take prescribed analgesics.",
  },
  {
    label: "Wisdom Extraction (#32)",
    type: "sick_leave" as CertificateType,
    procedure: "Surgical Odontectomy (Surgical Extraction) of Impacted Third Molar #32 with Mucoperiosteal Flap and Suturing.",
    tooth: "#32",
    days: 3,
    remarks: "Patient advised ice pack application, soft lukewarm diet, strict prohibition of spitting or sucking with straw. Heavy lifting and physical labor prohibited.",
  },
  {
    label: "Implant Placement (#30)",
    type: "sick_leave" as CertificateType,
    procedure: "Endosseous Dental Titanium Implant Placement on Site #30 with Autogenous Bone Grafting under Local Anesthesia.",
    tooth: "#30",
    days: 3,
    remarks: "Strict rest advised to avoid micro-movement of surgical fixture. Avoid mastication on right mandibular arch. Ice pack and medication as scheduled.",
  },
  {
    label: "Flap / Perio Surgery",
    type: "sick_leave" as CertificateType,
    procedure: "Open Flap Debridement & Regenerative Periodontal Bone Grafting in Maxillary Anterior Quadrant.",
    tooth: "Maxilla Q1/Q2",
    days: 2,
    remarks: "Advised soft diet, avoid toothbrushing in surgical area for 48 hours, rinse with Chlorhexidine oral rinse 0.2%. No strenuous exercises.",
  },
  {
    label: "Fitness to Resume Duty",
    type: "fitness" as CertificateType,
    procedure: "Final Clinical Review, Suture Removal & Complete Post-Operative Healing Evaluation.",
    tooth: "#19",
    days: 0,
    remarks: "Surgical site has fully epithelialized with intact restorative integrity. Patient is clinically cleared and fit to resume occupational duty.",
  },
];

export default function MedicalCertificatePage() {
  // Certificate Type
  const [certType, setCertType] = useState<CertificateType>("sick_leave");
  const [certNumber, setCertNumber] = useState("CERT-2026-0042");
  const [issueDate, setIssueDate] = useState("2026-10-24");

  // Patient Info
  const [patientName, setPatientName] = useState("Anika Tabassum");
  const [customId, setCustomId] = useState("DENT-2026-00042");
  const [age, setAge] = useState<number | string>(34);
  const [gender, setGender] = useState("Female");
  const [phone, setPhone] = useState("+880 1712-345678");
  const [address, setAddress] = useState("House 42, Road 7A, Dhanmondi, Dhaka");

  // Clinical Content
  const [procedure, setProcedure] = useState(
    "Surgical Pulpectomy and Root Canal Therapy on Tooth #19 under Local Anesthesia."
  );
  const [targetTooth, setTargetTooth] = useState("#19");
  const [diagnosis, setDiagnosis] = useState("Acute Irreversible Pulpitis with Symptomatic Apical Periodontitis");
  const [daysRest, setDaysRest] = useState(2);
  const [startDate, setStartDate] = useState("2026-10-24");
  const [endDate, setEndDate] = useState("2026-10-26");
  const [fitFromDate, setFitFromDate] = useState("2026-10-27");
  const [remarks, setRemarks] = useState(
    "Patient is advised complete oral rest and soft diet. Avoid strenuous physical exertion or masticatory stress on treated quadrant."
  );

  // Clinic & Doctor Customization
  const [clinicName, setClinicName] = useState("DHAKA DENTAL CARE & MAXILLOFACIAL HOSPITAL");
  const [doctorName, setDoctorName] = useState("Dr. Sarah Smith");
  const [doctorDegree, setDoctorDegree] = useState("BDS (DU), FCPS (Oral & Maxillofacial Surgery)");
  const [doctorDesignation, setDoctorDesignation] = useState("Senior Consultant Dental Surgeon");
  const [bmdcReg, setBmdcReg] = useState("BMDC Reg. No: A-84291");

  // Letterhead Mode
  const [letterheadMode, setLetterheadMode] = useState<"full_blank_a4" | "preprinted_pad">("full_blank_a4");

  // Handle Preset Patient Selection
  const handleSelectPresetPatient = (p: PresetPatient) => {
    setPatientName(p.name);
    setCustomId(p.customId);
    setAge(p.age);
    setGender(p.gender);
    setPhone(p.phone);
    setAddress(p.address);
    toast.info(`Loaded patient profile: ${p.name} (${p.customId})`);
  };

  // Apply Template
  const handleApplyTemplate = (tpl: (typeof CLINICAL_CERT_TEMPLATES)[0]) => {
    setCertType(tpl.type);
    setProcedure(tpl.procedure);
    setTargetTooth(tpl.tooth);
    setDaysRest(tpl.days);
    setRemarks(tpl.remarks);
    toast.success(`Applied clinical template: ${tpl.label}`);
  };

  const getCertificateData = (): CertificatePdfData => {
    return {
      certificateNumber: certNumber,
      certificateType: certType,
      issueDate: issueDate,
      patientName: patientName,
      patientId: customId,
      age: age,
      gender: gender,
      phone: phone,
      address: address,
      procedure: procedure,
      targetTooth: targetTooth,
      diagnosis: diagnosis,
      daysRest: daysRest,
      startDate: startDate,
      endDate: endDate,
      fitFromDate: fitFromDate,
      remarks: remarks,
      clinicName: clinicName,
      clinicTagline: "Advanced Oral & Maxillofacial Surgery, Microscopic Endodontics & Dental Implant Centre",
      clinicAddress: "House 42, Road 7A, Dhanmondi R/A, Dhaka-1209, Bangladesh",
      clinicPhone: "+880 1712-345678 / +880 2-9876543",
      clinicLicense: "DGHS Reg. No: DGHS/DH-2024/9912 · BMDC Approved",
      clinicEmail: "info@dhakadentalcare.com",
      doctorName: doctorName,
      doctorDegree: doctorDegree,
      doctorDesignation: doctorDesignation,
      bmdcReg: bmdcReg,
      letterheadMode: letterheadMode,
    };
  };

  // Print Action
  const handlePrintCertificate = () => {
    printCertificateWindow(getCertificateData());
  };

  // Download Action
  const handleDownload = () => {
    downloadCertificatePdf(getCertificateData());
    toast.success(`Certificate ${certNumber} downloaded successfully!`);
  };

  // Issue & Log to Patient History
  const handleIssueCertificate = () => {
    const data = getCertificateData();
    // Log to patient timeline
    logPatientActivity({
      id: `cert-${Date.now()}`,
      patientId: customId,
      date: `${issueDate} 12:00 PM`,
      timestamp: Date.now(),
      type: "clinical_procedure",
      title: certType === "fitness" ? "Medical Fitness Certificate Issued" : "Sick Leave Medical Certificate Issued",
      doctor: `${doctorName}, ${doctorDegree}`,
      badge: certType === "fitness" ? "Fitness Certificate" : "Sick Leave Certificate",
      badgeColor: certType === "fitness" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-blue-100 text-blue-800 border-blue-300",
      chiefComplaint: `Certificate issued for ${procedure}`,
      clinicalNotes: `Official Certificate Reference: ${certNumber}\nDuration: ${daysRest} Days (${startDate} to ${endDate})\nDiagnosis: ${diagnosis}\nRemarks: ${remarks}`,
      targetTooth: targetTooth,
    });

    toast.success(`Medical Certificate ${certNumber} issued and logged to patient history!`);
  };

  // Certificate Type specific labels
  const isSickLeave = certType === "sick_leave";
  const isFitness = certType === "fitness";
  const qrHash = `DENTAI-AUTH-${certNumber}-${customId.slice(-5)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=${encodeURIComponent(
    `https://dentai.health/verify/cert?id=${certNumber}&patient=${encodeURIComponent(patientName)}&hash=${qrHash}`
  )}`;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Medical & Dental Certificate Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Issue authentic clinical letterhead certificates for sick leave, fitness to resume duty, and surgical treatment completion
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-1.5 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Download HTML / PDF
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrintCertificate}
            className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Letterhead Certificate
          </Button>

          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={handleIssueCertificate}
            className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Issue & Log Certificate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── LEFT COLUMN (5 COLS): CERTIFICATE EDITOR ─── */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Quick Presets & Certificate Type */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                1. Certificate Type & Quick Patient Selector
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              {/* Type Selector */}
              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Certificate Category
                </Label>
                <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                  {[
                    { id: "sick_leave", label: "Sick Leave / Medical Rest" },
                    { id: "fitness", label: "Fitness to Resume Duty" },
                    { id: "treatment_completion", label: "Treatment Completion" },
                    { id: "attendance", label: "Clinical Attendance" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCertType(t.id as CertificateType)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border text-left font-medium transition-all ${
                        certType === t.id
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                          : "bg-background text-muted-foreground hover:bg-muted/50 border-border"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Quick Selector */}
              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                  <span>Preload Patient Record</span>
                  <span className="text-[10px] text-primary font-normal">Recent Clinical Queue</span>
                </Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {PRESET_PATIENTS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPresetPatient(p)}
                      className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                        customId === p.customId
                          ? "bg-primary/10 border-primary text-primary font-bold"
                          : "bg-background hover:bg-muted/40 border-border text-foreground"
                      }`}
                    >
                      {p.name} ({p.customId})
                    </button>
                  ))}
                </div>
              </div>

              {/* 1-Click Clinical Procedure Templates */}
              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                  1-Click Dental Clinical Templates
                </Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {CLINICAL_CERT_TEMPLATES.map((tpl, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="h-6 text-[10px] px-2 bg-background hover:bg-primary/10 hover:border-primary font-medium"
                    >
                      ⚡ {tpl.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Patient Demographics Form */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                2. Patient Demographics & Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Patient Full Name</Label>
                  <Input
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Patient ID</Label>
                  <Input
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    className="h-8 text-xs mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Age (Years)</Label>
                  <Input
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Gender</Label>
                  <Input
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Issue Date</Label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="h-8 text-xs mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Contact Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-8 text-xs mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Certificate Ref No.</Label>
                  <Input
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    className="h-8 text-xs mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Residential Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. Clinical Operatory & Rest Period */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                3. Operatory Details & Medical Absence Period
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label className="text-xs">Operatory Diagnosis</Label>
                  <Input
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Target Tooth</Label>
                  <Input
                    value={targetTooth}
                    onChange={(e) => setTargetTooth(e.target.value)}
                    placeholder="e.g. #19"
                    className="h-8 text-xs mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Procedure & Treatment Rendered</Label>
                <Textarea
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  rows={2}
                  className="text-xs mt-1"
                />
              </div>

              {isSickLeave && (
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-red-500/5 rounded-lg border border-red-500/20">
                  <div>
                    <Label className="text-xs text-red-800 dark:text-red-300 font-bold">Days of Rest</Label>
                    <Input
                      type="number"
                      value={daysRest}
                      onChange={(e) => setDaysRest(Number(e.target.value))}
                      className="h-8 text-xs mt-1 font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 text-xs mt-1 font-mono"
                    />
                  </div>
                </div>
              )}

              {isFitness && (
                <div className="p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                  <Label className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">Fit to Resume Duty From</Label>
                  <Input
                    type="date"
                    value={fitFromDate}
                    onChange={(e) => setFitFromDate(e.target.value)}
                    className="h-8 text-xs mt-1 font-mono font-bold"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs">Clinical Advice & Limitations</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="text-xs mt-1"
                />
              </div>

              {/* Letterhead Print Mode Switch */}
              <div className="pt-2 border-t">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1.5">
                  Print Letterhead Mode
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLetterheadMode("full_blank_a4")}
                    className={`text-xs px-3 py-1.5 rounded-lg border flex-1 text-center font-medium transition-all ${
                      letterheadMode === "full_blank_a4"
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                        : "bg-background text-muted-foreground hover:bg-muted/40 border-border"
                    }`}
                  >
                    Full Letterhead (Blank A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLetterheadMode("preprinted_pad")}
                    className={`text-xs px-3 py-1.5 rounded-lg border flex-1 text-center font-medium transition-all ${
                      letterheadMode === "preprinted_pad"
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                        : "bg-background text-muted-foreground hover:bg-muted/40 border-border"
                    }`}
                  >
                    Pre-Printed Clinic Pad
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {letterheadMode === "full_blank_a4"
                    ? "Prints full executive clinic branding, header, and doctor qualifications on blank A4 paper."
                    : "Leaves a 60mm top margin so text aligns on existing physical clinic letterhead pad."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── RIGHT COLUMN (7 COLS): AUTHENTIC PRINTED LETTERHEAD CERTIFICATE PREVIEW ─── */}
        <div className="lg:col-span-7">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                A4 Authentic Printed Letterhead Preview
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono bg-background">
                  {letterheadMode === "full_blank_a4" ? "Blank A4 Layout" : "Pre-Printed Pad Spacer (60mm)"}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrintCertificate}
                  className="h-7 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Now
                </Button>
              </div>
            </div>

            {/* Printable A4 Certificate Card */}
            <div className="bg-white text-slate-900 border-2 border-slate-300 shadow-2xl rounded-xl p-8 space-y-4 font-sans text-xs relative overflow-hidden max-w-2xl mx-auto">
              {/* Subtle Dental Watermark */}
              <div className="absolute right-12 top-48 opacity-[0.035] pointer-events-none select-none">
                <ToothIcon className="w-80 h-80 text-sky-900" strokeWidth={1} />
              </div>

              <div className="relative z-10 space-y-3.5">
                {/* ── 1. CLINIC & DOCTOR LETTERHEAD HEADER ── */}
                {letterheadMode === "full_blank_a4" ? (
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-3 gap-4">
                    {/* Left: Clinic Brand */}
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ToothIcon className="h-6 w-6 text-white" strokeWidth={2.2} />
                      </div>
                      <div className="space-y-0.5">
                        <h2 className="text-base font-black tracking-tight text-slate-900 uppercase leading-snug">
                          {clinicName}
                        </h2>
                        <p className="text-[10.5px] text-sky-700 font-semibold">
                          Advanced Oral & Maxillofacial Surgery, Microscopic Endodontics & Dental Implant Centre
                        </p>
                        <p className="text-[10px] text-slate-600 leading-tight">
                          House 42, Road 7A, Dhanmondi R/A, Dhaka-1209 · Phone: <strong className="text-slate-900">+880 1712-345678</strong>
                        </p>
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono pt-0.5">
                          <span>DGHS Reg: DGHS/DH-2024/9912</span>
                          <span>•</span>
                          <span>BMDC Approved Dental Facility</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Attending Doctor Qualifications */}
                    <div className="text-left sm:text-right space-y-0.5 sm:border-l sm:pl-4 border-slate-300 shrink-0">
                      <span className="font-serif italic text-base font-bold text-slate-900 block leading-tight">
                        {doctorName}
                      </span>
                      <p className="text-[10.5px] font-semibold text-slate-800 leading-tight">
                        {doctorDegree}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium">
                        {doctorDesignation}
                      </p>
                      <div className="pt-0.5 flex flex-col sm:items-end text-[9.5px] text-slate-600 font-mono">
                        <span className="font-bold text-sky-800">{bmdcReg}</span>
                        <span className="text-[9px] text-slate-500">Visiting: Sat-Thu 4:00 PM - 9:00 PM</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Pre-printed Pad Spacer */
                  <div className="h-20 flex items-center justify-center border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs italic">
                    Pre-printed clinic letterhead stationery space (60mm)
                  </div>
                )}

                {/* ── 2. PATIENT DEMOGRAPHICS STRIP ── */}
                <div className="border-y border-slate-900 py-2 px-2 text-xs bg-slate-50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1 gap-x-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Patient Name:</span>
                      <strong className="text-slate-900 text-xs font-bold">{patientName}</strong>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Age / Sex:</span>
                      <span className="font-semibold text-slate-900">{age} Y / {gender}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Patient ID:</span>
                      <span className="font-mono font-bold text-sky-800">{customId}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Date:</span>
                      <span className="font-semibold text-slate-900 font-mono">{issueDate}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Contact:</span>
                      <span className="font-mono text-slate-700">{phone}</span>
                    </div>
                    <div className="sm:col-span-3 flex items-baseline gap-1.5">
                      <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Address:</span>
                      <span className="text-slate-700 truncate">{address}</span>
                    </div>
                  </div>
                </div>

                {/* ── 3. CERTIFICATE TITLE RIBBON ── */}
                <div className="text-center py-2.5 px-3 bg-slate-100 border border-slate-300 rounded-lg">
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 tracking-wider uppercase">
                    {certType === "fitness"
                      ? "CERTIFICATE OF MEDICAL & DENTAL FITNESS"
                      : certType === "treatment_completion"
                      ? "DENTAL SURGERY & TREATMENT COMPLETION CERTIFICATE"
                      : certType === "attendance"
                      ? "CLINICAL ATTENDANCE & CONSULTATION CERTIFICATE"
                      : "OFFICIAL MEDICAL & DENTAL SICK LEAVE CERTIFICATE"}
                  </h3>
                  <p className="text-[10px] font-bold text-sky-700 uppercase tracking-widest mt-0.5">
                    {certType === "fitness"
                      ? "DUTY RESUMPTION & RESTORATIVE CLEARANCE CONFIRMATION"
                      : "TEMPORARY MEDICAL UNFITNESS & MANDATORY REST DECLARATION"}
                  </p>
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-600 border-t border-dashed border-slate-300 mt-2 pt-1.5">
                    <span>Certificate Ref: <strong className="text-slate-900">{certNumber}</strong></span>
                    <Badge className="bg-slate-900 text-white text-[9px] font-mono">
                      {certType === "fitness" ? "CERTIFIED FIT" : "REST ADVISED"}
                    </Badge>
                    <span>Security Hash: <strong className="text-sky-800">{qrHash}</strong></span>
                  </div>
                </div>

                {/* ── 4. CERTIFICATE CLINICAL NARRATIVE ── */}
                <div className="text-xs space-y-3 leading-relaxed text-slate-800">
                  <p className="text-justify">
                    This is to clinically certify that <strong className="text-slate-900 text-[13px] underline decoration-slate-400 underline-offset-2">{patientName}</strong>, 
                    aged <strong>{age} years</strong>, residing at <em>{address}</em> (Patient ID: <span className="font-mono font-bold text-sky-800">{customId}</span>), 
                    was under my direct clinical consultation, operatory care, and dental surgical examination at this facility on <strong>{issueDate}</strong>.
                  </p>

                  {/* Diagnosis & Procedure Box */}
                  <div className="p-3 bg-slate-50 border-l-4 border-sky-600 rounded-r-lg border-y border-r border-slate-200 space-y-1">
                    <span className="text-[9.5px] uppercase font-bold text-sky-700 tracking-wider block">
                      Operatory Findings & Treatment Performed
                    </span>
                    <p className="font-semibold text-slate-900 text-xs">
                      {targetTooth && (
                        <span className="inline-block bg-sky-100 text-sky-800 font-mono font-bold px-1.5 py-0.5 rounded text-[10px] mr-1.5">
                          Tooth {targetTooth}
                        </span>
                      )}
                      {procedure}
                    </p>
                    {diagnosis && (
                      <p className="text-[10.5px] text-slate-600">
                        <strong>Clinical Assessment:</strong> {diagnosis}
                      </p>
                    )}
                  </div>

                  {/* Sick Leave Rest Callout */}
                  {isSickLeave && (
                    <>
                      <p className="text-justify">
                        Following the invasive surgical dental procedure administered under local anesthesia, 
                        the patient presents with acute tissue trauma, post-operative inflammation, and transient functional masticatory limitation. 
                        In my professional clinical opinion, the patient is currently <strong>medically unfit to discharge occupational, physical, or academic duties</strong>.
                      </p>

                      <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded-r-lg border-y border-r border-red-200">
                        <span className="text-[9.5px] uppercase font-bold text-red-700 tracking-wider block">
                          Prescribed Medical Rest & Absence Period
                        </span>
                        <p className="font-bold text-red-900 text-xs mt-0.5">
                          The patient is strictly advised complete medical rest for{" "}
                          <span className="inline-block bg-red-600 text-white px-2 py-0.5 rounded font-extrabold text-xs">
                            {daysRest} Day(s)
                          </span>{" "}
                          from <strong>{startDate}</strong> to <strong>{endDate}</strong> (both days inclusive).
                        </p>
                      </div>
                    </>
                  )}

                  {/* Fitness Callout */}
                  {isFitness && (
                    <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-lg border-y border-r border-emerald-200">
                      <span className="text-[9.5px] uppercase font-bold text-emerald-700 tracking-wider block">
                        Medical & Dental Fitness Confirmation
                      </span>
                      <p className="font-bold text-emerald-900 text-xs mt-0.5">
                        The patient has successfully completed the required operative dental treatment and post-operative recovery, 
                        and is hereby certified <strong>FIT TO RESUME NORMAL OCCUPATIONAL / ACADEMIC DUTIES</strong> effective from{" "}
                        <span className="font-mono underline">{fitFromDate}</span>.
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {remarks && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                      <strong>Clinical Recommendations:</strong> {remarks}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 italic">
                    This document is an authentic clinical record issued upon patient request for employer / institutional notification 
                    and medical compliance verification.
                  </p>
                </div>

                {/* ── 5. VERIFICATION, SEAL & SIGNATURES ── */}
                <div className="border-t-2 border-slate-300 pt-4 mt-6 flex items-end justify-between gap-4">
                  {/* Digital QR Verification */}
                  <div className="flex items-center gap-2.5">
                    <img
                      src={qrUrl}
                      alt="Verification QR"
                      className="h-14 w-14 rounded-md border border-slate-300 p-0.5 bg-white shadow-2xs shrink-0"
                    />
                    <div className="text-[9px] text-slate-500 leading-tight space-y-0.5 max-w-[150px]">
                      <span className="font-bold text-slate-900 text-[10px] block">Hospital Verification</span>
                      <span>Scan with any smartphone camera to verify record on DentAI Portal.</span>
                      <span className="font-mono text-[8px] text-sky-800 block">{qrHash}</span>
                    </div>
                  </div>

                  {/* Official Clinic Seal Area */}
                  <div className="h-18 w-18 rounded-full border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-center p-1 text-[7.5px] text-slate-400 font-bold uppercase leading-tight select-none">
                    <span>Dhaka Dental<br/>Official Seal<br/>& Emboss</span>
                  </div>

                  {/* Doctor Signature */}
                  <div className="text-right space-y-0.5 min-w-[170px]">
                    <span className="font-serif italic text-lg font-bold text-slate-900 block leading-tight">
                      {doctorName}
                    </span>
                    <div className="border-t border-slate-900 pt-1">
                      <p className="text-[11px] font-bold text-slate-900">{doctorName}</p>
                      <p className="text-[9.5px] text-slate-600 font-semibold">{doctorDesignation}</p>
                      <p className="text-[9px] text-slate-600">{doctorDegree}</p>
                      <p className="text-[8.5px] text-sky-800 font-mono font-bold">{bmdcReg}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Legal Strip */}
                <div className="border-t border-dotted border-slate-200 pt-2 flex items-center justify-between text-[8px] text-slate-400 font-mono">
                  <span>DentAI OS · Secure Electronic Health Record # EHR-{customId}</span>
                  <span>Issued: {issueDate} · Authorized Medical Practitioner Verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
