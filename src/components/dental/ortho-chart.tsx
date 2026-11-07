"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Ruler, ClipboardList, CalendarClock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ANGLE_CLASS_LABELS,
  AngleClass,
  CROSSBITE_OPTIONS,
  HABIT_OPTIONS,
  ORTHO_APPLIANCES,
  ORTHO_EVENT,
  ORTHO_STATUS_LABELS,
  OrthoRecord,
  OrthoStatus,
  OrthoVisit,
  getOrthoRecord,
  saveOrthoRecord,
} from "@/lib/specialty-charts-store";
import { toISODate } from "@/lib/clinical-flow-store";

const NONE = "__none";

function Choice<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-semibold text-muted-foreground">{label}</Label>
      <Select
        value={value || NONE}
        onValueChange={(v) => onChange((v === NONE ? "" : v) as T)}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 text-xs bg-background">
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-semibold text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs bg-background"
        disabled={disabled}
      />
    </div>
  );
}

function Chips({
  label,
  options,
  selected,
  onToggle,
  disabled,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-semibold text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              disabled={disabled}
              aria-pressed={on}
              onClick={() => onToggle(o)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const angleOptions = (Object.keys(ANGLE_CLASS_LABELS) as Array<Exclude<AngleClass, "">>).map((k) => ({
  value: k as AngleClass,
  label: ANGLE_CLASS_LABELS[k],
}));

/** Orthodontic assessment, treatment plan and adjustment visits for one patient. */
export function OrthoChart({ patientId, readOnly = false }: { patientId: string; readOnly?: boolean }) {
  const [record, setRecord] = useState<OrthoRecord>(() => getOrthoRecord(patientId));
  const [loadedFor, setLoadedFor] = useState(patientId);
  if (loadedFor !== patientId) {
    setLoadedFor(patientId);
    setRecord(getOrthoRecord(patientId));
  }

  // Changes made on another computer
  useEffect(() => {
    const onSync = (e: Event) => {
      const id = (e as CustomEvent<{ patientId?: string }>).detail?.patientId;
      if (!id || id === patientId) setRecord(getOrthoRecord(patientId));
    };
    window.addEventListener(ORTHO_EVENT, onSync);
    return () => window.removeEventListener(ORTHO_EVENT, onSync);
  }, [patientId]);

  const update = (patch: Partial<OrthoRecord>) => {
    if (readOnly) return;
    const next = { ...record, ...patch };
    setRecord(next);
    saveOrthoRecord(patientId, next);
  };
  const toggle = (key: "crossbite" | "habits", v: string) =>
    update({ [key]: record[key].includes(v) ? record[key].filter((x) => x !== v) : [...record[key], v] });

  const [visitDraft, setVisitDraft] = useState<Omit<OrthoVisit, "id">>({
    date: toISODate(),
    upperArchwire: "",
    lowerArchwire: "",
    procedure: "",
    notes: "",
    nextVisit: "",
  });

  const addVisit = () => {
    if (!visitDraft.procedure.trim() && !visitDraft.upperArchwire.trim() && !visitDraft.lowerArchwire.trim()) return;
    const visit: OrthoVisit = { ...visitDraft, id: `ov-${Date.now()}` };
    update({
      visits: [visit, ...record.visits],
      status: record.status === "assessment" || record.status === "planned" ? "active" : record.status,
    });
    setVisitDraft({ date: toISODate(), upperArchwire: "", lowerArchwire: "", procedure: "", notes: "", nextVisit: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold">Treatment status:</span>
        {(Object.keys(ORTHO_STATUS_LABELS) as OrthoStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            disabled={readOnly}
            onClick={() => update({ status: s })}
            aria-pressed={record.status === s}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              record.status === s ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
            }`}
          >
            {ORTHO_STATUS_LABELS[s]}
          </button>
        ))}
        {record.updatedAt && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            Updated {new Date(record.updatedAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        )}
      </div>

      <Card className="shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs font-bold">
            <Ruler className="h-4 w-4 text-primary" />
            Malocclusion assessment
          </CardTitle>
          <CardDescription className="text-[11px]">Angle classification, overjet / overbite, crowding and habits.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
          <Choice label="Molar (right)" value={record.molarRight} onChange={(v) => update({ molarRight: v })} options={angleOptions} disabled={readOnly} />
          <Choice label="Molar (left)" value={record.molarLeft} onChange={(v) => update({ molarLeft: v })} options={angleOptions} disabled={readOnly} />
          <Choice label="Canine (right)" value={record.canineRight} onChange={(v) => update({ canineRight: v })} options={angleOptions} disabled={readOnly} />
          <Choice label="Canine (left)" value={record.canineLeft} onChange={(v) => update({ canineLeft: v })} options={angleOptions} disabled={readOnly} />
          <Field label="Overjet (mm)" type="number" value={record.overjetMm} onChange={(v) => update({ overjetMm: v })} disabled={readOnly} />
          <Field label="Overbite (mm)" type="number" value={record.overbiteMm} onChange={(v) => update({ overbiteMm: v })} disabled={readOnly} />
          <Field label="Crowding upper (mm)" type="number" value={record.crowdingUpperMm} onChange={(v) => update({ crowdingUpperMm: v })} disabled={readOnly} />
          <Field label="Crowding lower (mm)" type="number" value={record.crowdingLowerMm} onChange={(v) => update({ crowdingLowerMm: v })} disabled={readOnly} />
          <Choice
            label="Open bite"
            value={record.openBite}
            onChange={(v) => update({ openBite: v })}
            options={[
              { value: "anterior", label: "Anterior" },
              { value: "posterior", label: "Posterior" },
            ]}
            disabled={readOnly}
          />
          <Choice
            label="Facial profile"
            value={record.profile}
            onChange={(v) => update({ profile: v })}
            options={[
              { value: "straight", label: "Straight" },
              { value: "convex", label: "Convex" },
              { value: "concave", label: "Concave" },
            ]}
            disabled={readOnly}
          />
          <Field label="Spacing / diastema" value={record.spacing} onChange={(v) => update({ spacing: v })} placeholder="e.g. 2 mm midline diastema" disabled={readOnly} />
          <Field label="Midline shift" value={record.midlineShift} onChange={(v) => update({ midlineShift: v })} placeholder="e.g. lower 2 mm left" disabled={readOnly} />
          <div className="col-span-2">
            <Chips label="Crossbite" options={CROSSBITE_OPTIONS} selected={record.crossbite} onToggle={(v) => toggle("crossbite", v)} disabled={readOnly} />
          </div>
          <div className="col-span-2">
            <Chips label="Habits" options={HABIT_OPTIONS} selected={record.habits} onToggle={(v) => toggle("habits", v)} disabled={readOnly} />
          </div>
          <div className="col-span-2 space-y-1 md:col-span-4">
            <Label className="text-[11px] font-semibold text-muted-foreground">Assessment notes</Label>
            <Textarea
              value={record.assessmentNotes}
              onChange={(e) => update({ assessmentNotes: e.target.value })}
              className="min-h-16 bg-background text-xs"
              placeholder="Cephalometric findings, skeletal pattern, oral hygiene, patient concerns…"
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs font-bold">
            <ClipboardList className="h-4 w-4 text-primary" />
            Treatment plan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
          <div className="col-span-2">
            <Choice
              label="Appliance"
              value={record.appliance}
              onChange={(v) => update({ appliance: v })}
              options={ORTHO_APPLIANCES.map((a) => ({ value: a, label: a }))}
              disabled={readOnly}
            />
          </div>
          <Field label="Estimated duration (months)" type="number" value={record.estimatedMonths} onChange={(v) => update({ estimatedMonths: v })} disabled={readOnly} />
          <Field label="Start date" type="date" value={record.startDate} onChange={(v) => update({ startDate: v })} disabled={readOnly} />
          <div className="col-span-2">
            <Field label="Extractions" value={record.extractions} onChange={(v) => update({ extractions: v })} placeholder="e.g. #14, #24, #34, #44 or non-extraction" disabled={readOnly} />
          </div>
          <Field label="Anchorage" value={record.anchorage} onChange={(v) => update({ anchorage: v })} placeholder="e.g. TPA, mini-implants" disabled={readOnly} />
          <Field label="Retainer" value={record.retainer} onChange={(v) => update({ retainer: v })} placeholder="e.g. Hawley, bonded lingual" disabled={readOnly} />
          <div className="col-span-2 space-y-1 md:col-span-4">
            <Label className="text-[11px] font-semibold text-muted-foreground">Plan notes</Label>
            <Textarea
              value={record.planNotes}
              onChange={(e) => update({ planNotes: e.target.value })}
              className="min-h-14 bg-background text-xs"
              placeholder="Treatment objectives, sequence, risks discussed…"
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs font-bold">
            <CalendarClock className="h-4 w-4 text-primary" />
            Adjustment visits
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {record.visits.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {!readOnly && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-dashed p-3 md:grid-cols-6">
              <Field label="Date" type="date" value={visitDraft.date} onChange={(v) => setVisitDraft({ ...visitDraft, date: v })} />
              <Field label="Upper archwire" value={visitDraft.upperArchwire} onChange={(v) => setVisitDraft({ ...visitDraft, upperArchwire: v })} placeholder="0.014 NiTi" />
              <Field label="Lower archwire" value={visitDraft.lowerArchwire} onChange={(v) => setVisitDraft({ ...visitDraft, lowerArchwire: v })} placeholder="0.016 NiTi" />
              <div className="col-span-2">
                <Field label="Procedure" value={visitDraft.procedure} onChange={(v) => setVisitDraft({ ...visitDraft, procedure: v })} placeholder="Bonding, wire change, elastics, IPR…" />
              </div>
              <Field label="Next visit" type="date" value={visitDraft.nextVisit} onChange={(v) => setVisitDraft({ ...visitDraft, nextVisit: v })} />
              <div className="col-span-2 md:col-span-5">
                <Field label="Notes" value={visitDraft.notes} onChange={(v) => setVisitDraft({ ...visitDraft, notes: v })} />
              </div>
              <div className="flex items-end">
                <Button type="button" size="sm" className="h-8 w-full gap-1 text-xs" onClick={addVisit}>
                  <Plus className="h-3.5 w-3.5" />
                  Add visit
                </Button>
              </div>
            </div>
          )}
          {record.visits.length === 0 ? (
            <p className="text-xs text-muted-foreground">No adjustment visits recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1 text-left">Date</th>
                    <th className="px-2 py-1 text-left">Upper</th>
                    <th className="px-2 py-1 text-left">Lower</th>
                    <th className="px-2 py-1 text-left">Procedure</th>
                    <th className="px-2 py-1 text-left">Next</th>
                    {!readOnly && <th />}
                  </tr>
                </thead>
                <tbody>
                  {record.visits.map((v) => (
                    <tr key={v.id} className="border-t align-top">
                      <td className="whitespace-nowrap px-2 py-1.5 font-mono">{v.date}</td>
                      <td className="px-2 py-1.5">{v.upperArchwire || "—"}</td>
                      <td className="px-2 py-1.5">{v.lowerArchwire || "—"}</td>
                      <td className="px-2 py-1.5">
                        {v.procedure || "—"}
                        {v.notes && <span className="block text-[10px] text-muted-foreground">{v.notes}</span>}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 font-mono">{v.nextVisit || "—"}</td>
                      {!readOnly && (
                        <td className="px-2 py-1.5 text-right">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            aria-label={`Remove visit on ${v.date}`}
                            onClick={() => update({ visits: record.visits.filter((x) => x.id !== v.id) })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OrthoChart;
