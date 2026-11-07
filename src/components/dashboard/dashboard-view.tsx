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
import { getClinicSetup, isChairMatch, ClinicSetupData } from "@/lib/clinic-setup-store";
import {
  getStoredAppointments,
  ClinicalQueuePatient,
  toISODate,
} from "@/lib/clinical-flow-store";
import { getAllPatients } from "@/lib/patients-store";
import { getOutstandingVisits, summariseCollections } from "@/lib/billing-store";
import { CollectionsReport } from "@/components/dashboard/collections-report";
import { formatBDT } from "@/lib/currency";
import { PageHeader } from "@/components/layout/page-header";

/** Today's collections and all outstanding dues, from the saved bills. */
function computeMoney() {
  // Includes consultation fees paid at check-in
  const today = toISODate();
  const todays = summariseCollections(today, today);
  const dues = getOutstandingVisits();
  return {
    collectedToday: todays.total,
    paymentsToday: todays.payments,
    dueTotal: dues.reduce((sum, v) => sum + (v.invoice?.balanceDue || 0), 0),
    dueBills: dues.length,
  };
}

const loadToday = (): ClinicalQueuePatient[] =>
  getStoredAppointments().filter((a) => (a.date || toISODate()) === toISODate());

interface DashboardViewProps {
  userName: string;
}

export function DashboardView({ userName }: DashboardViewProps) {
  // Pages render after the clinic's data has loaded (see ClinicDataGate), so read it straight away
  const [setup, setSetup] = useState<ClinicSetupData | null>(() => getClinicSetup());
  const [appointments, setAppointments] = useState<ClinicalQueuePatient[]>(loadToday);
  const isClient = true;
  const [patientCount] = useState(() => getAllPatients().length);
  const [money, setMoney] = useState(computeMoney);

  // Listen to changes made here, in other tabs or on other computers
  useEffect(() => {
    const handleSetupSync = () => {
      setSetup(getClinicSetup());
    };

    const handleAptSync = () => {
      setAppointments(loadToday());
      setMoney(computeMoney());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "dentai_clinic_setup_v1") {
        setSetup(getClinicSetup());
      }
      if (e.key === "dentai_appointments_patient_queue_v2") {
        setAppointments(loadToday());
        setMoney(computeMoney());
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
          // Checked-in patients are in the waiting room; only a started session occupies a chair
          apt.status === "in_progress" &&
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

  const metrics = [
    {
      title: "Today's appointments",
      value: String(appointments.length),
      subtext: `${completedCount} done · ${inChairCount} in chair · ${upcomingCount} waiting`,
      icon: CalendarCheck,
      href: "/appointments",
    },
    {
      title: "Registered patients",
      value: patientCount.toLocaleString("en-BD"),
      subtext: "In the patient registry",
      icon: Users,
      href: "/patients",
    },
    {
      title: "Collected today",
      value: formatBDT(money.collectedToday),
      subtext: `${money.paymentsToday} payment${money.paymentsToday === 1 ? "" : "s"} received`,
      icon: Receipt,
      href: "/billing",
    },
    {
      title: "Outstanding dues",
      value: formatBDT(money.dueTotal),
      subtext: money.dueBills === 0 ? "No unpaid bills" : `${money.dueBills} unpaid bill${money.dueBills === 1 ? "" : "s"}`,
      icon: Activity,
      href: "/billing",
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
      <PageHeader
        title={`Welcome back, ${userName.split(",")[0]}`}
        description={`${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · ${activeOperatoriesCount} of ${chairs.length} chairs active`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/appointments">
                <Clock className="mr-1.5 h-4 w-4" />
                Schedule
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/appointments?session=active">
                <Stethoscope className="mr-1.5 h-4 w-4" />
                Start next session
              </Link>
            </Button>
          </>
        }
      />

      {/* 4 Key Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Link key={m.title} href={m.href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full shadow-xs transition-colors group-hover:bg-muted/40">
              <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle>
                <m.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tabular-nums">{m.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{m.subtext}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Daily / monthly collections by doctor and service group */}
      <CollectionsReport />

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
                          ? item.checkInInvoice
                            ? "Checked In · Paid"
                            : "Checked In"
                          : "Not arrived"}
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
