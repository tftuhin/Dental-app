"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Odontogram } from "@/components/dental/odontogram";
import { PeriodontalChart } from "@/components/dental/perio-chart";
import { PatientProfileTimeline } from "@/components/patients/patient-profile-timeline";
import { EditPatientDialog } from "@/components/patients/edit-patient-dialog";
import {
  PatientProfile,
  getPatientById,
  INITIAL_PATIENTS,
  formatDobDisplay,
} from "@/lib/patients-store";
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
  Edit,
  HeartPulse,
  Briefcase,
  FileSpreadsheet,
} from "lucide-react";

interface PatientProfileViewProps {
  initialPatientId: string;
}

export function PatientProfileView({ initialPatientId }: PatientProfileViewProps) {
  const [patient, setPatient] = useState<PatientProfile>(() => {
    return getPatientById(initialPatientId) || INITIAL_PATIENTS[0];
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Sync with localStorage store and listen to updates
  useEffect(() => {
    const loaded = getPatientById(initialPatientId);
    if (loaded) {
      setPatient(loaded);
    }

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ patient: PatientProfile }>;
      if (
        customEvent.detail?.patient &&
        (customEvent.detail.patient.id === initialPatientId ||
          customEvent.detail.patient.customId === initialPatientId)
      ) {
        setPatient(customEvent.detail.patient);
      } else {
        const recheck = getPatientById(initialPatientId);
        if (recheck) setPatient(recheck);
      }
    };

    window.addEventListener("dentalos1-patients-updated", handleUpdate);
    return () => {
      window.removeEventListener("dentalos1-patients-updated", handleUpdate);
    };
  }, [initialPatientId]);

  // Generate initials for avatar
  const initials = patient.name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "PT";

  return (
    <div className="space-y-6">
      {/* ─── Patient Profile Header ─── */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 bg-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-xl sm:text-2xl shadow-md shrink-0">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  {patient.name}
                </h1>
                <Badge variant="outline" className="font-mono text-xs">
                  {patient.customId}
                </Badge>
                <Badge
                  className={`text-[11px] capitalize font-medium ${
                    patient.status === "in_treatment"
                      ? "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300"
                      : patient.status === "recall_due"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                  }`}
                >
                  {patient.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  DOB: {formatDobDisplay(patient.dob)} ({patient.age}y · {patient.gender})
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <HeartPulse className="h-3 w-3 text-muted-foreground" />
                  Blood: <strong>{patient.bloodGroup}</strong>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  {patient.phone}
                </span>
                {patient.email && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {patient.email}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {patient.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] h-4 px-1.5 font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex-1 sm:flex-initial"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Profile Details
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5 text-xs flex-1 sm:flex-initial"
            >
              <Link href="/clinical">
                <Stethoscope className="h-3.5 w-3.5" />
                Encounter
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5 text-xs flex-1 sm:flex-initial"
            >
              <Link href="/prescriptions">
                <Pill className="h-3.5 w-3.5" />
                Write Rx
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5 text-xs flex-1 sm:flex-initial"
            >
              <Link href="/billing">
                <Receipt className="h-3.5 w-3.5" />
                Billing
              </Link>
            </Button>
          </div>
        </div>

        {/* Flashing Allergy Warning */}
        {patient.allergies.length > 0 && (
          <div className="medical-alert-banner px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
              <AlertTriangle className="h-4 w-4 animate-bounce shrink-0" />
              <span>CRITICAL MEDICAL ALERT: {patient.allergies.join(" · ")}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded self-start sm:self-auto">
              Safety Verification Required
            </span>
          </div>
        )}
      </Card>

      {/* ─── Profile Navigation Tabs ─── */}
      <Tabs defaultValue="timeline" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="grid grid-cols-4 w-full sm:w-[500px]">
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
        </div>

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
          <Card className="border shadow-sm p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Patient Personal & Demographic Information
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete EHR profile record, residential address, emergency contact, and medical status.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
                className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
              >
                <Edit className="h-3.5 w-3.5 text-primary" />
                Edit Personal Details
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Personal Details */}
              <div className="space-y-4">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Personal Details
                </h4>
                <div className="space-y-2.5 bg-muted/20 p-3.5 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Full Legal Name:</span>
                    <span className="font-semibold text-foreground">{patient.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date of Birth (DoB):</span>
                    <span className="font-semibold text-foreground font-mono">
                      {formatDobDisplay(patient.dob)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Calculated Age / Gender:</span>
                    <span className="font-semibold text-foreground">
                      {patient.age} years · {patient.gender}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Blood Group:</span>
                    <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                      {patient.bloodGroup}
                    </Badge>
                  </div>
                  {patient.occupation && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Occupation:</span>
                      <span className="font-semibold text-foreground">{patient.occupation}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Account Status:</span>
                    <span className="font-semibold text-foreground capitalize">
                      {patient.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Contact Information
                </h4>
                <div className="space-y-2.5 bg-muted/20 p-3.5 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Primary Mobile Number:</span>
                    <span className="font-semibold text-foreground font-mono">{patient.phone}</span>
                  </div>
                  {patient.phone2 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Secondary Phone:</span>
                      <span className="font-semibold text-foreground font-mono">{patient.phone2}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email Address:</span>
                    <span className="font-semibold text-foreground">
                      {patient.email || "None recorded"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">Residential Address:</span>
                    <span className="font-medium text-foreground text-right">
                      {patient.address || "None recorded"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">Emergency Contact:</span>
                    <span className="font-semibold text-foreground text-right">
                      {patient.emergencyContact || "None recorded"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Medical Alerts & Allergies
                </h4>
                <div className="space-y-2.5 bg-muted/20 p-3.5 rounded-lg border">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Known Drug Allergies:</span>
                    {patient.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {patient.allergies.map((allergy) => (
                          <Badge
                            key={allergy}
                            variant="destructive"
                            className="text-xs font-semibold py-0.5"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-foreground italic">No known drug allergies.</span>
                    )}
                  </div>

                  <div className="space-y-1 pt-2 border-t">
                    <span className="text-muted-foreground block">Systemic Medical Conditions:</span>
                    {patient.medicalConditions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {patient.medicalConditions.map((cond) => (
                          <Badge
                            key={cond}
                            variant="secondary"
                            className="text-xs py-0.5 font-medium"
                          >
                            {cond}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-foreground italic">No systemic conditions recorded.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial & Clinical Notes */}
              <div className="space-y-4">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Account Balance & Clinical Notes
                </h4>
                <div className="space-y-2.5 bg-muted/20 p-3.5 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Outstanding Account Balance:</span>
                    <span className="font-bold text-foreground font-mono text-sm text-primary">
                      {patient.outstandingBalance}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Clinic Visit:</span>
                    <span className="font-semibold text-foreground">{patient.lastVisit}</span>
                  </div>
                  {patient.nextRecall && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Next Scheduled Recall:</span>
                      <span className="font-semibold text-foreground">{patient.nextRecall}</span>
                    </div>
                  )}
                  {patient.notes && (
                    <div className="space-y-1 pt-2 border-t">
                      <span className="text-muted-foreground block font-semibold">Doctor Notes:</span>
                      <p className="text-foreground bg-background p-2 rounded border italic">
                        "{patient.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Interactive Edit Dialog */}
      <EditPatientDialog
        patient={patient}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSaved={(updated) => setPatient(updated)}
      />
    </div>
  );
}
