"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    phone: "+880 1711-234891",
    address: "House 42, Road 7A, Dhanmondi R/A, Dhaka-1209",
  },
  {
    id: "p-89",
    name: "Nusrat Parveen",
    customId: "DENT-2026-00089",
    age: 28,
    gender: "Female",
    phone: "+880 1819-872334",
    address: "Flat 4B, Plot 12, Banani DOHS, Dhaka",
  },
  {
    id: "p-104",
    name: "Mohammad Tariqul Islam",
    customId: "DENT-2026-00104",
    age: 45,
    gender: "Male",
    phone: "+880 1912-439019",
    address: "House 18, Road 3, Uttara Sector 4, Dhaka",
  },
  {
    id: "p-122",
    name: "Tanvir Ahmed",
    customId: "DENT-2026-00122",
    age: 39,
    gender: "Male",
    phone: "+880 1675-901443",
    address: "Road 11, Block C, Mirpur-2, Dhaka",
  },
  {
    id: "p-812",
    name: "Kazi Nazrul Haque",
    customId: "DENT-2025-00812",
    age: 62,
    gender: "Male",
    phone: "+880 1722-312778",
    address: "Plot 88, Gulshan-2, Dhaka",
  },
  {
    id: "p-95",
    name: "Farhana Chowdhury",
    customId: "DENT-2026-00095",
    age: 31,
    gender: "Female",
    phone: "+880 1733-892120",
    address: "56 Shantinagar Road, Kakrail, Dhaka",
  },
  {
    id: "p-88",
    name: "Rahat Chowdhury",
    customId: "DENT-2026-00088",
    age: 28,
    gender: "Male",
    phone: "+880 1819-876543",
    address: "House 12, Road 5, Sector 7, Uttara, Dhaka",
  },
  {
    id: "p-105",
    name: "Sarah Begum",
    customId: "DENT-2026-00105",
    age: 45,
    gender: "Female",
    phone: "+880 1911-223344",
    address: "Apt 5A, Green Road, Farmgate, Dhaka",
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

function convertDaysToWords(days: number): string {
  const map: Record<number, string> = {
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
    6: "Six",
    7: "Seven",
    8: "Eight",
    9: "Nine",
    10: "Ten",
    14: "Fourteen",
    21: "Twenty-One",
    30: "Thirty",
  };
  return map[days] || String(days);
}

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

  // Selected Patient in Dropdown
  const [selectedPatientId, setSelectedPatientId] = useState<string>("p-42");

  // Handle Dropdown / Preset Patient Selection
  const handleSelectPatientById = (val: string) => {
    setSelectedPatientId(val);
    if (val === "custom") {
      toast.info("Switched to manual patient data entry.");
      return;
    }
    const found = PRESET_PATIENTS.find((p) => p.id === val);
    if (found) {
      setPatientName(found.name);
      setCustomId(found.customId);
      setAge(found.age);
      setGender(found.gender);
      setPhone(found.phone);
      setAddress(found.address);
      setCertNumber(`CERT-2026-${found.customId.slice(-5)}`);
      toast.success(`Selected patient: ${found.name} (${found.customId})`);
    }
  };

  const handleSelectPresetPatient = (p: PresetPatient) => {
    handleSelectPatientById(p.id);
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
  const qrHash = `DENTALOS1-AUTH-${certNumber}-${customId.slice(-5)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=${encodeURIComponent(
    `https://dentalos1.health/verify/cert?id=${certNumber}&patient=${encodeURIComponent(patientName)}&hash=${qrHash}`
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
                  <span>Quick Patient Chips</span>
                  <span className="text-[10px] text-primary font-normal">Recent Queue</span>
                </Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {PRESET_PATIENTS.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPresetPatient(p)}
                      className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                        selectedPatientId === p.id
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
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
              <CardTitle className="text-xs font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  2. Patient Demographics & Reference
                </span>
                <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                  {selectedPatientId === "custom" ? "Custom Patient" : "Registered Patient"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              {/* Patient Selection Dropdown */}
              <div>
                <Label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    Select Patient from Dropdown
                  </span>
                  <span className="text-[10px] text-primary font-normal">Auto-populates fields</span>
                </Label>
                <Select
                  value={selectedPatientId}
                  onValueChange={handleSelectPatientById}
                >
                  <SelectTrigger className="h-9 text-xs bg-background border-primary/40 focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Choose a patient from clinical directory..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {PRESET_PATIENTS.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs py-2 cursor-pointer">
                        <div className="flex flex-col gap-0.5 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{p.name}</span>
                            <span className="text-[10px] font-mono text-primary font-bold">[{p.customId}]</span>
                            <span className="text-[10px] text-muted-foreground font-normal">({p.age}Y, {p.gender})</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{p.phone} · {p.address}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" className="text-xs py-2 font-medium text-muted-foreground border-t">
                      ✍️ Custom / Unregistered Patient (Enter manually below)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Patient Full Name</Label>
                  <Input
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      setSelectedPatientId("custom");
                    }}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Patient ID</Label>
                  <Input
                    value={customId}
                    onChange={(e) => {
                      setCustomId(e.target.value);
                      setSelectedPatientId("custom");
                    }}
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
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="h-7 text-xs font-semibold gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
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

            {/* Stationery Desk Worksurface Preview Backdrop */}
            <div className="bg-slate-100 dark:bg-slate-950/80 p-3 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner flex justify-center">
              {/* Authentic Physical A4 Letterhead Sheet */}
              <div className="bg-white text-slate-900 shadow-[0_16px_40px_rgba(0,0,0,0.16)] border border-slate-300 w-full max-w-2xl font-serif text-[12.5px] leading-relaxed relative select-text">
                
                {/* Traditional Certificate Frame (Double Border) */}
                <div className="p-2 sm:p-3.5 m-2.5 sm:m-3.5 border border-slate-900 relative bg-white">
                  <div className="p-3 sm:p-5 border border-slate-300 relative bg-white">

                    {/* Subtle Watermark Crest */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                      <ToothIcon className="w-80 h-80 text-slate-900" strokeWidth={1} />
                    </div>

                    <div className="relative z-10 space-y-3.5">
                      {/* ── 1. CLINIC & DOCTOR LETTERHEAD HEADER ── */}
                      {letterheadMode === "full_blank_a4" ? (
                        <div className="border-b-[2.5px] border-double border-slate-900 pb-3 mb-3">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            {/* Left: Clinic Brand & Crest */}
                            <div className="flex items-start gap-2.5 flex-1">
                              <div className="h-11 w-11 border-[1.5px] border-slate-900 rounded-xs bg-white flex items-center justify-center shrink-0">
                                <ToothIcon className="h-6 w-6 text-slate-900" strokeWidth={2} />
                              </div>
                              <div className="space-y-0.5">
                                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 uppercase font-serif leading-tight">
                                  {clinicName}
                                </h2>
                                <p className="text-[10px] text-slate-700 italic font-serif">
                                  Institute of Advanced Oral Surgery, Microscopic Endodontics & Implantology
                                </p>
                                <p className="text-[9.5px] text-slate-600 font-sans leading-tight mt-0.5">
                                  House 42, Road 7A, Dhanmondi R/A, Dhaka-1209 · Tel: <strong className="text-slate-900 font-semibold">+880 1712-345678</strong>
                                </p>
                                <div className="flex items-center gap-2 text-[8.5px] text-slate-500 font-mono pt-0.5">
                                  <span>DGHS Reg: DGHS/DH-2024/9912</span>
                                  <span>•</span>
                                  <span>BMDC Approved Dental Facility</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Attending Doctor Qualifications */}
                            <div className="text-left sm:text-right space-y-0.5 sm:border-l sm:pl-3.5 border-slate-300 shrink-0 min-w-[190px]">
                              <span className="font-serif font-bold text-sm sm:text-[15px] text-slate-900 block leading-tight">
                                {doctorName}
                              </span>
                              <p className="text-[10px] font-semibold text-slate-800 leading-tight">
                                {doctorDegree}
                              </p>
                              <p className="text-[9.5px] text-slate-600 leading-tight">
                                {doctorDesignation}
                              </p>
                              <div className="pt-0.5 flex flex-col sm:items-end text-[9px] font-mono">
                                <span className="font-bold text-sky-900">{bmdcReg}</span>
                                <span className="text-[8.5px] text-slate-500 font-sans">Visiting: Sat-Thu 4:00 PM - 9:00 PM</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Pre-printed Pad Spacer (60mm) */
                        <div className="h-20 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded bg-slate-50/50 text-slate-400 text-xs italic font-sans mb-3">
                          <span>[Pre-printed clinic letterhead pad reserved space — 60mm]</span>
                          <span className="text-[10px] text-slate-400">Printed text starts below this line</span>
                        </div>
                      )}

                      {/* ── 2. REFERENCE NUMBER & DATE LINE ── */}
                      <div className="flex items-baseline justify-between border-b border-slate-300 pb-2 mb-3 text-[11px] font-mono text-slate-600">
                        <div>
                          Ref. No.: <strong className="text-slate-900 font-bold">{certNumber}</strong>
                        </div>
                        <div>
                          Patient ID: <strong className="text-slate-900 font-bold">{customId}</strong>
                        </div>
                        <div>
                          Date: <strong className="text-slate-900 font-bold font-serif">{issueDate}</strong>
                        </div>
                      </div>

                      {/* ── 3. OFFICIAL DOCUMENT TITLE ── */}
                      <div className="text-center my-3">
                        <h3 className="text-sm sm:text-base font-black tracking-widest uppercase text-slate-900 font-serif border-b-[1.5px] border-slate-900 inline-block pb-0.5">
                          {certType === "fitness"
                            ? "MEDICAL FITNESS CERTIFICATE"
                            : certType === "treatment_completion"
                            ? "DENTAL TREATMENT COMPLETION CERTIFICATE"
                            : certType === "attendance"
                            ? "CLINICAL ATTENDANCE CERTIFICATE"
                            : "MEDICAL CERTIFICATE"}
                        </h3>
                        <p className="text-[9.5px] font-sans font-bold uppercase tracking-wider text-slate-600 mt-1">
                          {certType === "fitness"
                            ? "CERTIFICATE OF RECOVERY & FITNESS TO RESUME REGULAR DUTIES"
                            : certType === "treatment_completion"
                            ? "OFFICIAL RECORD OF SURGICAL / RESTORATIVE CARE RENDERED"
                            : certType === "attendance"
                            ? "RECORD OF CLINICAL CONSULTATION & CONSULTING SURGEON EXAMINATION"
                            : "CERTIFICATE OF TEMPORARY MEDICAL UNFITNESS & SICK LEAVE"}
                        </p>
                      </div>

                      {/* ── 4. FORMAL SALUTATION ── */}
                      <div className="text-center my-3.5">
                        <span className="text-xs sm:text-[13px] font-serif font-bold tracking-widest uppercase text-slate-900 underline underline-offset-4">
                          TO WHOM IT MAY CONCERN
                        </span>
                      </div>

                      {/* ── 5. FORMAL CERTIFICATION NARRATIVE ── */}
                      <div className="text-[12px] sm:text-[12.5px] space-y-3 leading-relaxed text-slate-800 text-justify font-serif">
                        <p>
                          This is to officially certify that <strong className="text-slate-900 underline underline-offset-3 font-bold">{patientName}</strong>, 
                          aged <strong>{age} years</strong>, residing at <em>{address}</em> (Patient Registration ID: <strong className="font-mono text-slate-900">{customId}</strong>), 
                          has been clinically examined and under active dental surgical care at this healthcare facility on <strong>{issueDate}</strong>.
                        </p>

                        {/* Indented Clinical Diagnosis & Operative Care */}
                        <div className="my-2.5 ml-4 pl-3 border-l-2 border-slate-900 py-1 bg-slate-50/70">
                          <div className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                            Clinical Diagnosis & Operative Procedure Rendered:
                          </div>
                          <div className="font-semibold text-slate-900 text-xs">
                            {targetTooth && (
                              <span className="font-mono font-bold text-sky-900 mr-1.5">
                                [Tooth {targetTooth}]
                              </span>
                            )}
                            {procedure}
                          </div>
                          {diagnosis && (
                            <div className="text-[11px] text-slate-600 mt-1">
                              <strong>Diagnostic Finding:</strong> {diagnosis}
                            </div>
                          )}
                        </div>

                        {/* Sick Leave Declaration */}
                        {isSickLeave && (
                          <>
                            <p>
                              Following the surgical intervention administered under local anesthesia, the patient presents with 
                              acute tissue trauma, post-operative inflammation, and transient functional limitation. 
                              In my professional clinical opinion, the patient is currently <strong>medically unfit to discharge occupational, physical, or academic duties</strong>.
                            </p>

                            <div className="bg-slate-50/80 border border-slate-300 border-l-[3.5px] border-l-slate-900 p-2.5 sm:p-3 my-2.5">
                              <div className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                                Prescribed Medical Rest & Absence Period:
                              </div>
                              <div className="text-xs sm:text-[13px] font-bold text-slate-900">
                                The patient is strictly advised complete medical rest for a duration of{" "}
                                <u>{daysRest} ({convertDaysToWords(daysRest)}) Day(s)</u>, effective from{" "}
                                <strong>{startDate}</strong> to <strong>{endDate}</strong> (both days inclusive).
                              </div>
                            </div>
                          </>
                        )}

                        {/* Medical Fitness Clearance */}
                        {isFitness && (
                          <>
                            <p>
                              Upon comprehensive post-operative evaluation and clinical follow-up, the intraoral operative site exhibits 
                              complete mucosal epithelialization, optimal physiological healing, and resolution of symptoms.
                            </p>

                            <div className="bg-slate-50/80 border border-slate-300 border-l-[3.5px] border-l-slate-900 p-2.5 sm:p-3 my-2.5">
                              <div className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                                Clinical Fitness Clearance:
                              </div>
                              <div className="text-xs sm:text-[13px] font-bold text-slate-900">
                                The patient is clinically certified <strong>FIT TO RESUME NORMAL WORK / ACADEMIC DUTIES</strong> effective from{" "}
                                <u>{fitFromDate || startDate}</u>.
                              </div>
                            </div>
                          </>
                        )}

                        {/* Treatment Completion / Attendance */}
                        {!isSickLeave && !isFitness && (
                          <p>
                            The dental surgical / restorative procedure described above was successfully executed in accordance with 
                            recognized operative protocols. The patient has been provided post-operative instructions and appropriate pharmacotherapy.
                          </p>
                        )}

                        {/* Clinician Advice */}
                        {remarks && (
                          <div className="my-2 ml-4 pl-3 border-l-2 border-slate-400 py-0.5">
                            <div className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                              Clinician's Advice & Functional Limitations:
                            </div>
                            <div className="text-[11.5px] text-slate-700 italic">
                              {remarks}
                            </div>
                          </div>
                        )}

                        <p className="text-[10.5px] text-slate-500 italic pt-1">
                          This medical certificate is issued upon patient request without prejudice, for official communication 
                          and institutional medical records verification.
                        </p>
                      </div>

                      {/* ── 6. OFFICIAL SIGN-OFF, SEAL & VERIFICATION ── */}
                      <div className="border-t-[1.5px] border-slate-900 pt-4 mt-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
                        {/* Digital Verification QR */}
                        <div className="flex items-center gap-2.5">
                          <img
                            src={qrUrl}
                            alt="Verification QR"
                            className="h-14 w-14 border border-slate-300 p-0.5 bg-white shrink-0"
                          />
                          <div className="text-[8.5px] font-sans text-slate-500 leading-tight space-y-0.5 max-w-[150px]">
                            <strong className="text-slate-900 text-[9px] block font-semibold">
                              Electronic Health Record Verification
                            </strong>
                            <span>Scan with mobile camera to verify official registry record.</span>
                            <span className="font-mono text-[7.5px] text-sky-800 block">
                              Auth: {qrHash}
                            </span>
                          </div>
                        </div>

                        {/* Official Hospital Circular Embossed Seal */}
                        <div className="text-center select-none">
                          <div className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-slate-500 p-1 flex flex-col items-center justify-center text-center">
                            <div className="h-full w-full rounded-full border border-slate-300 flex flex-col items-center justify-center p-1">
                              <ToothIcon className="h-3.5 w-3.5 text-slate-500 mb-0.5" strokeWidth={1.5} />
                              <span className="text-[6.5px] font-sans font-bold uppercase tracking-wider text-slate-600 leading-tight">
                                DHAKA DENTAL
                              </span>
                              <span className="text-[5.5px] font-sans uppercase text-slate-500">
                                OFFICIAL SEAL
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Attending Doctor Signature Block */}
                        <div className="text-right min-w-[190px]">
                          <div className="font-serif italic text-2xl text-slate-900 leading-none mb-1 pr-2">
                            {doctorName}
                          </div>
                          <div className="border-t-[1.5px] border-slate-900 pt-1">
                            <div className="text-xs font-bold text-slate-900 font-serif">{doctorName}</div>
                            <div className="text-[9.5px] text-slate-700 font-serif">{doctorDegree}</div>
                            <div className="text-[8.5px] text-sky-900 font-mono font-bold">{bmdcReg}</div>
                            <div className="text-[9px] text-slate-600 font-sans">{doctorDesignation}</div>
                          </div>
                        </div>
                      </div>

                      {/* ── 7. HOSPITAL ARCHIVE MICRO-FOOTPRINT ── */}
                      <div className="border-t border-dotted border-slate-300 pt-2 mt-3 flex items-center justify-between text-[8px] font-mono text-slate-500">
                        <span>DentalOS1 · Secure Electronic Health Record # EHR-{customId}</span>
                        <span>Issued: {issueDate} · Certified Dental Practitioner Sign-off</span>
                        <span>Page 1 of 1</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
