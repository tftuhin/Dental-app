"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  CalendarDays,
  Plus,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Filter,
  Phone,
  FileEdit,
  ArrowRight,
  Activity,
  HeartPulse,
  Sparkles,
  Save,
  Check,
  UserX,
  Play,
  Pill,
  Receipt,
  Globe,
  Footprints,
  Zap,
  Thermometer,
  Flame,
  ShieldAlert,
  X,
  ChevronRight,
  Info,
  Layers,
  Upload,
  FileUp,
  FileText,
  Paperclip,
  Eye,
  Trash2,
  Image as ImageIcon,
  Copy,
  Loader2,
} from "lucide-react";
import { useCompletion } from "@ai-sdk/react";
import { Odontogram } from "@/components/dental/odontogram";
import { PeriodontalChart } from "@/components/dental/perio-chart";
import { ToothIcon } from "@/components/icons/dental-icons";
import {
  ClinicalQueuePatient,
  ClinicalSessionFile,
  getStoredAppointments,
  saveStoredAppointments,
} from "@/lib/clinical-flow-store";
import { formatBDT } from "@/lib/currency";
import { toast } from "sonner";

// Categorized Clinical Symptoms for Dental Consultation
const CATEGORIZED_SYMPTOMS: Record<string, string[]> = {
  "Pain & Sensitivity": [
    "Spontaneous Throbbing Toothache",
    "Severe Nocturnal Pain (Awakens at night)",
    "Sharp Sensitivity to Cold/Hot",
    "Pain upon Chewing / Biting",
  ],
  "Swelling & Soft Tissue": [
    "Localized Gum Swelling / Abscess",
    "Gingival Bleeding during Brushing",
    "Purulent Pus Discharge from Pocket",
    "Foul Odor / Halitosis",
  ],
  "Structural & Functional": [
    "Tooth Mobility / Looseness",
    "Fractured Cusp / Old Restoration",
    "Deep Cavity / Food Impaction",
    "Jaw Joint / TMJ Pain or Clicking",
    "Aesthetic Discoloration",
  ],
};

const COMMON_TEETH_CHIPS = [
  { code: "#19", name: "LL 1st Molar" },
  { code: "#30", name: "LR 1st Molar" },
  { code: "#18", name: "LL 2nd Molar" },
  { code: "#31", name: "LR 2nd Molar" },
  { code: "#11", name: "UR Central" },
  { code: "#21", name: "UL Central" },
  { code: "#16", name: "UR 1st Molar" },
  { code: "#26", name: "UL 1st Molar" },
  { code: "#14", name: "UR 1st Premolar" },
  { code: "#32", name: "Lower Wisdom" },
];

const QUICK_DIAGNOSIS_LIST = [
  "Symptomatic Irreversible Pulpitis",
  "Acute Apical Periodontitis",
  "Generalized Chronic Periodontitis",
  "Class II Deep Occlusal Dental Caries",
  "Periapical Dental Abscess",
  "Impacted 3rd Molar with Pericoronitis",
  "Cracked Tooth Syndrome",
];

const QUICK_LAB_TESTS = [
  "Digital IOPA Radiograph",
  "Full Mouth OPG (Panoramic)",
  "Sectional CBCT 3D Scan",
  "Bitewing Radiograph (Bilateral)",
  "Routine Blood Count (CBC + RBS)",
  "CAD/CAM Monolithic Zirconia Crown",
];

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<ClinicalQueuePatient[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [filterChair, setFilterChair] = useState<string>("all");
  const [statusTab, setStatusTab] = useState<"active" | "completed" | "no_show" | "all">("active");

  // Selected Appointment for Clinical Session & Notes Popup
  const [selectedAppointment, setSelectedAppointment] = useState<ClinicalQueuePatient | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Form State inside session modal
  const [sessionComplaint, setSessionComplaint] = useState("");
  const [sessionSymptoms, setSessionSymptoms] = useState<string[]>([]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionDiagnosis, setSessionDiagnosis] = useState("");
  const [sessionChair, setSessionChair] = useState("Chair 1");
  const [sessionStatus, setSessionStatus] = useState<ClinicalQueuePatient["status"]>("in_progress");
  const [sessionBp, setSessionBp] = useState("120/80");
  const [sessionPulse, setSessionPulse] = useState("74");
  const [sessionBloodSugar, setSessionBloodSugar] = useState("6.2 mmol/L");
  const [sessionTemp, setSessionTemp] = useState("98.6°F");
  const [sessionTargetTooth, setSessionTargetTooth] = useState("#19");
  const [sessionPainScore, setSessionPainScore] = useState<number>(7);
  const [sessionPercussion, setSessionPercussion] = useState<"positive" | "negative" | "severe">("positive");
  const [sessionColdTest, setSessionColdTest] = useState<"lingering" | "normal" | "non_responsive">("lingering");
  const [sessionMobility, setSessionMobility] = useState<"gr0" | "gr1" | "gr2" | "gr3">("gr0");
  const [sessionLabProcedures, setSessionLabProcedures] = useState<string[]>([]);
  const [newLabProcedureText, setNewLabProcedureText] = useState("");

  // Uploaded Files State (PDF / Image X-rays, lab reports)
  const [sessionUploadedFiles, setSessionUploadedFiles] = useState<ClinicalSessionFile[]>([]);
  const [selectedFilePreview, setSelectedFilePreview] = useState<ClinicalSessionFile | null>(null);
  const [fileUploadNote, setFileUploadNote] = useState("");

  // New Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPhone, setNewPhone] = useState("+880 17");
  const [newAge, setNewAge] = useState<number>(30);
  const [newGender, setNewGender] = useState("Female");
  const [newAddress, setNewAddress] = useState("Dhanmondi, Dhaka");
  const [newChannel, setNewChannel] = useState<"walk_in" | "phone" | "online">("walk_in");
  const [newService, setNewService] = useState("Comprehensive Oral Exam & RCT Consult");
  const [newChair, setNewChair] = useState("Chair 1");
  const [newAlerts, setNewAlerts] = useState("");

  // Clinical Briefing & Session Tabs ("briefing" | "odontogram" | "copilot")
  const [sessionTab, setSessionTab] = useState<"briefing" | "odontogram" | "copilot">("briefing");

  // DentAI Clinical Copilot hook
  const {
    completion: copilotCompletion,
    complete: completeCopilot,
    isLoading: isCopilotLoading,
  } = useCompletion({
    api: "/api/ai/copilot",
    onError: (err) => {
      toast.error("Failed to generate AI recommendations: " + err.message);
    },
    onFinish: () => {
      toast.success("DentAI Copilot recommendations ready!");
    },
  });

  const handleGenerateAiSuggestions = async () => {
    if (!selectedAppointment) return;
    toast.info("Consulting DentAI Clinical Copilot...");
    await completeCopilot("", {
      body: {
        patient: {
          age: selectedAppointment.age,
          gender: selectedAppointment.gender,
          medicalAlerts: selectedAppointment.alerts || [],
          currentMedications: "",
        },
        symptoms: sessionSymptoms,
        chiefComplaint: sessionComplaint,
        clinicalNotes: `${sessionNotes}\nPhysical Examination: Percussion=${sessionPercussion}, Cold Vitality=${sessionColdTest}, Mobility=${sessionMobility}`,
        activeTooth: sessionTargetTooth,
      },
    });
  };

  const handleApplyAiToNotes = () => {
    if (!copilotCompletion) return;
    setSessionNotes((prev) => (prev ? prev + "\n\n" : "") + "[DentAI Clinical Copilot Recommendations]:\n" + copilotCompletion);
    toast.success("Copilot recommendations appended to Operatory Notes!");
  };

  // Completed Handover Banner in modal
  const [isJustCompleted, setIsJustCompleted] = useState(false);

  // Open the Clinical Session & Notes modal
  const openSessionModal = (apt: ClinicalQueuePatient, autoStart = false) => {
    let currentStatus = apt.status;
    if (autoStart && (apt.status === "scheduled" || apt.status === "checked_in")) {
      currentStatus = "in_progress";
      const updatedList = (appointments.length > 0 ? appointments : getStoredAppointments()).map((a) =>
        a.id === apt.id ? { ...a, status: "in_progress" as const } : a
      );
      setAppointments(updatedList);
      saveStoredAppointments(updatedList);
      toast.success(`Session started for ${apt.patient}! Patient seated in ${apt.chair}.`);
    }

    const matchedTooth = apt.service?.match(/#\d+/) || apt.clinicalNotes?.match(/#\d+/);
    setSelectedAppointment({ ...apt, status: currentStatus });
    setSessionTab("briefing");
    setSessionComplaint(apt.chiefComplaint || `Patient reports discomfort in ${matchedTooth ? matchedTooth[0] : "lower molar"}.`);
    setSessionSymptoms(apt.selectedSymptoms && apt.selectedSymptoms.length > 0 ? apt.selectedSymptoms : ["Spontaneous Throbbing Toothache", "Sharp Sensitivity to Cold/Hot"]);
    setSessionNotes(apt.clinicalNotes || "");
    setSessionDiagnosis(apt.provisionalDiagnosis || "");
    setSessionChair(apt.chair);
    setSessionStatus(currentStatus);
    setSessionBp(apt.vitals?.bp || "120/80");
    setSessionPulse(apt.vitals?.pulse || "74");
    setSessionBloodSugar(apt.vitals?.bloodSugar || "6.2 mmol/L");
    setSessionTemp("98.6°F");
    setSessionTargetTooth(matchedTooth ? matchedTooth[0] : "#19");
    setSessionPainScore(7);
    setSessionPercussion("positive");
    setSessionColdTest("lingering");
    setSessionMobility("gr0");
    setSessionLabProcedures(apt.labProceduresRecommended && apt.labProceduresRecommended.length > 0 ? apt.labProceduresRecommended : ["Digital IOPA Radiograph"]);
    setSessionUploadedFiles(
      apt.uploadedFiles && apt.uploadedFiles.length > 0
        ? apt.uploadedFiles
        : [
            {
              id: "file-init-1",
              name: "Digital_IOPA_Tooth_19.jpg",
              type: "image",
              size: "1.4 MB",
              url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80",
              uploadedAt: "Today 10:20 AM",
              notes: "Periapical radiolucency noted around mesial root apex (#19)",
            },
          ]
    );
    setIsJustCompleted(apt.status === "completed");
    setIsSessionModalOpen(true);
  };

  useEffect(() => {
    setIsClient(true);
    const initialList = getStoredAppointments();
    setAppointments(initialList);

    const handleSync = () => {
      setAppointments(getStoredAppointments());
    };
    window.addEventListener("dentai-appointments-updated", handleSync);

    // Auto-open session modal if redirected from Clinical Briefing or with active query param
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get("session");
      const patientIdParam = params.get("patientId");
      if (sessionParam === "active" || patientIdParam) {
        let targetApt: ClinicalQueuePatient | undefined;
        if (patientIdParam) {
          targetApt = initialList.find(
            (a) => a.id === patientIdParam || a.patientId === patientIdParam
          );
        }
        if (!targetApt) {
          targetApt =
            initialList.find((a) => a.status === "in_progress") ||
            initialList.find((a) => a.status === "checked_in" || a.status === "scheduled") ||
            initialList[0];
        }
        if (targetApt) {
          setTimeout(() => {
            openSessionModal(targetApt!, true);
          }, 150);
        }
      }
    }

    return () => window.removeEventListener("dentai-appointments-updated", handleSync);
  }, []);

  // Sorted active queue: strictly sorted by serial (lowest first)
  const activeQueue = appointments
    .filter((a) => a.status === "in_progress" || a.status === "checked_in" || a.status === "scheduled")
    .sort((a, b) => a.fifoSerial - b.fifoSerial);

  // Next in queue
  const nextInQueue = activeQueue.find((a) => a.status === "in_progress") || activeQueue[0];

  // Upload PDF or image file (X-ray, lab report)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const reader = new FileReader();

      reader.onload = (event) => {
        const fileUrl = event.target?.result as string;
        const newFile: ClinicalSessionFile = {
          id: "file-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: isPdf ? "pdf" : "image",
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
          url: fileUrl,
          uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          notes: fileUploadNote || (isPdf ? "Diagnostic Lab Report PDF" : "Digital Radiograph / X-Ray"),
        };

        setSessionUploadedFiles((prev) => [...prev, newFile]);
        toast.success(`Uploaded: ${file.name}`);
      };

      reader.readAsDataURL(file);
    });

    e.target.value = "";
    setFileUploadNote("");
  };

  const removeUploadedFile = (fileId: string) => {
    setSessionUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.info("File removed from clinical session");
  };

  // 1-Click Clinical Note Templates
  const applyClinicalTemplate = (type: "rct" | "crown" | "scaling" | "filling" | "extraction") => {
    const tooth = sessionTargetTooth || "#19";
    if (type === "rct") {
      setSessionComplaint(`Severe spontaneous throbbing toothache in ${tooth}, sharp nocturnal pain awakening patient at night.`);
      setSessionSymptoms([
        "Spontaneous Throbbing Toothache",
        "Severe Nocturnal Pain (Awakens at night)",
        "Sharp Sensitivity to Cold/Hot",
        "Pain upon Chewing / Biting",
      ]);
      setSessionPainScore(8);
      setSessionPercussion("positive");
      setSessionColdTest("lingering");
      setSessionNotes(`Tooth ${tooth}: Deep distal caries invading pulp horn. Tender to vertical percussion (+). Lingering thermal response (>30s). Cold test (+).
Operatory procedure: Local anesthesia with 2% Lidocaine + 1:100,000 Adrenaline (IANB). Rubber dam isolation achieved. Caries excavated, access cavity prepared. Pulp extirpated from MB, ML, and Distal canals. Working length confirmed via apex locator and verified on IOPA. Chemo-mechanical preparation completed up to #25/.04 rotary. Copious 2.5% NaOCl & saline irrigation. Calcium hydroxide intracanal dressing placed. Cavit temporary seal placed.`);
      setSessionDiagnosis(`Symptomatic Irreversible Pulpitis with Acute Apical Periodontitis (${tooth})`);
      setSessionLabProcedures(["Digital IOPA Radiograph", "Working Length Confirmation Film"]);
      toast.success("Applied 'Root Canal Therapy (RCT)' template!");
    } else if (type === "crown") {
      setSessionComplaint(`Fractured cusp & structural restoration needed for root canal treated tooth ${tooth}.`);
      setSessionSymptoms(["Fractured Cusp / Old Restoration", "Pain upon Chewing / Biting"]);
      setSessionPainScore(3);
      setSessionPercussion("negative");
      setSessionColdTest("non_responsive");
      setSessionNotes(`Tooth ${tooth}: Post-endodontic evaluation shows sound apical seal. Core buildup performed with dual-cure composite & fiber post. Full contour monolithic zirconia crown preparation completed: 1.5mm occlusal clearance, 1.0mm axial reduction with distinct chamfer finish line. Gingival retraction cord (#00) placed for 4 mins. Dual-phase vinyl polysiloxane impression recorded. Shade: A2 (VITA 3D Master). Provisional crown cemented with non-eugenol cement.`);
      setSessionDiagnosis(`Coronal Tooth Structure Loss post-RCT (${tooth})`);
      setSessionLabProcedures(["CAD/CAM Monolithic Zirconia Crown", "Dual-Phase Elastomeric Impression"]);
      toast.success("Applied 'Crown & Bridge Prep' template!");
    } else if (type === "scaling") {
      setSessionComplaint("Bleeding gums while tooth brushing, bad breath (halitosis), and stubborn yellowish tartar deposits.");
      setSessionSymptoms(["Gingival Bleeding during Brushing", "Localized Gum Swelling / Abscess", "Foul Odor / Halitosis"]);
      setSessionPainScore(2);
      setSessionPercussion("negative");
      setSessionColdTest("normal");
      setSessionNotes(`Intraoral examination reveals generalized moderate supragingival and subgingival calculus, especially in mandibular anterior lingual and maxillary molar buccal segments. Marginal erythema and bleeding on probing (BOP +) present.
Operatory procedure: Full mouth ultrasonic scaling with piezo scaler. Subgingival root planing on periodontal pockets. Interdental flossing and prophylaxis polishing with fine-grit fluoride paste. Chlorhexidine 0.2% mouthwash irrigation. Detailed oral hygiene instruction (OHI) and Modified Bass brushing technique demonstrated.`);
      setSessionDiagnosis("Generalized Chronic Moderate Marginal Gingivitis with Calculus");
      setSessionLabProcedures(["Full Mouth OPG (Panoramic)", "Periodontal Pocket Charting"]);
      toast.success("Applied 'Scaling & Periodontal Prophylaxis' template!");
    } else if (type === "filling") {
      setSessionComplaint(`Food trapping and mild sensitivity to cold and sweet foods in tooth ${tooth}.`);
      setSessionSymptoms(["Sharp Sensitivity to Cold/Hot", "Fractured Cusp / Old Restoration"]);
      setSessionPainScore(4);
      setSessionPercussion("negative");
      setSessionColdTest("normal");
      setSessionNotes(`Tooth ${tooth}: Class II mesio-occlusal carious lesion detected. No spontaneous nocturnal pain. Cold test normal, percussion negative.
Operatory procedure: Infiltration anesthesia (4% Articaine). Caries excavated using round diamond bur and spoon excavator. Cavity borders smoothed. Sectional matrix band and wedge positioned for tight contact. Selective enamel etching with 37% phosphoric acid (15s). Universal adhesive applied and light-cured (10s). Nano-hybrid composite resin placed in 2mm incremental layers, light-cured, and finished with fine finishing burs and polishing discs. Occlusion checked with 40µ articulating paper.`);
      setSessionDiagnosis(`Class II Mesio-Occlusal Dental Caries (${tooth})`);
      setSessionLabProcedures(["Bitewing Radiograph (Bilateral)"]);
      toast.success("Applied 'Composite Tooth Restoration' template!");
    } else if (type === "extraction") {
      setSessionComplaint(`Severe unmanageable pain and swollen gum around lower wisdom tooth ${tooth}.`);
      setSessionSymptoms(["Spontaneous Throbbing Toothache", "Localized Gum Swelling / Abscess", "Jaw Joint / TMJ Pain or Clicking", "Tooth Mobility / Looseness"]);
      setSessionPainScore(9);
      setSessionPercussion("positive");
      setSessionNotes(`Tooth ${tooth}: Mesioangular impacted third molar with inflamed pericoronal flap (Pericoronitis). Trismus present (mouth opening restricted).
Operatory procedure: Inferior alveolar nerve block and long buccal nerve block administered with 2% Lidocaine 1:100,000 Adrenaline. Full-thickness mucoperiosteal envelope flap reflected. Minimal buccal bone guttering performed under continuous sterile saline irrigation. Crown sectioned horizontally with surgical handpiece. Elevated and delivered in segments atraumatically. Socket inspected, curetted, and irrigated. Hemostatic gelatin sponge inserted. Flap repositioned with 3-0 braided silk interrupted sutures. Hemostasis achieved. Post-extraction instructions given.`);
      setSessionDiagnosis(`Symptomatic Mesioangular Impacted Third Molar with Pericoronitis (${tooth})`);
      setSessionLabProcedures(["Full Mouth OPG (Panoramic)", "Digital IOPA Radiograph"]);
      toast.success("Applied 'Surgical Extraction / Impaction' template!");
    }
  };

  // Toggle symptom chip
  const toggleSymptom = (symptom: string) => {
    if (sessionSymptoms.includes(symptom)) {
      setSessionSymptoms(sessionSymptoms.filter((s) => s !== symptom));
    } else {
      setSessionSymptoms([...sessionSymptoms, symptom]);
    }
  };

  // Add lab procedure
  const handleAddLabProcedure = (procName?: string) => {
    const textToAdd = procName || newLabProcedureText.trim();
    if (!textToAdd) return;
    if (!sessionLabProcedures.includes(textToAdd)) {
      setSessionLabProcedures([...sessionLabProcedures, textToAdd]);
    }
    if (!procName) setNewLabProcedureText("");
  };

  // Save in-progress session notes
  const handleSaveNotes = () => {
    if (!selectedAppointment) return;

    const updatedList = appointments.map((a) =>
      a.id === selectedAppointment.id
        ? {
            ...a,
            chiefComplaint: sessionComplaint,
            selectedSymptoms: sessionSymptoms,
            clinicalNotes: sessionNotes,
            provisionalDiagnosis: sessionDiagnosis,
            chair: sessionChair,
            status: sessionStatus,
            labProceduresRecommended: sessionLabProcedures,
            uploadedFiles: sessionUploadedFiles,
            vitals: {
              bp: sessionBp,
              pulse: sessionPulse,
              bloodSugar: sessionBloodSugar,
            },
          }
        : a
    );

    setAppointments(updatedList);
    saveStoredAppointments(updatedList);
    toast.success(`Clinical notes, uploaded reports & symptoms saved for ${selectedAppointment.patient}!`);
  };

  // Mark patient completed & move to Rx and Billing
  const handleMarkCompletedAndHandover = () => {
    if (!selectedAppointment) return;

    const completionTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const updatedList = appointments.map((a) =>
      a.id === selectedAppointment.id
        ? {
            ...a,
            chiefComplaint: sessionComplaint,
            selectedSymptoms: sessionSymptoms,
            clinicalNotes: sessionNotes,
            provisionalDiagnosis: sessionDiagnosis,
            chair: sessionChair,
            status: "completed" as const,
            completedAt: `${completionTime} Today`,
            labProceduresRecommended: sessionLabProcedures,
            uploadedFiles: sessionUploadedFiles,
            vitals: {
              bp: sessionBp,
              pulse: sessionPulse,
              bloodSugar: sessionBloodSugar,
            },
          }
        : a
    );

    setAppointments(updatedList);
    saveStoredAppointments(updatedList);
    setIsJustCompleted(true);
    toast.success(
      `Consultation completed for ${selectedAppointment.patient}! Profile & uploaded reports moved to Prescription & Billing.`
    );
  };

  // Mark patient as No Show
  const handleMarkNoShow = (apt: ClinicalQueuePatient, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedList = appointments.map((a) =>
      a.id === apt.id ? { ...a, status: "no_show" as const } : a
    );
    setAppointments(updatedList);
    saveStoredAppointments(updatedList);
    toast.error(`${apt.patient} (Serial #${apt.fifoSerial}) marked as No Show.`);
    if (selectedAppointment?.id === apt.id) {
      setIsSessionModalOpen(false);
    }
  };

  // Book new appointment (Serial assignment)
  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const maxSerial = appointments.reduce((max, a) => Math.max(max, a.fifoSerial || 0), 0);
    const nextSerial = maxSerial + 1;
    const token = `A-0${nextSerial + 13}`;
    const newId = "apt-" + Date.now();
    const customPatientId = `DENT-2026-00${String(nextSerial + 150).padStart(3, "0")}`;

    const newApt: ClinicalQueuePatient = {
      id: newId,
      token,
      fifoSerial: nextSerial,
      bookingChannel: newChannel,
      patient: newPatientName.trim(),
      patientId: customPatientId,
      phone: newPhone.trim(),
      age: Number(newAge),
      gender: newGender,
      address: newAddress.trim(),
      chair: newChair,
      doctor: "Dr. Sarah Smith, BDS, FCPS",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      duration: "30m",
      service: newService,
      status: newChannel === "walk_in" ? "checked_in" : "scheduled",
      alerts: newAlerts ? newAlerts.split(",").map((s) => s.trim()) : [],
      chiefComplaint: "New appointment consultation",
      suggestedFee: 800,
    };

    const updated = [...appointments, newApt];
    setAppointments(updated);
    saveStoredAppointments(updated);
    setIsBookModalOpen(false);
    toast.success(
      `Appointment booked for ${newApt.patient}! Assigned Serial #${nextSerial} (${newApt.token}).`
    );

    // Reset fields
    setNewPatientName("");
    setNewAlerts("");
  };

  // Filter based on operatory & status tab
  const filteredList = appointments
    .filter((a) => filterChair === "all" || a.chair === filterChair)
    .filter((a) => {
      if (statusTab === "active") return a.status === "in_progress" || a.status === "checked_in" || a.status === "scheduled";
      if (statusTab === "completed") return a.status === "completed";
      if (statusTab === "no_show") return a.status === "no_show";
      return true;
    })
    .sort((a, b) => a.fifoSerial - b.fifoSerial);

  const channelBadge = (channel: ClinicalQueuePatient["bookingChannel"]) => {
    switch (channel) {
      case "walk_in":
        return (
          <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200 flex items-center gap-1 font-semibold">
            <Footprints className="h-3 w-3" />
            Walk-in
          </Badge>
        );
      case "phone":
        return (
          <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 font-semibold">
            <Phone className="h-3 w-3" />
            Phone Call
          </Badge>
        );
      case "online":
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 font-semibold">
            <Globe className="h-3 w-3" />
            Online Booking
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Daily Patient Queue & Operatory Scheduling (Dhaka Clinic)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated serial queue for Online, Phone & Walk-in bookings with real-time Doctor session handover to Rx & Billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsBookModalOpen(true)} className="gap-1.5 text-xs font-semibold shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            Book Patient (Online / Phone / Walk-in)
          </Button>
        </div>
      </div>

      {/* PROMINENT NEXT APPOINTMENT CARD (Dr. Start Session Callout) */}
      {nextInQueue && (
        <Card className="border-2 border-primary/50 bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-background shadow-md overflow-hidden rounded-xl">
          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground text-xs font-extrabold px-2.5 py-0.5 shadow-sm">
                  NEXT IN QUEUE · SERIAL #{nextInQueue.fifoSerial}
                </Badge>
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  Token: {nextInQueue.token}
                </Badge>
                {channelBadge(nextInQueue.bookingChannel)}
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {nextInQueue.time} ({nextInQueue.duration})
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  {nextInQueue.patient}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({nextInQueue.gender}, {nextInQueue.age} yrs)
                  </span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  {nextInQueue.patientId} · {nextInQueue.address} · {nextInQueue.phone}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-foreground font-medium">
                  Chief Complaint / Service: <strong className="text-primary">{nextInQueue.service}</strong>
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-foreground">
                  Chair: <strong>{nextInQueue.chair}</strong>
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-foreground">
                  Doctor: <strong>{nextInQueue.doctor}</strong>
                </span>
              </div>

              {nextInQueue.alerts.length > 0 && (
                <div className="inline-flex items-center gap-1.5 text-xs text-red-600 font-semibold bg-red-100/90 dark:bg-red-950/50 px-2 py-0.5 rounded">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Medical Alert: {nextInQueue.alerts.join(", ")}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              {nextInQueue.status === "in_progress" ? (
                <Button
                  size="sm"
                  className="gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md h-10 px-4 text-xs"
                  onClick={() => openSessionModal(nextInQueue, false)}
                >
                  <FileEdit className="h-4 w-4" />
                  Continue Active Session & Notes
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-10 px-4 text-xs"
                  onClick={() => openSessionModal(nextInQueue, true)}
                >
                  <Play className="h-4 w-4 fill-current" />
                  Start Session (Listen & Take Notes)
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-xs text-red-600 hover:bg-red-50 border-red-200"
                onClick={(e) => handleMarkNoShow(nextInQueue, e)}
              >
                <UserX className="h-3.5 w-3.5 mr-1" />
                No Show
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Queue View Tabs & Operatory Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg text-xs">
          <button
            onClick={() => setStatusTab("active")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              statusTab === "active" ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active Patient Queue ({appointments.filter((a) => a.status === "in_progress" || a.status === "checked_in" || a.status === "scheduled").length})
          </button>
          <button
            onClick={() => setStatusTab("completed")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              statusTab === "completed" ? "bg-background text-foreground shadow-sm font-bold text-emerald-600" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Completed Today ({appointments.filter((a) => a.status === "completed").length})
          </button>
          <button
            onClick={() => setStatusTab("no_show")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              statusTab === "no_show" ? "bg-background text-foreground shadow-sm font-bold text-red-600" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            No Shows ({appointments.filter((a) => a.status === "no_show").length})
          </button>
          <button
            onClick={() => setStatusTab("all")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              statusTab === "all" ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Bookings ({appointments.length})
          </button>
        </div>

        {/* Chair Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["all", "Chair 1", "Chair 2", "Chair 3"].map((c) => (
            <Button
              key={c}
              size="sm"
              variant={filterChair === c ? "default" : "outline"}
              className="text-xs h-7 px-2.5"
              onClick={() => setFilterChair(c)}
            >
              {c === "all" ? "All Chairs" : c}
            </Button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="py-3 px-3 text-left font-semibold">Serial</th>
                <th className="py-3 px-3 text-left font-semibold">Token</th>
                <th className="py-3 px-3 text-left font-semibold">Channel</th>
                <th className="py-3 px-3 text-left font-semibold">Time</th>
                <th className="py-3 px-4 text-left font-semibold">Patient (Bangladesh)</th>
                <th className="py-3 px-3 text-left font-semibold">Service</th>
                <th className="py-3 px-3 text-left font-semibold">Operatory</th>
                <th className="py-3 px-3 text-left font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Clinical Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredList.map((apt) => (
                <tr
                  key={apt.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openSessionModal(apt, false)}
                >
                  <td className="py-3 px-3 font-mono font-bold text-primary">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs">
                      #{apt.fifoSerial}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-foreground">
                    {apt.token}
                  </td>
                  <td className="py-3 px-3">
                    {channelBadge(apt.bookingChannel)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-foreground whitespace-nowrap">
                    {apt.time}
                    <span className="text-[10px] text-muted-foreground block font-normal">
                      ({apt.duration})
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    <div>
                      <span className="font-bold text-primary hover:underline">{apt.patient}</span>
                      <span className="text-[11px] text-muted-foreground block">
                        {apt.patientId} · {apt.address} · {apt.phone}
                      </span>
                      {apt.alerts.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-semibold mt-0.5">
                          <AlertCircle className="h-3 w-3" />
                          {apt.alerts.join(", ")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground font-medium">{apt.service}</td>
                  <td className="py-3 px-3 font-semibold text-foreground">
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {apt.chair}
                    </Badge>
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      className={`text-[10px] capitalize font-semibold ${
                        apt.status === "in_progress"
                          ? "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300"
                          : apt.status === "checked_in"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          : apt.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : apt.status === "no_show"
                          ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {apt.status === "no_show" ? "No Show" : apt.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {apt.status !== "completed" && apt.status !== "no_show" && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 text-[10px] px-2 gap-1 font-bold bg-primary hover:bg-primary/90"
                            onClick={() => openSessionModal(apt, true)}
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Start Session
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] px-2 text-red-600 hover:bg-red-50"
                            onClick={(e) => handleMarkNoShow(apt, e)}
                          >
                            <UserX className="h-3 w-3 mr-0.5" />
                            No Show
                          </Button>
                        </>
                      )}

                      {apt.status === "completed" && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="h-7 text-[10px] px-2 text-primary border-primary/30"
                          >
                            <Link href="/prescriptions">
                              <Pill className="h-3 w-3 mr-1" />
                              Write Rx
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="h-7 text-[10px] px-2 text-emerald-700 border-emerald-300"
                          >
                            <Link href="/billing">
                              <Receipt className="h-3 w-3 mr-1" />
                              Bill Patient
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── DOCTOR CLINICAL SESSION & HEALTH NOTES MODAL (PROPER STUDIO) ─── */}
      <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[96vw] md:max-w-[94vw] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1540px] h-[94vh] max-h-[94vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl bg-card border">
          {selectedAppointment && (
            <>
              {/* STICKY HEADER */}
              <div className="p-4 sm:p-5 border-b bg-muted/20 shrink-0 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-foreground">
                          {selectedAppointment.patient}
                        </h2>
                        <Badge variant="outline" className="font-mono text-xs font-semibold bg-background">
                          Serial #{selectedAppointment.fifoSerial} ({selectedAppointment.token})
                        </Badge>
                        {channelBadge(selectedAppointment.bookingChannel)}
                        <Badge
                          className={`text-xs capitalize font-semibold ${
                            sessionStatus === "completed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : sessionStatus === "in_progress"
                              ? "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {sessionStatus.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ID: <span className="font-mono font-medium text-foreground">{selectedAppointment.patientId}</span> · {selectedAppointment.gender}, {selectedAppointment.age} years · {selectedAppointment.phone} · {selectedAppointment.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pr-8">
                    <Badge variant="outline" className="text-xs px-2.5 py-1 bg-background font-medium">
                      Chair: <span className="font-bold text-primary ml-1">{sessionChair}</span>
                    </Badge>
                  </div>
                </div>

                {/* Medical Warning Alert Bar */}
                {selectedAppointment.alerts && selectedAppointment.alerts.length > 0 && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-lg text-xs text-red-800 dark:text-red-300 font-semibold flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                      <span>CRITICAL MEDICAL ALERT: {selectedAppointment.alerts.join(", ")}</span>
                    </div>
                    <span className="text-[10px] font-normal uppercase tracking-wider text-red-600 border border-red-300 dark:border-red-800 px-1.5 py-0.5 rounded bg-background/50">
                      Pre-Op Caution
                    </span>
                  </div>
                )}

                {/* Unified Studio Section Switcher Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSessionTab("briefing")}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                        sessionTab === "briefing"
                          ? "bg-background text-primary shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Activity className="h-3.5 w-3.5" />
                      1. Clinical Briefing & Notes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionTab("odontogram")}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                        sessionTab === "odontogram"
                          ? "bg-background text-primary shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <ToothIcon className="h-3.5 w-3.5" />
                      2. Odontogram & Perio Chart
                      <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1.5 bg-primary/10 text-primary font-mono">
                        {sessionTargetTooth}
                      </Badge>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionTab("copilot")}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                        sessionTab === "copilot"
                          ? "bg-background text-primary shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      3. DentAI Clinical Copilot
                    </button>
                  </div>

                  {/* 1-Click Clinical Templates Bar */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1 shrink-0 mr-1">
                      <Zap className="h-3.5 w-3.5 fill-primary text-primary" />
                      Templates:
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applyClinicalTemplate("rct")}
                      className="h-7 text-[11px] px-2 bg-background hover:bg-primary/10 hover:border-primary shrink-0 font-medium"
                    >
                      ⚡ RCT (#19)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applyClinicalTemplate("crown")}
                      className="h-7 text-[11px] px-2 bg-background hover:bg-primary/10 hover:border-primary shrink-0 font-medium"
                    >
                      ⚡ Crown
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applyClinicalTemplate("scaling")}
                      className="h-7 text-[11px] px-2 bg-background hover:bg-primary/10 hover:border-primary shrink-0 font-medium"
                    >
                      ⚡ Scaling
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applyClinicalTemplate("filling")}
                      className="h-7 text-[11px] px-2 bg-background hover:bg-primary/10 hover:border-primary shrink-0 font-medium"
                    >
                      ⚡ Class II
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applyClinicalTemplate("extraction")}
                      className="h-7 text-[11px] px-2 bg-background hover:bg-primary/10 hover:border-primary shrink-0 font-medium"
                    >
                      ⚡ Extraction
                    </Button>
                  </div>
                </div>
              </div>

              {/* SCROLLABLE 2-COLUMN CLINICAL BODY */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Handover Banner when completed */}
                {isJustCompleted && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl space-y-2.5 shadow-xs">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <span>Clinical Session Completed! Handover generated for {selectedAppointment.patient}.</span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 pl-7">
                      This patient's consultation notes, provisional diagnosis, and lab orders are now synced and available in Today's Completed Queue. Click below to continue:
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 pl-7">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/prescriptions?patientId=${selectedAppointment.id}`)}
                        className="text-xs bg-primary hover:bg-primary/90 text-white h-9 px-4 gap-2 font-bold shadow-xs"
                      >
                        <Pill className="h-4 w-4" />
                        Open Prescription Studio ({selectedAppointment.patient})
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/billing?patientId=${selectedAppointment.id}`)}
                        className="text-xs border-emerald-400 text-emerald-900 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/40 h-9 px-4 gap-2 font-bold"
                      >
                        <Receipt className="h-4 w-4 text-emerald-600" />
                        Open Billing Studio (Invoice Ready)
                      </Button>
                    </div>
                  </div>
                )}

                {/* ─── TAB 1: CLINICAL BRIEFING & NOTES ─── */}
                {sessionTab === "briefing" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* ─── LEFT COLUMN (col-span-5): Patient Voice & Symptoms & Vitals ─── */}
                  <div className="col-span-12 lg:col-span-5 space-y-4">
                    {/* 1. Listen to Patient: Chief Complaint & Pain Score */}
                    <Card className="border shadow-xs">
                      <CardHeader className="py-3 px-4 border-b bg-muted/20">
                        <CardTitle className="text-xs font-bold flex items-center justify-between text-foreground">
                          <span className="flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-primary" />
                            1. Listen to Patient (Chief Complaints)
                          </span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Target Tooth & Pain
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3.5 text-xs">
                        {/* Target Tooth Selector */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                            <span>Target Tooth Number / Quadrant</span>
                            <span className="text-[10px] text-muted-foreground">Universal / FDI</span>
                          </Label>
                          <div className="flex flex-wrap gap-1">
                            {COMMON_TEETH_CHIPS.map((t) => (
                              <button
                                key={t.code}
                                type="button"
                                onClick={() => setSessionTargetTooth(t.code)}
                                className={`text-[10px] px-2 py-0.5 rounded border font-mono font-medium transition-all ${
                                  sessionTargetTooth === t.code
                                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                                    : "bg-background text-muted-foreground hover:bg-muted/50 border-border"
                                }`}
                              >
                                {t.code}
                              </button>
                            ))}
                          </div>
                          <Input
                            value={sessionTargetTooth}
                            onChange={(e) => setSessionTargetTooth(e.target.value)}
                            placeholder="e.g. Tooth #19 (Mandibular Left First Molar)"
                            className="h-8 text-xs font-mono mt-1"
                          />
                        </div>

                        {/* Visual Pain Scale 1 to 10 */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Flame className="h-3.5 w-3.5 text-amber-500" />
                              Pain Intensity Scale (1 to 10)
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                sessionPainScore >= 8
                                  ? "bg-red-100 text-red-800 border-red-300"
                                  : sessionPainScore >= 5
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
                              }`}
                            >
                              Level {sessionPainScore} / 10 · {sessionPainScore >= 8 ? "Severe / Nocturnal" : sessionPainScore >= 5 ? "Moderate" : "Mild"}
                            </Badge>
                          </Label>
                          <div className="grid grid-cols-10 gap-1 pt-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                              <button
                                key={score}
                                type="button"
                                onClick={() => setSessionPainScore(score)}
                                className={`h-7 rounded text-[11px] font-bold transition-all ${
                                  sessionPainScore === score
                                    ? score >= 8
                                      ? "bg-red-600 text-white shadow-sm ring-2 ring-red-400"
                                      : score >= 5
                                      ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-300"
                                      : "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                }`}
                              >
                                {score}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Chief Complaints Notes */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-foreground">
                            Patient's Description (In Their Own Words)
                          </Label>
                          <Textarea
                            value={sessionComplaint}
                            onChange={(e) => setSessionComplaint(e.target.value)}
                            rows={4}
                            placeholder="Patient reports spontaneous pain, trigger factors, sensitivity to hot/cold, nocturnal pain awakens them..."
                            className="text-xs leading-relaxed"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* 2. Categorized Symptoms Checklist */}
                    <Card className="border shadow-xs">
                      <CardHeader className="py-3 px-4 border-b bg-muted/20">
                        <CardTitle className="text-xs font-bold flex items-center justify-between text-foreground">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            2. Mark Dental Symptoms Checklist
                          </span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Toggle chips
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3.5 space-y-3 text-xs">
                        {Object.entries(CATEGORIZED_SYMPTOMS).map(([category, symptoms]) => (
                          <div key={category} className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              {category}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {symptoms.map((symptom) => {
                                const isSelected = sessionSymptoms.includes(symptom);
                                return (
                                  <button
                                    key={symptom}
                                    type="button"
                                    onClick={() => toggleSymptom(symptom)}
                                    className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all flex items-center gap-1 ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                                        : "bg-background hover:bg-muted/50 text-muted-foreground border-border"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                    {symptom}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* 3. Clinical Documents & Test Reports Upload (PDF / Images) */}
                    <Card className="border shadow-xs">
                      <CardHeader className="py-2.5 px-4 border-b bg-muted/20">
                        <CardTitle className="text-xs font-bold flex items-center justify-between text-foreground">
                          <span className="flex items-center gap-1.5">
                            <FileUp className="h-4 w-4 text-primary" />
                            3. Clinical Test Reports & Radiographs Upload
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            PDF & Image
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3.5 space-y-3 text-xs">
                        {/* Hidden file input */}
                        <input
                          type="file"
                          id="clinical-file-upload-input"
                          multiple
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        {/* Dropzone / Upload button */}
                        <div className="border-2 border-dashed border-primary/30 hover:border-primary rounded-xl p-3 text-center bg-primary/5 transition-all">
                          <label
                            htmlFor="clinical-file-upload-input"
                            className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                          >
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <Upload className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-foreground">
                              Click to Upload X-Rays, IOPA, OPG or Lab PDFs
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Supports Digital IOPA, OPG, CBCT scans, Blood tests (PDF) & Intraoral photos
                            </span>
                          </label>
                        </div>

                        {/* Optional caption note for next file */}
                        <div className="flex gap-1.5 items-center">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Input
                            value={fileUploadNote}
                            onChange={(e) => setFileUploadNote(e.target.value)}
                            placeholder="Optional note: e.g. Pre-op IOPA #19, CBC Blood count..."
                            className="h-7 text-[11px]"
                          />
                        </div>

                        {/* Uploaded Files Gallery */}
                        {sessionUploadedFiles.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground text-center py-1 italic">
                            No files attached yet for this session. Upload PDFs or X-rays to attach to today's procedure timeline.
                          </p>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Attached Clinical Files ({sessionUploadedFiles.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {sessionUploadedFiles.map((file) => (
                                <div
                                  key={file.id}
                                  className="p-2 rounded-lg border bg-card hover:bg-muted/30 transition-all flex items-start gap-2 group relative"
                                >
                                  {file.type === "image" ? (
                                    <div
                                      onClick={() => setSelectedFilePreview(file)}
                                      className="h-12 w-12 rounded bg-muted overflow-hidden shrink-0 cursor-pointer border relative group/img"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={file.url}
                                        alt={file.name}
                                        className="h-full w-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                                        <Eye className="h-3.5 w-3.5" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => setSelectedFilePreview(file)}
                                      className="h-12 w-12 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col items-center justify-center shrink-0 cursor-pointer text-rose-600"
                                    >
                                      <FileText className="h-5 w-5" />
                                      <span className="text-[8px] font-bold uppercase mt-0.5 font-mono">PDF</span>
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0 pr-4">
                                    <p
                                      onClick={() => setSelectedFilePreview(file)}
                                      className="text-[11px] font-bold text-foreground truncate cursor-pointer hover:text-primary"
                                      title={file.name}
                                    >
                                      {file.name}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground">
                                      {file.size} · {file.uploadedAt}
                                    </p>
                                    {file.notes && (
                                      <p className="text-[10px] text-primary/80 line-clamp-1 italic mt-0.5">
                                        "{file.notes}"
                                      </p>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeUploadedFile(file.id)}
                                    className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-red-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove file"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 4. Operatory Vitals & Pre-Op */}
                    <Card className="border shadow-xs">
                      <CardHeader className="py-2.5 px-4 border-b bg-muted/20">
                        <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                          <HeartPulse className="h-4 w-4 text-rose-500" />
                          4. Operatory Vitals & Safety Screen
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Blood Pressure</span>
                          <Input
                            value={sessionBp}
                            onChange={(e) => setSessionBp(e.target.value)}
                            placeholder="120/80"
                            className="h-8 text-xs font-mono mt-0.5"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Pulse (bpm)</span>
                          <Input
                            value={sessionPulse}
                            onChange={(e) => setSessionPulse(e.target.value)}
                            placeholder="74"
                            className="h-8 text-xs font-mono mt-0.5"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Blood Sugar (RBS)</span>
                          <Input
                            value={sessionBloodSugar}
                            onChange={(e) => setSessionBloodSugar(e.target.value)}
                            placeholder="6.2 mmol/L"
                            className="h-8 text-xs font-mono mt-0.5"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Body Temp</span>
                          <Input
                            value={sessionTemp}
                            onChange={(e) => setSessionTemp(e.target.value)}
                            placeholder="98.6°F"
                            className="h-8 text-xs font-mono mt-0.5"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* ─── RIGHT COLUMN (col-span-7): Clinical Findings, Diagnosis & Lab ─── */}
                  <div className="col-span-12 lg:col-span-7 space-y-4">
                    {/* 4. Clinical Examination & Operatory Findings */}
                    <Card className="border shadow-xs">
                      <CardHeader className="py-3 px-4 border-b bg-muted/20">
                        <CardTitle className="text-xs font-bold flex items-center justify-between text-foreground">
                          <span className="flex items-center gap-1.5">
                            <FileEdit className="h-4 w-4 text-primary" />
                            4. Clinical Examination & Operatory Findings
                          </span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Objective Findings & Tests
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3.5 text-xs">
                        {/* Rapid Diagnostic Tests Toggles */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2.5 bg-muted/20 border rounded-lg">
                          {/* Percussion */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              Percussion Test
                            </span>
                            <div className="flex gap-1">
                              {[
                                { val: "negative", label: "(-) Neg" },
                                { val: "positive", label: "(+) Tender" },
                                { val: "severe", label: "(++) Severe" },
                              ].map((opt) => (
                                <button
                                  key={opt.val}
                                  type="button"
                                  onClick={() => setSessionPercussion(opt.val as any)}
                                  className={`text-[10px] px-1.5 py-1 rounded flex-1 border font-medium ${
                                    sessionPercussion === opt.val
                                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                                      : "bg-background text-muted-foreground hover:bg-muted/40"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cold Vitality */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              Cold Vitality Test
                            </span>
                            <div className="flex gap-1">
                              {[
                                { val: "normal", label: "Normal" },
                                { val: "lingering", label: "Lingering" },
                                { val: "non_responsive", label: "Necrotic" },
                              ].map((opt) => (
                                <button
                                  key={opt.val}
                                  type="button"
                                  onClick={() => setSessionColdTest(opt.val as any)}
                                  className={`text-[10px] px-1.5 py-1 rounded flex-1 border font-medium ${
                                    sessionColdTest === opt.val
                                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                                      : "bg-background text-muted-foreground hover:bg-muted/40"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tooth Mobility */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              Tooth Mobility
                            </span>
                            <div className="flex gap-1">
                              {[
                                { val: "gr0", label: "Gr-0" },
                                { val: "gr1", label: "Gr-I" },
                                { val: "gr2", label: "Gr-II" },
                                { val: "gr3", label: "Gr-III" },
                              ].map((opt) => (
                                <button
                                  key={opt.val}
                                  type="button"
                                  onClick={() => setSessionMobility(opt.val as any)}
                                  className={`text-[10px] px-1.5 py-1 rounded flex-1 border font-medium ${
                                    sessionMobility === opt.val
                                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                                      : "bg-background text-muted-foreground hover:bg-muted/40"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Detailed Notes Textarea */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-foreground">
                            Operatory Notes, Procedure Details & Findings
                          </Label>
                          <Textarea
                            value={sessionNotes}
                            onChange={(e) => setSessionNotes(e.target.value)}
                            rows={6}
                            placeholder="Enter objective intraoral findings: tooth condition, caries extent, canals located, canal working lengths, prep done, medication placed..."
                            className="text-xs font-mono leading-relaxed"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* 5. Provisional Clinical Diagnosis */}
                    <Card className="border shadow-xs">
                      <CardHeader className="py-2.5 px-4 border-b bg-muted/20">
                        <CardTitle className="text-xs font-bold text-foreground flex items-center justify-between">
                          <span>5. Provisional Clinical Diagnosis</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Click to auto-populate
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3.5 space-y-2.5 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {QUICK_DIAGNOSIS_LIST.map((diag) => (
                            <button
                              key={diag}
                              type="button"
                              onClick={() => setSessionDiagnosis(`${diag} (${sessionTargetTooth || "#19"})`)}
                              className="text-[10px] px-2 py-0.5 rounded border bg-background hover:bg-muted text-muted-foreground font-medium transition-colors"
                            >
                              + {diag}
                            </button>
                          ))}
                        </div>
                        <Input
                          value={sessionDiagnosis}
                          onChange={(e) => setSessionDiagnosis(e.target.value)}
                          placeholder="e.g. Symptomatic Irreversible Pulpitis #19 with Apical Periodontitis"
                          className="h-8 text-xs font-medium"
                        />
                      </CardContent>
                    </Card>

                    {/* 6. Lab Procedures & Radiographs Required */}
                    <Card className="border shadow-xs">
                      <CardHeader className="py-2.5 px-4 border-b bg-muted/20">
                        <CardTitle className="text-xs font-bold text-foreground flex items-center justify-between">
                          <span>6. Lab Procedures & Radiographs Required</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Passed to Rx & Billing
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3.5 space-y-2.5 text-xs">
                        {/* Quick Lab Pills */}
                        <div className="flex flex-wrap gap-1">
                          {QUICK_LAB_TESTS.map((test) => (
                            <button
                              key={test}
                              type="button"
                              onClick={() => handleAddLabProcedure(test)}
                              className="text-[10px] px-2 py-0.5 rounded border bg-background hover:bg-primary/10 text-muted-foreground hover:text-primary font-medium transition-colors"
                            >
                              + {test}
                            </button>
                          ))}
                        </div>

                        {/* Custom Input */}
                        <div className="flex gap-2">
                          <Input
                            value={newLabProcedureText}
                            onChange={(e) => setNewLabProcedureText(e.target.value)}
                            placeholder="Type test name (e.g. CBCT 3D Scan, Monolithic Zirconia Crown)..."
                            className="h-8 text-xs flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddLabProcedure();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddLabProcedure()}
                            className="h-8 text-xs px-3"
                          >
                            Add
                          </Button>
                        </div>

                        {/* List of Ordered Lab Tests */}
                        {sessionLabProcedures.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {sessionLabProcedures.map((proc, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-[11px] py-1 px-2.5 gap-1.5 bg-muted font-medium text-foreground"
                              >
                                {proc}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSessionLabProcedures(
                                      sessionLabProcedures.filter((_, i) => i !== idx)
                                    )
                                  }
                                  className="text-muted-foreground hover:text-red-600 ml-1 font-bold"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: INTERACTIVE ODONTOGRAM & PERIO CHART ─── */}
              {sessionTab === "odontogram" && (
                <div className="space-y-4">
                  {/* Active Operatory Tooth Banner */}
                  <Card className="border bg-gradient-to-r from-primary/5 via-card to-background p-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                          <ToothIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground">
                              Active Operatory Tooth: <span className="font-mono text-primary text-base font-extrabold">{sessionTargetTooth}</span>
                            </h3>
                            <Badge variant="outline" className="text-[10px] bg-background">
                              Auto-synced with Diagnosis & Rx
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Click any tooth below to select it as the active tooth. Click individual tooth surfaces (Mesial, Distal, Occlusal, Buccal, Lingual) to cycle conditions.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 bg-background font-medium hover:bg-primary/10 hover:border-primary"
                          onClick={() => {
                            setSessionDiagnosis(`Symptomatic Irreversible Pulpitis (${sessionTargetTooth})`);
                            toast.success(`Updated provisional diagnosis with ${sessionTargetTooth}`);
                          }}
                        >
                          Set as Pulpitis ({sessionTargetTooth})
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 bg-background font-medium hover:bg-primary/10 hover:border-primary"
                          onClick={() => {
                            setSessionNotes((prev) => (prev ? prev + "\n" : "") + `Operatory finding on tooth ${sessionTargetTooth}: `);
                            toast.success(`Appended ${sessionTargetTooth} to operatory notes`);
                          }}
                        >
                          Append to Notes
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* 32-Teeth Odontogram Arch */}
                  <Card className="border shadow-xs overflow-hidden">
                    <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                          <ToothIcon className="h-4 w-4 text-primary" />
                          32-Teeth Interactive Odontogram (Universal & FDI Notation)
                        </CardTitle>
                        <CardDescription className="text-[11px]">
                          Maxillary Upper Arch (Teeth #1-#16) and Mandibular Lower Arch (Teeth #17-#32)
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px] flex-wrap">
                        <span className="flex items-center gap-1 font-medium"><span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" /> Caries</span>
                        <span className="flex items-center gap-1 font-medium"><span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" /> Restored</span>
                        <span className="flex items-center gap-1 font-medium"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" /> Planned RCT</span>
                        <span className="flex items-center gap-1 font-medium"><span className="h-2.5 w-2.5 rounded-full bg-purple-500 inline-block" /> Fracture</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 overflow-x-auto">
                      <Odontogram
                        patientId={selectedAppointment.patientId}
                        onToothSelect={(num) => {
                          setSessionTargetTooth("#" + num);
                          toast.info(`Selected Tooth #${num} for this session`);
                        }}
                      />
                    </CardContent>
                  </Card>

                  {/* Periodontal 6-Point Probing Depth Chart */}
                  <Card className="border shadow-xs overflow-hidden">
                    <CardHeader className="py-3 px-4 border-b bg-muted/20">
                      <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Periodontal Probing Depth (6-Point Chart) & Bleeding on Probing (BOP)
                      </CardTitle>
                      <CardDescription className="text-[11px]">
                        Circumferential probing depths (Distobuccal, Buccal, Mesiobuccal, Distolingual, Lingual, Mesiolingual) with furcation & mobility
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <PeriodontalChart patientId={selectedAppointment.patientId} />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ─── TAB 3: DENTAI CLINICAL COPILOT ─── */}
              {sessionTab === "copilot" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left: Input Parameters (5 cols) */}
                    <div className="col-span-12 lg:col-span-5 space-y-4">
                      <Card className="border shadow-xs bg-gradient-to-b from-card to-primary/5">
                        <CardHeader className="py-3 px-4 border-b">
                          <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                            DentAI Clinical Decision Support
                          </CardTitle>
                          <CardDescription className="text-[11px]">
                            Evidence-based chairside clinical assistant
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3.5 text-xs">
                          {/* Patient Snapshot */}
                          <div className="p-3 rounded-lg bg-muted/40 border space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">Patient Profile</span>
                              <span className="font-mono text-primary font-bold">{selectedAppointment.patient}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                              <div>Age/Gender: <span className="font-medium text-foreground">{selectedAppointment.age}y / {selectedAppointment.gender}</span></div>
                              <div>Target Tooth: <span className="font-mono font-bold text-primary">{sessionTargetTooth}</span></div>
                              <div>Blood Pressure: <span className="font-mono font-medium text-foreground">{sessionBp}</span></div>
                              <div>Pulse / RBS: <span className="font-mono font-medium text-foreground">{sessionPulse} bpm / {sessionBloodSugar}</span></div>
                            </div>
                            {selectedAppointment.alerts && selectedAppointment.alerts.length > 0 && (
                              <div className="pt-1 border-t border-border/50 text-[11px] text-red-600 font-medium flex items-center gap-1.5">
                                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                                Medical Alerts: {selectedAppointment.alerts.join(", ")}
                              </div>
                            )}
                          </div>

                          {/* Chief Complaint */}
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Chief Complaint Under Consideration</Label>
                            <p className="text-xs text-muted-foreground p-2 rounded bg-background border italic">
                              "{sessionComplaint}"
                            </p>
                          </div>

                          {/* Marked Symptoms */}
                          {sessionSymptoms.length > 0 && (
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold">Presenting Symptoms ({sessionSymptoms.length})</Label>
                              <div className="flex flex-wrap gap-1">
                                {sessionSymptoms.map((s, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[10px] bg-background">
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Physical Exam Values */}
                          <div className="p-2.5 rounded-lg bg-background border text-[11px] space-y-1">
                            <span className="font-semibold text-foreground block">Chairside Examination Signals:</span>
                            <div className="grid grid-cols-3 gap-1 text-muted-foreground">
                              <div>Percussion: <span className="font-medium text-foreground uppercase">{sessionPercussion}</span></div>
                              <div>Cold Vitality: <span className="font-medium text-foreground capitalize">{sessionColdTest}</span></div>
                              <div>Mobility: <span className="font-medium text-foreground uppercase">{sessionMobility}</span></div>
                            </div>
                          </div>

                          {/* Generate Button */}
                          <Button
                            type="button"
                            onClick={handleGenerateAiSuggestions}
                            disabled={isCopilotLoading}
                            className="w-full h-10 gap-2 text-xs font-bold shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {isCopilotLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Analyzing Symptoms & Dental Evidence...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                Generate AI Differential & CDT Treatment Plan
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right: Copilot Output Stream (7 cols) */}
                    <div className="col-span-12 lg:col-span-7">
                      <Card className="border shadow-xs h-full flex flex-col">
                        <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-primary" />
                            <CardTitle className="text-xs font-bold text-foreground">
                              AI Diagnostic & Treatment Recommendations
                            </CardTitle>
                          </div>
                          {copilotCompletion && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={handleApplyAiToNotes}
                              className="h-7 text-xs px-2.5 gap-1.5 bg-background font-semibold hover:bg-primary/10 hover:text-primary"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Append to Clinical Notes
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 flex-1 flex flex-col">
                          {copilotCompletion || isCopilotLoading ? (
                            <div className="p-3.5 rounded-lg border bg-muted/20 flex-1 overflow-y-auto max-h-[500px]">
                              <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                                {copilotCompletion}
                                {isCopilotLoading && (
                                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-xl bg-muted/10 space-y-2">
                              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <Sparkles className="h-5 w-5" />
                              </div>
                              <h4 className="text-xs font-bold text-foreground">No AI Recommendations Generated Yet</h4>
                              <p className="text-xs text-muted-foreground max-w-sm">
                                Click "Generate AI Differential & CDT Treatment Plan" on the left to analyze the patient's symptoms, target tooth {sessionTargetTooth}, and vitals.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STICKY FOOTER */}
              <div className="p-3.5 border-t bg-muted/30 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-medium">Operatory:</span>
                    <Select value={sessionChair} onValueChange={setSessionChair}>
                      <SelectTrigger className="h-8 text-xs w-[130px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chair 1">Chair 1 (RCT)</SelectItem>
                        <SelectItem value="Chair 2">Chair 2 (Crown)</SelectItem>
                        <SelectItem value="Chair 3">Chair 3 (Scaling)</SelectItem>
                        <SelectItem value="Consultation">Consult Room</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-medium">Status:</span>
                    <Select
                      value={sessionStatus}
                      onValueChange={(val: any) => setSessionStatus(val)}
                    >
                      <SelectTrigger className="h-8 text-xs w-[140px] bg-background font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="checked_in">Checked In</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSessionModalOpen(false)}
                    className="text-xs h-9 px-3"
                  >
                    Close
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveNotes}
                    className="text-xs h-9 px-3.5 gap-1.5 font-semibold"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save Notes
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleMarkCompletedAndHandover}
                    className="text-xs h-9 px-4 gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Completed & Move to Rx / Billing
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── NEW APPOINTMENT BOOKING MODAL (Serial Assignment) ─── */}
      <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Book New Patient Appointment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assigns the next automatic queue serial for today's clinic schedule
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookAppointment} className="space-y-3.5 text-xs py-2">
            <div>
              <Label className="text-xs font-semibold">Booking Channel *</Label>
              <Select value={newChannel} onValueChange={(v: any) => setNewChannel(v)}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk_in">Walk-in Patient (Immediate Check-in)</SelectItem>
                  <SelectItem value="phone">Phone Call Booking</SelectItem>
                  <SelectItem value="online">Online Web Portal Booking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Patient Full Name *</Label>
              <Input
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder="e.g. Farhana Chowdhury"
                required
                className="h-8 text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Mobile Phone *</Label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+880 1711-000000"
                  required
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <Label className="text-xs font-semibold">Age</Label>
                  <Input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Gender</Label>
                  <Select value={newGender} onValueChange={setNewGender}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Address / Area in Dhaka</Label>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="e.g. Dhanmondi, Mirpur, Banani..."
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Primary Reason / Procedure</Label>
              <Input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="e.g. Toothache & RCT consult, Scaling..."
                className="h-8 text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Initial Operatory Chair</Label>
                <Select value={newChair} onValueChange={setNewChair}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chair 1">Chair 1</SelectItem>
                    <SelectItem value="Chair 2">Chair 2</SelectItem>
                    <SelectItem value="Chair 3">Chair 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-red-600">Known Allergies</Label>
                <Input
                  value={newAlerts}
                  onChange={(e) => setNewAlerts(e.target.value)}
                  placeholder="e.g. Penicillin, Latex"
                  className="h-8 text-xs mt-1 border-red-200"
                />
              </div>
            </div>

            <div className="p-2.5 bg-muted/40 rounded-lg border text-[11px] text-muted-foreground">
              Queue Position: Assigned as <strong>Serial #{appointments.length + 1}</strong>.
            </div>

            <DialogFooter className="border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs font-bold gap-1">
                Confirm & Add to Queue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: FILE PREVIEW (X-Ray / PDF) ─── */}
      <Dialog open={!!selectedFilePreview} onOpenChange={(open) => !open && setSelectedFilePreview(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-4">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-sm font-bold flex items-center justify-between">
              <span className="truncate pr-4">{selectedFilePreview?.name}</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {selectedFilePreview?.size}
              </Badge>
            </DialogTitle>
            {selectedFilePreview?.notes && (
              <DialogDescription className="text-xs text-primary font-medium">
                Clinical Note: {selectedFilePreview.notes}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-muted/20 rounded-lg min-h-[300px]">
            {selectedFilePreview?.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedFilePreview.url}
                alt={selectedFilePreview.name}
                className="max-h-[60vh] max-w-full object-contain rounded-lg border shadow-sm"
              />
            ) : (
              <div className="text-center p-8 space-y-3">
                <FileText className="h-16 w-16 text-rose-500 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold">{selectedFilePreview?.name}</h4>
                  <p className="text-xs text-muted-foreground">Digital Clinical Pathology / Lab Report (PDF)</p>
                </div>
                {selectedFilePreview?.url.startsWith("data:") ? (
                  <Button asChild size="sm" className="gap-1.5 text-xs">
                    <a href={selectedFilePreview.url} download={selectedFilePreview.name}>
                      Download & View PDF
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => window.open(selectedFilePreview?.url, "_blank")} className="gap-1.5 text-xs">
                    Open PDF in New Tab
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedFilePreview(null)} className="text-xs">
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
