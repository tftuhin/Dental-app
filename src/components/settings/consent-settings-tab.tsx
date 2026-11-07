"use client";

import { useEffect, useRef, useState } from "react";
import { FileSignature, Plus, Copy, Trash2, RotateCcw, Save, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CONSENT_PLACEHOLDERS,
  CONSENT_TEMPLATES_EVENT,
  ConsentTemplate,
  DEFAULT_CONSENT_TEMPLATES,
  fillConsentText,
  getConsentTemplates,
  saveConsentTemplates,
  unknownPlaceholders,
} from "@/lib/consent-store";
import { getClinicSetup } from "@/lib/clinic-setup-store";
import { generateConsentHtml } from "@/lib/consent-pdf-generator";

const APPLIES_LABELS: Record<ConsentTemplate["appliesTo"], string> = {
  procedure: "Procedures",
  surgery: "Surgery",
  any: "Procedures and surgery",
};

/** Sample details for the preview, with the clinic's real name and first doctor. */
function sampleValues(): Record<string, string> {
  const clinic = getClinicSetup();
  const doctor = clinic.doctors?.find((d) => d.status === "active") || clinic.doctors?.[0];
  return {
    patient_name: "Rahima Begum",
    patient_id: "DENT-2026-00123",
    age: "34",
    gender: "Female",
    phone: "+880 1711-000000",
    address: "Dhanmondi, Dhaka",
    guardian_name: "",
    procedure: "Root Canal Treatment — Molar",
    teeth: "#36",
    diagnosis: "Symptomatic irreversible pulpitis",
    anaesthesia: "Local anaesthesia (2% lignocaine with adrenaline)",
    estimated_cost: "৳ 8,500",
    allergies: "Penicillin",
    medical_conditions: "None reported",
    doctor_name: doctor?.name || "Dr. A. Rahman",
    doctor_degree: doctor?.degree || "BDS",
    doctor_bmdc: doctor?.bmdcReg || "12345",
    clinic_name: clinic.name,
    clinic_address: clinic.address,
    clinic_phone: clinic.phone,
    date: new Date().toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" }),
  };
}

/** Settings → Consent Forms: the wording printed before procedures and surgery. */
export function ConsentSettingsTab() {
  const [templates, setTemplates] = useState<ConsentTemplate[]>(getConsentTemplates);
  const [selectedId, setSelectedId] = useState(() => getConsentTemplates()[0]?.id || "");
  const [dirty, setDirty] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Changes saved on another computer (only when nothing is being edited here)
  useEffect(() => {
    const onSync = () => {
      if (!dirty) setTemplates(getConsentTemplates());
    };
    window.addEventListener(CONSENT_TEMPLATES_EVENT, onSync);
    return () => window.removeEventListener(CONSENT_TEMPLATES_EVENT, onSync);
  }, [dirty]);

  const selected = templates.find((t) => t.id === selectedId) || templates[0];
  const defaultVersion = DEFAULT_CONSENT_TEMPLATES.find((d) => d.id === selected?.id);
  const unknown = selected ? unknownPlaceholders(`${selected.title}\n${selected.body}`) : [];

  const update = (patch: Partial<ConsentTemplate>) => {
    if (!selected) return;
    setTemplates((list) => list.map((t) => (t.id === selected.id ? { ...t, ...patch } : t)));
    setDirty(true);
  };

  const insertPlaceholder = (key: string) => {
    if (!selected) return;
    const el = bodyRef.current;
    const token = `{{${key}}}`;
    const start = el?.selectionStart ?? selected.body.length;
    const end = el?.selectionEnd ?? selected.body.length;
    const body = selected.body.slice(0, start) + token + selected.body.slice(end);
    update({ body });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const save = () => {
    if (templates.some((t) => !t.name.trim() || !t.title.trim() || !t.body.trim())) {
      toast.error("Every consent form needs a name, a title and some text.");
      return;
    }
    const stamped = templates.map((t) => ({ ...t, updatedAt: new Date().toISOString() }));
    saveConsentTemplates(stamped);
    setTemplates(stamped);
    setDirty(false);
    toast.success("Consent forms saved.");
  };

  const addTemplate = (from?: ConsentTemplate) => {
    const t: ConsentTemplate = from
      ? { ...from, id: `consent-${Date.now()}`, name: `${from.name} (copy)`, updatedAt: undefined }
      : {
          id: `consent-${Date.now()}`,
          name: "New consent form",
          appliesTo: "procedure",
          title: "Informed Consent",
          body: "I, {{patient_name}} (Patient ID {{patient_id}}), consent to {{procedure}} by {{doctor_name}} at {{clinic_name}}.",
          isActive: true,
        };
    setTemplates((list) => [...list, t]);
    setSelectedId(t.id);
    setDirty(true);
  };

  const removeTemplate = () => {
    if (!selected) return;
    if (templates.length <= 1) {
      toast.error("Keep at least one consent form. Switch it off instead if you don't want it offered.");
      return;
    }
    const rest = templates.filter((t) => t.id !== selected.id);
    setTemplates(rest);
    setSelectedId(rest[0]?.id || "");
    setDirty(true);
  };

  const preview = () => {
    if (!selected) return;
    const v = sampleValues();
    const clinic = getClinicSetup();
    const html = generateConsentHtml({
      consentNumber: "CNS-PREVIEW",
      title: fillConsentText(selected.title, v),
      body: fillConsentText(selected.body, v),
      date: v.date,
      clinicName: clinic.name,
      clinicTagline: clinic.tagline,
      clinicAddress: clinic.address,
      clinicPhone: clinic.phone,
      clinicLicense: clinic.bmdcLicense,
      logoUrl: clinic.logoUrl,
      patientName: v.patient_name,
      patientId: v.patient_id,
      age: v.age,
      gender: v.gender,
      phone: v.phone,
      address: v.address,
      doctorName: v.doctor_name,
      doctorDegree: v.doctor_degree,
      bmdcReg: v.doctor_bmdc,
    }).replace(/<script>[\s\S]*?<\/script>/, "");
    const win = window.open("", "_blank", "width=850,height=1100");
    if (!win) {
      toast.error("Allow pop-ups for this site to see the preview.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-xs">
        <CardHeader className="flex flex-col gap-2 border-b bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileSignature className="h-4 w-4 text-primary" />
              Consent forms
              {dirty && <Badge className="bg-amber-100 text-[10px] text-amber-800">Unsaved changes</Badge>}
            </CardTitle>
            <CardDescription className="text-xs">
              Printed when the doctor sends a patient to a procedure or surgery. Words in {"{{double braces}}"} are filled in
              with the patient&apos;s and doctor&apos;s details; anything unknown prints as a blank line.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => addTemplate()}>
              <Plus className="h-3.5 w-3.5" />
              New form
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" onClick={save} disabled={!dirty}>
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[220px_1fr]">
          <ul className="space-y-1" aria-label="Consent forms">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  aria-current={t.id === selected?.id}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                    t.id === selected?.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <span className="block font-semibold">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {APPLIES_LABELS[t.appliesTo]}
                    {!t.isActive && " · off"}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Name (shown to staff)</Label>
                  <Input value={selected.name} onChange={(e) => update({ name: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Offered first for</Label>
                  <Select value={selected.appliesTo} onValueChange={(v) => update({ appliesTo: v as ConsentTemplate["appliesTo"] })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(APPLIES_LABELS) as Array<ConsentTemplate["appliesTo"]>).map((k) => (
                        <SelectItem key={k} value={k} className="text-xs">
                          {APPLIES_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold">Title printed on the form</Label>
                  <Input value={selected.title} onChange={(e) => update({ title: e.target.value })} className="h-8 text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Wording</Label>
                <p className="text-[11px] text-muted-foreground">
                  Leave a blank line between paragraphs. Start a line with &quot;- &quot; for a bullet point. Click a detail below to
                  insert it where the cursor is.
                </p>
                <div className="flex flex-wrap gap-1">
                  {CONSENT_PLACEHOLDERS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      title={p.label}
                      onClick={() => insertPlaceholder(p.key)}
                      className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] hover:border-primary hover:text-primary"
                    >
                      {`{{${p.key}}}`}
                    </button>
                  ))}
                </div>
                <Textarea
                  ref={bodyRef}
                  value={selected.body}
                  onChange={(e) => update({ body: e.target.value })}
                  className="min-h-80 font-mono text-xs leading-relaxed"
                />
                {unknown.length > 0 && (
                  <p className="flex items-center gap-1.5 text-[11px] text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Not recognised (will print as a blank line): {unknown.map((k) => `{{${k}}}`).join(", ")}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={selected.isActive} onCheckedChange={(on) => update({ isActive: on })} />
                  Offer this form
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={preview}>
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => addTemplate(selected)}>
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate
                  </Button>
                  {defaultVersion && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => update({ title: defaultVersion.title, body: defaultVersion.body })}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore original wording
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-destructive" onClick={removeTemplate}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
