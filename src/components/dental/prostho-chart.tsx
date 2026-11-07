"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Crown, Layers, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  KENNEDY_LABELS,
  KennedyClass,
  PROSTHESIS_LABELS,
  PROSTHESIS_MATERIALS,
  PROSTHO_EVENT,
  PROSTHO_STAGES,
  ProsthesisItem,
  ProsthesisType,
  ProsthoRecord,
  VITA_SHADES,
  getProsthoRecord,
  saveProsthoRecord,
  withStage,
} from "@/lib/specialty-charts-store";
import { toISODate } from "@/lib/clinical-flow-store";

const NONE = "__none";

function PickOne({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-semibold text-muted-foreground">{label}</Label>
      <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)} disabled={disabled}>
        <SelectTrigger className="h-8 bg-background text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE} className="text-xs text-muted-foreground">
            Not recorded
          </SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const kennedyOptions = (Object.keys(KENNEDY_LABELS) as Array<Exclude<KennedyClass, "">>).map((k) => ({
  value: k,
  label: KENNEDY_LABELS[k],
}));
const typeOptions = (Object.keys(PROSTHESIS_LABELS) as ProsthesisType[]).map((k) => ({ value: k, label: PROSTHESIS_LABELS[k] }));
const materialOptions = PROSTHESIS_MATERIALS.map((m) => ({ value: m, label: m }));
const shadeOptions = VITA_SHADES.map((s) => ({ value: s, label: s }));

function newItem(): ProsthesisItem {
  return {
    id: `pr-${Date.now()}`,
    type: "crown",
    teeth: "",
    material: "",
    shade: "",
    lab: "",
    stage: "planned",
    stageDates: { planned: toISODate() },
    notes: "",
  };
}

/** Crowns, bridges, dentures and implant prostheses for one patient, with lab stages. */
export function ProsthoChart({ patientId, readOnly = false }: { patientId: string; readOnly?: boolean }) {
  const [record, setRecord] = useState<ProsthoRecord>(() => getProsthoRecord(patientId));
  const [loadedFor, setLoadedFor] = useState(patientId);
  if (loadedFor !== patientId) {
    setLoadedFor(patientId);
    setRecord(getProsthoRecord(patientId));
  }

  useEffect(() => {
    const onSync = (e: Event) => {
      const id = (e as CustomEvent<{ patientId?: string }>).detail?.patientId;
      if (!id || id === patientId) setRecord(getProsthoRecord(patientId));
    };
    window.addEventListener(PROSTHO_EVENT, onSync);
    return () => window.removeEventListener(PROSTHO_EVENT, onSync);
  }, [patientId]);

  const update = (patch: Partial<ProsthoRecord>) => {
    if (readOnly) return;
    const next = { ...record, ...patch };
    setRecord(next);
    saveProsthoRecord(patientId, next);
  };
  const updateItem = (id: string, patch: Partial<ProsthesisItem>) =>
    update({ items: record.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });

  const active = record.items.filter((i) => i.stage !== "fitted" && i.stage !== "review").length;

  return (
    <div className="space-y-4">
      <Card className="shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs font-bold">
            <Layers className="h-4 w-4 text-primary" />
            Edentulous areas
          </CardTitle>
          <CardDescription className="text-[11px]">Kennedy classification for each arch.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          <PickOne
            label="Upper arch"
            value={record.kennedyUpper}
            onChange={(v) => update({ kennedyUpper: v as KennedyClass })}
            options={kennedyOptions}
            disabled={readOnly}
          />
          <PickOne
            label="Lower arch"
            value={record.kennedyLower}
            onChange={(v) => update({ kennedyLower: v as KennedyClass })}
            options={kennedyOptions}
            disabled={readOnly}
          />
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-muted-foreground">Notes</Label>
            <Input
              value={record.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Ridge condition, abutment health, occlusion…"
              className="h-8 bg-background text-xs"
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b bg-muted/20 px-4 py-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xs font-bold">
              <Crown className="h-4 w-4 text-primary" />
              Prostheses
              <Badge variant="secondary" className="text-[10px]">
                {record.items.length}
              </Badge>
              {active > 0 && <Badge className="bg-amber-100 text-[10px] text-amber-800">{active} in progress</Badge>}
            </CardTitle>
            <CardDescription className="text-[11px]">Click a stage to move the prosthesis there; the date is noted.</CardDescription>
          </div>
          {!readOnly && (
            <Button type="button" size="sm" className="h-8 gap-1 text-xs" onClick={() => update({ items: [newItem(), ...record.items] })}>
              <Plus className="h-3.5 w-3.5" />
              Add prosthesis
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {record.items.length === 0 && <p className="text-xs text-muted-foreground">No crowns, bridges or dentures planned yet.</p>}
          {record.items.map((it) => {
            const stageIdx = PROSTHO_STAGES.findIndex((s) => s.key === it.stage);
            return (
              <div key={it.id} className="space-y-3 rounded-lg border p-3">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
                  <div className="col-span-2">
                    <PickOne
                      label="Type"
                      value={it.type}
                      onChange={(v) => updateItem(it.id, { type: (v || "crown") as ProsthesisType })}
                      options={typeOptions}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Teeth</Label>
                    <Input
                      value={it.teeth}
                      onChange={(e) => updateItem(it.id, { teeth: e.target.value })}
                      placeholder="#14-#16"
                      className="h-8 bg-background font-mono text-xs"
                      disabled={readOnly}
                    />
                  </div>
                  <PickOne label="Material" value={it.material} onChange={(v) => updateItem(it.id, { material: v })} options={materialOptions} disabled={readOnly} />
                  <PickOne label="Shade (VITA)" value={it.shade} onChange={(v) => updateItem(it.id, { shade: v })} options={shadeOptions} disabled={readOnly} />
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Lab</Label>
                    <Input
                      value={it.lab}
                      onChange={(e) => updateItem(it.id, { lab: e.target.value })}
                      placeholder="Dental lab name"
                      className="h-8 bg-background text-xs"
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <ol className="flex flex-wrap items-center gap-1" aria-label="Stages">
                  {PROSTHO_STAGES.map((s, i) => {
                    const reached = i <= stageIdx;
                    const date = it.stageDates[s.key];
                    return (
                      <li key={s.key}>
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => updateItem(it.id, withStage(it, s.key, toISODate()))}
                          aria-current={it.stage === s.key ? "step" : undefined}
                          title={date ? `${s.label}: ${date}` : s.label}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            it.stage === s.key
                              ? "border-primary bg-primary text-primary-foreground"
                              : reached
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {reached && it.stage !== s.key && <Check className="h-2.5 w-2.5" />}
                          {s.label}
                          {date && reached && <span className="font-mono font-normal opacity-80">{date.slice(5)}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ol>

                <div className="flex items-start gap-2">
                  <Textarea
                    value={it.notes}
                    onChange={(e) => updateItem(it.id, { notes: e.target.value })}
                    placeholder="Preparation notes, margin design, occlusion, lab instructions…"
                    className="min-h-12 flex-1 bg-background text-xs"
                    disabled={readOnly}
                  />
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label="Remove prosthesis"
                      onClick={() => update({ items: record.items.filter((x) => x.id !== it.id) })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProsthoChart;
