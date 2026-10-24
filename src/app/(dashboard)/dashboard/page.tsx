import { auth } from "@/auth";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  Stethoscope,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Plus,
  Sparkles,
  ChevronRight,
  Activity,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToothIcon } from "@/components/icons/dental-icons";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "Dr. Sarah Smith";

  // Mock initial clinical metrics for immediate presentation
  const metrics = [
    {
      title: "Today's Appointments",
      value: "14",
      subtext: "4 completed · 3 in-chair · 7 upcoming",
      icon: CalendarCheck,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Active Patients",
      value: "1,248",
      subtext: "+18 this month",
      icon: Users,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-950/40",
    },
    {
      title: "Today's Production",
      value: "৳48,500.00",
      subtext: "Target: ৳55,000.00 (88%)",
      icon: Receipt,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Recalls Due (30d)",
      value: "38",
      subtext: "12 automated SMS reminders sent via GP/Banglalink",
      icon: Activity,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  const chairs = [
    {
      id: "Chair 1",
      patient: "Anika Tabassum",
      doctor: "Dr. Sarah Smith, BDS, FCPS",
      procedure: "Root Canal Therapy (Tooth #19)",
      status: "In Progress",
      startTime: "10:15 AM",
      duration: "45m elapsed",
      badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
    },
    {
      id: "Chair 2",
      patient: "Mohammad Tariqul Islam",
      doctor: "Dr. Tanvir Ahmed, BDS (DU), FCPS",
      procedure: "Zirconia Crown Cementation (#30)",
      status: "Seated / Anesthesia",
      startTime: "10:45 AM",
      duration: "15m elapsed",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    },
    {
      id: "Chair 3",
      patient: "Nusrat Parveen",
      doctor: "Dr. Nusrat Jahan, BDS, MS",
      procedure: "Full Mouth Prophylaxis & Perio Charting",
      status: "Ready for Exam",
      startTime: "10:30 AM",
      duration: "30m elapsed",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    },
    {
      id: "Chair 4",
      patient: null,
      doctor: null,
      procedure: "Sterilization & Prep for 11:30 AM",
      status: "Available",
      startTime: null,
      duration: null,
      badgeColor: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    },
  ];

  const upcomingQueue = [
    {
      token: "A-015",
      time: "11:15 AM",
      patient: "Kazi Nazrul Haque",
      patientId: "DENT-2026-00122",
      type: "Surgical Wisdom Consultation (#38)",
      doctor: "Dr. Tanvir Ahmed, BDS, FCPS",
      alerts: ["Diabetic Type 2 (HbA1c: 6.8)"],
      status: "Waiting (5m)",
    },
    {
      token: "A-016",
      time: "11:30 AM",
      patient: "Farhana Rahman",
      patientId: "DENT-2026-00145",
      type: "Composite Restoration (#14 MO)",
      doctor: "Dr. Sarah Smith, BDS, FCPS",
      alerts: [],
      status: "Confirmed",
    },
    {
      token: "A-017",
      time: "12:00 PM",
      patient: "Abdur Razzaq",
      patientId: "DENT-2026-00031",
      type: "Dental Implant Consultation & OPG",
      doctor: "Dr. Tanvir Ahmed, BDS, FCPS",
      alerts: ["Cardiac Stent (2023)"],
      status: "Confirmed",
    },
  ];

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
            Today is {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · All 4 operatories active
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
          <Card key={m.title} className="shadow-sm border hover:shadow transition-shadow">
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
              <h2 className="text-sm font-semibold text-foreground">Operatory Chairs (Live Status)</h2>
            </div>
            <Badge variant="outline" className="text-[11px] font-normal">
              3 of 4 Occupied
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {chairs.map((chair) => (
              <Card key={chair.id} className="relative overflow-hidden border shadow-sm">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs tracking-tight text-foreground">
                      {chair.id}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${chair.badgeColor}`}>
                      {chair.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1.5 text-xs">
                  {chair.patient ? (
                    <>
                      <div className="flex items-center justify-between font-medium text-foreground">
                        <span>{chair.patient}</span>
                        <span className="text-[11px] text-muted-foreground">{chair.startTime}</span>
                      </div>
                      <p className="text-[11px] text-primary truncate font-medium">
                        {chair.procedure}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-muted/50">
                        <span>{chair.doctor}</span>
                        <span>{chair.duration}</span>
                      </div>
                    </>
                  ) : (
                    <div className="py-3 text-center text-muted-foreground">
                      <p className="text-xs font-medium">Ready for Patient</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{chair.procedure}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Clinical Insights Banner */}
          <Card className="border-primary/20 bg-primary/5 shadow-none">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary flex-shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  DentAI Clinical Assistant Alert
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  3 lab orders from Dhaka Dental Lab are due for delivery today. 
                  Patient <strong>Anika Tabassum (Chair 1)</strong> has an outstanding antibiotic prescription review requirement.
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
            <Link href="/appointments" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>

          <Card className="border shadow-sm divide-y">
            {upcomingQueue.map((item) => (
              <div key={item.token} className="p-3.5 space-y-2 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      {item.token}
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
                  <span className="truncate pr-2">{item.type}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                    {item.status}
                  </Badge>
                </div>

                {item.alerts.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                      Alert: {item.alerts.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </Card>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" size="sm" asChild className="justify-start text-xs h-9">
              <Link href="/patients/new">
                <Plus className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Add Patient
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start text-xs h-9">
              <Link href="/billing/new">
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
