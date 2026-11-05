"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  CatalogCategory,
  CatalogItem,
  CATEGORY_LABELS,
  DEFAULT_CATALOG,
  getCatalog,
  saveCatalog,
} from "@/lib/procedures-catalog-store";
import { getClinicSetup, saveClinicSetup } from "@/lib/clinic-setup-store";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as CatalogCategory[];

/** Settings → Procedures & Fees: the price list used by the Procedure stage and Billing. */
export function ProceduresSettingsTab() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [dirty, setDirty] = useState(false);
  const [prepaid, setPrepaid] = useState(true);

  useEffect(() => {
    setItems(getCatalog());
    setPrepaid(getClinicSetup().prepaidConsultation !== false);
  }, []);

  const togglePrepaid = (on: boolean) => {
    setPrepaid(on);
    saveClinicSetup({ prepaidConsultation: on });
    toast.success(
      on
        ? "Consultation fee will be collected at check-in."
        : "Consultation fee will be billed at the end with the other charges."
    );
  };

  const update = (id: string, patch: Partial<CatalogItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setDirty(true);
  };

  const add = (category: CatalogCategory) => {
    setItems((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, code: "", name: "", category, price: 0, isActive: true },
    ]);
    setDirty(true);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDirty(true);
  };

  const save = () => {
    const invalid = items.find((i) => !i.name.trim() || isNaN(i.price) || i.price < 0);
    if (invalid) {
      toast.error("Every item needs a name and a price of 0 or more.");
      return;
    }
    saveCatalog(items.map((i) => ({ ...i, name: i.name.trim(), code: i.code.trim() })));
    setDirty(false);
    toast.success("Price list saved.");
  };

  const reset = () => {
    if (!confirm("Replace the price list with the default items and prices?")) return;
    setItems(DEFAULT_CATALOG);
    setDirty(true);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-xs">
        <CardContent className="p-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <label htmlFor="prepaid-consultation" className="text-sm font-semibold cursor-pointer">
              Collect consultation fee at check-in
            </label>
            <p className="text-xs text-muted-foreground max-w-xl">
              {prepaid
                ? "On: the patient pays the consultation fee when they check in and gets a receipt. Procedures, medicines and other charges are billed at the end."
                : "Off: patients check in without paying. The consultation fee is billed at the end together with procedures, medicines and other charges."}
            </p>
          </div>
          <Switch id="prepaid-consultation" checked={prepaid} onCheckedChange={togglePrepaid} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground max-w-xl">
          These prices are used in the Examination & Procedure stage and added to the bill automatically. The first
          active consultation item is the default consultation fee on every bill.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="text-xs gap-1.5" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Defaults
          </Button>
          <Button size="sm" className="text-xs gap-1.5" onClick={save} disabled={!dirty}>
            <Save className="h-3.5 w-3.5" />
            Save price list
          </Button>
        </div>
      </div>

      {CATEGORIES.map((cat) => {
        const rows = items.filter((i) => i.category === cat);
        return (
          <Card key={cat} className="shadow-xs">
            <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold">{CATEGORY_LABELS[cat]}</CardTitle>
                <CardDescription className="text-[11px]">{rows.length} items</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => add(cat)}>
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="text-left px-3 py-2 w-28">Code</th>
                    <th className="text-left px-2 py-2">Name</th>
                    <th className="text-left px-2 py-2 w-40">Category</th>
                    <th className="text-right px-2 py-2 w-28">Price (৳)</th>
                    <th className="text-center px-2 py-2 w-16">Active</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-1.5">
                        <Input
                          value={r.code}
                          onChange={(e) => update(r.id, { code: e.target.value })}
                          className="h-7 text-xs font-mono"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={r.name}
                          onChange={(e) => update(r.id, { name: e.target.value })}
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Select
                          value={r.category}
                          onValueChange={(v) => update(r.id, { category: v as CatalogCategory })}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {CATEGORY_LABELS[c]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min={0}
                          value={r.price}
                          onChange={(e) => update(r.id, { price: Number(e.target.value) })}
                          className="h-7 text-xs text-right"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <Switch
                          checked={r.isActive}
                          onCheckedChange={(v) => update(r.id, { isActive: v })}
                          aria-label={`${r.name || "Item"} active`}
                        />
                      </td>
                      <td className="pr-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600"
                          onClick={() => remove(r.id)}
                          aria-label={`Delete ${r.name || "item"}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
