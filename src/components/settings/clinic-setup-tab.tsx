"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Building2,
  Clock,
  Palette,
  Users,
  Plus,
  Trash2,
  Edit,
  Save,
  Check,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Stethoscope,
  ShieldCheck,
  Upload,
  Sparkles,
} from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import {
  ClinicSetupData,
  DoctorProfile,
  DentalChair,
  ALL_DAYS_OF_WEEK,
  COLOR_PALETTE_PRESETS,
  DEFAULT_CLINIC_SETUP,
  getClinicSetup,
  saveClinicSetup,
  addDoctor,
  updateDoctor,
  removeDoctor,
  addChair,
  updateChair,
  removeChair,
} from "@/lib/clinic-setup-store";
import { toast } from "sonner";

export function ClinicSetupTab() {
  const [setup, setSetup] = useState<ClinicSetupData>(DEFAULT_CLINIC_SETUP);
  const [isSaving, setIsSaving] = useState(false);

  // Active sub-section view
  const [activeSection, setActiveSection] = useState<"profile" | "hours" | "branding" | "doctors" | "chairs">("profile");

  // Doctor Dialog State
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [doctorForm, setDoctorForm] = useState<Omit<DoctorProfile, "id">>({
    name: "",
    designation: "",
    degree: "",
    bmdcReg: "",
    specialization: "General Dentistry",
    phone: "",
    email: "",
    visitingHours: "Sat - Thu: 10:00 AM - 02:00 PM, 05:00 PM - 09:00 PM",
    room: "Chamber 101",
    status: "active",
  });

  // Chair Dialog State
  const [isChairModalOpen, setIsChairModalOpen] = useState(false);
  const [editingChairId, setEditingChairId] = useState<string | null>(null);
  const [chairForm, setChairForm] = useState<Omit<DentalChair, "id">>({
    name: "",
    label: "",
    room: "Room 101, 1st Floor",
    department: "General & Operative Dentistry",
    assignedDoctor: "",
    status: "active",
    equipment: "Dental Delivery Unit, Ultrasonic Scaler, Light Cure Unit",
  });

  // Load from store
  useEffect(() => {
    setSetup(getClinicSetup());
    const handleUpdate = () => {
      setSetup(getClinicSetup());
    };
    window.addEventListener("dentai-clinic-setup-updated", handleUpdate);
    return () => window.removeEventListener("dentai-clinic-setup-updated", handleUpdate);
  }, []);

  // Save General Profile / Timing / Colors
  const handleSaveSetup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      saveClinicSetup(setup);
      toast.success("Clinic Setup successfully saved & updated across DentalOS1!");
    } catch {
      toast.error("Failed to save clinic setup");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Day Open/Closed
  const toggleDay = (day: string) => {
    let newOpen = [...setup.openDays];
    let newClosed = [...setup.closedDays];

    if (newOpen.includes(day)) {
      newOpen = newOpen.filter((d) => d !== day);
      if (!newClosed.includes(day)) newClosed.push(day);
    } else {
      newOpen.push(day);
      newClosed = newClosed.filter((d) => d !== day);
    }

    const updated = { ...setup, openDays: newOpen, closedDays: newClosed };
    setSetup(updated);
    saveClinicSetup(updated);
    toast.info(`${day} set as ${newOpen.includes(day) ? "Open" : "Closed"}`);
  };

  // Select Color Preset
  const handleSelectPalette = (presetId: string) => {
    const chosen = COLOR_PALETTE_PRESETS.find((p) => p.id === presetId);
    if (!chosen) return;
    const updated = {
      ...setup,
      palettePreset: chosen.id,
      primaryColor: chosen.primary,
      secondaryColor: chosen.secondary,
      accentColor: chosen.accent,
    };
    setSetup(updated);
    saveClinicSetup(updated);
    toast.success(`Color theme switched to "${chosen.label}"`);
  };

  // Open Doctor Modal for Add
  const handleOpenAddDoctor = () => {
    setEditingDoctorId(null);
    setDoctorForm({
      name: "",
      designation: "Associate Consultant",
      degree: "BDS, PGT",
      bmdcReg: "A-",
      specialization: "General Dentistry",
      phone: "+880 17",
      email: "",
      visitingHours: "Sat - Thu: 10:00 AM - 02:00 PM, 05:00 PM - 09:00 PM",
      room: "Chamber " + (setup.doctors.length + 101),
      status: "active",
    });
    setIsDoctorModalOpen(true);
  };

  // Open Doctor Modal for Edit
  const handleOpenEditDoctor = (doc: DoctorProfile) => {
    setEditingDoctorId(doc.id);
    setDoctorForm({
      name: doc.name,
      designation: doc.designation,
      degree: doc.degree,
      bmdcReg: doc.bmdcReg,
      specialization: doc.specialization,
      phone: doc.phone,
      email: doc.email,
      visitingHours: doc.visitingHours,
      room: doc.room,
      status: doc.status,
    });
    setIsDoctorModalOpen(true);
  };

  // Save Doctor
  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.name.trim() || !doctorForm.bmdcReg.trim()) {
      toast.error("Doctor name and BMDC Registration Number are required");
      return;
    }

    if (editingDoctorId) {
      updateDoctor(editingDoctorId, doctorForm);
      toast.success(`Doctor profile for ${doctorForm.name} updated successfully!`);
    } else {
      addDoctor(doctorForm);
      toast.success(`${doctorForm.name} added to clinic practitioner directory!`);
    }
    setSetup(getClinicSetup());
    setIsDoctorModalOpen(false);
  };

  // Delete Doctor
  const handleDeleteDoctor = (id: string, name: string) => {
    if (setup.doctors.length <= 1) {
      toast.error("At least one registered doctor must remain on record");
      return;
    }
    if (confirm(`Are you sure you want to remove ${name} from clinic practitioners?`)) {
      removeDoctor(id);
      setSetup(getClinicSetup());
      toast.info(`${name} removed from clinic directory`);
    }
  };

  // Open Chair Modal for Add
  const handleOpenAddChair = () => {
    setEditingChairId(null);
    setChairForm({
      name: `Chair 0${setup.chairs.length + 1}`,
      label: `Operatory ${setup.chairs.length + 1}`,
      room: `Room 10${setup.chairs.length + 1}, 1st Floor`,
      department: "General & Operative Dentistry",
      assignedDoctor: setup.doctors[0]?.name || "",
      status: "active",
      equipment: "Dental Unit, Intraoral Camera, Ultrasonic Scaler",
    });
    setIsChairModalOpen(true);
  };

  // Open Chair Modal for Edit
  const handleOpenEditChair = (chair: DentalChair) => {
    setEditingChairId(chair.id);
    setChairForm({
      name: chair.name,
      label: chair.label,
      room: chair.room,
      department: chair.department,
      assignedDoctor: chair.assignedDoctor || "",
      status: chair.status,
      equipment: chair.equipment,
    });
    setIsChairModalOpen(true);
  };

  // Save Chair
  const handleSaveChair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chairForm.name.trim()) {
      toast.error("Chair name / number is required");
      return;
    }

    if (editingChairId) {
      updateChair(editingChairId, chairForm);
      toast.success(`${chairForm.name} specifications updated!`);
    } else {
      addChair(chairForm);
      toast.success(`${chairForm.name} added to clinic operatories!`);
    }
    setSetup(getClinicSetup());
    setIsChairModalOpen(false);
  };

  // Delete Chair
  const handleDeleteChair = (id: string, name: string) => {
    if (setup.chairs.length <= 1) {
      toast.error("At least one operatory chair must remain in the clinic");
      return;
    }
    if (confirm(`Are you sure you want to remove ${name}?`)) {
      removeChair(id);
      setSetup(getClinicSetup());
      toast.info(`${name} removed from operatory list`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Clinic Setup Header Banner */}
      <Card className="border shadow-xs bg-gradient-to-r from-primary/10 via-primary/5 to-background p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: setup.primaryColor || "#0ea5e9" }}
            >
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  {setup.name}
                </h2>
                <Badge variant="outline" className="text-[10px] bg-background font-mono text-primary border-primary/30">
                  {setup.bmdcLicense}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {setup.address} · Phone: <span className="font-mono">{setup.phone}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-300">
                  ● Open: {setup.openDays.join(", ")}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border">
                  Hours: {setup.openingTime} – {setup.closingTime}
                </span>
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  {setup.doctors.length} Doctors · {setup.chairs.length} Chairs
                </span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => handleSaveSetup()}
            disabled={isSaving}
            className="gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs shrink-0"
          >
            <Save className="h-4 w-4" />
            Save Clinic Changes
          </Button>
        </div>
      </Card>

      {/* Sub-Navigation Pills */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        <button
          onClick={() => setActiveSection("profile")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSection === "profile"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Clinic Profile & Logo
        </button>
        <button
          onClick={() => setActiveSection("hours")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSection === "hours"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Operating Days & Hours
        </button>
        <button
          onClick={() => setActiveSection("branding")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSection === "branding"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          Primary & Secondary Brand Colors
        </button>
        <button
          onClick={() => setActiveSection("doctors")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSection === "doctors"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Doctors Directory ({setup.doctors.length})
        </button>
        <button
          onClick={() => setActiveSection("chairs")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSection === "chairs"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Stethoscope className="h-3.5 w-3.5" />
          Operatory Chairs ({setup.chairs.length})
        </button>
      </div>

      {/* ── SECTION 1: CLINIC PROFILE & LOGO ── */}
      {activeSection === "profile" && (
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Practice Profile, Address & Official Contacts
            </CardTitle>
            <CardDescription className="text-xs">
              Updated details automatically appear on printed prescriptions, billing receipts, SMS notifications, and patient portal
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            {/* Logo and Practice Title */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-xl border bg-muted/20">
              <div className="sm:col-span-3 flex flex-col items-center justify-center text-center p-3 rounded-xl border bg-background space-y-2">
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: setup.primaryColor }}
                >
                  <ToothIcon className="h-9 w-9" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-bold text-foreground">Clinic Emblem / Logo</span>
                <p className="text-[10px] text-muted-foreground">High-Resolution Vector SVG</p>
              </div>

              <div className="sm:col-span-9 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Official Practice Name *</Label>
                  <Input
                    value={setup.name}
                    onChange={(e) => setSetup({ ...setup, name: e.target.value })}
                    className="h-9 text-xs font-semibold"
                    placeholder="e.g. Dhaka Dental Care & Maxillofacial Implant Hospital"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Practice Tagline / Clinical Subtitle</Label>
                  <Input
                    value={setup.tagline}
                    onChange={(e) => setSetup({ ...setup, tagline: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="e.g. Advanced Digital Dentistry, Specialized Implantology & Smile Design"
                  />
                </div>
              </div>
            </div>

            {/* Address & License */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Clinic Physical Address *
                </Label>
                <Input
                  value={setup.address}
                  onChange={(e) => setSetup({ ...setup, address: e.target.value })}
                  className="h-8 text-xs"
                  placeholder="e.g. House 42, Road 9/A, Dhanmondi R/A, Dhaka-1209, Bangladesh"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  Primary Telephone / Mobile *
                </Label>
                <Input
                  value={setup.phone}
                  onChange={(e) => setSetup({ ...setup, phone: e.target.value })}
                  className="h-8 text-xs font-mono"
                  placeholder="+880 1711-000000"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Alternate Telephone / Landline
                </Label>
                <Input
                  value={setup.altPhone}
                  onChange={(e) => setSetup({ ...setup, altPhone: e.target.value })}
                  className="h-8 text-xs font-mono"
                  placeholder="+880 2-9661234"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Official Clinic Email
                </Label>
                <Input
                  value={setup.email}
                  onChange={(e) => setSetup({ ...setup, email: e.target.value })}
                  className="h-8 text-xs"
                  placeholder="contact@dhakadentalcare.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  BMDC Registration / Clinic License No.
                </Label>
                <Input
                  value={setup.bmdcLicense}
                  onChange={(e) => setSetup({ ...setup, bmdcLicense: e.target.value })}
                  className="h-8 text-xs font-mono font-semibold"
                  placeholder="BMDC-DH-2024-842"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => handleSaveSetup()} className="gap-2 text-xs font-semibold">
                <Save className="h-3.5 w-3.5" />
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SECTION 2: OPEN & CLOSED DAYS & WORKING HOURS ── */}
      {activeSection === "hours" && (
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Operating Schedule, Open/Closed Days & Consultation Hours
            </CardTitle>
            <CardDescription className="text-xs">
              Configure clinic weekly open and closed days and doctor chamber consulting hours for appointment slots
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6 text-xs">
            {/* Days Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold block">Weekly Clinic Operating Days (Click day to toggle Open/Closed)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                {ALL_DAYS_OF_WEEK.map((day) => {
                  const isOpen = setup.openDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        isOpen
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs"
                          : "bg-red-50 dark:bg-red-950/40 border-red-300 text-red-700 dark:text-red-300 opacity-80"
                      }`}
                    >
                      <span className="text-xs">{day}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 h-4 ${
                          isOpen
                            ? "bg-emerald-200 text-emerald-800 border-emerald-400 font-bold"
                            : "bg-red-200 text-red-800 border-red-400 font-medium"
                        }`}
                      >
                        {isOpen ? "OPEN" : "CLOSED"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl border bg-muted/20">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Opening Time (Morning)</Label>
                <Input
                  value={setup.openingTime}
                  onChange={(e) => setSetup({ ...setup, openingTime: e.target.value })}
                  placeholder="09:00 AM"
                  className="h-8 text-xs font-mono font-semibold bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Closing Time (Night)</Label>
                <Input
                  value={setup.closingTime}
                  onChange={(e) => setSetup({ ...setup, closingTime: e.target.value })}
                  placeholder="09:00 PM"
                  className="h-8 text-xs font-mono font-semibold bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mid-Day Break Start</Label>
                <Input
                  value={setup.breakStartTime}
                  onChange={(e) => setSetup({ ...setup, breakStartTime: e.target.value })}
                  placeholder="01:30 PM"
                  className="h-8 text-xs font-mono bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mid-Day Break End</Label>
                <Input
                  value={setup.breakEndTime}
                  onChange={(e) => setSetup({ ...setup, breakEndTime: e.target.value })}
                  placeholder="02:30 PM"
                  className="h-8 text-xs font-mono bg-background"
                />
              </div>
            </div>

            {/* Emergency Hotline */}
            <div className="p-3.5 rounded-xl border bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <div>
                  <strong className="block text-xs">24/7 Dental Trauma & Bleeding Emergency Care</strong>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300">
                    Emergency on-call surgeon available on closed days & outside operating hours
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={setup.emergencyPhone}
                  onChange={(e) => setSetup({ ...setup, emergencyPhone: e.target.value })}
                  className="h-8 text-xs font-mono bg-background border-amber-400 w-48"
                  placeholder="+880 1819-999999"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => handleSaveSetup()} className="gap-2 text-xs font-semibold">
                <Save className="h-3.5 w-3.5" />
                Save Operating Hours
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SECTION 3: BRANDING & PRIMARY / SECONDARY COLORS ── */}
      {activeSection === "branding" && (
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Primary & Secondary Brand Colors
            </CardTitle>
            <CardDescription className="text-xs">
              Customizes clinic theme colors across the entire system, printed prescription header, patient tokens, and buttons
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6 text-xs">
            {/* Curated Clinical Color Presets */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold block">Curated Dental Palette Themes</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {COLOR_PALETTE_PRESETS.map((p) => {
                  const isSelected = setup.palettePreset === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPalette(p.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                          : "hover:border-primary/40 bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground text-xs">{p.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-10 rounded-md shadow-xs border" style={{ backgroundColor: p.primary }} />
                        <div className="h-6 w-10 rounded-md shadow-xs border" style={{ backgroundColor: p.secondary }} />
                        <div className="h-6 w-10 rounded-md shadow-xs border" style={{ backgroundColor: p.accent }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
              <Label className="text-xs font-semibold block">Custom Brand Color Inputs (Hex / Color Picker)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Primary Color */}
                <div className="space-y-1.5 p-3 rounded-lg border bg-background">
                  <Label className="text-[11px] font-semibold flex items-center justify-between">
                    <span>Primary Brand Color *</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{setup.primaryColor}</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={setup.primaryColor}
                      onChange={(e) => setSetup({ ...setup, primaryColor: e.target.value })}
                      className="h-8 w-10 rounded cursor-pointer border p-0.5 bg-background"
                    />
                    <Input
                      value={setup.primaryColor}
                      onChange={(e) => setSetup({ ...setup, primaryColor: e.target.value })}
                      className="h-8 text-xs font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="space-y-1.5 p-3 rounded-lg border bg-background">
                  <Label className="text-[11px] font-semibold flex items-center justify-between">
                    <span>Secondary Brand Color *</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{setup.secondaryColor}</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={setup.secondaryColor}
                      onChange={(e) => setSetup({ ...setup, secondaryColor: e.target.value })}
                      className="h-8 w-10 rounded cursor-pointer border p-0.5 bg-background"
                    />
                    <Input
                      value={setup.secondaryColor}
                      onChange={(e) => setSetup({ ...setup, secondaryColor: e.target.value })}
                      className="h-8 text-xs font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-1.5 p-3 rounded-lg border bg-background">
                  <Label className="text-[11px] font-semibold flex items-center justify-between">
                    <span>Highlight Accent Color</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{setup.accentColor}</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={setup.accentColor}
                      onChange={(e) => setSetup({ ...setup, accentColor: e.target.value })}
                      className="h-8 w-10 rounded cursor-pointer border p-0.5 bg-background"
                    />
                    <Input
                      value={setup.accentColor}
                      onChange={(e) => setSetup({ ...setup, accentColor: e.target.value })}
                      className="h-8 text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Swatch */}
              <div className="p-4 rounded-xl border bg-background flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: setup.primaryColor }}
                  >
                    <ToothIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <strong className="block text-xs text-foreground">Interactive Theme Swatch Preview</strong>
                    <span className="text-[11px] text-muted-foreground">
                      Buttons, prescription letterheads, and active indicators dynamically adapt to these colors.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: setup.primaryColor }}
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: setup.secondaryColor }}
                  >
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => handleSaveSetup()} className="gap-2 text-xs font-semibold">
                <Save className="h-3.5 w-3.5" />
                Save Colors
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SECTION 4: DOCTORS DIRECTORY (ADD, EDIT, REMOVE) ── */}
      {activeSection === "doctors" && (
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Registered Dental Surgeons & Consultants ({setup.doctors.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Doctors appear on appointment booking schedules, e-prescription signature blocks, and chamber boards
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleOpenAddDoctor}
                className="gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add New Doctor
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {setup.doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                        {doc.name.split(" ").slice(-1)[0][0] || "D"}
                      </div>
                      <div className="space-y-0.5">
                        <strong className="text-sm font-bold text-foreground block">{doc.name}</strong>
                        <p className="text-[11px] text-primary font-semibold">{doc.designation}</p>
                        <p className="text-[11px] text-muted-foreground">{doc.degree}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        doc.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {doc.status === "active" ? "Active" : "On Leave"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">BMDC Reg No.</span>
                      <strong className="font-mono text-foreground">{doc.bmdcReg}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Specialization</span>
                      <span className="font-medium text-foreground">{doc.specialization}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Chamber / Room</span>
                      <span className="font-medium text-foreground">{doc.room}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Phone Contact</span>
                      <span className="font-mono text-foreground">{doc.phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[10px]">Visiting Hours</span>
                      <span className="text-foreground italic">{doc.visitingHours}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditDoctor(doc)}
                      className="h-7 text-xs gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                      className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SECTION 5: DENTAL CHAIRS OPERATORIES (ADD, EDIT, REMOVE) ── */}
      {activeSection === "chairs" && (
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Operatory Dental Chairs & Setup ({setup.chairs.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Chairs manage appointment operatory queues, procedure room assignments, and live chairside status
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleOpenAddChair}
                className="gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add Dental Chair
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {setup.chairs.map((chair) => (
                <div
                  key={chair.id}
                  className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold font-mono text-sm border border-teal-200">
                        💺
                      </div>
                      <div>
                        <strong className="text-sm font-bold text-foreground block">{chair.name}</strong>
                        <p className="text-[11px] text-muted-foreground">{chair.label}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        chair.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 font-semibold"
                          : "bg-amber-50 text-amber-700 border-amber-300"
                      }`}
                    >
                      {chair.status === "active" ? "Active / In-Service" : chair.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Room / Location</span>
                      <span className="font-medium text-foreground">{chair.room}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Department</span>
                      <span className="font-medium text-foreground">{chair.department}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[10px]">Assigned Doctor / Lead</span>
                      <span className="font-semibold text-primary">{chair.assignedDoctor || "Any Available Surgeon"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[10px]">Installed Equipment</span>
                      <span className="text-muted-foreground italic">{chair.equipment}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditChair(chair)}
                      className="h-7 text-xs gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit Chair
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChair(chair.id, chair.name)}
                      className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── MODAL: ADD / EDIT DOCTOR ── */}
      <Dialog open={isDoctorModalOpen} onOpenChange={setIsDoctorModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {editingDoctorId ? "Update Doctor Profile" : "Add New Doctor / Dental Surgeon"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill in doctor credentials, BMDC registration number, and chamber visiting schedule
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDoctor} className="space-y-3.5 text-xs py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-semibold">Doctor Full Name *</Label>
                <Input
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  placeholder="e.g. Dr. Sarah Smith"
                  className="h-8 text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Designation</Label>
                <Input
                  value={doctorForm.designation}
                  onChange={(e) => setDoctorForm({ ...doctorForm, designation: e.target.value })}
                  placeholder="e.g. Senior Consultant"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">BMDC Registration No. *</Label>
                <Input
                  value={doctorForm.bmdcReg}
                  onChange={(e) => setDoctorForm({ ...doctorForm, bmdcReg: e.target.value })}
                  placeholder="e.g. A-84291"
                  className="h-8 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-semibold">Qualifications & Degree</Label>
                <Input
                  value={doctorForm.degree}
                  onChange={(e) => setDoctorForm({ ...doctorForm, degree: e.target.value })}
                  placeholder="e.g. BDS (DU), FCPS (Oral & Maxillofacial Surgery)"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Clinical Specialization</Label>
                <Select
                  value={doctorForm.specialization}
                  onValueChange={(val) => setDoctorForm({ ...doctorForm, specialization: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oral & Maxillofacial Surgery" className="text-xs">Oral & Maxillofacial Surgery</SelectItem>
                    <SelectItem value="Orthodontics & Clear Aligners" className="text-xs">Orthodontics & Aligners</SelectItem>
                    <SelectItem value="Conservative Dentistry & Endodontics" className="text-xs">Conservative Dentistry & Endodontics</SelectItem>
                    <SelectItem value="Prosthodontics & Implantology" className="text-xs">Prosthodontics & Implantology</SelectItem>
                    <SelectItem value="Periodontics & Gum Surgery" className="text-xs">Periodontics & Gum Surgery</SelectItem>
                    <SelectItem value="Pediatric Dentistry" className="text-xs">Pediatric Dentistry</SelectItem>
                    <SelectItem value="General Dentistry" className="text-xs">General Dentistry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Chamber / Room</Label>
                <Input
                  value={doctorForm.room}
                  onChange={(e) => setDoctorForm({ ...doctorForm, room: e.target.value })}
                  placeholder="e.g. Chamber 101"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Phone Contact</Label>
                <Input
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  placeholder="+880 17..."
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Doctor Status</Label>
                <Select
                  value={doctorForm.status}
                  onValueChange={(val: "active" | "on_leave" | "inactive") => setDoctorForm({ ...doctorForm, status: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xs">Active / On Duty</SelectItem>
                    <SelectItem value="on_leave" className="text-xs">On Leave</SelectItem>
                    <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-semibold">Visiting Hours Schedule</Label>
                <Input
                  value={doctorForm.visitingHours}
                  onChange={(e) => setDoctorForm({ ...doctorForm, visitingHours: e.target.value })}
                  placeholder="e.g. Sat - Thu: 10:00 AM - 02:00 PM, 05:00 PM - 09:00 PM"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDoctorModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-white font-semibold">
                {editingDoctorId ? "Save Doctor Changes" : "Add Doctor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: ADD / EDIT CHAIR ── */}
      <Dialog open={isChairModalOpen} onOpenChange={setIsChairModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ToothIcon className="h-5 w-5 text-primary" />
              {editingChairId ? "Edit Dental Chair" : "Add New Dental Chair Operatory"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure dental chair room, department, and installed equipment specifications
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveChair} className="space-y-3.5 text-xs py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Chair Name / Code *</Label>
              <Input
                value={chairForm.name}
                onChange={(e) => setChairForm({ ...chairForm, name: e.target.value })}
                placeholder="e.g. Chair 05"
                className="h-8 text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Operatory Label / Subtitle</Label>
              <Input
                value={chairForm.label}
                onChange={(e) => setChairForm({ ...chairForm, label: e.target.value })}
                placeholder="e.g. Surgical Suite (Hydraulic Unit)"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Room / Location</Label>
                <Input
                  value={chairForm.room}
                  onChange={(e) => setChairForm({ ...chairForm, room: e.target.value })}
                  placeholder="e.g. Room 105"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Operatory Status</Label>
                <Select
                  value={chairForm.status}
                  onValueChange={(val: "active" | "maintenance" | "occupied" | "reserved") => setChairForm({ ...chairForm, status: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xs">Active / Available</SelectItem>
                    <SelectItem value="maintenance" className="text-xs">Under Maintenance</SelectItem>
                    <SelectItem value="occupied" className="text-xs">Occupied</SelectItem>
                    <SelectItem value="reserved" className="text-xs">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Clinical Department</Label>
              <Input
                value={chairForm.department}
                onChange={(e) => setChairForm({ ...chairForm, department: e.target.value })}
                placeholder="e.g. Oral Surgery, Orthodontics, Hygiene"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Assigned Lead Doctor (Optional)</Label>
              <Select
                value={chairForm.assignedDoctor || "any"}
                onValueChange={(val) => setChairForm({ ...chairForm, assignedDoctor: val === "any" ? "" : val })}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Any Available Doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any" className="text-xs">Any Available Doctor</SelectItem>
                  {setup.doctors.map((d) => (
                    <SelectItem key={d.id} value={d.name} className="text-xs">
                      {d.name} ({d.specialization})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Installed Chairside Equipment</Label>
              <Input
                value={chairForm.equipment}
                onChange={(e) => setChairForm({ ...chairForm, equipment: e.target.value })}
                placeholder="e.g. Digital Sensor, Apex Locator, Piezo Scaler"
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsChairModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-white font-semibold">
                {editingChairId ? "Save Chair Changes" : "Add Dental Chair"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
