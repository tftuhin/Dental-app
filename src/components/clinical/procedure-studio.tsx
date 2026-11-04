"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stethoscope, Plus, Trash2, ArrowRight, Save, Search, Package } from "lucide-react";
import { toast } from "sonner";
import {
  ClinicalQueuePatient,
  VisitLineItem,
  getStoredAppointments,
  getVisit,
  updateVisit,
  logPatientActivity,
  toISODate,
} from "@/lib/clinical-flow-store";
import {
  CatalogCategory,
  CatalogItem,
  CATEGORY_LABELS,
  CATALOG_UPDATED_EVENT,
  getActiveCatalog,
} from "@/lib/procedures-catalog-store";
import { formatBDT } from "@/lib/currency";
import { PatientContextPanel } from "@/components/clinical/patient-context-panel";
import { VisitStepper } from "@/components/clinical/visit-stepper";

const PICKER_TABS: CatalogCategory[] = ["examination", "procedure", "surgery"];

function lineFromCatalog(item: CatalogItem, toothNumber = "", quantity = 1): VisitLineItem {
  return {
    id: `li-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    catalogId: item.id,
    code: item.code,
    name: item.name,
    category: item.category,
    toothNumber: toothNumber || undefined,
    quantity,
    unitPrice: item.price,
  };
}

export function ProcedureStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [queue, setQueue] = useState<ClinicalQueuePatient[]>([]);
  const [visitId, setVisitId] = useState<string>("");
  const [visit, setVisit] = useState<ClinicalQueuePatient | undefined>();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  const [items, setItems] = useState<VisitLineItem[]>([]);
  const [consumables, setConsumables] = useState<VisitLineItem[]>([]);
  const [notes, setNotes] = useState("");

  const [tab, setTab] = useState<CatalogCategory>("examination");
  const [search, setSearch] = useState("");
  const [tooth, setTooth] = useState("");

  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | "">("");

  // Today's visits waiting for (or already through) this stage, plus the price list
  useEffect(() => {
    const load = () => {
      const today = toISODate();
      setQueue(
        getStoredAppointments().filter(
          (a) => (a.date || today) === today && (a.stage === "procedure" || (a.procedures?.length ?? 0) > 0)
        )
      );
      setCatalog(getActiveCatalog());
    };
    load();
    const param = searchParams?.get("visitId");
    if (param) setVisitId(param);
    window.addEventListener("dentai-appointments-updated", load);
    window.addEventListener(CATALOG_UPDATED_EVENT, load);
    return () => {
      window.removeEventListener("dentai-appointments-updated", load);
      window.removeEventListener(CATALOG_UPDATED_EVENT, load);
    };
  }, [searchParams]);

  // Load the selected visit's saved work
  useEffect(() => {
    const v = getVisit(visitId);
    setVisit(v);
    setItems(v?.procedures || []);
    setConsumables(v?.consumables || []);
    setNotes(v?.procedureNotes || "");
    setTooth(v?.examinationFindings?.targetTooth || "");
  }, [visitId]);

  const pickerItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter(
      (c) =>
        c.category === tab &&
        (!q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
    );
  }, [catalog, tab, search]);

  const consumableCatalog = catalog.filter((c) => c.category === "consumable");

  const procedureTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const consumableTotal = consumables.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const addItem = (c: CatalogItem) => {
    setItems((prev) => [...prev, lineFromCatalog(c, tooth)]);
    toast.success(`Added ${c.name}${tooth ? ` (${tooth})` : ""}`);
  };

  const addConsumableFromCatalog = (id: string) => {
    const c = consumableCatalog.find((x) => x.id === id);
    if (!c) return;
    setConsumables((prev) => {
      const existing = prev.find((p) => p.catalogId === c.id);
      if (existing) {
        return prev.map((p) => (p.id === existing.id ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [...prev, lineFromCatalog(c)];
    });
  };

  const addCustomConsumable = () => {
    if (!customName.trim() || customPrice === "" || Number(customPrice) < 0) {
      toast.error("Enter a name and price for the item.");
      return;
    }
    setConsumables((prev) => [
      ...prev,
      {
        id: `li-custom-${Date.now()}`,
        code: "DSP",
        name: customName.trim(),
        category: "consumable",
        quantity: Math.max(1, customQty),
        unitPrice: Number(customPrice),
      },
    ]);
    setCustomName("");
    setCustomQty(1);
    setCustomPrice("");
  };

  const setQty = (list: "items" | "consumables", id: string, qty: number) => {
    const apply = (prev: VisitLineItem[]) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, qty || 1) } : p));
    if (list === "items") setItems(apply);
    else setConsumables(apply);
  };

  const save = (silent = false) => {
    if (!visit) return;
    updateVisit(visit.id, { procedures: items, consumables, procedureNotes: notes });
    if (!silent) toast.success("Examination & procedure saved.");
  };

  const proceedToPrescription = () => {
    if (!visit) return;
    if (items.length === 0) {
      toast.error("Add at least one examination or procedure first.");
      return;
    }
    updateVisit(visit.id, {
      procedures: items,
      consumables,
      procedureNotes: notes,
      stage: "prescription",
    });

    logPatientActivity({
      id: `ev-${visit.id}-procedure`,
      patientId: visit.patientId,
      date: new Date().toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
      timestamp: Date.now(),
      type: "clinical_procedure",
      title: items.map((i) => i.name + (i.toothNumber ? ` (${i.toothNumber})` : "")).join(", "),
      doctor: visit.doctor,
      chair: visit.chair,
      targetTooth: items.find((i) => i.toothNumber)?.toothNumber,
      clinicalNotes: notes || undefined,
      provisionalDiagnosis: visit.provisionalDiagnosis || undefined,
      badge: "Procedure",
      badgeColor: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
    });

    toast.success(`${visit.patient} sent to Prescription.`);
    router.push(`/prescriptions?visitId=${visit.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Examination & Procedure
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record examinations, procedures and surgery from the clinic price list, plus medicines and disposables used.
          </p>
        </div>
        <div className="w-full sm:w-80">
          <Label className="text-[11px] text-muted-foreground">Patient</Label>
          <Select value={visitId} onValueChange={setVisitId}>
            <SelectTrigger className="h-9 text-xs mt-1">
              <SelectValue placeholder="Select a patient waiting for procedure" />
            </SelectTrigger>
            <SelectContent>
              {queue.length === 0 && !visit && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No patients waiting today.</div>
              )}
              {queue.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  #{a.fifoSerial} {a.patient} ({a.patientId})
                </SelectItem>
              ))}
              {visit && !queue.some((a) => a.id === visit.id) && (
                <SelectItem value={visit.id}>
                  #{visit.fifoSerial} {visit.patient} ({visit.patientId})
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!visit ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground space-y-2">
            <p>Select a patient to record today&apos;s examination and procedures.</p>
            <p className="text-xs">
              Patients arrive here when the doctor chooses <strong>Needs Procedure / Surgery</strong> at the end of note
              taking on the{" "}
              <Link href="/appointments" className="text-primary hover:underline">
                Appointments
              </Link>{" "}
              page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <VisitStepper visitId={visit.id} current="procedure" reached={visit.stage} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
              {/* Price-list picker */}
              <Card className="shadow-xs">
                <CardHeader className="py-3 px-4 border-b bg-muted/20">
                  <CardTitle className="text-xs font-bold">Add from price list</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {PICKER_TABS.map((c) => (
                      <Button
                        key={c}
                        type="button"
                        size="sm"
                        variant={tab === c ? "default" : "outline"}
                        className="h-7 text-[11px]"
                        onClick={() => setTab(c)}
                      >
                        {CATEGORY_LABELS[c]}
                      </Button>
                    ))}
                    <div className="relative flex-1 min-w-40">
                      <Search className="h-3.5 w-3.5 absolute left-2 top-2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or code"
                        className="h-7 text-xs pl-7"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Label className="text-[11px] whitespace-nowrap">Tooth</Label>
                      <Input
                        value={tooth}
                        onChange={(e) => setTooth(e.target.value)}
                        placeholder="#19"
                        className="h-7 text-xs w-20 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                    {pickerItems.length === 0 && (
                      <p className="text-xs text-muted-foreground col-span-full">
                        Nothing in this category. Add items in{" "}
                        <Link href="/settings?tab=procedures" className="text-primary hover:underline">
                          Settings → Procedures & Fees
                        </Link>
                        .
                      </p>
                    )}
                    {pickerItems.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => addItem(c)}
                        className="flex items-center justify-between gap-2 text-left p-2.5 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <span>
                          <span className="block text-xs font-semibold leading-tight">{c.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{c.code}</span>
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-bold">{formatBDT(c.price, false)}</span>
                          <Plus className="h-3.5 w-3.5 text-primary" />
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Items done today */}
              <Card className="shadow-xs">
                <CardHeader className="py-3 px-4 border-b bg-muted/20">
                  <CardTitle className="text-xs font-bold flex items-center justify-between">
                    <span>Examinations & procedures done today</span>
                    <span>{formatBDT(procedureTotal)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {items.length === 0 ? (
                    <p className="p-4 text-xs text-muted-foreground">Nothing added yet.</p>
                  ) : (
                    <LineTable
                      rows={items}
                      onQty={(id, q) => setQty("items", id, q)}
                      onRemove={(id) => setItems((prev) => prev.filter((p) => p.id !== id))}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Consumables */}
              <Card className="shadow-xs">
                <CardHeader className="py-3 px-4 border-b bg-muted/20">
                  <CardTitle className="text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-primary" />
                      Medicines & disposables used (billable)
                    </span>
                    <span>{formatBDT(consumableTotal)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="w-full sm:w-64">
                      <Label className="text-[11px]">From price list</Label>
                      <Select value="" onValueChange={addConsumableFromCatalog}>
                        <SelectTrigger className="h-8 text-xs mt-1">
                          <SelectValue placeholder="Add item…" />
                        </SelectTrigger>
                        <SelectContent>
                          {consumableCatalog.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} · {formatBDT(c.price, false)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-[11px] text-muted-foreground pb-2">or</span>
                    <div className="flex-1 min-w-36">
                      <Label className="text-[11px]">Other item</Label>
                      <Input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Item name"
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <div className="w-16">
                      <Label className="text-[11px]">Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        value={customQty}
                        onChange={(e) => setCustomQty(Number(e.target.value))}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-[11px]">Unit ৳</Label>
                      <Input
                        type="number"
                        min={0}
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={addCustomConsumable}
                      aria-label="Add other item"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {consumables.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <LineTable
                        rows={consumables}
                        onQty={(id, q) => setQty("consumables", id, q)}
                        onRemove={(id) => setConsumables((prev) => prev.filter((p) => p.id !== id))}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardHeader className="py-3 px-4 border-b bg-muted/20">
                  <CardTitle className="text-xs font-bold">Procedure notes</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Anaesthesia, technique, findings, complications, post-op instructions…"
                    className="text-xs"
                  />
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border bg-muted/20">
                <p className="text-xs">
                  Running total for billing: <strong>{formatBDT(procedureTotal + consumableTotal)}</strong>{" "}
                  <span className="text-muted-foreground">(consultation fee is added at billing)</span>
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="text-xs gap-1.5" onClick={() => save()}>
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                  <Button size="sm" className="text-xs gap-1.5 font-bold" onClick={proceedToPrescription}>
                    Proceed to Prescription
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <PatientContextPanel visit={visit} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LineTable({
  rows,
  onQty,
  onRemove,
}: {
  rows: VisitLineItem[];
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <table className="w-full text-xs">
      <thead className="bg-muted/30 text-[10px] uppercase text-muted-foreground">
        <tr>
          <th className="text-left px-3 py-2">Item</th>
          <th className="text-left px-2 py-2">Tooth</th>
          <th className="text-center px-2 py-2 w-16">Qty</th>
          <th className="text-right px-2 py-2">Unit</th>
          <th className="text-right px-3 py-2">Total</th>
          <th className="w-8" />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t">
            <td className="px-3 py-2">
              <span className="font-semibold">{r.name}</span>{" "}
              <Badge variant="outline" className="text-[9px] font-mono ml-1">
                {r.code}
              </Badge>
            </td>
            <td className="px-2 py-2 font-mono">{r.toothNumber || "—"}</td>
            <td className="px-2 py-2">
              <Input
                type="number"
                min={1}
                value={r.quantity}
                onChange={(e) => onQty(r.id, Number(e.target.value))}
                className="h-7 text-xs text-center"
              />
            </td>
            <td className="px-2 py-2 text-right">{formatBDT(r.unitPrice, false)}</td>
            <td className="px-3 py-2 text-right font-semibold">{formatBDT(r.quantity * r.unitPrice, false)}</td>
            <td className="pr-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-600"
                onClick={() => onRemove(r.id)}
                aria-label={`Remove ${r.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
