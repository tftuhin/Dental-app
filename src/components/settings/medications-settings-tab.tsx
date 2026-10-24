"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pill,
  Search,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Sparkles,
  Clock,
  Calendar,
  AlertCircle,
  Building,
  CheckCircle2,
  Filter,
  Check,
  ShieldCheck,
  Beaker,
} from "lucide-react";
import {
  CatalogMedicine,
  getStoredMedicines,
  addStoredMedicine,
  updateStoredMedicine,
  deleteStoredMedicine,
  resetStoredMedicines,
} from "@/lib/medicines-store";
import { toast } from "sonner";

const COMMON_CATEGORIES = [
  "Analgesic & Antipyretic",
  "NSAID Analgesic",
  "Penicillin Antibiotic",
  "Anaerobic Antimicrobial",
  "Cephalosporin Antibiotic",
  "Lincosamide Antibiotic",
  "Antiseptic Mouthwash",
  "Periodontal Topical Gel",
  "Corticosteroid Gel",
  "Proton Pump Inhibitor (PPI)",
  "Muscle Relaxant",
  "Antifungal Oral Suspension",
  "Desensitizing Agent",
  "Other",
];

const COMMON_MANUFACTURERS = [
  "Square Pharmaceuticals",
  "Beximco Pharmaceuticals",
  "Renata Limited",
  "Incepta Pharmaceuticals",
  "Eskayef Pharmaceuticals (SK+F)",
  "Popular Pharmaceuticals",
  "ACME Laboratories",
  "Aristopharma",
  "Opsonin Pharma",
  "Other",
];

const COMMON_DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Oral Rinse",
  "Topical Gel",
  "Syrup",
  "Injection",
  "Drops",
  "Powder",
  "Other",
];

const COMMON_FREQUENCIES = [
  { val: "1+0+1", label: "1+0+1 (Morning + Night)" },
  { val: "1+1+1", label: "1+1+1 (Thrice daily / 8-hourly)" },
  { val: "1+0+0", label: "1+0+0 (Once daily - Morning)" },
  { val: "0+0+1", label: "0+0+1 (Once daily - Bedtime)" },
  { val: "1+1+1+1", label: "1+1+1+1 (4 times daily / 6-hourly)" },
  { val: "SOS / As needed", label: "SOS (Only when severe pain)" },
];

const COMMON_TIMINGS = [
  "After food",
  "30 mins before food",
  "With food / during meals",
  "At bedtime after food",
  "After tooth brushing (Do not swallow)",
  "Empty stomach",
];

export function MedicationsSettingsTab() {
  const [medications, setMedications] = useState<CatalogMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedForm, setSelectedForm] = useState("all");

  // Add / Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [brandName, setBrandName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [strength, setStrength] = useState("");
  const [manufacturer, setManufacturer] = useState("Square Pharmaceuticals");
  const [dosageForm, setDosageForm] = useState("Tablet");
  const [category, setCategory] = useState("NSAID Analgesic");
  const [defaultFrequency, setDefaultFrequency] = useState("1+0+1");
  const [defaultDuration, setDefaultDuration] = useState("3 days");
  const [defaultTiming, setDefaultTiming] = useState("After food");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingMed, setDeletingMed] = useState<CatalogMedicine | null>(null);

  // Load medications on mount & listen to sync events
  useEffect(() => {
    const list = getStoredMedicines();
    setMedications(list);

    const handleSync = () => {
      setMedications(getStoredMedicines());
    };
    window.addEventListener("dentai-medications-updated", handleSync);
    return () => window.removeEventListener("dentai-medications-updated", handleSync);
  }, []);

  // Filtered medications
  const filteredMedications = useMemo(() => {
    return medications.filter((med) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        med.brandName.toLowerCase().includes(q) ||
        med.genericName?.toLowerCase().includes(q) ||
        med.category?.toLowerCase().includes(q) ||
        med.strength?.toLowerCase().includes(q) ||
        med.manufacturer?.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "all" || med.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesForm =
        selectedForm === "all" || med.dosageForm?.toLowerCase() === selectedForm.toLowerCase();

      return matchesSearch && matchesCategory && matchesForm;
    });
  }, [medications, searchQuery, selectedCategory, selectedForm]);

  // Open Add Dialog
  const handleOpenAdd = () => {
    setDialogMode("add");
    setEditingId(null);
    setBrandName("");
    setGenericName("");
    setStrength("");
    setManufacturer("Square Pharmaceuticals");
    setDosageForm("Tablet");
    setCategory("NSAID Analgesic");
    setDefaultFrequency("1+0+1");
    setDefaultDuration("3 days");
    setDefaultTiming("After food");
    setSpecialInstructions("");
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (med: CatalogMedicine) => {
    setDialogMode("edit");
    setEditingId(med.id);
    setBrandName(med.brandName);
    setGenericName(med.genericName || "");
    setStrength(med.strength || "");
    setManufacturer(med.manufacturer || "Square Pharmaceuticals");
    setDosageForm(med.dosageForm || "Tablet");
    setCategory(med.category || "NSAID Analgesic");
    setDefaultFrequency(med.defaultFrequency || "1+0+1");
    setDefaultDuration(med.defaultDuration || "3 days");
    setDefaultTiming(med.defaultTiming || "After food");
    setSpecialInstructions(med.specialInstructions || "");
    setIsDialogOpen(true);
  };

  // Submit Add or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast.error("Brand name is required");
      return;
    }

    setIsSubmitting(true);
    const medPayload = {
      brandName: brandName.trim(),
      genericName: genericName.trim() || undefined,
      strength: strength.trim() || undefined,
      manufacturer: manufacturer.trim() || undefined,
      dosageForm,
      category,
      defaultFrequency,
      defaultDuration,
      defaultTiming,
      specialInstructions: specialInstructions.trim() || undefined,
    };

    try {
      if (dialogMode === "add") {
        // Post to API for DB persistence
        fetch("/api/medicines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(medPayload),
        }).catch((err) => console.warn("Background API sync:", err));

        // Save to client store & notify
        addStoredMedicine(medPayload);
        toast.success(`"${brandName}" added to Clinic Medications Catalog!`);
      } else if (dialogMode === "edit" && editingId) {
        updateStoredMedicine(editingId, medPayload);
        toast.success(`"${brandName}" updated successfully!`);
      }
      setIsDialogOpen(false);
    } catch {
      toast.error("Failed to save medication");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm and Execute Delete
  const handleConfirmDelete = () => {
    if (!deletingMed) return;
    deleteStoredMedicine(deletingMed.id);

    // Call API delete in background
    fetch(`/api/medicines?id=${deletingMed.id}`, { method: "DELETE" }).catch((err) =>
      console.warn("API delete:", err)
    );

    toast.success(`"${deletingMed.brandName}" removed from medications catalog`);
    setDeletingMed(null);
  };

  // Reset to default formulary
  const handleResetDefaults = () => {
    if (confirm("Reset the medications catalog back to the default 15+ Bangladeshi dental medications? Any custom added drugs will be cleared.")) {
      resetStoredMedicines();
      toast.success("Medications catalog restored to standard Bangladeshi dental formulary.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card className="border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Pill className="h-5 w-5 text-primary" />
                Clinic Medications Catalog & Pharmacopeia
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Official dental medications formulary. Prescriptions Studio queries this catalog for auto-completing brands, dosages, and regimens.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetDefaults}
                className="text-xs h-8 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                Reset Defaults
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenAdd}
                className="text-xs h-8 gap-1.5 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add Medication
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brand (e.g. Napa, Torax, Moxacil), generic, category, or manufacturer..."
                className="h-9 pl-8 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="w-full md:w-[220px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories ({medications.length})</SelectItem>
                  {COMMON_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dosage Form Dropdown */}
            <div className="w-full md:w-[150px]">
              <Select value={selectedForm} onValueChange={setSelectedForm}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="All Forms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {COMMON_DOSAGE_FORMS.map((form) => (
                    <SelectItem key={form} value={form}>
                      {form}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters / Result Summary */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
            <span>
              Showing <strong className="text-foreground">{filteredMedications.length}</strong> of{" "}
              <strong className="text-foreground">{medications.length}</strong> registered medications
            </span>
            {(searchQuery || selectedCategory !== "all" || selectedForm !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedForm("all");
                }}
                className="text-primary hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Medications Grid / Table */}
          {filteredMedications.length === 0 ? (
            <div className="p-8 text-center border rounded-xl bg-muted/10 space-y-2">
              <Pill className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No medications match your search criteria</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No matching medications found for &quot;{searchQuery}&quot;. You can clear filters or add this medication to the catalog now.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenAdd}
                className="text-xs h-8 gap-1.5 mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Add &quot;{searchQuery}&quot; as New Medication
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredMedications.map((med) => (
                <div
                  key={med.id}
                  className="p-3.5 sm:p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-xs transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    {/* Brand & Generic Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Pill className="h-4 w-4 text-primary shrink-0" />
                          {med.brandName}
                        </span>
                        {med.strength && (
                          <Badge variant="secondary" className="font-mono text-[10px] font-semibold">
                            {med.strength}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-background font-medium border-primary/20 text-primary"
                        >
                          {med.dosageForm || "Tablet"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-muted/50 text-muted-foreground font-normal"
                        >
                          {med.category || "Dental Therapeutics"}
                        </Badge>
                        {med.isCustomAdded && (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                            Custom Added
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        {med.genericName && (
                          <span>
                            Generic: <strong className="text-foreground">{med.genericName}</strong>
                          </span>
                        )}
                        {med.manufacturer && (
                          <span>
                            · Manufacturer: <span className="font-medium text-foreground">{med.manufacturer}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(med)}
                        className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingMed(med)}
                        className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Standard Regimen Pills */}
                  <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/40 border text-muted-foreground font-medium">
                      <Clock className="h-3 w-3 text-primary" />
                      Frequency: <strong className="text-foreground ml-0.5">{med.defaultFrequency || "1+0+1"}</strong>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/40 border text-muted-foreground font-medium">
                      <Calendar className="h-3 w-3 text-primary" />
                      Duration: <strong className="text-foreground ml-0.5">{med.defaultDuration || "5 days"}</strong>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/40 border text-muted-foreground font-medium">
                      <Beaker className="h-3 w-3 text-primary" />
                      Timing: <strong className="text-foreground ml-0.5">{med.defaultTiming || "After food"}</strong>
                    </div>
                  </div>

                  {/* Special Instructions / Notes */}
                  {med.specialInstructions && (
                    <div className="p-2 bg-muted/20 border rounded-lg text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{med.specialInstructions}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── ADD / EDIT MEDICATION MODAL ─── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl w-[94vw] p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl bg-card border">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <DialogHeader className="p-4 sm:p-5 border-b bg-muted/20">
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Pill className="h-5 w-5 text-primary" />
                {dialogMode === "add" ? "Add New Medication to Catalog" : `Edit Medication: ${brandName}`}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {dialogMode === "add"
                  ? "Register a new dental drug into the practice catalog for quick 1-click prescribing."
                  : "Modify default dosage form, strengths, and standard regimens for this medication."}
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 sm:p-5 space-y-3.5 max-h-[70vh] overflow-y-auto text-xs">
              {/* Row 1: Brand & Generic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Brand Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Napa Extra, Torax, Moxacil"
                    className="h-8 text-xs font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Generic Chemical Name</Label>
                  <Input
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    placeholder="e.g. Paracetamol + Caffeine"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Row 2: Strength & Manufacturer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Strength / Formulation</Label>
                  <Input
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="e.g. 500 mg, 10 mg, 100 ml"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Manufacturer (Company)</Label>
                  <Select value={manufacturer} onValueChange={setManufacturer}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_MANUFACTURERS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Dosage Form & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Dosage Form</Label>
                  <Select value={dosageForm} onValueChange={setDosageForm}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_DOSAGE_FORMS.map((form) => (
                        <SelectItem key={form} value={form}>
                          {form}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Therapeutic Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Default Regimen (Frequency, Duration, Timing) */}
              <div className="p-3 bg-muted/20 border rounded-xl space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Default Prescribing Regimen
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium">Frequency</Label>
                    <Select value={defaultFrequency} onValueChange={setDefaultFrequency}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_FREQUENCIES.map((f) => (
                          <SelectItem key={f.val} value={f.val}>
                            {f.val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium">Duration</Label>
                    <Input
                      value={defaultDuration}
                      onChange={(e) => setDefaultDuration(e.target.value)}
                      placeholder="e.g. 5 days, 3 days"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium">Timing</Label>
                    <Select value={defaultTiming} onValueChange={setDefaultTiming}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_TIMINGS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Row 5: Special Clinical Instructions / Cautions */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Special Clinical Instructions / Caution</Label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Complete full course. Contraindicated in penicillin allergy. Take with plenty of water..."
                  rows={2}
                  className="text-xs leading-relaxed"
                />
              </div>
            </div>

            <DialogFooter className="p-3.5 border-t bg-muted/20 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs h-8 px-4 gap-1.5 font-bold bg-primary hover:bg-primary/90 text-white"
              >
                <Check className="h-3.5 w-3.5" />
                {dialogMode === "add" ? "Save to Catalog" : "Update Medication"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRMATION DIALOG ─── */}
      <Dialog open={!!deletingMed} onOpenChange={(open) => !open && setDeletingMed(null)}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-xl border bg-card shadow-2xl">
          <DialogHeader className="p-4 border-b bg-muted/20">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Remove Medication from Catalog?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete <strong className="text-foreground">{deletingMed?.brandName}</strong> ({deletingMed?.strength})? It will no longer appear in the quick prescription search.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-3 border-t bg-muted/20 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingMed(null)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="text-xs h-8 px-3 font-semibold"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
