"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Receipt,
  Plus,
  Trash2,
  Cake,
  Printer,
  CreditCard,
  Banknote,
  Percent,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Clock,
  User,
  ArrowRight,
  Pill,
  FileText,
  Calendar,
  Edit,
  Stethoscope,
  Scissors,
  Download,
  X,
} from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import {
  ClinicalQueuePatient,
  PatientTimelineEvent,
  getStoredAppointments,
  saveStoredAppointments,
  logPatientActivity,
} from "@/lib/clinical-flow-store";
import { formatBDT, numberToWordsBDT } from "@/lib/currency";
import { getClinicSetup, ClinicSetupData } from "@/lib/clinic-setup-store";
import { printReceiptWindow, downloadReceiptPdf, ReceiptPdfData } from "@/lib/receipt-pdf-generator";
import { toast } from "sonner";

export interface InvoiceLineItem {
  id: string;
  cdtCode: string;
  description: string;
  toothNumber?: string;
  category: "procedure" | "consultation" | "medicine" | "lab" | "other";
  quantity: number;
  unitPrice: number;
}

function ModalReceiptSlip({
  copyTitle,
  badgeBg,
  data,
}: {
  copyTitle: "PATIENT COPY" | "OFFICE / CLINIC COPY";
  badgeBg: string;
  data: ReceiptPdfData;
}) {
  const isFullSettlement = data.paidAmount >= data.grandTotal;
  const inWords = numberToWordsBDT(data.paidAmount > 0 ? data.paidAmount : data.grandTotal);

  return (
    <div className="border-2 border-border/80 rounded-xl p-4 sm:p-5 bg-card text-foreground space-y-3.5 shadow-sm">
      {/* ── CLINIC LETTERHEAD & COPY TITLE ── */}
      <div className="border-b-2 border-foreground/10 pb-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-center shadow-md shrink-0 border border-white/20">
            <ToothIcon className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight uppercase text-foreground leading-tight">
              {data.clinicName}
            </h3>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              {data.clinicTagline}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {data.clinicAddress} · Phone: <span className="font-semibold text-foreground">{data.clinicPhone}</span>
            </p>
            <p className="text-[9px] text-muted-foreground font-mono">
              DGHS Lic: {data.clinicLicense} · BMDC Reg: {data.bmdcReg}
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right space-y-1 shrink-0">
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeBg} shadow-xs`}>
            {copyTitle}
          </span>
          <div className="text-[10px] text-muted-foreground font-mono leading-tight">
            <span className="block font-bold text-foreground">REC: {data.receiptNumber}</span>
            <span className="block">INV: {data.invoiceNumber}</span>
            <span className="block">{data.date} · {data.time}</span>
          </div>
        </div>
      </div>

      {/* ── PATIENT & CLINICIAN DEMOGRAPHICS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs p-2.5 rounded-lg bg-muted/40 border border-border/70">
        <div>
          <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider block">Patient</span>
          <strong className="text-foreground text-xs block truncate">{data.patientName}</strong>
          <span className="text-muted-foreground font-mono text-[10px] block">{data.patientId}</span>
          <span className="text-[10px] text-muted-foreground">{data.phone}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider block">Demographics</span>
          <span className="text-foreground font-semibold block text-[11px]">{data.age} Yrs · {data.gender}</span>
          <span className="text-muted-foreground block text-[10px] truncate">{data.address}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider block">Attending Clinician</span>
          <strong className="text-foreground text-[11px] block truncate">{data.doctorName}</strong>
          <span className="text-muted-foreground text-[9px] block truncate">{data.doctorDegree}</span>
          <span className="text-muted-foreground font-mono text-[9px] block">Reg: {data.bmdcReg}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider block">Settlement Mode</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-[9px] uppercase">
              {data.paymentMethod}
            </Badge>
            {isFullSettlement ? (
              <Badge variant="outline" className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 border-emerald-500/40">
                PAID IN FULL
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] font-bold text-amber-600 border-amber-500/40">
                DUE: {formatBDT(data.balanceDue)}
              </Badge>
            )}
          </div>
          {data.trxId && (
            <span className="font-mono text-[9px] text-muted-foreground block mt-0.5">
              TrxID: {data.trxId}
            </span>
          )}
        </div>
      </div>

      {/* ── CLINICAL DIAGNOSIS ── */}
      {data.diagnosis && (
        <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Stethoscope className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <div className="text-[11px] truncate">
              <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 uppercase mr-1">
                Diagnosis:
              </span>
              <strong className="text-foreground">{data.diagnosis}</strong>
            </div>
          </div>
          <Badge variant="outline" className="text-[8px] font-mono text-emerald-800 dark:text-emerald-300 border-emerald-500/40 bg-background shrink-0">
            BMDC Verified
          </Badge>
        </div>
      )}

      {/* ── ITEMIZED CDT SERVICE BILLING TABLE ── */}
      <div className="border rounded-lg overflow-hidden shadow-2xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/70 border-b text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
              <th className="py-1.5 px-2.5 text-left w-8">Sl</th>
              <th className="py-1.5 px-2.5 text-left">Service / Procedure Description</th>
              <th className="py-1.5 px-2 text-center w-14">Tooth</th>
              <th className="py-1.5 px-2 text-center w-10">Qty</th>
              <th className="py-1.5 px-2.5 text-right w-20">Unit Rate</th>
              <th className="py-1.5 px-2.5 text-right w-24">Net Total</th>
            </tr>
          </thead>
          <tbody className="divide-y text-[11px]">
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-3 text-center text-muted-foreground italic">
                  No billing procedures listed
                </td>
              </tr>
            ) : (
              data.items.map((it, idx) => (
                <tr key={it.id || idx} className={idx % 2 === 0 ? "bg-background" : "bg-muted/15"}>
                  <td className="py-1.5 px-2.5 font-mono text-muted-foreground font-semibold">{idx + 1}</td>
                  <td className="py-1.5 px-2.5">
                    <span className="font-semibold text-foreground">{it.description}</span>
                    {it.cdtCode && (
                      <span className="text-[9px] text-muted-foreground font-mono ml-1.5">({it.cdtCode})</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono font-medium text-foreground">{it.toothNumber || "—"}</td>
                  <td className="py-1.5 px-2 text-center font-mono">{it.quantity}</td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-muted-foreground">{formatBDT(it.unitPrice)}</td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-foreground">
                    {formatBDT(it.total || it.unitPrice * it.quantity)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── FINANCIAL LEDGER & WORDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-0.5">
        <div className="sm:col-span-7 space-y-2 text-xs">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="text-[9px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
              Amount in Words:
            </span>
            <span className="font-serif italic font-bold text-foreground text-xs">
              {inWords} {data.paidAmount >= data.grandTotal ? "(Paid in Full)" : `(Remaining Due: ${formatBDT(data.balanceDue)})`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Official medical tax invoice & hospital money receipt authenticated under DentalOS1.</span>
          </div>
        </div>

        <div className="sm:col-span-5 space-y-1 font-mono text-[11px] border rounded-lg p-2.5 bg-muted/30">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal:</span>
            <span className="font-semibold text-foreground">{formatBDT(data.subtotal)}</span>
          </div>
          {data.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Discount ({data.discountType === "birthday" ? "Birthday Privilege" : data.discountType}):</span>
              <span>-{formatBDT(data.discountAmount)}</span>
            </div>
          )}
          {data.taxAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>VAT ({data.taxRate}%):</span>
              <span>+{formatBDT(data.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs text-foreground border-t pt-1">
            <span>Grand Total:</span>
            <span className="text-primary font-black">{formatBDT(data.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold border-t pt-0.5">
            <span>Amount Received:</span>
            <span>{formatBDT(data.paidAmount)}</span>
          </div>
          <div className={`flex justify-between font-bold pt-0.5 border-t ${data.balanceDue > 0 ? "text-amber-600 font-black" : "text-emerald-600"}`}>
            <span>Balance Due:</span>
            <span>{formatBDT(data.balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* ── MANUAL SIGNATURE PLACEHOLDERS ── */}
      <div className="pt-3 border-t-2 border-foreground/10 grid grid-cols-3 items-end text-xs text-muted-foreground gap-3">
        {/* Left: Patient / Depositor's Signature */}
        <div className="text-left space-y-1">
          <div className="h-6 border-b-2 border-dashed border-foreground/30 w-32"></div>
          <span className="text-[9px] block font-bold text-foreground uppercase tracking-wide">
            Patient / Depositor's Signature
          </span>
          <span className="text-[8px] text-muted-foreground block font-mono">Date: ____________________</span>
        </div>

        {/* Center: Official Seal */}
        <div className="text-center">
          <div className="inline-block border border-dashed border-muted-foreground/40 rounded px-2.5 py-1 text-[8px] font-bold text-muted-foreground tracking-widest uppercase">
            [ Official Seal ]
          </div>
        </div>

        {/* Right: Cashier / Accounts */}
        <div className="text-right space-y-1">
          <div className="h-6 border-b-2 border-dashed border-foreground/30 w-36 ml-auto"></div>
          <span className="text-[9px] block font-bold text-foreground uppercase tracking-wide">
            Authorized Cashier / Accounts
          </span>
          <span className="text-[8px] text-muted-foreground block font-mono">Dhaka Dental Care (BMDC Reg)</span>
        </div>
      </div>
    </div>
  );
}

export function BillingStudio() {
  const searchParams = useSearchParams();

  // Clinic Setup Data from settings store
  const [clinic, setClinic] = useState<ClinicSetupData | null>(null);

  useEffect(() => {
    setClinic(getClinicSetup());
    const handleClinicUpdate = () => setClinic(getClinicSetup());
    window.addEventListener("dentai-clinic-setup-updated", handleClinicUpdate);
    return () => window.removeEventListener("dentai-clinic-setup-updated", handleClinicUpdate);
  }, []);

  const clinicName = clinic?.name || "Dhaka Dental Care & Maxillofacial Implant Hospital";
  const clinicTagline = clinic?.tagline || "Advanced Microscopic Endodontics, Oral Surgery & Dental Implantology Centre";
  const clinicAddress = clinic?.address || "House 42, Road 7A, Dhanmondi R/A, Dhaka-1209, Bangladesh";
  const clinicPhone = clinic?.phone || "+880 1712-345678";
  const clinicLicense = clinic?.bmdcLicense || "DGHS/DH-2024/9912 · BMDC Approved";

  // Queue of patients awaiting billing from clinical store
  const [queuePatients, setQueuePatients] = useState<ClinicalQueuePatient[]>([]);
  const [selectedQueuePatientId, setSelectedQueuePatientId] = useState<string>("apt-1");

  const [patient, setPatient] = useState({
    name: "Anika Tabassum",
    customId: "DENT-2026-00042",
    age: 34,
    gender: "Female",
    phone: "+880 1712-345678",
    address: "House 42, Road 7A, Dhanmondi R/A, Dhaka-1209",
    dateOfBirth: "1992-10-14", // Birthday this month!
    isBirthdayMonth: true,
  });

  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(
    "Symptomatic Irreversible Pulpitis with Acute Apical Periodontitis (Tooth #19)"
  );

  // Add Procedure Blank Form Dialog State
  const [isAddProcedureOpen, setIsAddProcedureOpen] = useState(false);
  const [newProcedureForm, setNewProcedureForm] = useState<Omit<InvoiceLineItem, "id">>({
    cdtCode: "D2392",
    description: "",
    toothNumber: "",
    category: "procedure",
    quantity: 1,
    unitPrice: 1500,
  });

  // Edit Existing Procedure Dialog State
  const [isEditProcedureOpen, setIsEditProcedureOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceLineItem | null>(null);

  const [invoiceNumber] = useState("INV-2026-00412");
  const [invoiceDate] = useState(new Date().toISOString().split("T")[0]);

  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      id: "item-1",
      cdtCode: "D3330",
      description: "Endodontic Therapy - Molar (Tooth #19, Complete Rotary)",
      toothNumber: "#19",
      category: "procedure",
      quantity: 1,
      unitPrice: 8500.0,
    },
    {
      id: "item-2",
      cdtCode: "D0140",
      description: "Comprehensive Oral Examination & Specialist Consultation",
      toothNumber: "",
      category: "consultation",
      quantity: 1,
      unitPrice: 800.0,
    },
    {
      id: "item-3",
      cdtCode: "D0220",
      description: "Digital Intraoral Periapical (IOPA) Radiograph",
      toothNumber: "#19",
      category: "procedure",
      quantity: 1,
      unitPrice: 400.0,
    },
    {
      id: "item-4",
      cdtCode: "D9630",
      description: "Prescribed Dental Pharmacotherapy Pack (Torax, Amodis, Maxpro, Clohex)",
      toothNumber: "",
      category: "medicine",
      quantity: 1,
      unitPrice: 480.0,
    },
  ]);

  const [discountType, setDiscountType] = useState<"none" | "fixed" | "percentage" | "birthday">("birthday");
  const [discountValue, setDiscountValue] = useState<number>(patient.age);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [trxId, setTrxId] = useState("BK-94829184");
  const [isFinalized, setIsFinalized] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Sync with clinical store on mount & check query params
  useEffect(() => {
    const list = getStoredAppointments();
    setQueuePatients(list);

    const paramPatientId = searchParams?.get("patientId");
    if (paramPatientId) {
      setSelectedQueuePatientId(paramPatientId);
      const chosen = list.find((a) => a.id === paramPatientId);
      if (chosen) {
        setPatient({
          name: chosen.patient,
          customId: chosen.patientId,
          age: chosen.age,
          gender: (chosen as any).gender || (chosen.patient.includes("Tabassum") || chosen.patient.includes("Begum") || chosen.patient.includes("Fatima") || chosen.patient.includes("Nusrat") ? "Female" : "Male"),
          phone: chosen.phone,
          address: chosen.address,
          dateOfBirth: "1992-10-14",
          isBirthdayMonth: true,
        });

        if (chosen.provisionalDiagnosis) {
          setPrimaryDiagnosis(chosen.provisionalDiagnosis);
        } else {
          setPrimaryDiagnosis(`${chosen.service} - Clinical Operatory Procedure`);
        }

        const newItems: InvoiceLineItem[] = [
          {
            id: "item-cons-" + Date.now(),
            cdtCode: "D0140",
            description: "Comprehensive Oral Examination & Specialist Consultation",
            toothNumber: "",
            category: "consultation",
            quantity: 1,
            unitPrice: 800.0,
          },
        ];

        if (chosen.service.toLowerCase().includes("pulpectomy") || chosen.service.toLowerCase().includes("rct")) {
          newItems.push({
            id: "item-rct-" + Date.now(),
            cdtCode: "D3330",
            description: "Endodontic Therapy - Molar (Tooth #19, Complete Rotary)",
            toothNumber: "#19",
            category: "procedure",
            quantity: 1,
            unitPrice: 8500.0,
          });
          newItems.push({
            id: "item-xray-" + Date.now(),
            cdtCode: "D0220",
            description: "Digital Intraoral Periapical (IOPA) Radiograph",
            toothNumber: "#19",
            category: "procedure",
            quantity: 1,
            unitPrice: 400.0,
          });
          newItems.push({
            id: "item-med-" + Date.now(),
            cdtCode: "D9630",
            description: "Prescribed Dental Pharmacotherapy Pack (Torax, Amodis, Maxpro, Clohex)",
            toothNumber: "",
            category: "medicine",
            quantity: 1,
            unitPrice: 480.0,
          });
        } else if (chosen.service.toLowerCase().includes("crown")) {
          newItems.push({
            id: "item-crw-" + Date.now(),
            cdtCode: "D2740",
            description: "Full Contour Monolithic Zirconia Crown (#30 CAD/CAM)",
            toothNumber: "#30",
            category: "procedure",
            quantity: 1,
            unitPrice: 12000.0,
          });
        } else if (chosen.service.toLowerCase().includes("scaling") || chosen.service.toLowerCase().includes("perio")) {
          newItems.push({
            id: "item-scl-" + Date.now(),
            cdtCode: "D1110",
            description: "Prophylaxis - Adult Full Mouth Ultrasonic Scaling & Polish",
            toothNumber: "",
            category: "procedure",
            quantity: 1,
            unitPrice: 2500.0,
          });
        } else {
          newItems.push({
            id: "item-gen-" + Date.now(),
            cdtCode: "D9999",
            description: `${chosen.service} - Operatory Session`,
            toothNumber: "",
            category: "procedure",
            quantity: 1,
            unitPrice: chosen.suggestedFee || 1500.0,
          });
        }

        if (chosen.labProceduresRecommended) {
          chosen.labProceduresRecommended.forEach((proc, idx) => {
            if (!newItems.some((it) => it.description.toLowerCase().includes(proc.toLowerCase()))) {
              newItems.push({
                id: `item-lab-${idx}-${Date.now()}`,
                cdtCode: "D0220",
                description: `${proc} (Ordered during session)`,
                toothNumber: "",
                category: "lab",
                quantity: 1,
                unitPrice: 450.0,
              });
            }
          });
        }

        setItems(newItems);
        toast.success(`Loaded billing items for ${chosen.patient}!`);
      }
    }

    const handleSync = () => {
      setQueuePatients(getStoredAppointments());
    };
    window.addEventListener("dentai-appointments-updated", handleSync);
    return () => window.removeEventListener("dentai-appointments-updated", handleSync);
  }, [searchParams]);

  // Handle selecting a completed patient from the dropdown
  const handleSelectPatient = (patientId: string) => {
    setSelectedQueuePatientId(patientId);
    const chosen = queuePatients.find((a) => a.id === patientId);
    if (!chosen) return;

    setPatient({
      name: chosen.patient,
      customId: chosen.patientId,
      age: chosen.age,
      gender: (chosen as any).gender || (chosen.patient.includes("Tabassum") || chosen.patient.includes("Begum") || chosen.patient.includes("Fatima") || chosen.patient.includes("Nusrat") ? "Female" : "Male"),
      phone: chosen.phone,
      address: chosen.address,
      dateOfBirth: "1992-10-14",
      isBirthdayMonth: true,
    });

    if (chosen.provisionalDiagnosis) {
      setPrimaryDiagnosis(chosen.provisionalDiagnosis);
    } else {
      setPrimaryDiagnosis(`${chosen.service} - Clinical Operatory Procedure`);
    }

    // Generate appropriate line items based on their service & lab procedures
    const newItems: InvoiceLineItem[] = [
      {
        id: "item-cons-" + Date.now(),
        cdtCode: "D0140",
        description: "Comprehensive Oral Examination & Specialist Consultation",
        toothNumber: "",
        category: "consultation",
        quantity: 1,
        unitPrice: 800.0,
      },
    ];

    if (chosen.service.toLowerCase().includes("pulpectomy") || chosen.service.toLowerCase().includes("rct")) {
      newItems.push({
        id: "item-rct-" + Date.now(),
        cdtCode: "D3330",
        description: "Endodontic Therapy - Molar (Tooth #19, Complete Rotary)",
        toothNumber: "#19",
        category: "procedure",
        quantity: 1,
        unitPrice: 8500.0,
      });
      newItems.push({
        id: "item-xray-" + Date.now(),
        cdtCode: "D0220",
        description: "Digital Intraoral Periapical (IOPA) Radiograph",
        toothNumber: "#19",
        category: "procedure",
        quantity: 1,
        unitPrice: 400.0,
      });
      newItems.push({
        id: "item-med-" + Date.now(),
        cdtCode: "D9630",
        description: "Prescribed Dental Pharmacotherapy Pack (Torax, Amodis, Maxpro, Clohex)",
        toothNumber: "",
        category: "medicine",
        quantity: 1,
        unitPrice: 480.0,
      });
    } else if (chosen.service.toLowerCase().includes("crown")) {
      newItems.push({
        id: "item-crw-" + Date.now(),
        cdtCode: "D2740",
        description: "Full Contour Monolithic Zirconia Crown (#30 CAD/CAM)",
        toothNumber: "#30",
        category: "procedure",
        quantity: 1,
        unitPrice: 12000.0,
      });
      newItems.push({
        id: "item-post-" + Date.now(),
        cdtCode: "D2950",
        description: "Core Buildup with Fiber Post & Resin Cementation",
        toothNumber: "#30",
        category: "procedure",
        quantity: 1,
        unitPrice: 2500.0,
      });
    } else if (chosen.service.toLowerCase().includes("scaling") || chosen.service.toLowerCase().includes("perio")) {
      newItems.push({
        id: "item-scl-" + Date.now(),
        cdtCode: "D1110",
        description: "Full Mouth Ultrasonic Scaling & Subgingival Debridement",
        toothNumber: "Full Arch",
        category: "procedure",
        quantity: 1,
        unitPrice: 2500.0,
      });
      newItems.push({
        id: "item-perio-" + Date.now(),
        cdtCode: "D0180",
        description: "Comprehensive 6-Point Periodontal Probing Depth Charting",
        toothNumber: "",
        category: "procedure",
        quantity: 1,
        unitPrice: 500.0,
      });
    } else if (chosen.service.toLowerCase().includes("extraction") || chosen.service.toLowerCase().includes("wisdom")) {
      newItems.push({
        id: "item-ext-" + Date.now(),
        cdtCode: "D7230",
        description: "Surgical Removal of Impacted Wisdom Tooth (#38)",
        toothNumber: "#38",
        category: "procedure",
        quantity: 1,
        unitPrice: 6500.0,
      });
      newItems.push({
        id: "item-opg-" + Date.now(),
        cdtCode: "D0330",
        description: "Digital Panoramic Radiograph (OPG)",
        toothNumber: "Full Arch",
        category: "procedure",
        quantity: 1,
        unitPrice: 1200.0,
      });
    } else {
      newItems.push({
        id: "item-proc-" + Date.now(),
        cdtCode: "D2392",
        description: `${chosen.service} (Clinical Procedure)`,
        toothNumber: "",
        category: "procedure",
        quantity: 1,
        unitPrice: chosen.suggestedFee || 1500.0,
      });
    }

    setItems(newItems);
    setDiscountValue(chosen.age);
    setPaidAmount(0);
    setIsFinalized(false);
    toast.success(`Loaded billing profile for ${chosen.patient} (Serial #${chosen.fifoSerial || chosen.id})`);
  };

  // Calculations in BDT
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  let discountAmount = 0;
  if (discountType === "none") {
    discountAmount = 0;
  } else if (discountType === "fixed") {
    discountAmount = Math.min(subtotal, Math.max(0, discountValue));
  } else if (discountType === "percentage") {
    discountAmount = (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
  } else if (discountType === "birthday") {
    // Birthday Privilege Rule: Discount % = Patient's Age
    discountAmount = (subtotal * patient.age) / 100;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + taxAmount;
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  const addItem = () => {
    setNewProcedureForm({
      cdtCode: "D" + Math.floor(1000 + Math.random() * 8999),
      description: "",
      toothNumber: "",
      category: "procedure",
      quantity: 1,
      unitPrice: 1500,
    });
    setIsAddProcedureOpen(true);
  };

  const handleConfirmAddProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcedureForm.description.trim()) {
      toast.error("Please enter a procedure description");
      return;
    }
    const newItem: InvoiceLineItem = {
      id: "item-custom-" + Date.now(),
      cdtCode: newProcedureForm.cdtCode || "D9999",
      description: newProcedureForm.description.trim(),
      toothNumber: newProcedureForm.toothNumber?.trim() || "",
      category: newProcedureForm.category,
      quantity: Math.max(1, Number(newProcedureForm.quantity) || 1),
      unitPrice: Math.max(0, Number(newProcedureForm.unitPrice) || 0),
    };
    setItems([...items, newItem]);
    setIsAddProcedureOpen(false);
    toast.success(`Procedure "${newItem.description}" added to invoice!`);
  };

  const handleOpenEditItem = (item: InvoiceLineItem) => {
    setEditingItem({ ...item });
    setIsEditProcedureOpen(true);
  };

  const handleConfirmEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.description.trim()) {
      toast.error("Procedure description cannot be empty");
      return;
    }
    const updated = items.map((it) =>
      it.id === editingItem.id
        ? {
            ...editingItem,
            description: editingItem.description.trim(),
            toothNumber: editingItem.toothNumber?.trim() || "",
            quantity: Math.max(1, Number(editingItem.quantity) || 1),
            unitPrice: Math.max(0, Number(editingItem.unitPrice) || 0),
          }
        : it
    );
    setItems(updated);
    setIsEditProcedureOpen(false);
    toast.success(`Updated "${editingItem.description}"!`);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const applyBirthdayDiscount = () => {
    setDiscountType("birthday");
    setDiscountValue(patient.age);
    toast.success(`Birthday Privilege Applied: ${patient.age}% off on total bill!`);
  };

  const removeDiscount = () => {
    setDiscountType("none");
    setDiscountValue(0);
    toast.info("Discount removed. Full fee applied.");
  };

  const handleFinalizeInvoice = () => {
    setIsFinalized(true);

    // Update patient in store as billed
    const updated = queuePatients.map((a) =>
      a.id === selectedQueuePatientId ? { ...a, billed: true } : a
    );
    setQueuePatients(updated);
    saveStoredAppointments(updated);

    // Save complete procedure & billing log under patient's history timeline
    const apt = queuePatients.find((a) => a.id === selectedQueuePatientId);
    const activityEvent: PatientTimelineEvent = {
      id: "ev-" + Date.now(),
      patientId: patient.customId,
      date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
      timestamp: Date.now(),
      type: "invoice",
      title: `${apt?.service || "Dental Procedure"} & Official Billing Receipt`,
      doctor: apt?.doctor || "Dr. Sarah Smith, BDS, FCPS",
      chair: apt?.chair || "Chair 1",
      chiefComplaint: apt?.chiefComplaint || "Dental examination and operatory procedure completed.",
      selectedSymptoms: apt?.selectedSymptoms || ["Throbbing pain", "Cold sensitivity"],
      targetTooth: apt?.service?.match(/#\d+/)?.[0] || "#19",
      clinicalNotes: apt?.clinicalNotes || "Comprehensive dental examination, pulp treatment and tooth restoration completed.",
      provisionalDiagnosis: apt?.provisionalDiagnosis || "Symptomatic Irreversible Pulpitis #19 with Periapical Periodontitis",
      examinationFindings: {
        percussion: "Tender (+)",
        coldTest: "Lingering pain",
        mobility: "Gr-0 (Normal)",
        vitals: apt?.vitals || { bp: "120/80", pulse: "74", bloodSugar: "6.2 mmol/L", temp: "98.6°F" },
      },
      labProcedures: apt?.labProceduresRecommended || ["Digital IOPA Radiograph (#19)"],
      uploadedFiles: apt?.uploadedFiles || [
        {
          id: "f-1",
          name: "Digital_IOPA_Tooth_19.jpg",
          type: "image",
          size: "1.4 MB",
          url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80",
          uploadedAt: "10:20 AM",
          notes: "Pre-op IOPA radiograph showing periapical lesion tooth #19",
        },
      ],
      prescribedMedicines: [
        { brandName: "Torax 10mg", dosageForm: "Tablet", frequency: "1+0+1", duration: "3 days" },
        { brandName: "Amodis 400mg", dosageForm: "Tablet", frequency: "1+1+1", duration: "5 days" },
        { brandName: "Maxpro 20mg", dosageForm: "Capsule", frequency: "1+0+1", duration: "5 days" },
        { brandName: "Clohex 0.2%", dosageForm: "Oral Rinse", frequency: "1+0+1", duration: "7 days" },
      ],
      billingDetails: {
        invoiceNumber,
        totalAmount: grandTotal,
        discountAmount,
        paidAmount,
        paymentMethod: paymentMethod.toUpperCase(),
        paidAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        receiptNumber: "REC-" + invoiceNumber.replace("INV-", ""),
      },
      badge: "Paid & Logged",
      badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    };

    logPatientActivity(activityEvent);

    // Open receipt modal for printing
    setShowReceiptModal(true);

    toast.success(
      `Invoice #${invoiceNumber} finalized! Payment of ${formatBDT(paidAmount)} recorded via ${paymentMethod.toUpperCase()}. Complete activity logged to Patient History!`
    );
  };

  const getReceiptData = (): ReceiptPdfData => {
    const apt = queuePatients.find((a) => a.id === selectedQueuePatientId);
    return {
      invoiceNumber,
      receiptNumber: "REC-" + invoiceNumber.replace(/^INV-/, ""),
      date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      clinicName,
      clinicTagline,
      clinicAddress,
      clinicPhone,
      clinicLicense,
      doctorName: apt?.doctor?.split(",")?.[0] || "Dr. Sarah Smith",
      doctorDegree: apt?.doctor?.split(",").slice(1).join(",").trim() || "BDS (DU), FCPS (Oral & Maxillofacial Surgery)",
      bmdcReg: "BMDC-DS-18492",
      patientName: patient.name,
      patientId: patient.customId,
      age: patient.age,
      gender: (patient as any).gender || (patient.name.includes("Tabassum") ? "Female" : "Male"),
      phone: patient.phone,
      address: patient.address,
      diagnosis: primaryDiagnosis,
      items: items.map((it, idx) => ({
        id: it.id,
        sl: idx + 1,
        cdtCode: it.cdtCode,
        description: it.description,
        toothNumber: it.toothNumber,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.unitPrice * it.quantity,
      })),
      subtotal,
      discountAmount,
      discountType,
      taxAmount,
      taxRate,
      grandTotal,
      paidAmount,
      balanceDue,
      paymentMethod,
      trxId,
    };
  };

  const handlePrintMoneyReceipt = () => {
    printReceiptWindow(getReceiptData());
  };

  const handleDownloadMoneyReceipt = () => {
    downloadReceiptPdf(getReceiptData());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-600" />
            Dental Billing, Invoicing & POS Studio (BDT / ৳)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Collect consultation & procedure fees in Bangladeshi Taka (৳) via bKash, Nagad, POS Card, and Cash with instant SMS dispatch
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReceiptModal(true)}
            className="gap-1.5 text-xs flex-1 sm:flex-initial"
          >
            <FileText className="h-3.5 w-3.5" />
            Preview Receipt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintMoneyReceipt}
            className="gap-1.5 text-xs bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium flex-1 sm:flex-initial"
          >
            <Printer className="h-3.5 w-3.5" />
            Print 2-Copy A4 Receipt
          </Button>
          <Button
            size="sm"
            onClick={handleFinalizeInvoice}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm w-full sm:w-auto"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Finalize Invoice & Dispatch SMS
          </Button>
        </div>
      </div>

      {/* DROPDOWN: TODAY'S PATIENTS AWAITING BILLING (Handover from Consultation/Rx) */}
      <Card className="border-2 border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Select Today's Patient Awaiting Billing (Completed from Consultation & Rx)
            </span>
            <p className="text-xs text-muted-foreground">
              Automatically populates examination fees, completed procedures, radiograph tests, and prescribed items
            </p>
          </div>

          <div className="w-full sm:w-96">
            <Select value={selectedQueuePatientId} onValueChange={handleSelectPatient}>
              <SelectTrigger className="h-9 text-xs font-medium bg-background border-emerald-400/50">
                <SelectValue placeholder="Select patient awaiting billing..." />
              </SelectTrigger>
              <SelectContent>
                {queuePatients.map((apt) => (
                  <SelectItem key={apt.id} value={apt.id} className="text-xs">
                    <span className="font-bold text-emerald-700 mr-1.5">
                      Serial #{apt.fifoSerial}:
                    </span>
                    {apt.patient} · {apt.service}
                    {apt.status === "completed" ? " (Completed)" : " (In Chair)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* SUCCESS CONFIRMATION BANNER */}
      {isFinalized && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">Invoice #{invoiceNumber} Paid & Patient Discharged!</span>
              <span>
                Payment of {formatBDT(paidAmount)} verified via {paymentMethod.toUpperCase()} (TrxID: {trxId || "N/A"}). Balance due: {formatBDT(balanceDue)}.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReceiptModal(true)}
              className="text-xs bg-background"
            >
              Preview Receipt
            </Button>
            <Button
              size="sm"
              onClick={handlePrintMoneyReceipt}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print 2-Copy A4 Receipt
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Invoice Editor & Line Items */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <span>Invoice #{invoiceNumber}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {clinicName}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Patient: <strong className="text-foreground">{patient.name}</strong> ({patient.customId}) · {patient.address}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  Date: <span className="font-mono font-medium text-foreground">{invoiceDate}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Primary Clinical Diagnosis & Indication Banner */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                      Primary Clinical Diagnosis & Indication:
                    </span>
                    <strong className="text-foreground">{primaryDiagnosis}</strong>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] bg-background border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold self-start sm:self-auto shrink-0">
                  BMDC Clinical Indication
                </Badge>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b text-muted-foreground">
                    <tr>
                      <th className="py-2 px-3 text-left">Code</th>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-2 text-center">Tooth</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Fee (BDT)</th>
                      <th className="py-2 px-3 text-right">Total</th>
                      <th className="py-2 px-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-mono font-semibold text-primary">
                          {item.cdtCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {item.description}
                          <Badge variant="secondary" className="ml-2 text-[9px] uppercase">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">
                          {item.toothNumber || "—"}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {formatBDT(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                          {formatBDT(item.quantity * item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenEditItem(item)}
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              title="Edit procedure fee / details"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeItem(item.id)}
                              className="h-6 w-6 text-muted-foreground hover:text-red-600"
                              title="Remove procedure"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Item Button */}
              <div className="flex justify-between items-center pt-1">
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5 text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5" />
                  Add Additional Procedure / Service
                </Button>
                <span className="text-xs text-muted-foreground">
                  Subtotal: <strong className="text-foreground text-sm font-mono">{formatBDT(subtotal)}</strong>
                </span>
              </div>

              {/* Birthday Privilege Engine Banner */}
              {patient.isBirthdayMonth && (
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Cake className="h-5 w-5 text-amber-600 animate-bounce shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-amber-900 dark:text-amber-300">
                          DentAI Birthday Privilege Rule
                        </span>
                        {discountType === "birthday" ? (
                          <Badge className="bg-amber-600 text-white text-[9px] uppercase font-bold">
                            Applied ({patient.age}%)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 border-amber-400 text-[9px] uppercase font-bold">
                            Available ({patient.age}%)
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-0.5">
                        Patient turns {patient.age} this month. Entitled to {patient.age}% privilege discount on procedures.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {discountType === "birthday" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={removeDiscount}
                        className="text-xs text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:hover:bg-red-950/40 font-semibold gap-1.5 h-8"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove Discount
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={applyBirthdayDiscount}
                        className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold h-8"
                      >
                        Apply {patient.age}% Discount
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Payment Collection & BDT Settlement */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                Payment Collection (BDT / ৳)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              {/* Financial Breakdown */}
              <div className="space-y-2 border-b pb-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Subtotal:</span>
                  <span className="font-mono font-medium">{formatBDT(subtotal)}</span>
                </div>

                {discountAmount > 0 ? (
                  <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Percent className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="font-medium truncate">
                        Discount ({discountType === "birthday" ? `${patient.age}% Birthday Privilege` : discountType === "percentage" ? `${discountValue}%` : `৳${discountValue}`}):
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono font-bold">-{formatBDT(discountAmount)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={removeDiscount}
                        className="h-5 w-5 text-amber-800 hover:text-red-600 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 rounded"
                        title="Remove discount"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-muted-foreground text-xs py-0.5">
                    <span className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Discount:
                    </span>
                    <span className="font-mono text-xs">None (৳0)</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t">
                  <span>Grand Total (BDT):</span>
                  <span className="font-mono text-emerald-600">{formatBDT(grandTotal)}</span>
                </div>
              </div>

              {/* Discount / Concession Controls */}
              <div className="p-2.5 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                    <Percent className="h-3 w-3 text-amber-600" />
                    Discount & Concessions
                  </Label>
                  {discountAmount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeDiscount}
                      className="h-5 px-1.5 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-100/60 dark:hover:bg-red-950/60 font-semibold gap-1"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      Remove Discount
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={removeDiscount}
                    className={`py-1 px-1.5 rounded border font-semibold text-center transition-all ${
                      discountType === "none" || discountAmount === 0
                        ? "bg-foreground text-background border-foreground shadow-2xs"
                        : "bg-background text-muted-foreground hover:bg-muted border-border"
                    }`}
                  >
                    None (0%)
                  </button>
                  {patient.isBirthdayMonth && (
                    <button
                      type="button"
                      onClick={applyBirthdayDiscount}
                      className={`py-1 px-1.5 rounded border font-semibold text-center transition-all ${
                        discountType === "birthday"
                          ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                          : "bg-background text-amber-700 dark:text-amber-400 hover:bg-amber-50 border-amber-300"
                      }`}
                    >
                      B'day ({patient.age}%)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("percentage");
                      if (discountValue <= 0 || discountType === "birthday") setDiscountValue(10);
                    }}
                    className={`py-1 px-1.5 rounded border font-semibold text-center transition-all ${
                      discountType === "percentage"
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                        : "bg-background text-muted-foreground hover:bg-muted border-border"
                    }`}
                  >
                    Percent (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("fixed");
                      if (discountValue <= 0 || discountType === "birthday") setDiscountValue(500);
                    }}
                    className={`py-1 px-1.5 rounded border font-semibold text-center transition-all ${
                      discountType === "fixed"
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                        : "bg-background text-muted-foreground hover:bg-muted border-border"
                    }`}
                  >
                    Fixed (৳)
                  </button>
                </div>

                {discountType === "percentage" && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Rate:</span>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="h-7 text-xs font-mono font-bold pr-6"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-bold">%</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeDiscount}
                      className="h-7 text-[10px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                )}

                {discountType === "fixed" && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Amount:</span>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                        className="h-7 text-xs font-mono font-bold pl-5"
                      />
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-bold">৳</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeDiscount}
                      className="h-7 text-[10px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Payment Gateway / Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bkash")}
                    className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "bkash"
                        ? "bg-pink-50 border-pink-500 text-pink-700 ring-1 ring-pink-500"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5 text-pink-600" />
                    bKash
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("nagad")}
                    className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "nagad"
                        ? "bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5 text-orange-600" />
                    Nagad
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "card"
                        ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                    Card POS
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "cash"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                    Cash BDT
                  </button>
                </div>
              </div>

              {/* TrxID input for mobile banking */}
              {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Transaction ID (TrxID) *</Label>
                  <Input
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. BK-9842104"
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
              )}

              {/* Amount Paid input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold">Amount Received (BDT) *</Label>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(grandTotal)}
                    className="text-[10px] text-primary hover:underline font-semibold"
                  >
                    Pay Full (৳{grandTotal.toLocaleString("en-BD")})
                  </button>
                </div>
                <Input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="h-9 text-xs font-mono font-bold text-emerald-600"
                />
              </div>

              {/* Balance Due Notice */}
              <div className="p-3 rounded-lg border bg-muted/30 flex justify-between items-center text-xs">
                <span className="font-semibold text-muted-foreground">Remaining Balance Due:</span>
                <span className={`font-mono font-bold text-sm ${balanceDue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {formatBDT(balanceDue)}
                </span>
              </div>

              <Button
                onClick={handleFinalizeInvoice}
                className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                Collect Payment & Complete Visit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PRINTABLE BILL RECEIPT MODAL */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0 bg-background border shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                  Official Money Receipt (2-Copy Duplicate A4 Layout)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Single A4 portrait sheet formatted with Patient Copy (Top) and Office Copy (Bottom) separated by a perforation cut line with manual signature placeholders.
                </DialogDescription>
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold self-start sm:self-auto shrink-0">
                Single A4 Ready
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-4 bg-muted/10">
            {/* TOP HALF: PATIENT COPY */}
            <ModalReceiptSlip
              copyTitle="PATIENT COPY"
              badgeBg="bg-emerald-600 text-white"
              data={getReceiptData()}
            />

            {/* PERFORATION CUT LINE DIVIDER */}
            <div className="flex items-center gap-3 py-1 text-xs font-mono text-muted-foreground select-none">
              <div className="flex-1 border-t-2 border-dashed border-muted-foreground/40" />
              <div className="flex items-center gap-2 px-3 py-1 bg-background border rounded-full text-[10px] uppercase font-bold tracking-widest text-muted-foreground shadow-2xs">
                <Scissors className="h-3.5 w-3.5 text-emerald-600" />
                <span>✂ Cut or Tear Here · Patient Copy (Top) / Office Copy (Bottom) ✂</span>
                <Scissors className="h-3.5 w-3.5 text-emerald-600 rotate-180" />
              </div>
              <div className="flex-1 border-t-2 border-dashed border-muted-foreground/40" />
            </div>

            {/* BOTTOM HALF: OFFICE / CLINIC COPY */}
            <ModalReceiptSlip
              copyTitle="OFFICE / CLINIC COPY"
              badgeBg="bg-slate-700 text-white dark:bg-slate-800"
              data={getReceiptData()}
            />
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t flex flex-row items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowReceiptModal(false)} className="text-xs">
              Close Preview
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMoneyReceipt}
                className="gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Download HTML Receipt
              </Button>
              <Button
                size="sm"
                onClick={handlePrintMoneyReceipt}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                Print 2-Copy A4 Money Receipt
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 1: ADD BLANK / CUSTOM PROCEDURE TO INVOICE ── */}
      <Dialog open={isAddProcedureOpen} onOpenChange={setIsAddProcedureOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Add Clinical Procedure / Service Line
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter procedure details, quantity, tooth number, and fee in Bangladeshi Taka (৳)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmAddProcedure} className="space-y-3.5 text-xs py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Procedure / Service Description *</Label>
              <Input
                value={newProcedureForm.description}
                onChange={(e) => setNewProcedureForm({ ...newProcedureForm, description: e.target.value })}
                placeholder="e.g. Composite Restoration (Class II), Root Canal, Scaling..."
                className="h-8 text-xs font-semibold"
                required
              />
              {/* Quick suggestion pills */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[
                  "Composite Restoration (Tooth #19)",
                  "Root Canal Therapy (Molar)",
                  "Full Mouth Ultrasonic Scaling & Polish",
                  "Surgical Extraction of Impacted Wisdom Tooth",
                  "Monolithic Zirconia Crown (#30)",
                  "Gingivectomy & Crown Lengthening",
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setNewProcedureForm({ ...newProcedureForm, description: sug })}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border transition-all"
                  >
                    + {sug.split("(")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tooth # / Region</Label>
                <Input
                  value={newProcedureForm.toothNumber}
                  onChange={(e) => setNewProcedureForm({ ...newProcedureForm, toothNumber: e.target.value })}
                  placeholder="e.g. #19, #30, Full Arch"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category</Label>
                <Select
                  value={newProcedureForm.category}
                  onValueChange={(val: "procedure" | "consultation" | "medicine" | "lab" | "other") =>
                    setNewProcedureForm({ ...newProcedureForm, category: val })
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="procedure" className="text-xs">Clinical Procedure</SelectItem>
                    <SelectItem value="consultation" className="text-xs">Doctor Consultation</SelectItem>
                    <SelectItem value="lab" className="text-xs">Lab / Diagnostic Test</SelectItem>
                    <SelectItem value="medicine" className="text-xs">Medicine / Pharmacotherapy</SelectItem>
                    <SelectItem value="other" className="text-xs">Other Operatory Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={newProcedureForm.quantity}
                  onChange={(e) => setNewProcedureForm({ ...newProcedureForm, quantity: Number(e.target.value) || 1 })}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Unit Fee (BDT / ৳) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={newProcedureForm.unitPrice}
                  onChange={(e) => setNewProcedureForm({ ...newProcedureForm, unitPrice: Number(e.target.value) || 0 })}
                  className="h-8 text-xs font-mono font-bold text-emerald-700"
                  required
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/40 border flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Calculated Line Total:</span>
              <span className="font-mono font-bold text-sm text-foreground">
                {formatBDT((Number(newProcedureForm.quantity) || 1) * (Number(newProcedureForm.unitPrice) || 0))}
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddProcedureOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Add to Invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: EDIT EXISTING PROCEDURE IN INVOICE ── */}
      <Dialog open={isEditProcedureOpen} onOpenChange={setIsEditProcedureOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Procedure Line Item
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update procedure description, tooth number, quantity, or fee in BDT
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleConfirmEditItem} className="space-y-3.5 text-xs py-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Procedure Description *</Label>
                <Input
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="h-8 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tooth # / Region</Label>
                  <Input
                    value={editingItem.toothNumber || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, toothNumber: e.target.value })}
                    className="h-8 text-xs font-mono"
                    placeholder="e.g. #19"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Category</Label>
                  <Select
                    value={editingItem.category}
                    onValueChange={(val: "procedure" | "consultation" | "medicine" | "lab" | "other") =>
                      setEditingItem({ ...editingItem, category: val })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="procedure" className="text-xs">Clinical Procedure</SelectItem>
                      <SelectItem value="consultation" className="text-xs">Doctor Consultation</SelectItem>
                      <SelectItem value="lab" className="text-xs">Lab / Diagnostic Test</SelectItem>
                      <SelectItem value="medicine" className="text-xs">Medicine / Pharmacotherapy</SelectItem>
                      <SelectItem value="other" className="text-xs">Other Operatory Fee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) || 1 })}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Unit Fee (BDT / ৳) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) || 0 })}
                    className="h-8 text-xs font-mono font-bold text-emerald-700"
                    required
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/40 border flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Updated Line Total:</span>
                <span className="font-mono font-bold text-sm text-foreground">
                  {formatBDT((Number(editingItem.quantity) || 1) * (Number(editingItem.unitPrice) || 0))}
                </span>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditProcedureOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
