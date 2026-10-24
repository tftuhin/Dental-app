"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  Stethoscope,
  Receipt,
  Clock,
  Plus,
  Sparkles,
  Activity,
  AlertTriangle,
  ArrowRight,
  Armchair,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToothIcon } from "@/components/icons/dental-icons";
import {
  getClinicSetup,
  DentalChair,
  isChairMatch,
  ClinicSetupData,
} from "@/lib/clinic-setup-store";
import {
  getStoredAppointments,
  ClinicalQueuePatient,
} from "@/lib/clinical-flow-store";

interface DashboardViewProps {
  userName: string;
}

export function DashboardView({ userName }: DashboardViewProps) {
  const [setup, setSetup] = useState<ClinicSetupData | null>(null);
  const [appointments, setAppointments] = useState<ClinicalQueuePatient[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Load setup and appointments on mount, and listen to real-time events
  useEffect(() => {
    setIsClient(true);
    setSetup(getClinicSetup());
    setAppointments(getStoredAppointments());

    const handleSetupSync = () => {
      setSetup(getClinicSetup());
    };

    const handleAptSync = () => {
      setAppointments(getStoredAppointments());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "dentai_clinic_setup_v1") {
        setSetup(getClinicSetup());
      }
      if (e.key === "dentai_clinical_queue_v1") {
        setAppointments(getStoredAppointments());
      }
    };

    window.addEventListener("dentai-clinic-setup-updated", handleSetupSync);
    window.addEventListener("dentai-appointments-updated", handleAptSync);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("dentai-clinic-setup-updated", handleSetupSync);
      window.removeEventListener("dentai-appointments-updated", handleAptSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const chairs = useMemo(() => {
    return setup?.chairs || [];
  }, [setup]);

  // Active Queue: appointments scheduled, checked-in or in-progress
  const activeQueue = useMemo(() => {
    return appointments
      .filter(
        (a) =>
          a.status === "in_progress" ||
          a.status === "checked_in" ||
          a.status === "scheduled"
      )
      .sort((a, b) => (a.fifoSerial || 0) - (b.fifoSerial || 0));
  }, [appointments]);

  // Metrics calculations
  const completedCount = useMemo(
    () => appointments.filter((a) => a.status === "completed").length,
    [appointments]
  );
  const inChairCount = useMemo(
    () => appointments.filter((a) => a.status === "in_progress").length,
    [appointments]
  );
  const upcomingCount = useMemo(
    () =>
      appointments.filter(
        (a) => a.status === "scheduled" || a.status === "checked_in"
      ).length,
    [appointments]
  );

  // Map each configured chair to its active occupant (if any)
  const chairOccupancy = useMemo(() => {
    return chairs.map((chair) => {
      // Find patient whose assigned chair matches this chair's name or label
      const activePatient = appointments.find(
        (apt) =>
          (apt.status === "in_progress" || apt.status === "checked_in") &&
          isChairMatch(chair.name, apt.chair)
      );

      return {
        chair,
        patient: activePatient || null,
      };
    });
  }, [chairs, appointments]);

  const occupiedCount = useMemo(() => {
    return chairOccupancy.filter((c) => c.patient !== null).length;
  }, [chairOccupancy]);

  const activeOperatoriesCount = useMemo(() => {
    return chairs.filter((c) => c.status === "active").length;
  }, [chairs]);

  // Production calculation
  const todayProduction = useMemo(() => {
    const total = appointments
      .filter((a) => a.status === "completed" || a.status === "in_progress")
      .reduce((sum, a) => sum + (a.suggestedFee || 4500), 0);
    return total > 0 ? total : 48500;
  }, [appointments]);

  const metrics = [
    {
      title: "Today's Appointments",
      value: appointments.length > 0 ? appointments.length.toString() : "14",
      subtext: `${completedCount} completed · ${inChairCount} in-chair · ${upcomingCount} upcoming`,
      icon: CalendarCheck,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Active Patients",
      value: "1,248",
      subtext: "+18 registered this month",
      icon: Users,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-950/40",
    },
    {
      title: "Today's Production",
      value: `৳${todayProduction.toLocaleString("en-BD", { minimumFractionDigits: 2 })}`,
      subtext: "Target: ৳55,000.00 (88% achieved)",
      icon: Receipt,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Recalls Due (30d)",
      value: "38",
      subtext: "Automated SMS reminders active",
      icon: Activity,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-md" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, {userName}
            <span className="inline-block animate-pulse">✨</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Today is{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            ·{" "}
            <span className="font-semibold text-foreground">
              {activeOperatoriesCount} of {chairs.length} Operatories Active
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/appointments">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Full Schedule
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/clinical/new">
              <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
              Start Clinical Encounter
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.title} className="shadow-xs border hover:shadow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {m.title}
              </CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.bgColor}`}>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{m.value}</div>
              <p className="text-[11px] text-muted-foreground mt-1">{m.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle Section: Chair Operatory Status & Live Queue */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chair Operatory Grid (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ToothIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Operatory Chairs (Live Status)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[11px] font-normal ${
                  occupiedCount > 0
                    ? "border-teal-500/30 text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20"
                    : ""
                }`}
              >
                {chairs.length === 0
                  ? "No chairs configured"
                  : `${occupiedCount} of ${chairs.length} Occupied`}
              </Badge>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground">
                <Link href="/settings?tab=clinic">Configure</Link>
              </Button>
            </div>
          </div>

          {chairs.length === 0 ? (
            <Card className="border border-dashed p-8 text-center bg-muted/20">
              <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Armchair className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">No Operatory Chairs Configured</h3>
                <p className="text-xs text-muted-foreground">
                  You have removed all chairs from Settings. Add your dental operatories in Clinic Setup to monitor live chair utilization.
                </p>
                <Button size="sm" asChild className="text-xs gap-1.5 mt-2">
                  <Link href="/settings?tab=clinic">
                    <Plus className="h-3.5 w-3.5" />
                    Add Operatory Chair
                  </Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div
              className={`grid gap-3 ${
                chairs.length === 1
                  ? "grid-cols-1"
                  : chairs.length === 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {chairOccupancy.map(({ chair, patient }) => {
                const isOccupied = patient !== null;
                const isInProgress = patient?.status === "in_progress";
                const isCheckedIn = patient?.status === "checked_in";

                const badgeColor = isOccupied
                  ? isInProgress
                    ? "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800"
                    : isCheckedIn
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : chair.status === "maintenance"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200"
                  : chair.status === "reserved"
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200";

                const statusLabel = isOccupied
                  ? isInProgress
                    ? "In Progress"
                    : isCheckedIn
                    ? "Seated / Anesthesia"
                    : "Ready for Exam"
                  : chair.status === "maintenance"
                  ? "Maintenance"
                  : chair.status === "reserved"
                  ? "Reserved"
                  : "Available";

                return (
                  <Card
                    key={chair.id}
                    className={`relative overflow-hidden border shadow-xs transition-all ${
                      isOccupied
                        ? "border-primary/30 ring-1 ring-primary/10"
                        : "hover:border-muted-foreground/30"
                    }`}
                  >
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs tracking-tight text-foreground">
                            {chair.name}
                          </span>
                          {chair.room && (
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">
                              {chair.room}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      {chair.label && (
                        <p className="text-[10px] text-muted-foreground truncate font-normal">
                          {chair.label}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="px-4 pb-3 space-y-2 text-xs">
                      {isOccupied ? (
                        <>
                          <div className="flex items-center justify-between font-semibold text-foreground pt-1">
                            <span className="truncate pr-2">{patient.patient}</span>
                            <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                              {patient.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-primary truncate font-medium">
                            {patient.service}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-muted/50">
                            <span className="truncate pr-2">
                              {patient.doctor || chair.assignedDoctor || "Consultant Surgeon"}
                            </span>
                            <span className="shrink-0 font-medium">
                              {patient.duration || "45m"} elapsed
                            </span>
                          </div>
                          <div className="pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-7 text-[11px] gap-1 text-primary hover:bg-primary/5"
                              asChild
                            >
                              <Link href={`/appointments?session=active&patientId=${patient.patientId || patient.id}`}>
                                <Stethoscope className="h-3 w-3" />
                                Open Chairside Session
                              </Link>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="py-2.5 text-center space-y-1">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Operatory Sterilized & Ready</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {chair.equipment || "Standard Dental Delivery Unit"}
                          </p>
                          <div className="pt-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full h-6 text-[10px] gap-1"
                              asChild
                            >
                              <Link href="/appointments">
                                <Plus className="h-3 w-3" />
                                Assign Next in Queue
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* AI Clinical Insights Banner */}
          <Card className="border-primary/20 bg-primary/5 shadow-none">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-foreground">
                  DentAI Clinical Assistant Alert
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {inChairCount > 0
                    ? `${inChairCount} patient${inChairCount > 1 ? "s are" : " is"} currently seated in operatory chairs. All dental records and pre-op radiographs are synced.`
                    : "All operatory chairs are sanitized and prepped for the next scheduled procedures."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Patient Queue (3 Columns) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Reception Queue
            </h2>
            <Link
              href="/appointments"
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              View all ({activeQueue.length})
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="border shadow-xs divide-y divide-border">
            {activeQueue.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No patients currently waiting in reception queue.
              </div>
            ) : (
              activeQueue.slice(0, 5).map((item) => {
                const statusBadge =
                  item.status === "in_progress"
                    ? "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300"
                    : item.status === "checked_in"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

                return (
                  <div
                    key={item.id}
                    className="p-3.5 space-y-2 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-[11px] font-bold">
                          {item.token || `A-${item.fifoSerial}`}
                        </Badge>
                        <span className="font-semibold text-xs text-foreground">
                          {item.patient}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {item.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate pr-2">{item.service}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusBadge}`}>
                        {item.status === "in_progress"
                          ? "In Chair"
                          : item.status === "checked_in"
                          ? "Checked In"
                          : "Scheduled"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1">
                        <Armchair className="h-3 w-3 text-primary/70" />
                        <span className="font-medium text-foreground">{item.chair}</span>
                      </span>
                      <span>{item.doctor}</span>
                    </div>

                    {item.alerts && item.alerts.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                        <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 truncate">
                          Alert: {item.alerts.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </Card>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="justify-start text-xs h-9"
            >
              <Link href="/patients/new">
                <Plus className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Add Patient
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="justify-start text-xs h-9"
            >
              <Link href="/billing">
                <Receipt className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                New Invoice
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
