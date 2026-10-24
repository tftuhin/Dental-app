"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EditPatientDialog } from "@/components/patients/edit-patient-dialog";
import {
  PatientProfile,
  getAllPatients,
  INITIAL_PATIENTS,
} from "@/lib/patients-store";
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
  Edit,
  Phone,
  MapPin,
} from "lucide-react";

export default function PatientsDirectoryPage() {
  const [patients, setPatients] = useState<PatientProfile[]>(() => {
    return getAllPatients();
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingPatient, setEditingPatient] = useState<PatientProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Sync with localStorage patient store and listen to custom updates
  useEffect(() => {
    setPatients(getAllPatients());

    const handleUpdate = () => {
      setPatients(getAllPatients());
    };

    window.addEventListener("dentalos1-patients-updated", handleUpdate);
    return () => {
      window.removeEventListener("dentalos1-patients-updated", handleUpdate);
    };
  }, []);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditClick = (patient: PatientProfile) => {
    setEditingPatient(patient);
    setIsEditDialogOpen(true);
  };

  const handleSaved = (updated: PatientProfile) => {
    setPatients((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (editingPatient?.id === updated.id) {
      setEditingPatient(updated);
    }
  };

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
            Manage comprehensive clinical records, demographics, addresses, contact details, and medical alerts.
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
              placeholder="Search by name, patient ID (e.g. DENT-2026-...), phone number, or address..."
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
                <th className="py-3 px-3 text-left font-semibold">Contact / Phone</th>
                <th className="py-3 px-3 text-left font-semibold">Address</th>
                <th className="py-3 px-3 text-left font-semibold">Status</th>
                <th className="py-3 px-3 text-left font-semibold">Medical Alerts</th>
                <th className="py-3 px-3 text-left font-semibold">Last Visit</th>
                <th className="py-3 px-3 text-right font-semibold">Balance</th>
                <th className="py-3 px-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground text-xs">
                    No patients found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      <Link href={`/patients/${p.id}`} className="hover:underline">
                        {p.customId}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      <Link
                        href={`/patients/${p.id}`}
                        className="hover:underline flex items-center gap-1.5 font-semibold"
                      >
                        {p.name}
                        <span className="text-muted-foreground font-normal text-[11px]">
                          ({p.age}y · {p.gender})
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground font-mono">
                      {p.phone}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground max-w-[200px] truncate" title={p.address}>
                      {p.address ? (
                        <span className="truncate block">{p.address}</span>
                      ) : (
                        <span className="italic text-muted-foreground/60">Not provided</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize font-medium ${
                          p.status === "in_treatment"
                            ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300"
                            : p.status === "recall_due"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {p.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      {p.allergies && p.allergies.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          {p.allergies.join(", ")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{p.lastVisit}</td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                      {p.outstandingBalance}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit patient personal details"
                          onClick={() => handleEditClick(p)}
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit Patient</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          asChild
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="View Patient Profile"
                        >
                          <Link href={`/patients/${p.id}`}>
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">View Profile</span>
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Patient Dialog */}
      {editingPatient && (
        <EditPatientDialog
          patient={editingPatient}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
