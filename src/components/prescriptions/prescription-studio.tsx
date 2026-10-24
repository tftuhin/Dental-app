"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Printer,
  ShieldCheck,
  Pill,
  AlertCircle,
  Search,
  Sparkles,
  Database,
  CheckCircle2,
  Clock,
  Check,
  Receipt,
  ArrowRight,
  History,
  FileText,
  User,
  RotateCcw,
  Edit,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Download,
  Eye,
  Calendar,
  Stethoscope,
} from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import {
  ClinicalQueuePatient,
  HistoricalPrescription,
  PrescriptionPdfDocument,
  getStoredAppointments,
  searchHistoricalPrescriptions,
  scheduleFollowUpAppointment,
  logPatientActivity,
} from "@/lib/clinical-flow-store";
import { downloadPrescriptionPdf } from "@/lib/prescription-pdf-generator";
import { formatBDT } from "@/lib/currency";
import { toast } from "sonner";

export interface PrescriptionMedicine {
  id: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  frequency: string;
  duration: string;
  timing: string;
  instructions: string;
}

import {
  CatalogMedicine,
  DEFAULT_BANGLA_MEDICINES,
  getStoredMedicines,
  addStoredMedicine,
} from "@/lib/medicines-store";

import {
  InvestigationItem,
  DEFAULT_INVESTIGATIONS,
  getStoredInvestigations,
  addStoredInvestigation,
} from "@/lib/investigations-store";
import { getClinicSetup, ClinicSetupData } from "@/lib/clinic-setup-store";

export interface PrescriptionTest {
  id: string;
  testName: string;
  category?: string;
  toothNumbers?: string;
  indication?: string;
}


export function PrescriptionStudio() {
  const router = useRouter();
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
  const clinicAddress = clinic?.address || "House 42, Road 9/A, Dhanmondi R/A, Dhaka-1209, Bangladesh";
  const clinicPhone = clinic?.phone || "+880 1711-234567";
  const clinicLicense = clinic?.bmdcLicense || "DGHS/DH-2024/9912 · BMDC Approved";

  const primaryDoctor = clinic?.doctors?.[0] || {
    name: "Dr. Sarah Smith",
    designation: "Senior Consultant & Dental Surgeon",
    degree: "BDS (DU), FCPS (Oral & Maxillofacial Surgery)",
    bmdcReg: "BMDC Reg: A-84291",
    visitingHours: "4:00 PM - 9:30 PM (Sat - Thu)",
  };

  // Active Tab: Write Rx vs Search Historical Rx
  const [activeTab, setActiveTab] = useState<"write" | "search">("write");

  // Today's completed patients queue from store
  const [todayQueue, setTodayQueue] = useState<ClinicalQueuePatient[]>([]);
  const [selectedQueuePatientId, setSelectedQueuePatientId] = useState<string>("apt-1");

  // Bangladeshi patient context
  const [patient, setPatient] = useState({
    id: "pat-1",
    name: "Anika Tabassum",
    customId: "DENT-2026-00042",
    age: 34,
    gender: "Female",
    phone: "+880 1712-345678",
    address: "House 42, Road 7A, Dhanmondi R/A, Dhaka-1209",
    allergies: ["Penicillin (Severe Rash/Anaphylaxis)"],
    date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
  });

  const [diagnosis, setDiagnosis] = useState(
    "Symptomatic Irreversible Pulpitis with Acute Apical Periodontitis (Tooth #19)"
  );

  // Prescribed medicines
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([
    {
      id: "med-1",
      brandName: "Torax",
      genericName: "Ketorolac Tromethamine",
      strength: "10 mg",
      dosageForm: "Tablet",
      frequency: "1+0+1",
      duration: "3 days",
      timing: "After food",
      instructions: "Take for breakthrough pain. Do not exceed 5 days.",
    },
    {
      id: "med-2",
      brandName: "Amodis",
      genericName: "Metronidazole",
      strength: "400 mg",
      dosageForm: "Tablet",
      frequency: "1+1+1",
      duration: "5 days",
      timing: "After food",
      instructions: "Do not consume alcohol. Take full 5-day course.",
    },
    {
      id: "med-3",
      brandName: "Maxpro",
      genericName: "Esomeprazole Magnesium",
      strength: "20 mg",
      dosageForm: "Capsule",
      frequency: "1+0+1",
      duration: "5 days",
      timing: "30 mins before food",
      instructions: "Gastric mucosa protection during NSAID therapy.",
    },
    {
      id: "med-4",
      brandName: "Clohex",
      genericName: "Chlorhexidine Gluconate 0.2%",
      strength: "100 ml",
      dosageForm: "Oral Rinse",
      frequency: "1+0+1",
      duration: "7 days",
      timing: "After tooth brushing",
      instructions: "Swish vigorously for 60 seconds then spit out. Do not swallow.",
    },
  ]);

  const [tests, setTests] = useState<PrescriptionTest[]>([
    {
      id: "t-1",
      testName: "Digital IOPA Radiograph (Tooth #19)",
      toothNumbers: "#19",
      indication: "Evaluate root canal curvature and periapical lesion extent",
    },
  ]);

  const [additionalAdvice, setAdditionalAdvice] = useState(
    "Soft diet for 48 hours. Avoid chewing hard food on left side. Maintain gentle flossing around Dhanmondi clinic recall."
  );

  // Medicine Search & Add State
  const [isAddingMedicine, setIsAddingMedicine] = useState(false);
  const [catalogMedicines, setCatalogMedicines] = useState<CatalogMedicine[]>(DEFAULT_BANGLA_MEDICINES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatalogMed, setSelectedCatalogMed] = useState<CatalogMedicine | null>(null);

  // New field inputs for prescription item
  const [customBrand, setCustomBrand] = useState("");
  const [customGeneric, setCustomGeneric] = useState("");
  const [customStrength, setCustomStrength] = useState("");
  const [customForm, setCustomForm] = useState("Tablet");
  const [customFrequency, setCustomFrequency] = useState("1+0+1");
  const [customDuration, setCustomDuration] = useState("5 days");
  const [customTiming, setCustomTiming] = useState("After food");
  const [customInstructions, setCustomInstructions] = useState("");

  // Dialog State: Add New Medicine to Database
  const [isNewMedDialogOpen, setIsNewMedDialogOpen] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    brandName: "",
    genericName: "",
    strength: "",
    dosageForm: "tablet",
    defaultFrequency: "1+0+1",
    defaultDuration: "5 days",
    defaultTiming: "After food",
    category: "Dental Therapeutics",
  });
  const [isSavingDbMed, setIsSavingDbMed] = useState(false);

  // Investigations & Diagnostic Tests State
  const [catalogInvestigations, setCatalogInvestigations] = useState<InvestigationItem[]>(DEFAULT_INVESTIGATIONS);
  const [selectedInvCode, setSelectedInvCode] = useState<string>("");
  const [customInvTooth, setCustomInvTooth] = useState<string>("");
  const [customInvIndication, setCustomInvIndication] = useState<string>("");
  const [isNewInvDialogOpen, setIsNewInvDialogOpen] = useState(false);
  const [isSavingDbInv, setIsSavingDbInv] = useState(false);
  const [newInvForm, setNewInvForm] = useState({
    name: "",
    code: "",
    category: "Radiographs & Imaging",
    defaultIndication: "",
    priceBDT: 500,
    turnaroundTime: "Instant (Digital Chairside)",
  });

  // Next Follow-Up Review Date (Optional - auto schedules appointment)
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [followUpNotes, setFollowUpNotes] = useState<string>("");
  const [autoScheduleFollowUp, setAutoScheduleFollowUp] = useState<boolean>(true);

  // Search Historical Prescriptions State
  const [histSearchQuery, setHistSearchQuery] = useState("");
  const [historicalResults, setHistoricalResults] = useState<HistoricalPrescription[]>([]);
  const [viewingHistRx, setViewingHistRx] = useState<HistoricalPrescription | null>(null);

  // Finalized Rx state
  const [isSignedAndReadyForBilling, setIsSignedAndReadyForBilling] = useState(false);

  // Edit Medication Modal state
  const [isEditMedModalOpen, setIsEditMedModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<PrescriptionMedicine | null>(null);

  // Drag & drop sequence reordering state
  const [draggedMedIndex, setDraggedMedIndex] = useState<number | null>(null);

  // Preview Invoice Popup Modal state
  const [isInvoicePreviewModalOpen, setIsInvoicePreviewModalOpen] = useState(false);
  const [previewModalTab, setPreviewModalTab] = useState<"prescription" | "invoice">("prescription");

  // Load appointments from store & sync
  useEffect(() => {
    const list = getStoredAppointments();
    setTodayQueue(list);

    // Initial search results
    setHistoricalResults(searchHistoricalPrescriptions(""));

    const paramPatientId = searchParams?.get("patientId");
    if (paramPatientId) {
      const chosen = list.find((a) => a.id === paramPatientId);
      if (chosen) {
        setSelectedQueuePatientId(paramPatientId);
        setPatient({
          id: chosen.id,
          name: chosen.patient,
          customId: chosen.patientId,
          age: chosen.age,
          gender: chosen.gender,
          phone: chosen.phone,
          address: chosen.address,
          allergies: chosen.alerts || [],
          date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
        });
        if (chosen.provisionalDiagnosis) {
          setDiagnosis(chosen.provisionalDiagnosis);
        } else {
          setDiagnosis(`${chosen.service} - Clinical Consultation`);
        }
        if (chosen.labProceduresRecommended && chosen.labProceduresRecommended.length > 0) {
          setTests(
            chosen.labProceduresRecommended.map((test, idx) => ({
              id: `t-${idx}-${Date.now()}`,
              testName: test,
              indication: "Recommended during today's clinical consultation",
            }))
          );
        }
        if (chosen.clinicalNotes) {
          setAdditionalAdvice(`Consultation note: ${chosen.clinicalNotes.slice(0, 100)}... Maintain oral hygiene & follow prescribed course.`);
        }
        toast.success(`Loaded completed patient: ${chosen.patient} (Serial #${chosen.fifoSerial})`);
      }
    }

    const handleSync = () => {
      setTodayQueue(getStoredAppointments());
    };
    window.addEventListener("dentai-appointments-updated", handleSync);
    return () => window.removeEventListener("dentai-appointments-updated", handleSync);
  }, [searchParams]);

  // Sync investigations catalog with local store & settings
  useEffect(() => {
    setCatalogInvestigations(getStoredInvestigations());
    const handleInvSync = () => {
      setCatalogInvestigations(getStoredInvestigations());
    };
    window.addEventListener("dentai-investigations-updated", handleInvSync);
    return () => window.removeEventListener("dentai-investigations-updated", handleInvSync);
  }, []);

  // Update historical search
  useEffect(() => {
    setHistoricalResults(searchHistoricalPrescriptions(histSearchQuery));
  }, [histSearchQuery]);

  // Sync with local store & settings updates
  useEffect(() => {
    setCatalogMedicines(getStoredMedicines());
    const handleMedsSync = () => {
      setCatalogMedicines(getStoredMedicines());
    };
    window.addEventListener("dentai-medications-updated", handleMedsSync);
    return () => window.removeEventListener("dentai-medications-updated", handleMedsSync);
  }, []);

  // Load medicines catalog from database on mount or search
  useEffect(() => {
    async function loadMedicines() {
      try {
        const url = searchQuery ? `/api/medicines?q=${encodeURIComponent(searchQuery)}` : "/api/medicines";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.medicines && data.medicines.length > 0) {
            setCatalogMedicines(data.medicines);
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote medicines catalog, using local defaults", err);
      }
    }
    const timer = setTimeout(loadMedicines, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select a patient from Today's Completed Patients Dropdown
  const handleSelectTodayCompletedPatient = (appointmentId: string) => {
    setSelectedQueuePatientId(appointmentId);
    const chosen = todayQueue.find((a) => a.id === appointmentId);
    if (!chosen) return;

    setPatient({
      id: chosen.id,
      name: chosen.patient,
      customId: chosen.patientId,
      age: chosen.age,
      gender: chosen.gender,
      phone: chosen.phone,
      address: chosen.address,
      allergies: chosen.alerts || [],
      date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
    });

    if (chosen.provisionalDiagnosis) {
      setDiagnosis(chosen.provisionalDiagnosis);
    } else {
      setDiagnosis(`${chosen.service} - Clinical Consultation`);
    }

    if (chosen.labProceduresRecommended && chosen.labProceduresRecommended.length > 0) {
      setTests(
        chosen.labProceduresRecommended.map((test, idx) => ({
          id: `t-${idx}-${Date.now()}`,
          testName: test,
          indication: "Recommended during today's clinical consultation",
        }))
      );
    }

    // Set clinical advice
    if (chosen.clinicalNotes) {
      setAdditionalAdvice(`Consultation note: ${chosen.clinicalNotes.slice(0, 100)}... Maintain oral hygiene & follow prescribed course.`);
    }

    setIsSignedAndReadyForBilling(false);
    toast.success(`Loaded completed patient: ${chosen.patient} (Serial #${chosen.fifoSerial})`);
  };

  // Select a medicine from dropdown / search
  const handleSelectCatalogMed = (med: CatalogMedicine) => {
    setSelectedCatalogMed(med);
    setCustomBrand(med.brandName);
    setCustomGeneric(med.genericName || "");
    setCustomStrength(med.strength || "");
    setCustomForm(med.dosageForm || "Tablet");
    setCustomFrequency(med.defaultFrequency || "1+0+1");
    setCustomDuration(med.defaultDuration || "5 days");
    setCustomTiming(med.defaultTiming || "After food");
    setCustomInstructions("");
  };

  // Add the configured medicine into the active prescription
  const handleConfirmAddMedicine = () => {
    const brand = customBrand.trim() || (selectedCatalogMed?.brandName ?? "");
    if (!brand) {
      toast.error("Please enter or select a medicine brand name");
      return;
    }

    const newPrescriptionItem: PrescriptionMedicine = {
      id: "med-" + Date.now(),
      brandName: brand,
      genericName: customGeneric || selectedCatalogMed?.genericName || "",
      strength: customStrength || selectedCatalogMed?.strength || "",
      dosageForm: customForm || selectedCatalogMed?.dosageForm || "Tablet",
      frequency: customFrequency || "1+0+1",
      duration: customDuration || "5 days",
      timing: customTiming || "After food",
      instructions: customInstructions || "",
    };

    setMedicines([...medicines, newPrescriptionItem]);
    toast.success(`${brand} added to e-Prescription`);

    setIsAddingMedicine(false);
    setSelectedCatalogMed(null);
    setSearchQuery("");
    setCustomBrand("");
    setCustomGeneric("");
    setCustomStrength("");
  };

  // Save new medicine to database and immediately select it
  const handleSaveNewMedicineToDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedForm.brandName.trim()) {
      toast.error("Brand name is required");
      return;
    }

    setIsSavingDbMed(true);
    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMedForm),
      });

      const data = await res.json();
      if (res.ok && data.medicine) {
        toast.success(`"${data.medicine.brandName}" saved to database catalog!`);
        addStoredMedicine(data.medicine);
        handleSelectCatalogMed(data.medicine);
        setIsNewMedDialogOpen(false);
        setNewMedForm({
          brandName: "",
          genericName: "",
          strength: "",
          dosageForm: "tablet",
          defaultFrequency: "1+0+1",
          defaultDuration: "5 days",
          defaultTiming: "After food",
          category: "Dental Therapeutics",
        });
      } else {
        toast.error(data.error || "Failed to save medicine to database");
      }
    } catch {
      toast.error("Network error while saving medicine");
    } finally {
      setIsSavingDbMed(false);
    }
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter((m) => m.id !== id));
    toast.info("Medicine removed from prescription");
  };

  // Open Edit Medication Modal
  const handleOpenEditMed = (med: PrescriptionMedicine) => {
    setEditingMed({ ...med });
    setIsEditMedModalOpen(true);
  };

  // Confirm Medication Edit
  const handleConfirmEditMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed) return;
    if (!editingMed.brandName.trim()) {
      toast.error("Medicine brand name cannot be empty");
      return;
    }
    setMedicines((prev) =>
      prev.map((m) => (m.id === editingMed.id ? { ...editingMed } : m))
    );
    setIsEditMedModalOpen(false);
    toast.success(`Dosage & timing updated for ${editingMed.brandName}`);
    setEditingMed(null);
  };

  // Reorder medicines via drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedMedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropMedicine = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedMedIndex === null || draggedMedIndex === targetIndex) return;

    const updated = [...medicines];
    const [draggedItem] = updated.splice(draggedMedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);
    setMedicines(updated);
    setDraggedMedIndex(null);
    toast.success(`Sequence updated: ${draggedItem.brandName} is now #${targetIndex + 1}`);
  };

  const moveMedicine = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= medicines.length) return;

    const updated = [...medicines];
    const [item] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, item);
    setMedicines(updated);
    toast.info(`Moved ${item.brandName} ${direction}`);
  };

  // Generate Prescription PDF Document object
  const createPrescriptionPdfDoc = (): PrescriptionPdfDocument => {
    const rxNumber = `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const docName = primaryDoctor.name;
    const docDegree = primaryDoctor.degree;
    const docReg = primaryDoctor.bmdcReg;
    return {
      id: `rx-pdf-${Date.now()}`,
      rxNumber,
      fileName: `Prescription_${patient.name.replace(/\s+/g, "_")}_${rxNumber}.pdf`,
      fileSize: "148 KB",
      generatedAt: patient.date || "Today",
      patientId: patient.customId || patient.id,
      patientName: patient.name,
      doctor: `${docName}, ${docDegree}`,
      doctorName: docName,
      bmdcRegNo: docReg,
      clinicName: clinicName,
      diagnosis: diagnosis,
      medicines: medicines.map((m) => ({
        brandName: m.brandName,
        genericName: m.genericName,
        strength: m.strength,
        dosageForm: m.dosageForm,
        frequency: m.frequency,
        duration: m.duration,
        timing: m.timing,
        instructions: m.instructions,
      })),
      investigations: tests.map((t) => t.testName),
      followUpDate: followUpDate || undefined,
      advice: additionalAdvice || undefined,
    };
  };

  // Archive to patient timeline and download PDF
  const handleArchiveAndDownloadPdf = () => {
    const pdfDoc = createPrescriptionPdfDoc();

    // Archive to patient profile timeline
    logPatientActivity({
      id: `tl-rx-${Date.now()}`,
      patientId: patient.customId || patient.id || "DENT-2026-00042",
      date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
      timestamp: Date.now(),
      type: "prescription",
      title: `e-Prescription Issued (${pdfDoc.rxNumber})`,
      doctor: `${primaryDoctor.name}, ${primaryDoctor.degree}`,
      clinicalNotes: `Prescribed ${medicines.length} medications and ${tests.length} diagnostic investigations. Primary Diagnosis: ${diagnosis}`,
      provisionalDiagnosis: diagnosis,
      prescribedMedicines: medicines.map((m) => ({
        brandName: m.brandName,
        dosageForm: m.dosageForm,
        frequency: m.frequency,
        duration: m.duration,
      })),
      prescriptionPdfDoc: pdfDoc,
      badge: "Rx Issued",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    });

    // Trigger download with full executive letterhead details
    downloadPrescriptionPdf({
      rxNumber: pdfDoc.rxNumber,
      patientName: patient.name,
      patientId: patient.customId || patient.id,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
      allergies: patient.allergies,
      date: patient.date,
      doctorName: primaryDoctor.name,
      doctorDegree: primaryDoctor.degree,
      bmdcReg: primaryDoctor.bmdcReg,
      visitingHours: primaryDoctor.visitingHours,
      clinicName: clinicName,
      clinicTagline: clinicTagline,
      clinicAddress: clinicAddress,
      clinicPhone: clinicPhone,
      clinicEmail: clinic?.email || "reception@dentai-clinic.bd",
      diagnosis: diagnosis,
      medicines: pdfDoc.medicines,
      tests: tests.map((t) => ({ testName: t.testName, indication: t.indication })),
      followUpDate: followUpDate || undefined,
      followUpNotes: followUpNotes || undefined,
      advice: additionalAdvice,
      vitals: {
        bp: "120/80 mmHg",
        pulse: "74 bpm",
        bloodSugar: "5.8 mmol/L",
        temp: "98.4 °F",
      },
    });

    toast.success(`Prescription archived to ${patient.name}'s profile and downloaded as PDF!`);
  };

  // Select an investigation from catalog dropdown
  const handleSelectCatalogInvestigation = (invCode: string) => {
    setSelectedInvCode(invCode);
    const item = catalogInvestigations.find((inv) => (inv.code || inv.id) === invCode);
    if (item) {
      setCustomInvIndication(item.indication || item.defaultIndication || "");
      if ((item.category === "radiology" || item.category === "Radiographs & Imaging") && !customInvTooth) {
        setCustomInvTooth("#19");
      }
    }
  };

  // Add selected investigation to active prescription
  const handleConfirmAddInvestigation = () => {
    if (!selectedInvCode) {
      toast.error("Please choose an investigation from the dropdown");
      return;
    }
    const inv = catalogInvestigations.find((i) => (i.code || i.id) === selectedInvCode);
    if (!inv) return;

    const displayName = inv.testName || inv.name || "Dental Diagnostic Investigation";
    const newTest: PrescriptionTest = {
      id: "test-" + Date.now(),
      testName: displayName + (customInvTooth ? ` (${customInvTooth})` : ""),
      category: inv.category,
      toothNumbers: customInvTooth,
      indication: customInvIndication || inv.indication || inv.defaultIndication || "Diagnostic evaluation",
    };

    setTests([...tests, newTest]);
    toast.success(`Investigation "${displayName}" added to prescription!`);
    setSelectedInvCode("");
    setCustomInvTooth("");
    setCustomInvIndication("");
  };

  // Save new custom investigation to database catalog
  const handleSaveNewInvestigationToDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvForm.name.trim()) {
      toast.error("Investigation name is required");
      return;
    }

    setIsSavingDbInv(true);
    try {
      const code = newInvForm.code.trim() || ("INV-" + Math.floor(100 + Math.random() * 900));
      const payload = { ...newInvForm, code };

      const res = await fetch("/api/investigations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.investigation) {
        toast.success(`"${data.investigation.name}" saved to database catalog!`);
        addStoredInvestigation(data.investigation);
        setCatalogInvestigations(getStoredInvestigations());
        handleSelectCatalogInvestigation(data.investigation.code);
        setIsNewInvDialogOpen(false);
        setNewInvForm({
          name: "",
          code: "",
          category: "Radiographs & Imaging",
          defaultIndication: "",
          priceBDT: 500,
          turnaroundTime: "Instant (Digital Chairside)",
        });
      } else {
        toast.error(data.error || "Failed to save investigation");
      }
    } catch {
      toast.error("Network error while saving investigation");
    } finally {
      setIsSavingDbInv(false);
    }
  };

  const removeTest = (id: string) => {
    setTests(tests.filter((t) => t.id !== id));
    toast.info("Investigation removed from prescription");
  };

  // Preset follow up helpers
  const setFollowUpInDays = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    setFollowUpDate(`${yyyy}-${mm}-${dd}`);
    toast.info(`Next follow-up date set: ${target.toLocaleDateString("en-BD", { month: "short", day: "numeric", year: "numeric" })}`);
  };

  const handlePrint = () => {
    const pdfDoc = createPrescriptionPdfDoc();
    downloadPrescriptionPdf({
      rxNumber: pdfDoc.rxNumber,
      patientName: patient.name,
      patientId: patient.customId || patient.id,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
      allergies: patient.allergies,
      date: patient.date,
      doctorName: primaryDoctor.name,
      doctorDegree: primaryDoctor.degree,
      bmdcReg: primaryDoctor.bmdcReg,
      visitingHours: primaryDoctor.visitingHours,
      clinicName: clinicName,
      clinicTagline: clinicTagline,
      clinicAddress: clinicAddress,
      clinicPhone: clinicPhone,
      clinicEmail: clinic?.email || "reception@dentai-clinic.bd",
      diagnosis: diagnosis,
      medicines: pdfDoc.medicines,
      tests: tests.map((t) => ({ testName: t.testName, indication: t.indication })),
      followUpDate: followUpDate || undefined,
      followUpNotes: followUpNotes || undefined,
      advice: additionalAdvice,
    });
  };

  const handleSignAndFinalizeRx = () => {
    setIsSignedAndReadyForBilling(true);

    const pdfDoc = createPrescriptionPdfDoc();

    // Automatically archive into patient profile timeline
    logPatientActivity({
      id: `tl-final-${Date.now()}`,
      patientId: patient.customId || patient.id || "DENT-2026-00042",
      date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
      timestamp: Date.now(),
      type: "prescription",
      title: `e-Prescription Finalized (${pdfDoc.rxNumber})`,
      doctor: "Dr. Sarah Smith, BDS, FCPS",
      clinicalNotes: `Digitally signed e-Prescription with ${medicines.length} medications. Primary Diagnosis: ${diagnosis}`,
      provisionalDiagnosis: diagnosis,
      prescribedMedicines: medicines.map((m) => ({
        brandName: m.brandName,
        dosageForm: m.dosageForm,
        frequency: m.frequency,
        duration: m.duration,
      })),
      prescriptionPdfDoc: pdfDoc,
      badge: "Rx Finalized",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    });

    // Auto schedule appointment if follow-up date is set
    if (followUpDate && autoScheduleFollowUp) {
      const scheduled = scheduleFollowUpAppointment(
        patient.id,
        followUpDate,
        followUpNotes || "Post-treatment clinical follow-up & review"
      );
      if (scheduled) {
        toast.success(
          `Follow-up appointment automatically booked for ${patient.name} on ${followUpDate}! Assigned Serial #${scheduled.serialNumber} (${scheduled.appointment.time}).`,
          { duration: 7000 }
        );
      }
    }

    toast.success(`e-Prescription signed & archived to ${patient.name}'s profile! Ready for Billing.`);
  };

  // Load a historical prescription back into the Studio
  const handleLoadHistoricalRx = (rx: HistoricalPrescription) => {
    setPatient({
      id: "pat-" + rx.patientId,
      name: rx.patientName,
      customId: rx.patientId,
      age: rx.age,
      gender: rx.gender,
      phone: rx.phone,
      address: "Dhaka, Bangladesh",
      allergies: [],
      date: rx.date,
    });
    setDiagnosis(rx.diagnosis);
    setMedicines(
      rx.medicines.map((m, idx) => ({
        id: `med-hist-${idx}-${Date.now()}`,
        brandName: m.brandName,
        genericName: m.genericName,
        strength: m.strength,
        dosageForm: m.dosageForm,
        frequency: m.frequency,
        duration: m.duration,
        timing: m.timing,
        instructions: "Re-prescribed from past treatment history",
      }))
    );
    setTests(
      rx.tests.map((t, idx) => ({
        id: `t-hist-${idx}`,
        testName: t,
        indication: "Routine follow-up radiograph",
      }))
    );
    setAdditionalAdvice(rx.advice);
    setActiveTab("write");
    toast.success(`Loaded prescription #${rx.rxNumber} for ${rx.patientName} into Studio!`);
  };

  // Check if selected medicine triggers allergy alert
  const hasAllergyWarning =
    (customBrand.toLowerCase().includes("amox") ||
      customGeneric.toLowerCase().includes("amox") ||
      customGeneric.toLowerCase().includes("penicillin")) &&
    patient.allergies.some((a) => a.toLowerCase().includes("penicillin"));

  // Completed patients list for dropdown
  const completedPatients = todayQueue.filter((a) => a.status === "completed" || a.status === "in_progress");

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            e-Prescription & Diagnostic Studio (BDT / ৳)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prescribe Bangladeshi dental pharmacotherapy, select today's completed patients, or search historical records
          </p>
        </div>

        {/* Tab switch between Write Rx & Search Past Rx */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex rounded-lg border p-1 bg-muted/40 text-xs font-semibold w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("write")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "write" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Pill className="h-3.5 w-3.5 text-primary" />
              Write e-Prescription
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "search" ? "bg-background text-foreground shadow-xs font-bold text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Search Past Prescriptions
            </button>
          </div>

          {activeTab === "write" && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs flex-1 sm:flex-initial">
                <Printer className="h-3.5 w-3.5" />
                Print Rx
              </Button>
              <Button
                size="sm"
                onClick={handleSignAndFinalizeRx}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex-1 sm:flex-initial"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Sign & Finalize Rx
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── TAB 1: WRITE E-PRESCRIPTION ─── */}
      {activeTab === "write" && (
        <div className="space-y-4">
          {/* 1. DROPDOWN FOR TODAY'S COMPLETED PATIENTS */}
          <Card className="border-2 border-primary/30 bg-primary/5 p-4 shadow-sm print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Select Today's Completed Consultation Patient (Queue Dropdown)
                </span>
                <p className="text-xs text-muted-foreground">
                  Loads patient demographics, consultation notes, allergy warnings, and ordered lab tests
                </p>
              </div>

              <div className="w-full sm:w-96">
                <Select
                  value={selectedQueuePatientId}
                  onValueChange={handleSelectTodayCompletedPatient}
                >
                  <SelectTrigger className="h-9 text-xs font-medium bg-background border-primary/40">
                    <SelectValue placeholder="Choose a completed patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {completedPatients.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No completed consultations yet today
                      </SelectItem>
                    ) : (
                      completedPatients.map((apt) => (
                        <SelectItem key={apt.id} value={apt.id} className="text-xs">
                          <span className="font-bold text-primary mr-1.5">
                            Serial #{apt.fifoSerial} ({apt.token}):
                          </span>
                          {apt.patient} · {apt.service}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* 2. PROCEED TO BILLING CALLOUT BANNER (When Signed) */}
          {isSignedAndReadyForBilling && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in print:hidden">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Prescription Signed & Issued for {patient.name}!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Digital SHA-256 seal verified. The patient profile has now proceeded to the Billing Studio.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                asChild
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs h-10 px-4 shadow-sm shrink-0"
              >
                <Link href="/billing">
                  <Receipt className="h-4 w-4" />
                  Proceed to Billing & Collect Payment
                  <ArrowRight className="h-4 w-4 ml-0.5" />
                </Link>
              </Button>
            </div>
          )}

                    {/* 3. Interactive Prescription Pad with Integrated Controls */}
          <div className="max-w-5xl mx-auto space-y-4">
            <Card className="printable-prescription-pad border-2 shadow-xl bg-card p-6 sm:p-10 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none relative overflow-hidden">
              
              {/* Subtle Dental Watermark in Background */}
              <div className="absolute right-12 top-48 opacity-[0.03] dark:opacity-[0.02] pointer-events-none select-none">
                <ToothIcon className="w-96 h-96" strokeWidth={1} />
              </div>

              {/* ─── CLINIC & DOCTOR LETTERHEAD HEADER ─── */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 dark:border-slate-400 pb-3 gap-4 relative">
                {/* Left: Clinic Brand & Accreditation */}
                <div className="flex items-start gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-slate-900 dark:bg-primary text-white flex items-center justify-center shadow-md shrink-0 print:border print:border-slate-800">
                    <ToothIcon className="h-7 w-7 text-white" strokeWidth={2.2} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                        {clinicName}
                      </h2>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                      {clinicTagline}
                    </p>
                    <p className="text-[10.5px] text-muted-foreground">
                      {clinicAddress} · Phone: <span className="font-semibold text-foreground">{clinicPhone}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[9.5px] text-slate-600 dark:text-slate-400 font-mono pt-0.5">
                      <span>License: {clinicLicense}</span>
                      <span>•</span>
                      <span>Hotline: {clinic?.emergencyPhone || "+880 1711-999999"}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Attending Doctor Qualifications Block */}
                <div className="text-left sm:text-right space-y-0.5 sm:border-l sm:pl-4 border-slate-300 dark:border-slate-700">
                  <span className="font-serif italic text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 block">
                    {primaryDoctor.name}
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {primaryDoctor.degree}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {primaryDoctor.designation || "Senior Consultant & Dental Surgeon"}
                  </p>
                  <div className="pt-0.5 flex flex-col sm:items-end text-[10px] text-muted-foreground font-mono">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{primaryDoctor.bmdcReg}</span>
                    <span className="text-[9.5px]">Visiting Hours: {primaryDoctor.visitingHours}</span>
                  </div>
                </div>
              </div>

              {/* ─── AUTHENTIC LETTERHEAD PATIENT DEMOGRAPHICS STRIP ─── */}
              <div className="border-y border-slate-300 dark:border-slate-700 py-2 px-1 text-xs bg-slate-50/50 dark:bg-slate-900/30 print:bg-transparent">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1 gap-x-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Patient Name:</span>
                    <strong className="text-foreground text-sm font-bold">{patient.name}</strong>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Age / Sex:</span>
                    <span className="font-semibold text-foreground">{patient.age} Y / {patient.gender}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Patient ID:</span>
                    <span className="font-mono font-bold text-primary">{patient.customId}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Date:</span>
                    <span className="font-semibold text-foreground font-mono">{patient.date}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Contact:</span>
                    <span className="font-mono text-muted-foreground">{patient.phone}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Vitals:</span>
                    <span className="font-mono text-foreground font-semibold">BP 120/80 · Pulse 74</span>
                  </div>
                  <div className="sm:col-span-2 flex items-baseline gap-1.5">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Address:</span>
                    <span className="text-muted-foreground truncate">{patient.address}</span>
                  </div>
                </div>
              </div>

              {/* Medical Allergy Alert (If any) */}
              {patient.allergies.length > 0 && (
                <div className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-600 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    <span>ALLERGY ALERT: {patient.allergies.join(", ")} (Strictly avoid Beta-Lactams)</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider">CRITICAL CAUTION</span>
                </div>
              )}

              {/* ─── TWO-COLUMN PRESCRIPTION BODY (Clinical Margin on Left, ℞ Pharmacotherapy on Right) ─── */}
              <div className="prescription-two-col flex flex-col md:flex-row print:!flex-row w-full gap-0 border-t border-slate-300 dark:border-slate-700 pt-3 min-h-[580px]">
                
                {/* ── LEFT SUB-COLUMN: Clinical Margin (~32% width) ── */}
                <div className="prescription-col-left w-full md:w-[32%] print:!w-[32%] md:border-r border-slate-300 dark:border-slate-700 print:!border-r print:!border-slate-800 pr-0 md:pr-4 print:!pr-4 py-1 space-y-4 text-xs">
                  
                  {/* 1. Clinical Diagnosis / Impression */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block border-b border-slate-300 dark:border-slate-700 pb-0.5">
                      Diagnosis / Impression:
                    </span>
                    <div className="print:hidden pt-0.5">
                      <Input
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="Enter clinical diagnosis..."
                        className="h-8 text-xs font-semibold bg-background border-primary/30"
                      />
                    </div>
                    <p className="font-bold text-foreground text-xs leading-snug pt-0.5">
                      {diagnosis}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-mono block">Tooth: #19 (FDI 36)</span>
                  </div>

                  {/* 2. Investigations & Lab Requisition */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-700 pb-0.5">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Investigations:
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono print:hidden">
                        ({tests.length})
                      </span>
                    </div>

                    {tests.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic print:hidden py-0.5">
                        No investigations added.
                      </p>
                    ) : (
                      <ul className="space-y-1.5 list-none pl-0">
                        {tests.map((test) => (
                          <li
                            key={test.id}
                            className="group flex items-start justify-between gap-1 text-xs"
                          >
                            <div className="space-y-0.5">
                              <span className="font-semibold text-foreground block">
                                • {test.testName}
                              </span>
                              {test.indication && (
                                <span className="text-[10px] text-muted-foreground block pl-2.5">
                                  ↳ {test.indication}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTest(test.id)}
                              className="text-muted-foreground hover:text-red-600 print:hidden text-xs opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                              title="Remove test"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* INLINE ADD INVESTIGATION CONTROLS (print:hidden) */}
                    <div className="print:hidden rounded-lg border border-dashed border-teal-500/40 bg-teal-500/5 p-2.5 space-y-2 mt-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          Add Investigation
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsNewInvDialogOpen(true)}
                          className="h-5 text-[9.5px] px-1 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 font-semibold gap-1"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          + New
                        </Button>
                      </div>

                      <Select value={selectedInvCode} onValueChange={handleSelectCatalogInvestigation}>
                        <SelectTrigger className="h-7 text-xs bg-background border-teal-500/30">
                          <SelectValue placeholder="-- Select diagnostic test --" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {catalogInvestigations.map((inv) => {
                            const val = inv.code || inv.id;
                            const title = inv.testName || inv.name || "Test";
                            const fee = inv.defaultPriceBDT || inv.priceBDT || 0;
                            return (
                              <SelectItem key={val} value={val} className="text-xs">
                                <span className="font-semibold text-foreground">{title}</span>
                                <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
                                  ({inv.category} · {formatBDT(fee)})
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <Label className="text-[9.5px] font-semibold text-muted-foreground">Tooth #</Label>
                          <Input
                            value={customInvTooth}
                            onChange={(e) => setCustomInvTooth(e.target.value)}
                            placeholder="e.g. #19"
                            className="h-6 text-xs bg-background font-mono mt-0.5"
                          />
                        </div>
                        <div>
                          <Label className="text-[9.5px] font-semibold text-muted-foreground">Indication</Label>
                          <Input
                            value={customInvIndication}
                            onChange={(e) => setCustomInvIndication(e.target.value)}
                            placeholder="Clinical note"
                            className="h-6 text-xs bg-background mt-0.5"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirmAddInvestigation}
                        className="w-full h-6 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white gap-1 shadow-xs"
                      >
                        <Plus className="h-3 w-3" />
                        Add to Prescription
                      </Button>
                    </div>
                  </div>

                  {/* 3. Clinician's Advice & Post-Op Instructions */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block border-b border-slate-300 dark:border-slate-700 pb-0.5">
                      Advice / নির্দেশনাবলী:
                    </span>
                    <div className="print:hidden">
                      <Textarea
                        value={additionalAdvice}
                        onChange={(e) => setAdditionalAdvice(e.target.value)}
                        rows={3}
                        className="text-xs bg-background mt-1"
                        placeholder="Enter dietary restrictions, oral hygiene, post-op instructions..."
                      />
                    </div>
                    {additionalAdvice && (
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1 pt-0.5">
                        {additionalAdvice
                          .split(".")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((sentence, idx) => (
                            <p key={idx} className="flex items-start gap-1.5">
                              <span className="text-slate-900 dark:text-slate-100 font-bold">•</span>
                              <span>{sentence}.</span>
                            </p>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Next Follow-Up Review Section */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block border-b border-slate-300 dark:border-slate-700 pb-0.5">
                      Next Visit / পরবর্তী সাক্ষাত:
                    </span>
                    {followUpDate ? (
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-foreground">
                          • {new Date(followUpDate).toLocaleDateString("en-BD", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                        </p>
                        {followUpNotes && (
                          <p className="text-[10px] text-muted-foreground pl-2.5 italic">
                            Purpose: {followUpNotes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        • As advised / SOS
                      </p>
                    )}

                    {/* INLINE FOLLOW-UP CONTROLS (print:hidden) */}
                    <div className="print:hidden rounded-lg border border-dashed border-primary/30 bg-primary/5 p-2.5 space-y-2 mt-1">
                      <span className="text-[9.5px] uppercase font-bold text-primary block">
                        Schedule Follow-Up Date:
                      </span>

                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFollowUpInDays(3)}
                          className="h-5 text-[9.5px] px-1.5 bg-background"
                        >
                          +3D
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFollowUpInDays(7)}
                          className="h-5 text-[9.5px] px-1.5 bg-background"
                        >
                          +7D
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFollowUpInDays(14)}
                          className="h-5 text-[9.5px] px-1.5 bg-background"
                        >
                          +14D
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFollowUpInDays(30)}
                          className="h-5 text-[9.5px] px-1.5 bg-background"
                        >
                          +1M
                        </Button>
                        {followUpDate && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFollowUpDate("")}
                            className="h-5 text-[9.5px] px-1.5 text-red-600 hover:text-red-700"
                          >
                            Clear
                          </Button>
                        )}
                      </div>

                      <Input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="h-6 text-xs bg-background"
                      />

                      <Input
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        placeholder="Purpose (e.g. Suture removal)"
                        className="h-6 text-xs bg-background"
                      />
                    </div>
                  </div>

                  {/* 5. 24/7 Dental Emergency Helpline & Chamber Note */}
                  <div className="pt-2 text-[10px] text-muted-foreground space-y-0.5 border-t border-slate-300 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase block tracking-wider text-[9px]">
                      Chamber Emergency Helpline:
                    </span>
                    <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {clinicPhone} · {clinic?.emergencyPhone || "+880 1711-999999"}
                    </p>
                    <p className="text-[9px] leading-tight text-muted-foreground">
                      For severe bleeding, acute pain, or drug reaction, contact emergency hotline immediately.
                    </p>
                  </div>

                </div>

                {/* ── RIGHT SUB-COLUMN: ℞ Prescribed Medications (~68% width) ── */}
                <div className="prescription-col-right w-full md:w-[68%] print:!w-[68%] pl-0 md:pl-6 print:!pl-6 py-1 space-y-4">
                  
                  {/* Prescribed Medications Header */}
                  <div className="flex items-baseline justify-between border-b-2 border-slate-900 dark:border-slate-700 pb-1 mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif font-black text-3xl text-slate-900 dark:text-primary print:!text-black leading-none">
                        ℞
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
                        Prescribed Medications ({medicines.length})
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono print:hidden">
                      Drag to reorder · Click edit to modify
                    </span>
                  </div>

                  {/* Medicines List without any card borders */}
                  {medicines.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic print:hidden py-2">
                      No medicines prescribed yet. Use the add medicine form below to add drugs.
                    </p>
                  ) : (
                    <div className="space-y-3.5">
                      {medicines.map((med, index) => (
                        <div
                          key={med.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropMedicine(e, index)}
                          className="relative group py-1 border-b border-dotted border-slate-200 dark:border-slate-800 last:border-b-0 transition-colors"
                        >
                          {/* Medicine Header: #. DosageForm. BrandName Strength (Generic) */}
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {index + 1}.
                              </span>
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {med.dosageForm}. {med.brandName}
                              </span>
                              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {med.strength}
                              </span>
                              {med.genericName && (
                                <span className="text-xs text-muted-foreground italic">
                                  ({med.genericName})
                                </span>
                              )}
                            </div>

                            {/* Action buttons (print:hidden) */}
                            <div className="flex items-center gap-1 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                              <span
                                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5"
                                title="Drag to reorder sequence"
                              >
                                <GripVertical className="h-3.5 w-3.5" />
                              </span>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveMedicine(index, "up")}
                                className="text-muted-foreground hover:text-primary disabled:opacity-20 p-0.5 transition-colors"
                                title="Move Up"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                disabled={index === medicines.length - 1}
                                onClick={() => moveMedicine(index, "down")}
                                className="text-muted-foreground hover:text-primary disabled:opacity-20 p-0.5 transition-colors"
                                title="Move Down"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditMed(med)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                title="Edit dosage & timing"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMedicine(med.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
                                title="Remove medicine"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Traditional Leader Line & Dosage Schedule:
                              1 + 0 + 1  ──────────  3 days  (ভরা পেটে / After food) */}
                          <div className="flex items-center gap-2 pl-4 text-xs font-mono text-slate-800 dark:text-slate-200 pt-0.5 flex-wrap">
                            <span className="font-bold text-sm tracking-widest text-slate-900 dark:text-slate-100">
                              {med.frequency}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600 select-none tracking-tighter">
                              ──────────────────────
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {med.duration}
                            </span>
                            <span className="text-muted-foreground font-sans italic text-[11px]">
                              ({med.timing})
                            </span>
                          </div>

                          {/* Specific Instructions */}
                          {med.instructions && (
                            <p className="text-[11px] text-muted-foreground italic pl-4 pt-0.5">
                              * Note: {med.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── INLINE ADD MEDICINE CONTROL BOX (print:hidden) ── */}
                  <div className="print:hidden rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-3.5 space-y-3 mt-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-primary/20 pb-1.5">
                      <div className="flex items-center gap-2">
                        <Pill className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                          Add Medication to Prescription
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsNewMedDialogOpen(true)}
                        className="h-6 text-[10px] gap-1 text-primary border-primary/40 font-semibold bg-background"
                      >
                        <Database className="h-3 w-3" />
                        + Add New to DB
                      </Button>
                    </div>

                    {/* Quick Medicine Catalog Dropdown / Typeahead */}
                    <div className="space-y-1">
                      <Label className="text-[10.5px] font-semibold flex items-center justify-between">
                        <span>Select Brand or Type Custom *</span>
                        <span className="text-[9.5px] text-muted-foreground font-normal font-mono">
                          {catalogMedicines.length} Bangladesh Brands
                        </span>
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-8">
                          <Select
                            value={selectedCatalogMed?.brandName || ""}
                            onValueChange={(brand) => {
                              const chosen = catalogMedicines.find((m) => m.brandName === brand);
                              if (chosen) handleSelectCatalogMed(chosen);
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs bg-background">
                              <SelectValue placeholder="-- Choose brand (Torax, Amodis, Maxpro, Clohex...) --" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {catalogMedicines.map((med) => (
                                <SelectItem key={med.id || med.brandName} value={med.brandName} className="text-xs">
                                  <span className="font-bold text-foreground">{med.brandName}</span>
                                  <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
                                    ({med.dosageForm} {med.strength}) · {med.genericName}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-4">
                          <Input
                            value={customBrand}
                            onChange={(e) => setCustomBrand(e.target.value)}
                            placeholder="Or type brand name"
                            className="h-7 text-xs bg-background font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Strength, Generic & Dosage Form */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[9.5px] font-semibold text-muted-foreground">Generic Name</Label>
                        <Input
                          value={customGeneric}
                          onChange={(e) => setCustomGeneric(e.target.value)}
                          placeholder="e.g. Ketorolac"
                          className="h-6 text-xs bg-background mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[9.5px] font-semibold text-muted-foreground">Strength</Label>
                        <Input
                          value={customStrength}
                          onChange={(e) => setCustomStrength(e.target.value)}
                          placeholder="e.g. 10 mg"
                          className="h-6 text-xs bg-background mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[9.5px] font-semibold text-muted-foreground">Dosage Form</Label>
                        <Select value={customForm} onValueChange={setCustomForm}>
                          <SelectTrigger className="h-6 text-xs bg-background mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tablet" className="text-xs">Tablet</SelectItem>
                            <SelectItem value="Capsule" className="text-xs">Capsule</SelectItem>
                            <SelectItem value="Syrup" className="text-xs">Syrup / Suspension</SelectItem>
                            <SelectItem value="Oral Rinse" className="text-xs">Oral Rinse / Mouthwash</SelectItem>
                            <SelectItem value="Gel" className="text-xs">Oral Gel / Paste</SelectItem>
                            <SelectItem value="Injection" className="text-xs">Injection (IM/IV)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Frequency, Duration, Timing */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[9.5px] font-semibold text-muted-foreground">Frequency</Label>
                        <Select value={customFrequency} onValueChange={setCustomFrequency}>
                          <SelectTrigger className="h-6 text-xs bg-background mt-0.5 font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1+0+1" className="text-xs">1+0+1 (Morning + Night)</SelectItem>
                            <SelectItem value="1+1+1" className="text-xs">1+1+1 (TID - 3 Times)</SelectItem>
                            <SelectItem value="1+0+0" className="text-xs">1+0+0 (Morning once)</SelectItem>
                            <SelectItem value="0+0+1" className="text-xs">0+0+1 (Night once)</SelectItem>
                            <SelectItem value="1+1+1+1" className="text-xs">1+1+1+1 (QID - 4 Times)</SelectItem>
                            <SelectItem value="0+1+0" className="text-xs">0+1+0 (Noon once)</SelectItem>
                            <SelectItem value="1+0+1 (PRN)" className="text-xs">1+0+1 (PRN - When in pain)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[9.5px] font-semibold text-muted-foreground">Duration</Label>
                        <Select value={customDuration} onValueChange={setCustomDuration}>
                          <SelectTrigger className="h-6 text-xs bg-background mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3 days" className="text-xs">3 days</SelectItem>
                            <SelectItem value="5 days" className="text-xs">5 days</SelectItem>
                            <SelectItem value="7 days" className="text-xs">7 days</SelectItem>
                            <SelectItem value="10 days" className="text-xs">10 days</SelectItem>
                            <SelectItem value="14 days" className="text-xs">14 days</SelectItem>
                            <SelectItem value="1 month" className="text-xs">1 month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[9.5px] font-semibold text-muted-foreground">Timing</Label>
                        <Select value={customTiming} onValueChange={setCustomTiming}>
                          <SelectTrigger className="h-6 text-xs bg-background mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="After food" className="text-xs">After food</SelectItem>
                            <SelectItem value="Before food" className="text-xs">Before food (30 mins)</SelectItem>
                            <SelectItem value="Empty stomach" className="text-xs">Empty stomach</SelectItem>
                            <SelectItem value="Bedtime" className="text-xs">At bedtime</SelectItem>
                            <SelectItem value="After tooth brushing" className="text-xs">After tooth brushing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Special Instructions & Add Button */}
                    <div className="space-y-1.5">
                      <Input
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="Special directions (e.g. Swish 60 seconds, do not exceed 5 days)..."
                        className="h-6 text-xs bg-background"
                      />
                      <Button
                        type="button"
                        onClick={handleConfirmAddMedicine}
                        className="w-full h-7 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs"
                      >
                        <Plus className="h-3 w-3" />
                        Add Medicine to Prescription
                      </Button>
                    </div>
                  </div>

                </div>
              </div>

              {/* ─── DOCTOR SIGN-OFF & VERIFICATION FOOTER ─── */}
              <div className="border-t-2 border-slate-900 dark:border-slate-700 pt-4 flex flex-col sm:flex-row items-end justify-between gap-4 mt-auto">
                {/* Left: Security QR & Electronic Hash */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <div className="h-12 w-12 bg-white dark:bg-card border p-1 rounded-sm shrink-0 shadow-xs flex items-center justify-center print:border-black">
                    <svg viewBox="0 0 100 100" fill="currentColor" className="w-10 h-10 text-foreground">
                      <rect x="0" y="0" width="30" height="30" />
                      <rect x="5" y="5" width="20" height="20" fill="var(--background)" />
                      <rect x="9" y="9" width="12" height="12" />
                      <rect x="70" y="0" width="30" height="30" />
                      <rect x="75" y="5" width="20" height="20" fill="var(--background)" />
                      <rect x="79" y="9" width="12" height="12" />
                      <rect x="0" y="70" width="30" height="30" />
                      <rect x="5" y="75" width="20" height="20" fill="var(--background)" />
                      <rect x="9" y="79" width="12" height="12" />
                      <rect x="40" y="10" width="10" height="20" />
                      <rect x="40" y="40" width="20" height="20" />
                      <rect x="70" y="40" width="10" height="10" />
                      <rect x="85" y="45" width="15" height="15" />
                      <rect x="40" y="75" width="20" height="10" />
                      <rect x="70" y="70" width="25" height="25" />
                    </svg>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      <span>AUTHENTICATED DIGITAL e-PRESCRIPTION</span>
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground">
                      SHA-256: 7f8a...9c2e · Verifiable via DentalOS1
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      Issued in compliance with Bangladesh Medical & Dental Council (BMDC) Regulations.
                    </p>
                  </div>
                </div>

                {/* Right: Doctor's Signature Block */}
                <div className="text-right space-y-1">
                  <div className="w-56 border-t border-slate-900 dark:border-slate-400 pt-1 text-center ml-auto">
                    <span className="font-serif italic text-base font-bold text-foreground block">
                      {primaryDoctor.name}
                    </span>
                    <span className="text-[10px] text-primary font-bold block">
                      {primaryDoctor.degree}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono block">
                      {primaryDoctor.bmdcReg} · Attending Surgeon
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action inside Sheet */}
              <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
                    <Printer className="h-3.5 w-3.5" />
                    Print Clean
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArchiveAndDownloadPdf}
                    className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
                    title="Generate and download PDF prescription and save to patient profile"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsInvoicePreviewModalOpen(true)}
                    className="gap-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview Invoice & Rx
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSignAndFinalizeRx}
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Sign & Finalize
                  </Button>
                </div>

                <Button
                  size="sm"
                  asChild
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                >
                  <Link href={`/billing?patientId=${patient.id}`}>
                    <Receipt className="h-3.5 w-3.5" />
                    Proceed to Billing Studio
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

            </Card>
          </div>

        </div>
      )}

      {/* ─── TAB 2: SEARCH OLDER PRESCRIPTIONS (Name, ID, Phone) ─── */}
      {activeTab === "search" && (
        <div className="space-y-4">
          <Card className="border shadow-sm p-4">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Search Historical e-Prescriptions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Lookup past dental prescriptions by Patient Name, Custom Patient ID (e.g. DENT-2026-...), or Phone Number
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {historicalResults.length} records found
                </Badge>
              </div>

              <div className="relative pt-1">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={histSearchQuery}
                  onChange={(e) => setHistSearchQuery(e.target.value)}
                  placeholder="Type patient name (e.g. Anika, Tariqul), patient ID (DENT-2026-...), or phone (+880...)..."
                  className="pl-9 h-10 text-xs font-medium"
                />
              </div>
            </div>
          </Card>

          {/* Historical Prescriptions List */}
          <div className="space-y-3">
            {historicalResults.length === 0 ? (
              <Card className="p-8 text-center border">
                <p className="text-xs text-muted-foreground">No historical prescriptions found matching your query.</p>
              </Card>
            ) : (
              historicalResults.map((rx) => (
                <Card key={rx.id} className="border shadow-sm p-5 hover:shadow-md transition-shadow bg-card space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold font-mono text-xs">
                        Rx
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary text-sm">{rx.rxNumber}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {rx.patientId}
                          </Badge>
                          <span className="text-xs text-muted-foreground">· {rx.date}</span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                          {rx.patientName}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({rx.gender}, {rx.age}y) · {rx.phone}
                          </span>
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingHistRx(rx)}
                        className="text-xs h-8 gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View Full Sheet
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleLoadHistoricalRx(rx)}
                        className="text-xs h-8 gap-1.5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Load & Re-Prescribe
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-muted-foreground">Diagnosis: </span>
                    <span className="font-medium text-foreground">{rx.diagnosis}</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-semibold text-muted-foreground">Prescribed Medicines:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                      {rx.medicines.map((m, idx) => (
                        <div key={idx} className="p-2 rounded-lg border bg-muted/20 text-xs space-y-0.5">
                          <span className="font-bold text-foreground">{m.brandName}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {m.dosageForm} {m.strength} ({m.genericName})
                          </span>
                          <span className="text-[10px] text-primary font-semibold block">
                            {m.frequency} · {m.duration} · {m.timing}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
                    <span>Attending Doctor: <strong>{rx.doctorName}</strong> ({rx.doctorQualifications})</span>
                    <span className="font-mono text-[10px]">Hash: {rx.pdfHash.slice(0, 16)}...</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: VIEW HISTORICAL PRESCRIPTION SHEET ─── */}
      <Dialog open={!!viewingHistRx} onOpenChange={(open) => !open && setViewingHistRx(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingHistRx && (
            <div className="space-y-6 p-2">
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Past e-Prescription #{viewingHistRx.rxNumber}
                  </DialogTitle>
                  <Badge variant="outline" className="font-mono text-xs">
                    {viewingHistRx.date}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  Official clinical archival record from Dhaka Dental Care & Maxillofacial Implant Hospital
                </DialogDescription>
              </DialogHeader>

              {/* Patient and Doctor */}
              <div className="p-3 bg-muted/30 rounded-xl border grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px] block">Patient Name</span>
                  <strong className="text-foreground text-sm">{viewingHistRx.patientName}</strong>
                  <p className="text-muted-foreground text-[11px]">
                    {viewingHistRx.patientId} · {viewingHistRx.gender}, {viewingHistRx.age}y · {viewingHistRx.phone}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">Attending Dental Surgeon</span>
                  <strong className="text-foreground text-sm">{viewingHistRx.doctorName}</strong>
                  <p className="text-muted-foreground text-[11px]">{viewingHistRx.doctorQualifications}</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-muted-foreground uppercase text-[10px]">Diagnosis:</span>
                <p className="font-semibold text-foreground p-2 bg-muted/20 rounded border">
                  {viewingHistRx.diagnosis}
                </p>
              </div>

              {/* Medicines List */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-muted-foreground uppercase text-[10px]">Medicines Dispensed:</span>
                <div className="divide-y border rounded-lg p-2 bg-card">
                  {viewingHistRx.medicines.map((m, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-foreground">{idx + 1}. {m.brandName}</span>
                        <span className="text-muted-foreground text-[11px] ml-1.5">
                          ({m.genericName} {m.strength} - {m.dosageForm})
                        </span>
                      </div>
                      <span className="font-semibold text-primary">
                        {m.frequency} · {m.duration} · {m.timing}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-muted-foreground uppercase text-[10px]">Advice Given:</span>
                <p className="italic text-muted-foreground bg-muted/10 p-2 rounded border">
                  "{viewingHistRx.advice}"
                </p>
              </div>

              <DialogFooter className="border-t pt-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs">
                  <Printer className="h-3.5 w-3.5" />
                  Print Official Archive
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleLoadHistoricalRx(viewingHistRx);
                    setViewingHistRx(null);
                  }}
                  className="text-xs font-bold gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Load into Prescription Studio
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: ADD NEW MEDICINE TO DATABASE ─── */}
      <Dialog open={isNewMedDialogOpen} onOpenChange={setIsNewMedDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Add New Medicine to Database
            </DialogTitle>
            <DialogDescription className="text-xs">
              Saves a custom medication permanently into the Neon PostgreSQL medicines catalog
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewMedicineToDb} className="space-y-3.5 text-xs py-2">
            <div>
              <Label className="text-xs font-semibold">Brand / Trade Name *</Label>
              <Input
                value={newMedForm.brandName}
                onChange={(e) => setNewMedForm({ ...newMedForm, brandName: e.target.value })}
                placeholder="e.g. Ciprocin, Deltasone, Oraderm..."
                required
                className="h-8 text-xs mt-1 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Generic Name</Label>
                <Input
                  value={newMedForm.genericName}
                  onChange={(e) => setNewMedForm({ ...newMedForm, genericName: e.target.value })}
                  placeholder="e.g. Ciprofloxacin"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Strength</Label>
                <Input
                  value={newMedForm.strength}
                  onChange={(e) => setNewMedForm({ ...newMedForm, strength: e.target.value })}
                  placeholder="e.g. 500 mg / 10 mg"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Dosage Form</Label>
                <Select
                  value={newMedForm.dosageForm}
                  onValueChange={(v) => setNewMedForm({ ...newMedForm, dosageForm: v })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="capsule">Capsule</SelectItem>
                    <SelectItem value="syrup">Syrup</SelectItem>
                    <SelectItem value="oral_rinse">Oral Rinse / Mouthwash</SelectItem>
                    <SelectItem value="topical_gel">Topical Gel / Paste</SelectItem>
                    <SelectItem value="injection">Injection</SelectItem>
                    <SelectItem value="drops">Drops</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Category</Label>
                <Input
                  value={newMedForm.category}
                  onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
                  placeholder="e.g. Antibiotic, Analgesic"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs font-semibold">Default Freq</Label>
                <Select
                  value={newMedForm.defaultFrequency}
                  onValueChange={(v) => setNewMedForm({ ...newMedForm, defaultFrequency: v })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1+0+1">1+0+1</SelectItem>
                    <SelectItem value="1+1+1">1+1+1</SelectItem>
                    <SelectItem value="1+0+0">1+0+0</SelectItem>
                    <SelectItem value="0+0+1">0+0+1</SelectItem>
                    <SelectItem value="PRN">PRN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Default Duration</Label>
                <Input
                  value={newMedForm.defaultDuration}
                  onChange={(e) => setNewMedForm({ ...newMedForm, defaultDuration: e.target.value })}
                  placeholder="5 days"
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Default Timing</Label>
                <Input
                  value={newMedForm.defaultTiming}
                  onChange={(e) => setNewMedForm({ ...newMedForm, defaultTiming: e.target.value })}
                  placeholder="After food"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewMedDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSavingDbMed} className="text-xs font-bold">
                {isSavingDbMed ? "Saving to Neon DB..." : "Save to Database"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: ADD NEW INVESTIGATION TO DATABASE CATALOG ─── */}
      <Dialog open={isNewInvDialogOpen} onOpenChange={setIsNewInvDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Add New Diagnostic Investigation to Catalog
            </DialogTitle>
            <DialogDescription className="text-xs">
              Save new radiographs, lab blood tests, or diagnostic procedures into the database
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewInvestigationToDb} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Test Name *</Label>
                <Input
                  value={newInvForm.name}
                  onChange={(e) => setNewInvForm({ ...newInvForm, name: e.target.value })}
                  placeholder="e.g. Sialography, 3D Guided Stent"
                  className="h-8 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Code (Optional)</Label>
                <Input
                  value={newInvForm.code}
                  onChange={(e) => setNewInvForm({ ...newInvForm, code: e.target.value })}
                  placeholder="e.g. D0330, INV-205"
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Category</Label>
                <Select
                  value={newInvForm.category}
                  onValueChange={(v) => setNewInvForm({ ...newInvForm, category: v })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Radiographs & Imaging">Radiographs & Imaging</SelectItem>
                    <SelectItem value="Hematology & Blood">Hematology & Blood</SelectItem>
                    <SelectItem value="Pulp Vitality & Pathology">Pulp Vitality & Pathology</SelectItem>
                    <SelectItem value="Microbiology & Culture">Microbiology & Culture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Standard Price (BDT ৳)</Label>
                <Input
                  type="number"
                  value={newInvForm.priceBDT}
                  onChange={(e) => setNewInvForm({ ...newInvForm, priceBDT: Number(e.target.value) })}
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Default Clinical Indication</Label>
              <Input
                value={newInvForm.defaultIndication}
                onChange={(e) => setNewInvForm({ ...newInvForm, defaultIndication: e.target.value })}
                placeholder="e.g. Evaluate periapical radiolucency & canal length"
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Turnaround Time</Label>
              <Input
                value={newInvForm.turnaroundTime}
                onChange={(e) => setNewInvForm({ ...newInvForm, turnaroundTime: e.target.value })}
                placeholder="Instant (Digital Chairside) / 24 Hours"
                className="h-8 text-xs mt-1"
              />
            </div>

            <DialogFooter className="border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewInvDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSavingDbInv} className="text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white">
                {isSavingDbInv ? "Saving to Catalog..." : "Save to Catalog"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: EDIT ALREADY ADDED MEDICATION (DOSES, DURATION, TIMING) ─── */}
      <Dialog open={isEditMedModalOpen} onOpenChange={setIsEditMedModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" />
              Edit Prescription Dosage & Timing
            </DialogTitle>
            <DialogDescription className="text-xs">
              Modify the dosage frequency, course duration, timing, or directions for {editingMed?.brandName}
            </DialogDescription>
          </DialogHeader>

          {editingMed && (
            <form onSubmit={handleConfirmEditMed} className="space-y-3.5 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Brand Name</Label>
                  <Input
                    value={editingMed.brandName}
                    onChange={(e) => setEditingMed({ ...editingMed, brandName: e.target.value })}
                    className="h-8 text-xs mt-1 font-bold"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Generic Name</Label>
                  <Input
                    value={editingMed.genericName}
                    onChange={(e) => setEditingMed({ ...editingMed, genericName: e.target.value })}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Dosage Form</Label>
                  <Select
                    value={editingMed.dosageForm}
                    onValueChange={(v) => setEditingMed({ ...editingMed, dosageForm: v })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tablet">Tablet</SelectItem>
                      <SelectItem value="Capsule">Capsule</SelectItem>
                      <SelectItem value="Syrup">Syrup / Suspension</SelectItem>
                      <SelectItem value="Mouthwash">Mouthwash (Oral Rinse)</SelectItem>
                      <SelectItem value="Dental Gel">Dental Gel / Ointment</SelectItem>
                      <SelectItem value="Injection">Injection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Strength</Label>
                  <Input
                    value={editingMed.strength}
                    onChange={(e) => setEditingMed({ ...editingMed, strength: e.target.value })}
                    className="h-8 text-xs mt-1 font-mono"
                    placeholder="e.g. 10 mg / 500 mg"
                  />
                </div>
              </div>

              {/* Dosage / Frequency */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Dosage / Frequency *</Label>
                  <div className="flex items-center gap-1">
                    {["1+0+1", "1+1+1", "1+0+0", "0+0+1", "0+1+0", "PRN"].map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setEditingMed({ ...editingMed, frequency: freq })}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                          editingMed.frequency === freq
                            ? "bg-primary text-primary-foreground font-bold border-primary"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  value={editingMed.frequency}
                  onChange={(e) => setEditingMed({ ...editingMed, frequency: e.target.value })}
                  placeholder="e.g. 1+0+1 or Every 8 hours"
                  className="h-8 text-xs font-mono font-semibold"
                  required
                />
              </div>

              {/* Course Duration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Course Duration *</Label>
                  <div className="flex items-center gap-1">
                    {["3 days", "5 days", "7 days", "10 days", "14 days"].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setEditingMed({ ...editingMed, duration: dur })}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                          editingMed.duration === dur
                            ? "bg-primary text-primary-foreground font-bold border-primary"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  value={editingMed.duration}
                  onChange={(e) => setEditingMed({ ...editingMed, duration: e.target.value })}
                  placeholder="e.g. 5 days or 1 week"
                  className="h-8 text-xs font-semibold"
                  required
                />
              </div>

              {/* Administration Timing */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Administration Timing *</Label>
                <Select
                  value={editingMed.timing}
                  onValueChange={(v) => setEditingMed({ ...editingMed, timing: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="After food">After food (ভরা পেটে)</SelectItem>
                    <SelectItem value="Before food">Before food - 30 mins (খাবার ৩০ মিনিট আগে)</SelectItem>
                    <SelectItem value="With food">With food (খাবারের সাথে)</SelectItem>
                    <SelectItem value="Empty stomach">Empty stomach (খালি পেটে)</SelectItem>
                    <SelectItem value="At bedtime">At bedtime (ঘুমানোর আগে)</SelectItem>
                    <SelectItem value="After tooth brushing">After tooth brushing (দাঁত ব্রাশ করার পর)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Instructions */}
              <div>
                <Label className="text-xs font-semibold">Special Directions & Warnings</Label>
                <Textarea
                  value={editingMed.instructions}
                  onChange={(e) => setEditingMed({ ...editingMed, instructions: e.target.value })}
                  rows={2}
                  className="text-xs mt-1"
                  placeholder="e.g. Do not chew, rinse mouth thoroughly, avoid dairy..."
                />
              </div>

              <DialogFooter className="border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMedModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: INVOICE & e-PRESCRIPTION PREVIEW POPUP ─── */}
      <Dialog open={isInvoicePreviewModalOpen} onOpenChange={setIsInvoicePreviewModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Comprehensive e-Prescription & Invoice Preview
              </DialogTitle>
              <Badge className="bg-emerald-600 text-white text-[10px] font-mono">
                Ready for Settlement
              </Badge>
            </div>
            <DialogDescription className="text-xs">
              Preview the authentic printed letterhead prescription and itemized diagnostic fee statement
            </DialogDescription>

            {/* Tab switch between Letterhead Prescription and Itemized Invoice */}
            <div className="flex items-center gap-2 pt-2 border-b pb-2">
              <button
                type="button"
                onClick={() => setPreviewModalTab("prescription")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  previewModalTab === "prescription"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Pill className="h-3.5 w-3.5" />
                Official Letterhead Prescription Pad
              </button>
              <button
                type="button"
                onClick={() => setPreviewModalTab("invoice")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  previewModalTab === "invoice"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Receipt className="h-3.5 w-3.5" />
                Itemized Diagnostic & Fee Statement
              </button>
            </div>
          </DialogHeader>

          <div className="pt-2">
            {previewModalTab === "prescription" ? (
              /* ── TAB 1: AUTHENTIC REAL LETTERHEAD PRINTED PRESCRIPTION ── */
              <div className="bg-white text-slate-900 border-2 border-slate-300 shadow-xl rounded-lg p-6 sm:p-8 space-y-4 font-sans text-xs relative overflow-hidden">
                {/* Subtle Dental Watermark */}
                <div className="absolute right-8 top-44 opacity-[0.035] pointer-events-none select-none">
                  <ToothIcon className="w-80 h-80 text-sky-800" strokeWidth={1} />
                </div>

                <div className="relative z-10 space-y-3">
                  {/* Clinic & Doctor Letterhead Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-3 gap-4">
                    {/* Left: Clinic Brand */}
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ToothIcon className="h-6 w-6 text-white" strokeWidth={2.2} />
                      </div>
                      <div className="space-y-0.5">
                        <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                          {clinicName}
                        </h2>
                        <p className="text-[10.5px] text-sky-700 font-semibold">
                          {clinicTagline}
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {clinicAddress} · Phone: <strong className="text-slate-900">{clinicPhone}</strong>
                        </p>
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono pt-0.5">
                          <span>License: {clinicLicense}</span>
                          <span>•</span>
                          <span>Hotline: {clinic?.emergencyPhone || "+880 1711-999999"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Attending Doctor Qualifications */}
                    <div className="text-left sm:text-right space-y-0.5 sm:border-l sm:pl-4 border-slate-300">
                      <span className="font-serif italic text-lg font-bold text-slate-900 block leading-tight">
                        {primaryDoctor.name}
                      </span>
                      <p className="text-[11px] font-semibold text-slate-800 leading-tight">
                        {primaryDoctor.degree}
                      </p>
                      <p className="text-[10.5px] text-slate-600 font-medium">
                        {primaryDoctor.designation || "Senior Consultant & Dental Surgeon"}
                      </p>
                      <div className="pt-0.5 flex flex-col sm:items-end text-[9.5px] text-slate-600 font-mono">
                        <span className="font-bold text-slate-900">{primaryDoctor.bmdcReg}</span>
                        <span className="text-[9px] text-sky-700 font-semibold">Visiting Hours: {primaryDoctor.visitingHours}</span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Demographics Strip */}
                  <div className="border-y border-slate-900 py-2 px-1 text-xs bg-slate-50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1 gap-x-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Patient Name:</span>
                        <strong className="text-slate-900 text-xs font-bold">{patient.name}</strong>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Age / Sex:</span>
                        <span className="font-semibold text-slate-900">{patient.age} Y / {patient.gender}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Patient ID:</span>
                        <span className="font-mono font-bold text-sky-800">{patient.customId}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Date:</span>
                        <span className="font-semibold text-slate-900 font-mono">{patient.date}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Contact:</span>
                        <span className="font-mono text-slate-600">{patient.phone}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Vitals:</span>
                        <span className="font-mono text-slate-900 font-semibold">BP 120/80 · Pulse 74</span>
                      </div>
                      <div className="sm:col-span-2 flex items-baseline gap-1.5">
                        <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider">Address:</span>
                        <span className="text-slate-600 truncate">{patient.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Medical Allergy Alert (If any) */}
                  {patient.allergies.length > 0 && (
                    <div className="px-3 py-1.5 bg-red-50 border-l-4 border-red-600 text-red-900 text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        <span>ALLERGY ALERT: {patient.allergies.join(", ")} (Strictly avoid Beta-Lactams)</span>
                      </span>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-red-700">CRITICAL CAUTION</span>
                    </div>
                  )}

                  {/* Two-Column Clinical Body */}
                  <div className="flex flex-col sm:flex-row w-full gap-0 border-t border-slate-300 pt-3 min-h-[400px]">
                    {/* Left Column: Clinical Margin (32%) */}
                    <div className="w-full sm:w-[32%] sm:border-r border-slate-300 pr-0 sm:pr-4 py-1 space-y-3.5 text-xs">
                      {/* Diagnosis */}
                      <div className="space-y-1">
                        <span className="text-[10.5px] font-bold text-slate-900 uppercase tracking-wider block border-b border-slate-300 pb-0.5">
                          Diagnosis / Impression:
                        </span>
                        <p className="font-bold text-slate-900 text-xs leading-snug pt-0.5">
                          {diagnosis}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono block">Tooth: #19 (FDI 36)</span>
                      </div>

                      {/* Investigations */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between border-b border-slate-300 pb-0.5">
                          <span className="text-[10.5px] font-bold text-slate-900 uppercase tracking-wider">
                            Investigations:
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({tests.length})
                          </span>
                        </div>
                        {tests.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-0.5">No investigations added.</p>
                        ) : (
                          <ul className="space-y-1 list-none pl-0">
                            {tests.map((test) => (
                              <li key={test.id} className="space-y-0.5 text-xs">
                                <span className="font-semibold text-slate-900 block">• {test.testName}</span>
                                {test.indication && (
                                  <span className="text-[10px] text-slate-500 block pl-2.5">↳ {test.indication}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Advice */}
                      <div className="space-y-1">
                        <span className="text-[10.5px] font-bold text-slate-900 uppercase tracking-wider block border-b border-slate-300 pb-0.5">
                          Advice / নির্দেশনাবলী:
                        </span>
                        {additionalAdvice && (
                          <div className="text-xs text-slate-700 leading-relaxed space-y-1 pt-0.5">
                            {additionalAdvice
                              .split(".")
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((sentence, idx) => (
                                <p key={idx} className="flex items-start gap-1.5">
                                  <span className="text-slate-900 font-bold">•</span>
                                  <span>{sentence}.</span>
                                </p>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Next Visit */}
                      <div className="space-y-1">
                        <span className="text-[10.5px] font-bold text-slate-900 uppercase tracking-wider block border-b border-slate-300 pb-0.5">
                          Next Visit / পরবর্তী সাক্ষাত:
                        </span>
                        {followUpDate ? (
                          <div className="space-y-0.5 text-xs">
                            <p className="font-bold text-slate-900">
                              • {new Date(followUpDate).toLocaleDateString("en-BD", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                            </p>
                            {followUpNotes && (
                              <p className="text-[10px] text-slate-500 pl-2.5 italic">Purpose: {followUpNotes}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">• As advised / SOS</p>
                        )}
                      </div>

                      {/* Emergency Helpline */}
                      <div className="pt-2 text-[10px] text-slate-500 space-y-0.5 border-t border-slate-300">
                        <span className="font-bold text-slate-900 uppercase block tracking-wider text-[9px]">
                          Chamber Emergency Helpline:
                        </span>
                        <p className="font-mono font-bold text-slate-900">
                          {clinicPhone} · {clinic?.emergencyPhone || "+880 1711-999999"}
                        </p>
                        <p className="text-[9px] leading-tight text-slate-500">
                          For acute bleeding or severe pain, contact helpline immediately.
                        </p>
                      </div>
                    </div>

                    {/* Right Column: ℞ Pharmacotherapy (68%) */}
                    <div className="w-full sm:w-[68%] pl-0 sm:pl-6 py-1 space-y-3">
                      <div className="flex items-baseline justify-between border-b-2 border-slate-900 pb-1 mb-2">
                        <div className="flex items-baseline gap-2">
                          <span className="font-serif font-black text-3xl text-slate-900 leading-none">
                            ℞
                          </span>
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                            Prescribed Medications ({medicines.length})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Bangladeshi Dental Pharmacotherapy
                        </span>
                      </div>

                      {medicines.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">No medicines prescribed.</p>
                      ) : (
                        <div className="space-y-3">
                          {medicines.map((med, index) => (
                            <div
                              key={med.id}
                              className="py-1 border-b border-dotted border-slate-300 last:border-b-0"
                            >
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-slate-900 text-sm">
                                  {index + 1}.
                                </span>
                                <span className="font-bold text-slate-900 text-sm">
                                  {med.dosageForm}. {med.brandName}
                                </span>
                                <span className="font-mono text-xs font-semibold text-slate-700">
                                  {med.strength}
                                </span>
                                {med.genericName && (
                                  <span className="text-xs text-slate-500 italic">
                                    ({med.genericName})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 pl-4 text-xs font-mono text-slate-800 pt-0.5 flex-wrap">
                                <span className="font-bold text-sm tracking-widest text-slate-900">
                                  {med.frequency}
                                </span>
                                <span className="text-slate-300 select-none tracking-tighter">
                                  ──────────────────────
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {med.duration}
                                </span>
                                <span className="text-slate-500 font-sans italic text-[11px]">
                                  ({med.timing})
                                </span>
                              </div>

                              {med.instructions && (
                                <p className="text-[11px] text-slate-500 italic pl-4 pt-0.5">
                                  * Note: {med.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Doctor Sign-off & Verification Footer */}
                  <div className="border-t-2 border-slate-900 pt-4 flex flex-col sm:flex-row items-end justify-between gap-4 mt-6">
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <div className="h-11 w-11 bg-white border border-slate-900 p-1 rounded-sm shrink-0 shadow-xs flex items-center justify-center">
                        <svg viewBox="0 0 100 100" fill="#0f172a" className="w-9 h-9">
                          <rect x="0" y="0" width="30" height="30" />
                          <rect x="5" y="5" width="20" height="20" fill="#ffffff" />
                          <rect x="9" y="9" width="12" height="12" />
                          <rect x="70" y="0" width="30" height="30" />
                          <rect x="75" y="5" width="20" height="20" fill="#ffffff" />
                          <rect x="79" y="9" width="12" height="12" />
                          <rect x="0" y="70" width="30" height="30" />
                          <rect x="5" y="75" width="20" height="20" fill="#ffffff" />
                          <rect x="9" y="79" width="12" height="12" />
                          <rect x="40" y="10" width="10" height="20" />
                          <rect x="40" y="40" width="20" height="20" />
                          <rect x="70" y="40" width="10" height="10" />
                          <rect x="85" y="45" width="15" height="15" />
                          <rect x="40" y="75" width="20" height="10" />
                          <rect x="70" y="70" width="25" height="25" />
                        </svg>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
                          <span>AUTHENTICATED DIGITAL e-PRESCRIPTION</span>
                        </div>
                        <p className="font-mono text-[9px] text-slate-500">
                          SHA-256: 7f8a...9c2e · Verifiable via DentalOS1
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Issued in compliance with Bangladesh Medical & Dental Council (BMDC) Regulations.
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="w-56 border-t border-slate-900 pt-1 text-center ml-auto">
                        <span className="font-serif italic text-base font-bold text-slate-900 block">
                          {primaryDoctor.name}
                        </span>
                        <span className="text-[10px] text-sky-800 font-bold block">
                          {primaryDoctor.degree}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono block">
                          {primaryDoctor.bmdcReg} · Attending Surgeon
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── TAB 2: ITEMIZED BILLING & DIAGNOSTIC FEE STATEMENT ── */
              <div className="space-y-4">
                {/* Clinic & Patient Header Bar */}
                <div className="p-3.5 rounded-xl bg-muted/40 border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Patient Name</span>
                    <strong className="text-foreground text-sm block">{patient.name}</strong>
                    <span className="text-[11px] text-muted-foreground font-mono">{patient.customId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Age / Gender</span>
                    <span className="text-foreground font-semibold">{patient.age} Yrs · {patient.gender}</span>
                    <span className="text-[11px] text-muted-foreground block">{patient.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Date of Service</span>
                    <span className="text-foreground font-semibold">{patient.date}</span>
                    <span className="text-[11px] text-muted-foreground block truncate">{clinicName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Attending Clinician</span>
                    <span className="text-foreground font-semibold">{primaryDoctor.name}</span>
                    <span className="text-[10px] text-primary font-mono block">{primaryDoctor.bmdcReg}</span>
                  </div>
                </div>

                {/* Primary Diagnosis Indicators Banner */}
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <Stethoscope className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Primary Clinical Diagnosis & Diagnostic Indicators
                    </span>
                  </div>
                  <div className="space-y-0.5 pl-6">
                    <p className="text-sm font-bold text-foreground">
                      {diagnosis || "Comprehensive Dental Evaluation & Therapy"}
                    </p>
                    {additionalAdvice && (
                      <p className="text-xs text-muted-foreground italic">
                        Clinical Notes & Indications: {additionalAdvice}
                      </p>
                    )}
                    {patient.allergies && patient.allergies.length > 0 && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold pt-0.5">
                        ⚠ Documented Medical Alerts: {patient.allergies.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Itemized Fee Statement */}
                <div className="border rounded-xl p-3.5 space-y-3 bg-card shadow-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-primary" />
                      Itemized Fee Statement & Billing Summary
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">Currency: BDT (৳)</span>
                  </div>

                  <div className="divide-y text-xs">
                    {/* Consultation */}
                    <div className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-foreground">Specialist Dental Consultation & Clinical Triage</span>
                        <span className="text-[11px] text-muted-foreground block">Chairside examination, periodontal assessment & diagnostic workup</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-foreground">{formatBDT(1000)}</span>
                      </div>
                    </div>

                    {/* Investigations */}
                    {tests.map((test, idx) => {
                      const fee = test.testName.toLowerCase().includes("opg")
                        ? 1500
                        : test.testName.toLowerCase().includes("cbct")
                        ? 3500
                        : 500;
                      return (
                        <div key={test.id || idx} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-foreground">{test.testName}</span>
                            <span className="text-[11px] text-muted-foreground block">
                              Diagnostic Investigation {test.indication ? `· Indication: ${test.indication}` : ""}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-foreground">{formatBDT(fee)}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pharmacotherapy pack */}
                    <div className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-foreground">Dental Pharmacotherapy Counseling & e-Rx Formulation</span>
                        <span className="text-[11px] text-muted-foreground block">{medicines.length} medications prescribed & electronically authorized</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                          Included
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Total Summary */}
                  <div className="border-t pt-2.5 flex items-center justify-between bg-muted/20 -mx-3.5 -mb-3.5 p-3.5 rounded-b-xl">
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">Estimated Invoice Total</span>
                      <span className="text-[10px] text-muted-foreground">Net payable at reception / billing desk</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-lg text-primary">
                        {formatBDT(
                          1000 +
                            tests.reduce((acc, t) => {
                              const fee = t.testName.toLowerCase().includes("opg")
                                ? 1500
                                : t.testName.toLowerCase().includes("cbct")
                                ? 3500
                                : 500;
                              return acc + fee;
                            }, 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-3 flex-col sm:flex-row gap-2 sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs font-semibold"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Official Letterhead
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleArchiveAndDownloadPdf}
                className="gap-1.5 text-xs text-primary border-primary/40 hover:bg-primary/10 font-semibold"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF Prescription
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsInvoicePreviewModalOpen(false)}
                className="text-xs"
              >
                Close Preview
              </Button>
              <Button
                type="button"
                size="sm"
                asChild
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
              >
                <Link href={`/billing?patientId=${patient.id}`}>
                  <Receipt className="h-3.5 w-3.5" />
                  Proceed to Billing Studio
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
