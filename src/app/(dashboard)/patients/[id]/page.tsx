import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Odontogram } from "@/components/dental/odontogram";
import { PeriodontalChart } from "@/components/dental/perio-chart";
import { PatientProfileTimeline } from "@/components/patients/patient-profile-timeline";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  Stethoscope,
  Pill,
  Receipt,
  FileText,
  Clock,
  Plus,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Mock comprehensive patient data
  const patient = {
    id,
    customId: "DENT-2026-00042",
    name: "Anika Tabassum",
    dob: "October 14, 1992",
    age: 34,
    gender: "Female",
    phone: "+880 1711-234891",
    email: "anika.tabassum@gmail.com",
    address: "House 42, Road 9/A, Dhanmondi R/A, Dhaka-1209, Bangladesh",
    emergencyContact: "Tariqul Islam (Spouse) · +880 1711-234892",
    bloodGroup: "O+",
    allergies: ["Penicillin (Severe Anaphylaxis)"],
    medicalConditions: ["Mild Asthma (Well-controlled)"],
    status: "in_treatment",
    outstandingBalance: "৳1,200.00",
    tags: ["High Caries Risk", "Crown Candidate", "Recall: 6M"],
  };

  // Unified Chronological Timeline Events
  const timelineEvents = [
    {
      id: "ev-1",
      date: "Today, Oct 24, 2026 · 10:15 AM",
      type: "encounter",
      title: "Clinical Encounter #ENC-2026-0089",
      doctor: "Dr. Sarah Smith, BDS, FCPS",
      description:
        "Chief Complaint: Throbbing pain Tooth #19. Diagnosis: Symptomatic Irreversible Pulpitis. Pulpectomy initiated, canal instrumentation completed to #25, Calcium hydroxide intra-canal medicament placed.",
      badge: "In Progress",
      badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
      icon: Stethoscope,
    },
    {
      id: "ev-2",
      date: "Today, Oct 24, 2026 · 10:45 AM",
      type: "prescription",
      title: "e-Prescription Issued #RX-2026-00381",
      doctor: "Dr. Sarah Smith, BDS, FCPS",
      description:
        "Prescribed Clindamycin 300mg TID (Allergy Safe Alternative to Amoxicillin), Torax 10mg PRN, Clohex 0.2% mouthwash. Digitally signed with SHA-256 hash.",
      badge: "Signed & Dispensed",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      icon: Pill,
    },
    {
      id: "ev-3",
      date: "Today, Oct 24, 2026 · 11:00 AM",
      type: "invoice",
      title: "Invoice #INV-2026-00412 Issued",
      doctor: "Billing Desk",
      description:
        "Services: Endodontic Therapy Molar (D3330), Limited Exam (D0140), IOPA (D0220). Total: ৳9,700.00. Privilege Discount: -৳1,500.00. Balance: ৳1,200.00 outstanding.",
      badge: "Partially Paid",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      icon: Receipt,
    },
    {
      id: "ev-4",
      date: "Oct 12, 2026 · 02:30 PM",
      type: "appointment",
      title: "Routine Hygiene & Perio Charting",
      doctor: "Dr. Rumana Akter",
      description:
        "Full mouth scaling and ultrasonic debridement. Completed 6-point probing chart. Localized 5mm pocket noted distal of #14 and mesial of #19. Oral hygiene instructions delivered.",
      badge: "Completed",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      icon: Calendar,
    },
    {
      id: "ev-5",
      date: "Apr 15, 2026 · 09:00 AM",
      type: "radiograph",
      title: "Full Mouth Panoramic Radiograph (OPG)",
      doctor: "Radiology Tech",
      description:
        "Digital OPG captured. Normal condylar morphology. Impacted tooth #32 noted with mesioangular tilt.",
      badge: "Attached",
      badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Patient Profile Header ─── */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-6 bg-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-md">
              AT
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">
                  {patient.name}
                </h1>
                <Badge variant="outline" className="font-mono text-xs">
                  {patient.customId}
                </Badge>
                <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 text-[11px] capitalize">
                  {patient.status.replace("_", " ")}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                <span>DOB: {patient.dob} ({patient.age} years)</span>
                <span>·</span>
                <span>Blood: <strong>{patient.bloodGroup}</strong></span>
                <span>·</span>
                <span>Phone: {patient.phone}</span>
                <span>·</span>
                <span>Email: {patient.email}</span>
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {patient.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" asChild className="gap-1.5 text-xs">
              <Link href="/clinical">
                <Stethoscope className="h-3.5 w-3.5" />
                Open Clinical Encounter
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
              <Link href="/prescriptions">
                <Pill className="h-3.5 w-3.5" />
                Write Rx
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
              <Link href="/billing">
                <Receipt className="h-3.5 w-3.5" />
                Billing
              </Link>
            </Button>
          </div>
        </div>

        {/* Flashing Allergy Warning */}
        {patient.allergies.length > 0 && (
          <div className="medical-alert-banner px-6 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
              <AlertTriangle className="h-4 w-4 animate-bounce" />
              <span>CRITICAL MEDICAL ALERT: {patient.allergies.join(" · ")}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded">
              Do Not Prescribe Beta-Lactams
            </span>
          </div>
        )}
      </Card>

      {/* ─── Profile Navigation Tabs ─── */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid grid-cols-4 sm:w-[500px]">
          <TabsTrigger value="timeline" className="text-xs">
            Unified Timeline
          </TabsTrigger>
          <TabsTrigger value="odontogram" className="text-xs">
            Odontogram
          </TabsTrigger>
          <TabsTrigger value="perio" className="text-xs">
            Perio Chart
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs">
            Demographics
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Unified Chronological Timeline */}
        <TabsContent value="timeline" className="mt-4">
          <PatientProfileTimeline
            patientCustomId={patient.customId}
            patientName={patient.name}
          />
        </TabsContent>

        {/* Tab 2: Odontogram */}
        <TabsContent value="odontogram" className="mt-4">
          <Odontogram patientId={patient.customId} />
        </TabsContent>

        {/* Tab 3: Perio */}
        <TabsContent value="perio" className="mt-4">
          <PeriodontalChart patientId={patient.customId} />
        </TabsContent>

        {/* Tab 4: Demographics & Emergency */}
        <TabsContent value="details" className="mt-4">
          <Card className="border shadow-sm p-6">
            <h3 className="text-sm font-bold text-foreground mb-4">
              Patient Demographic & Medical Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground block font-semibold">Residential Address</span>
                <span className="text-foreground">{patient.address}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block font-semibold">Emergency Contact</span>
                <span className="text-foreground">{patient.emergencyContact}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block font-semibold">Medical Conditions</span>
                <span className="text-foreground">{patient.medicalConditions.join(", ")}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block font-semibold">Outstanding Account Balance</span>
                <span className="text-foreground font-bold">{patient.outstandingBalance}</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
