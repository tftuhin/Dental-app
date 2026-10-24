"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Plus,
  Filter,
  Calendar,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  Clock,
  ArrowUpDown,
} from "lucide-react";

interface PatientRecord {
  id: string;
  customId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  status: "active" | "recall_due" | "in_treatment" | "new";
  lastVisit: string;
  nextRecall?: string;
  alerts: string[];
  balance: string;
}

const MOCK_PATIENTS: PatientRecord[] = [
  {
    id: "pat-1",
    customId: "DENT-2026-00042",
    name: "Anika Tabassum",
    age: 34,
    gender: "Female",
    phone: "+880 1711-234891",
    status: "in_treatment",
    lastVisit: "Today",
    nextRecall: "Oct 30, 2026",
    alerts: ["Penicillin Allergy"],
    balance: "৳1,200.00",
  },
  {
    id: "pat-2",
    customId: "DENT-2026-00089",
    name: "Nusrat Parveen",
    age: 28,
    gender: "Female",
    phone: "+880 1819-872334",
    status: "active",
    lastVisit: "Oct 12, 2026",
    nextRecall: "Apr 12, 2027",
    alerts: [],
    balance: "৳0.00",
  },
  {
    id: "pat-3",
    customId: "DENT-2026-00104",
    name: "Mohammad Tariqul Islam",
    age: 45,
    gender: "Male",
    phone: "+880 1912-439019",
    status: "new",
    lastVisit: "First Visit",
    alerts: ["Hypertension"],
    balance: "৳800.00",
  },
  {
    id: "pat-4",
    customId: "DENT-2026-00122",
    name: "Tanvir Ahmed",
    age: 39,
    gender: "Male",
    phone: "+880 1675-901443",
    status: "in_treatment",
    lastVisit: "Oct 05, 2026",
    nextRecall: "Nov 05, 2026",
    alerts: ["Latex Allergy"],
    balance: "৳4,500.00",
  },
  {
    id: "pat-5",
    customId: "DENT-2025-00812",
    name: "Kazi Nazrul Haque",
    age: 62,
    gender: "Male",
    phone: "+880 1722-312778",
    status: "recall_due",
    lastVisit: "Apr 15, 2026",
    nextRecall: "Oct 15, 2026 (Overdue)",
    alerts: ["Osteoporosis / Bisphosphonates"],
    balance: "৳0.00",
  },
];

export default function PatientsDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPatients = MOCK_PATIENTS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Patient Directory & Clinical EHR Registry
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage comprehensive clinical records, medical alerts, treatment timelines, and recall schedules
          </p>
        </div>
        <Button size="sm" asChild className="gap-1.5 text-xs w-full sm:w-auto">
          <Link href="/patients/new">
            <Plus className="h-3.5 w-3.5" />
            Register New Patient
          </Link>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, patient ID (e.g. DENT-2026-...), or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex flex-wrap sm:flex-nowrap rounded-lg border p-0.5 bg-muted/40 text-xs w-full sm:w-auto">
              {[
                { label: "All Patients", val: "all" },
                { label: "Active", val: "active" },
                { label: "In Treatment", val: "in_treatment" },
                { label: "Recall Due", val: "recall_due" },
              ].map((tab) => (
                <button
                  key={tab.val}
                  onClick={() => setStatusFilter(tab.val)}
                  className={`flex-1 sm:flex-initial text-center px-3 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                    statusFilter === tab.val
                      ? "bg-background text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Patients Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Patient ID</th>
                <th className="py-3 px-4 text-left font-semibold">Patient Name</th>
                <th className="py-3 px-3 text-left font-semibold">Phone</th>
                <th className="py-3 px-3 text-left font-semibold">Status</th>
                <th className="py-3 px-3 text-left font-semibold">Medical Alerts</th>
                <th className="py-3 px-3 text-left font-semibold">Last Visit</th>
                <th className="py-3 px-3 text-right font-semibold">Balance</th>
                <th className="py-3 px-3 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPatients.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    <Link href={`/patients/${p.id}`} className="hover:underline">
                      {p.customId}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    <Link href={`/patients/${p.id}`} className="hover:underline flex items-center gap-1.5 font-semibold">
                      {p.name}
                      <span className="text-muted-foreground font-normal text-[11px]">
                        ({p.age}y · {p.gender})
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{p.phone}</td>
                  <td className="py-3 px-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize font-medium ${
                        p.status === "in_treatment"
                          ? "bg-teal-50 text-teal-700 border-teal-200"
                          : p.status === "recall_due"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {p.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-3 px-3">
                    {p.alerts.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="h-3 w-3" />
                        {p.alerts.join(", ")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">None</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{p.lastVisit}</td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                    {p.balance}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Button size="icon" variant="ghost" asChild className="h-7 w-7">
                      <Link href={`/patients/${p.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
