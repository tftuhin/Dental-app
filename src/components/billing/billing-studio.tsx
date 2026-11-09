"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Receipt, Plus, Trash2, Cake, Printer, CreditCard, Banknote, Percent, CheckCircle2, ShieldCheck, Smartphone, Clock, FileText, Edit, Stethoscope, Scissors, Download, X } from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import {
  BillSegment,
  ClinicalQueuePatient,
  getStoredAppointments,
  logPatientActivity,
  getVisit,
  updateVisit,
  toISODate,
} from "@/lib/clinical-flow-store";
import { getPatientById, updatePatient } from "@/lib/patients-store";
import { buildReceiptFromInvoice, netPaid, recalcPatientOutstanding } from "@/lib/billing-store";
import { CATEGORY_LABELS } from "@/lib/procedures-catalog-store";
import { DuePayments, CollectDueDialog } from "@/components/billing/due-payments";
import { RefundDialog, RefundsPanel } from "@/components/billing/refunds";
import { PageHeader } from "@/components/layout/page-header";
import { getDefaultConsultationItem } from "@/lib/procedures-catalog-store";
import { VisitStepper } from "@/components/clinical/visit-stepper";
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
  /** Revenue group for reports (examination, surgery, ...), when known from the visit. */
  segment?: BillSegment;
}

/** Bill-editor category for a revenue group. */
function uiCategoryOf(seg: BillSegment): InvoiceLineItem["category"] {
  if (seg === "consultation") return "consultation";
  if (seg === "consumable") return "medicine";
  if (seg === "examination") return "lab";
  return "procedure";
}

/** Revenue group of a bill line; follows the category if staff changed it. */
function segmentFor(it: InvoiceLineItem): BillSegment {
  if (it.segment && uiCategoryOf(it.segment) === it.category) return it.segment;
  if (it.category === "consultation") return "consultation";
  if (it.category === "medicine") return "consumable";
  if (it.category === "lab") return "examination";
  return "procedure";
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
            <span>Official medical tax invoice & hospital money receipt authenticated under DentalOSbd.</span>
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
            Patient / Depositor&apos;s Signature
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

/** Today's visits that reached billing (or were billed today), by serial. */
function todaysBillingQueue(): ClinicalQueuePatient[] {
  const today = toISODate();
  return getStoredAppointments()
    .filter((a) => a._view !== "private" && (a.date || today) === today && (a.stage === "billing" || a.stage === "done"))
    .sort((a, b) => (a.fifoSerial || 0) - (b.fifoSerial || 0));
}

export function BillingStudio() {
  const searchParams = useSearchParams();

  // Clinic Setup Data from settings store
  const [clinic, setClinic] = useState<ClinicSetupData | null>(() => getClinicSetup());

  useEffect(() => {
    const handleClinicUpdate = () => setClinic(getClinicSetup());
    window.addEventListener("dentai-clinic-setup-updated", handleClinicUpdate);
    return () => window.removeEventListener("dentai-clinic-setup-updated", handleClinicUpdate);
  }, []);

  const clinicName = clinic?.name || "Dhaka Dental Care & Maxillofacial Implant Hospital";
  const clinicTagline = clinic?.tagline || "Advanced Microscopic Endodontics, Oral Surgery & Dental Implantology Centre";
  const clinicAddress = clinic?.address || "House 42, Road 7A, Dhanmondi R/A, Dhaka-1209, Bangladesh";
  const clinicPhone = clinic?.phone || "+880 1712-345678";
  const clinicLicense = clinic?.bmdcLicense || "DGHS/DH-2024/9912 · BMDC Approved";

  // Today's visits that reached billing (or were billed today)
  const [queuePatients, setQueuePatients] = useState<ClinicalQueuePatient[]>(todaysBillingQueue);
  const [selectedQueuePatientId, setSelectedQueuePatientId] = useState<string>("");
  const [visit, setVisit] = useState<ClinicalQueuePatient | undefined>();

  // Patient on the bill. Starts empty until a visit is selected.
  const [patient, setPatient] = useState({
    name: "",
    customId: "",
    age: 0,
    gender: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    isBirthdayMonth: false,
  });

  const [primaryDiagnosis, setPrimaryDiagnosis] = useState("");

  // Add Procedure Blank Form Dialog State
  const [isAddProcedureOpen, setIsAddProcedureOpen] = useState(false);
  const [newProcedureForm, setNewProcedureForm] = useState<Omit<InvoiceLineItem, "id">>({
    cdtCode: "",
    description: "",
    toothNumber: "",
    category: "procedure",
    quantity: 1,
    unitPrice: 0,
  });

  // Edit Existing Procedure Dialog State
  const [isEditProcedureOpen, setIsEditProcedureOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceLineItem | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate] = useState(new Date().toISOString().split("T")[0]);

  const [items, setItems] = useState<InvoiceLineItem[]>([]);

  const [discountType, setDiscountType] = useState<"none" | "fixed" | "percentage" | "birthday">("none");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const taxRate = 0; // no VAT on dental services; kept so receipts show the line if added later
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [trxId, setTrxId] = useState("");
  const [isFinalized, setIsFinalized] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [collectDueOpen, setCollectDueOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const loadQueue = () => setQueuePatients(todaysBillingQueue());

  // Keep today's billing queue in step with the visit store
  useEffect(() => {
    const loadQueue = () => setQueuePatients(todaysBillingQueue());
    window.addEventListener("dentai-appointments-updated", loadQueue);
    return () => window.removeEventListener("dentai-appointments-updated", loadQueue);
  }, []);

  // Open the visit from the link (?visitId=), just after rendering
  useEffect(() => {
    const paramVisitId = searchParams?.get("visitId") || searchParams?.get("patientId");
    if (!paramVisitId) return;
    const t = setTimeout(() => {
      const chosen = getVisit(paramVisitId);
      if (chosen) loadVisitForBilling(chosen);
    }, 0);
    return () => clearTimeout(t);
  }, [searchParams]);

  const handleSelectPatient = (visitId: string) => {
    const chosen = getVisit(visitId);
    if (chosen) loadVisitForBilling(chosen);
  };

  /**
   * The bill is built only from what was recorded in the visit:
   * consultation fee + examinations/procedures/surgery + medicines & disposables used.
   */
  function loadVisitForBilling(chosen: ClinicalQueuePatient) {
    const record = getPatientById(chosen.patientRecordId || chosen.patientId);
    const dob = record?.dob || "";
    const isBirthdayMonth = !!dob && new Date(dob).getMonth() === new Date().getMonth();

    setVisit(chosen);
    setSelectedQueuePatientId(chosen.id);
    setPatient({
      name: chosen.patient,
      customId: chosen.patientId,
      age: chosen.age,
      gender: chosen.gender || record?.gender || "",
      phone: chosen.phone,
      address: chosen.address,
      dateOfBirth: dob,
      isBirthdayMonth,
    });
    setPrimaryDiagnosis(chosen.prescription?.diagnosis || chosen.provisionalDiagnosis || "");

    const lines: InvoiceLineItem[] = [];
    // Paid at check-in: the consultation already has its own bill
    const consult = chosen.checkInInvoice ? undefined : getDefaultConsultationItem(!!chosen.isFollowUp);
    if (consult) {
      lines.push({
        id: `item-${chosen.id}-consult`,
        cdtCode: consult.code,
        description: consult.name,
        toothNumber: "",
        category: "consultation",
        segment: "consultation",
        quantity: 1,
        unitPrice: consult.price,
      });
    }
    for (const p of chosen.procedures || []) {
      lines.push({
        id: p.id,
        cdtCode: p.code,
        description: p.name,
        toothNumber: p.toothNumber || "",
        category: uiCategoryOf(p.category),
        segment: p.category,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
      });
    }
    for (const c of chosen.consumables || []) {
      lines.push({
        id: c.id,
        cdtCode: c.code,
        description: c.name,
        toothNumber: "",
        category: "medicine",
        segment: "consumable",
        quantity: c.quantity,
        unitPrice: c.unitPrice,
      });
    }
    // A finalized bill reloads exactly as issued (catalog prices may have changed since)
    const issued = chosen.invoice?.items;
    setItems(
      issued && issued.length > 0
        ? issued.map((it, i) => ({
            id: `item-issued-${i}`,
            cdtCode: it.code,
            description: it.description,
            toothNumber: it.toothNumber || "",
            category: it.category ? uiCategoryOf(it.category) : ("procedure" as const),
            segment: it.category,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          }))
        : lines
    );

    const inv = chosen.invoice;
    setInvoiceNumber(
      inv?.invoiceNumber ||
        `INV-${toISODate().replace(/-/g, "")}-${String(chosen.fifoSerial || 0).padStart(3, "0")}`
    );
    setDiscountType(inv && inv.discountAmount > 0 ? "fixed" : "none");
    setDiscountValue(inv?.discountAmount || 0);
    setPaidAmount(inv?.paidAmount || 0);
    setPaymentMethod(inv?.paymentMethod || "cash");
    setTrxId("");
    setIsFinalized(!!inv);

    if (!chosen.prescriptionDone) {
      toast.warning(`${chosen.patient}'s prescription has not been signed yet.`);
    }
  }

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

  // Record the payment, close the visit and log it to the patient's history
  const handleFinalizeInvoice = () => {
    if (!visit) {
      toast.error("Select a patient to bill first.");
      return;
    }
    if (visit.invoice) {
      toast.error(
        visit.invoice.balanceDue > 0
          ? "This bill is already finalized. Use Collect Due Payment for the remaining amount."
          : "This bill is already paid."
      );
      return;
    }
    if (items.length === 0) {
      if (visit.checkInInvoice) {
        // Only the consultation, already paid at check-in: nothing more to bill
        updateVisit(visit.id, { billed: true, stage: "done" });
        setVisit(getVisit(visit.id));
        loadQueue();
        toast.success(`${visit.patient}'s visit is complete. The consultation fee was paid at check-in.`);
        return;
      }
      toast.error("The bill has no items.");
      return;
    }
    if (!(paidAmount > 0) && grandTotal > 0) {
      toast.error("Enter the amount the patient paid before finalizing.");
      return;
    }
    if (paidAmount < grandTotal && !confirm(`Patient is paying ${formatBDT(paidAmount)} of ${formatBDT(grandTotal)}. Record ${formatBDT(balanceDue)} as due?`)) {
      return;
    }

    const receiptNumber = "REC-" + invoiceNumber.replace(/^INV-/, "");
    const paidAt = new Date().toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });

    updateVisit(visit.id, {
      billed: true,
      stage: "done",
      invoice: {
        invoiceNumber,
        receiptNumber,
        subtotal,
        discountAmount,
        discountType,
        taxAmount,
        taxRate,
        total: grandTotal,
        paidAmount,
        balanceDue,
        paymentMethod,
        paidAt,
        diagnosis: primaryDiagnosis,
        items: items.map((it) => ({
          code: it.cdtCode,
          description: it.description,
          toothNumber: it.toothNumber,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          category: segmentFor(it),
        })),
        payments: [
          {
            id: "pay-initial",
            amount: paidAmount,
            method: paymentMethod,
            trxId: trxId || undefined,
            paidAt: new Date().toISOString(),
            receiptNumber,
          },
        ],
      },
    });
    const saved = getVisit(visit.id);
    setVisit(saved);

    // Patient's outstanding balance = sum of all their unpaid bills
    if (saved) recalcPatientOutstanding(saved);
    const record = getPatientById(visit.patientRecordId || visit.patientId);
    if (record) updatePatient(record.id, { status: "active" });

    logPatientActivity({
      id: `ev-${visit.id}-invoice`,
      patientId: visit.patientId,
      date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
      timestamp: Date.now(),
      type: "invoice",
      title: `Bill paid (${invoiceNumber})`,
      doctor: visit.doctor,
      chair: visit.chair,
      chiefComplaint: visit.chiefComplaint || undefined,
      provisionalDiagnosis: primaryDiagnosis || undefined,
      prescribedMedicines: visit.prescription?.medicines,
      billingDetails: {
        invoiceNumber,
        totalAmount: grandTotal,
        discountAmount,
        paidAmount,
        paymentMethod: paymentMethod.toUpperCase(),
        paidAt,
        receiptNumber,
      },
      badge: balanceDue > 0 ? "Part Paid" : "Paid",
      badgeColor:
        balanceDue > 0
          ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
          : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    });

    setIsFinalized(true);
    setShowReceiptModal(true);
    loadQueue();
    toast.success(
      `Payment of ${formatBDT(paidAmount)} recorded for ${visit.patient}.${balanceDue > 0 ? ` Due: ${formatBDT(balanceDue)}.` : ""}`
    );
  };

  const getReceiptData = (): ReceiptPdfData => {
    if (visit?.invoice) {
      const fromInvoice = buildReceiptFromInvoice(visit);
      if (fromInvoice) return fromInvoice;
    }
    // The visit's doctor, with degree and registration from Settings → Clinic Setup
    const doctorName = visit?.doctor?.split(",")[0]?.trim() || "";
    const doctor = clinic?.doctors?.find((d) => d.name === doctorName);
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
      doctorName: doctorName,
      doctorDegree: doctor?.degree || visit?.doctor?.split(",").slice(1).join(",").trim() || "",
      bmdcReg: doctor?.bmdcReg || "",
      patientName: patient.name,
      patientId: patient.customId,
      age: patient.age,
      gender: patient.gender,
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

  // The receipt is printed only after the payment is recorded
  const handlePrintMoneyReceipt = () => {
    if (!isFinalized) {
      toast.error("Record the payment first. The receipt prints after the bill is finalized.");
      return;
    }
    printReceiptWindow(getReceiptData());
  };

  const handleDownloadMoneyReceipt = () => {
    if (!isFinalized) {
      toast.error("Record the payment first. The receipt prints after the bill is finalized.");
      return;
    }
    downloadReceiptPdf(getReceiptData());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Bills are built from the visit: consultation, procedures and items used. Partial payments stay as dues."
        actions={
          visit && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowReceiptModal(true)} className="gap-1.5">
                <FileText className="h-4 w-4" />
                Preview receipt
              </Button>
              {visit.invoice ? (
                <Button size="sm" onClick={handlePrintMoneyReceipt} className="gap-1.5">
                  <Printer className="h-4 w-4" />
                  Print receipt
                </Button>
              ) : (
                <Button size="sm" onClick={handleFinalizeInvoice} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {items.length === 0 && visit.checkInInvoice ? "Complete visit" : "Record payment & finalize"}
                </Button>
              )}
            </>
          )
        }
      />

      {/* DROPDOWN: TODAY'S PATIENTS AWAITING BILLING (Handover from Consultation/Rx) */}
      <Card className="p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Patient to bill
            </span>
            <p className="text-xs text-muted-foreground">
              Today&apos;s patients whose prescription is done. Older unpaid bills are under Outstanding Dues.
            </p>
          </div>

          <div className="w-full sm:w-96">
            <Select value={selectedQueuePatientId} onValueChange={handleSelectPatient}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="Select patient awaiting billing..." />
              </SelectTrigger>
              <SelectContent>
                {queuePatients.length === 0 && !visit && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No patients waiting for billing today.</div>
                )}
                {queuePatients.map((apt) => (
                  <SelectItem key={apt.id} value={apt.id} className="text-xs">
                    <span className="font-bold text-emerald-700 mr-1.5">
                      Serial #{apt.fifoSerial}:
                    </span>
                    {apt.patient} ({apt.patientId})
                    {apt.stage === "done" ? " · Paid" : " · Awaiting payment"}
                  </SelectItem>
                ))}
                {visit && !queuePatients.some((a) => a.id === visit.id) && (
                  <SelectItem value={visit.id} className="text-xs">
                    Serial #{visit.fifoSerial}: {visit.patient} ({visit.patientId})
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        {visit && (
          <div className="mt-3 pt-3 border-t border-emerald-500/20">
            <VisitStepper
              visitId={visit.id}
              current="billing"
              reached={visit.stage}
              skippedProcedure={(visit.procedures?.length ?? 0) === 0}
            />
          </div>
        )}
      </Card>

      {/* Bills with money still owed, from any day */}
      <DuePayments onOpenBill={(id) => handleSelectPatient(id)} />

      {/* Give money back on any paid bill */}
      <RefundsPanel />

      {visit?.invoice && (
        <RefundDialog
          visitId={visit.id}
          kind="invoice"
          open={refundOpen}
          onOpenChange={setRefundOpen}
          onRefunded={(fresh) => loadVisitForBilling(fresh)}
        />
      )}

      {visit?.invoice && visit.invoice.balanceDue > 0 && (
        <CollectDueDialog
          visitId={visit.id}
          open={collectDueOpen}
          onOpenChange={setCollectDueOpen}
          onPaid={() => {
            const fresh = getVisit(visit.id);
            if (fresh) loadVisitForBilling(fresh);
          }}
        />
      )}

      {!visit && (
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
          Select a patient above. Their bill is built from today&apos;s consultation, procedures and items used.
        </Card>
      )}

      {/* SUCCESS CONFIRMATION BANNER */}
      {isFinalized && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">
                {visit?.invoice && visit.invoice.balanceDue > 0
                  ? `Invoice #${invoiceNumber} partly paid · ${formatBDT(visit.invoice.balanceDue)} still due`
                  : `Invoice #${invoiceNumber} paid in full`}
              </span>
              <span>
                Paid so far: {formatBDT(visit?.invoice?.paidAmount ?? paidAmount)} of {formatBDT(visit?.invoice?.total ?? grandTotal)}.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {visit?.invoice && visit.invoice.balanceDue > 0 && (
              <Button
                size="sm"
                onClick={() => setCollectDueOpen(true)}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                Collect Due Payment
              </Button>
            )}
            {visit?.invoice && netPaid(visit.invoice) > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefundOpen(true)}
                className="text-xs bg-background text-rose-700 border-rose-300"
              >
                Refund
              </Button>
            )}
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
              Print Receipt (2 Copies, Landscape)
            </Button>
          </div>
        </div>
      )}

      {visit && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Invoice Editor & Line Items */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold break-all">
                    Invoice <span className="font-mono">#{invoiceNumber}</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <strong className="text-foreground">{patient.name}</strong> ({patient.customId})
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

              {visit.checkInInvoice && (
                <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-50/60 dark:bg-sky-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span>
                    <strong>Consultation fee {formatBDT(visit.checkInInvoice.total)} paid at check-in</strong>{" "}
                    <span className="font-mono text-muted-foreground">({visit.checkInInvoice.invoiceNumber})</span>. This
                    bill covers the other charges only.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] gap-1 bg-background shrink-0"
                    onClick={() => {
                      const r = buildReceiptFromInvoice(visit, undefined, visit.checkInInvoice);
                      if (r) printReceiptWindow(r);
                    }}
                  >
                    <Printer className="h-3 w-3" />
                    Check-in receipt
                  </Button>
                </div>
              )}

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
                            {CATEGORY_LABELS[segmentFor(item)].split(" ")[0]}
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
                      B&apos;day ({patient.age}%)
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
                {items.length === 0 && visit.checkInInvoice ? "Complete Visit (nothing more to bill)" : "Collect Payment & Complete Visit"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* PRINTABLE BILL RECEIPT MODAL */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-4xl xl:max-w-[1400px] max-h-[92vh] overflow-y-auto p-0 bg-background border shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                  Official Money Receipt (2 Copies, A4 Landscape)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  One A4 landscape sheet: Patient Copy on the left, Office Copy on the right, with a cut line down the middle.
                </DialogDescription>
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold self-start sm:self-auto shrink-0">
                Single A4 Ready
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 bg-muted/10 grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
            {/* LEFT: PATIENT COPY */}
            <ModalReceiptSlip
              copyTitle="PATIENT COPY"
              badgeBg="bg-emerald-600 text-white"
              data={getReceiptData()}
            />

            {/* CUT LINE: vertical when side by side (wide screens), horizontal when stacked */}
            <div className="flex xl:flex-col items-center gap-3 py-1 xl:py-0 xl:px-1 text-xs font-mono text-muted-foreground select-none">
              <div className="flex-1 border-t-2 xl:border-t-0 xl:border-l-2 border-dashed border-muted-foreground/40 xl:self-center xl:w-0" />
              <div className="flex xl:flex-col items-center gap-2 px-3 py-1 xl:px-1 xl:py-3 bg-background border rounded-full text-[10px] uppercase font-bold tracking-widest text-muted-foreground shadow-2xs">
                <Scissors className="h-3.5 w-3.5 text-emerald-600" />
                <span className="xl:[writing-mode:vertical-rl] whitespace-nowrap">Cut here · Patient (left) / Office (right)</span>
                <Scissors className="h-3.5 w-3.5 text-emerald-600 rotate-180" />
              </div>
              <div className="flex-1 border-t-2 xl:border-t-0 xl:border-l-2 border-dashed border-muted-foreground/40 xl:self-center xl:w-0" />
            </div>

            {/* RIGHT: OFFICE / CLINIC COPY */}
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
                Print Receipt (2 Copies, Landscape)
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
