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
  Microscope,
  Search,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Clock,
  AlertCircle,
  Check,
  FileText,
  Scan,
  Activity,
  Layers,
} from "lucide-react";
import {
  InvestigationItem,
  getStoredInvestigations,
  addStoredInvestigation,
  updateStoredInvestigation,
  deleteStoredInvestigation,
  resetStoredInvestigations,
} from "@/lib/investigations-store";
import { formatBDT } from "@/lib/currency";
import { toast } from "sonner";

const CATEGORIES = [
  { val: "all", label: "All Categories" },
  { val: "radiology", label: "Radiology & Dental Imaging" },
  { val: "pathology", label: "Pathology & Blood Work" },
  { val: "clinical", label: "Clinical & Chairside Tests" },
  { val: "biopsy", label: "Biopsy & Histopathology" },
];

export function InvestigationsSettingsTab() {
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Add / Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [testName, setTestName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<InvestigationItem["category"]>("radiology");
  const [sampleOrModality, setSampleOrModality] = useState("Digital RVG Sensor");
  const [turnaroundTime, setTurnaroundTime] = useState("Immediate (5 mins)");
  const [defaultPriceBDT, setDefaultPriceBDT] = useState("500");
  const [indication, setIndication] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deletingItem, setDeletingItem] = useState<InvestigationItem | null>(null);

  // Load and listen to sync
  useEffect(() => {
    setInvestigations(getStoredInvestigations());

    const handleSync = () => {
      setInvestigations(getStoredInvestigations());
    };
    window.addEventListener("dentai-investigations-updated", handleSync);
    return () => window.removeEventListener("dentai-investigations-updated", handleSync);
  }, []);

  // Filtered investigations
  const filteredInvestigations = useMemo(() => {
    return investigations.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.testName.toLowerCase().includes(q) ||
        inv.sampleOrModality.toLowerCase().includes(q) ||
        inv.indication.toLowerCase().includes(q) ||
        inv.code?.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === "all" || inv.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [investigations, searchQuery, selectedCategory]);

  const handleOpenAdd = () => {
    setDialogMode("add");
    setEditingId(null);
    setTestName("");
    setCode("");
    setCategory("radiology");
    setSampleOrModality("Digital RVG Sensor");
    setTurnaroundTime("Immediate (5 mins)");
    setDefaultPriceBDT("500");
    setIndication("");
    setInstructions("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (inv: InvestigationItem) => {
    setDialogMode("edit");
    setEditingId(inv.id);
    setTestName(inv.testName);
    setCode(inv.code || "");
    setCategory(inv.category);
    setSampleOrModality(inv.sampleOrModality);
    setTurnaroundTime(inv.turnaroundTime);
    setDefaultPriceBDT(String(inv.defaultPriceBDT || 500));
    setIndication(inv.indication);
    setInstructions(inv.instructions || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      toast.error("Test / Investigation name is required");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      testName: testName.trim(),
      code: code.trim() || undefined,
      category,
      sampleOrModality: sampleOrModality.trim(),
      turnaroundTime: turnaroundTime.trim(),
      defaultPriceBDT: Number(defaultPriceBDT) || 500,
      indication: indication.trim(),
      instructions: instructions.trim() || undefined,
    };

    try {
      if (dialogMode === "add") {
        fetch("/api/investigations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((err) => console.warn("API sync:", err));

        addStoredInvestigation(payload);
        toast.success(`"${testName}" added to clinic investigations formulary!`);
      } else if (dialogMode === "edit" && editingId) {
        updateStoredInvestigation(editingId, payload);
        toast.success(`"${testName}" updated successfully!`);
      }
      setIsDialogOpen(false);
    } catch {
      toast.error("Failed to save investigation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    deleteStoredInvestigation(deletingItem.id);
    toast.success(`"${deletingItem.testName}" removed from investigations catalog`);
    setDeletingItem(null);
  };

  const handleResetDefaults = () => {
    if (confirm("Reset the investigations catalog back to standard Bangladeshi dental diagnostics?")) {
      resetStoredInvestigations();
      toast.success("Investigations catalog restored to defaults.");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Microscope className="h-5 w-5 text-primary" />
                Clinic Investigations & Diagnostic Tests Catalog
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Official formulary for dental radiographs, hematology tests, pulp tests, and biopsy investigations used in Prescriptions Studio.
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
                Add Investigation
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search test name (e.g. IOPA, OPG, CBCT, RBS, CBC), modality, or indication..."
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

            <div className="w-full sm:w-[240px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.val} value={c.val}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Result summary */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
            <span>
              Showing <strong className="text-foreground">{filteredInvestigations.length}</strong> of{" "}
              <strong className="text-foreground">{investigations.length}</strong> diagnostic investigations
            </span>
            {(searchQuery || selectedCategory !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-primary hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Cards List */}
          {filteredInvestigations.length === 0 ? (
            <div className="p-8 text-center border rounded-xl bg-muted/10 space-y-2">
              <Microscope className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No matching investigations found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No diagnostic test found for &quot;{searchQuery}&quot;. You can register this investigation into the practice catalog now.
              </p>
              <Button type="button" size="sm" onClick={handleOpenAdd} className="text-xs h-8 gap-1.5 mt-2">
                <Plus className="h-3.5 w-3.5" />
                Add &quot;{searchQuery}&quot; as New Investigation
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredInvestigations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 sm:p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-xs transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Scan className="h-4 w-4 text-primary shrink-0" />
                          {inv.testName}
                        </span>
                        {inv.code && (
                          <Badge variant="secondary" className="font-mono text-[10px] font-semibold">
                            {inv.code}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-background font-medium border-primary/20 text-primary capitalize"
                        >
                          {inv.category}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-muted/50 text-muted-foreground font-normal">
                          {inv.sampleOrModality}
                        </Badge>
                        {inv.isCustomAdded && (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                            Custom Added
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Indication: <strong className="text-foreground">{inv.indication}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      <div className="text-right mr-1">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
                          {formatBDT(inv.defaultPriceBDT || 500)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {inv.turnaroundTime}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(inv)}
                        className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingItem(inv)}
                        className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {inv.instructions && (
                    <div className="p-2 bg-muted/20 border rounded-lg text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{inv.instructions}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── ADD / EDIT DIALOG ─── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl w-[94vw] p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl bg-card border">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <DialogHeader className="p-4 sm:p-5 border-b bg-muted/20">
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Microscope className="h-5 w-5 text-primary" />
                {dialogMode === "add" ? "Add Investigation to Formulary" : `Edit Investigation: ${testName}`}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Register a new diagnostic test or dental radiograph available during prescription authoring.
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 sm:p-5 space-y-3.5 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs font-semibold">
                    Test / Investigation Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g. Digital IOPA Radiograph, CBCT 3D Scan"
                    className="h-8 text-xs font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Diagnostic Code</Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. RAD-IOPA"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Category</Label>
                  <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="radiology">Radiology & Dental Imaging</SelectItem>
                      <SelectItem value="pathology">Pathology & Blood Work</SelectItem>
                      <SelectItem value="clinical">Clinical Chairside Tests</SelectItem>
                      <SelectItem value="biopsy">Biopsy & Histopathology</SelectItem>
                      <SelectItem value="other">Other Diagnostic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Sample or Imaging Modality</Label>
                  <Input
                    value={sampleOrModality}
                    onChange={(e) => setSampleOrModality(e.target.value)}
                    placeholder="e.g. Digital RVG Sensor, Venous Blood"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Standard Turnaround Time</Label>
                  <Input
                    value={turnaroundTime}
                    onChange={(e) => setTurnaroundTime(e.target.value)}
                    placeholder="e.g. Immediate (5 mins), Same Day"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Standard Patient Fee (BDT ৳)</Label>
                  <Input
                    type="number"
                    value={defaultPriceBDT}
                    onChange={(e) => setDefaultPriceBDT(e.target.value)}
                    placeholder="350"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Diagnostic Indication / Clinical Purpose</Label>
                <Input
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  placeholder="e.g. Evaluate periapical radiolucency & root canal curvature"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Pre-Test Instructions / Cautions</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Remove jewelry, earrings and hairpins before exposure..."
                  rows={2}
                  className="text-xs leading-relaxed"
                />
              </div>
            </div>

            <DialogFooter className="p-3.5 border-t bg-muted/20 flex items-center justify-between gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs h-8 px-4 gap-1.5 font-bold bg-primary hover:bg-primary/90 text-white"
              >
                <Check className="h-3.5 w-3.5" />
                {dialogMode === "add" ? "Save to Formulary" : "Update Investigation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE DIALOG ─── */}
      <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-xl border bg-card shadow-2xl">
          <DialogHeader className="p-4 border-b bg-muted/20">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Remove Investigation from Catalog?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to remove <strong className="text-foreground">{deletingItem?.testName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-3 border-t bg-muted/20 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingItem(null)} className="text-xs h-8">
              Cancel
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleConfirmDelete} className="text-xs h-8 px-3 font-semibold">
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
