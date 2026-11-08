"use client";

import { useRef, useState } from "react";
import { MessageCircle, Save, Plus, Trash2, RotateCcw, BellRing, ExternalLink, Send } from "lucide-react";
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
  DEFAULT_MESSAGE_TEMPLATES,
  MESSAGE_PLACEHOLDERS,
  MessageChannel,
  MessageTemplate,
  MessagingSettings,
  bookingLink,
  clinicMessageValues,
  fillMessage,
  getMessageTemplates,
  getMessagingSettings,
  saveMessageTemplates,
  saveMessagingSettings,
  smsSegments,
} from "@/lib/messaging-store";
import { isValidPhone, normalisePhone } from "@/lib/message-sender";
import { SmsSendingCard } from "./sms-sending-card";

const SAMPLE = {
  patient_name: "Rahima Begum",
  first_name: "Rahima",
  patient_id: "DENT-2026-00123",
  procedure: "Crown fitting on #36",
  due_date: "15 Dec 2026",
  last_visit: "8 Nov 2026",
  doctor_name: "Dr. Sarah Smith",
};

/** Settings → Messages: WhatsApp and SMS, recall reminders, and message templates. */
export function MessagesSettingsTab() {
  const [settings, setSettings] = useState<MessagingSettings>(getMessagingSettings);
  const [templates, setTemplates] = useState<MessageTemplate[]>(getMessageTemplates);
  const [selectedId, setSelectedId] = useState(() => getMessageTemplates()[0]?.id || "");
  const [dirty, setDirty] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const change = (patch: Partial<MessagingSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    setDirty(true);
  };
  const selected = templates.find((t) => t.id === selectedId) || templates[0];
  const updateTemplate = (patch: Partial<MessageTemplate>) => {
    if (!selected) return;
    setTemplates((list) => list.map((t) => (t.id === selected.id ? { ...t, ...patch } : t)));
    setDirty(true);
  };
  const recallTemplates = templates.filter((t) => t.kind === "recall" && t.isActive);

  const save = () => {
    if (settings.whatsappNumber.trim() && !isValidPhone(settings.whatsappNumber)) {
      toast.error("The WhatsApp number doesn't look right. Use the full number, e.g. +880 1711-234891.");
      return;
    }
    if (templates.some((t) => !t.name.trim() || !t.body.trim())) {
      toast.error("Every template needs a name and a message.");
      return;
    }
    saveMessagingSettings({ ...settings, recallGraceDays: Math.max(0, Math.min(90, Number(settings.recallGraceDays) || 0)) });
    saveMessageTemplates(templates);
    setDirty(false);
    toast.success("Message settings saved.");
  };

  const insert = (key: string) => {
    if (!selected) return;
    const el = bodyRef.current;
    const token = `{{${key}}}`;
    const from = el?.selectionStart ?? selected.body.length;
    const to = el?.selectionEnd ?? selected.body.length;
    updateTemplate({ body: selected.body.slice(0, from) + token + selected.body.slice(to) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(from + token.length, from + token.length);
    });
  };

  const addTemplate = (kind: MessageTemplate["kind"]) => {
    const t: MessageTemplate = { id: `tpl-${Date.now()}`, name: kind === "recall" ? "New reminder" : "New campaign message", kind, body: "Dear {{first_name}}, … - {{clinic_name}}", isActive: true };
    setTemplates((l) => [...l, t]);
    setSelectedId(t.id);
    setDirty(true);
  };

  const testWhatsApp = () => {
    const n = normalisePhone(settings.whatsappNumber);
    if (!isValidPhone(n)) {
      toast.error("Enter your WhatsApp number first.");
      return;
    }
    const text = encodeURIComponent(`Test from DentalOS1: WhatsApp messages to patients will open in this account (${clinicMessageValues().clinic_name}).`);
    const url = settings.whatsappOpenWith === "app" ? `whatsapp://send?phone=${n}&text=${text}` : `https://web.whatsapp.com/send?phone=${n}&text=${text}`;
    if (url.startsWith("whatsapp:")) window.location.href = url;
    else window.open(url, "dentalos1-whatsapp");
  };

  const preview = selected ? fillMessage(selected.body, { ...clinicMessageValues(), ...SAMPLE }) : "";
  const seg = smsSegments(preview);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {dirty && <Badge className="bg-amber-100 text-[10px] text-amber-800">Unsaved changes</Badge>}
        <Button size="sm" className="gap-1.5 text-xs" onClick={save} disabled={!dirty}>
          <Save className="h-3.5 w-3.5" />
          Save
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* WhatsApp */}
        <Card className="shadow-xs">
          <CardHeader className="border-b bg-muted/20 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              WhatsApp
            </CardTitle>
            <CardDescription className="text-xs">
              Use your own WhatsApp number (personal or WhatsApp Business app). Messages open in the WhatsApp signed in on
              this computer with the text filled in; you press Send.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Clinic WhatsApp number</Label>
              <Input
                value={settings.whatsappNumber}
                onChange={(e) => change({ whatsappNumber: e.target.value })}
                placeholder="+880 1711-234891"
                className="h-8 font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Shown to patients as {"{{clinic_whatsapp}}"} so they can reply or message you.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Open messages in</Label>
              <div className="flex gap-1" role="radiogroup">
                {(
                  [
                    ["web", "WhatsApp Web (browser)"],
                    ["app", "WhatsApp app on this computer"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={settings.whatsappOpenWith === v}
                    onClick={() => change({ whatsappOpenWith: v })}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-semibold ${
                      settings.whatsappOpenWith === v ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <ol className="list-decimal space-y-1 rounded-lg border bg-muted/30 p-3 pl-6 text-[11px]">
              <li>
                {settings.whatsappOpenWith === "web" ? (
                  <>
                    Open{" "}
                    <a href="https://web.whatsapp.com" target="dentalos1-whatsapp" className="font-semibold text-primary hover:underline">
                      WhatsApp Web <ExternalLink className="inline h-3 w-3" />
                    </a>{" "}
                    on each clinic computer.
                  </>
                ) : (
                  "Install WhatsApp for Windows/Mac on each clinic computer."
                )}
              </li>
              <li>On your phone: WhatsApp → Settings → Linked devices → Link a device, and scan the QR code.</li>
              <li>Save here, then send yourself a test message.</li>
            </ol>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={testWhatsApp}>
              <Send className="h-3.5 w-3.5" />
              Send a test to my number
            </Button>
          </CardContent>
        </Card>

        {/* SMS + recall rules */}
        <div className="space-y-4">
          <SmsSendingCard mode={settings.smsMode} onModeChange={(m) => change({ smsMode: m })} />

          <Card className="shadow-xs">
            <CardHeader className="border-b bg-muted/20 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BellRing className="h-4 w-4 text-amber-600" />
                Reminders for planned treatment
              </CardTitle>
              <CardDescription className="text-xs">
                When a patient hasn&apos;t come back for the treatment the doctor planned, a reminder is drafted for the doctor to approve.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 text-xs sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Draft after the date, plus</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={90}
                    value={settings.recallGraceDays}
                    onChange={(e) => change({ recallGraceDays: Number(e.target.value) })}
                    className="h-8 w-20 text-xs"
                  />
                  <span>days</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Send by default</Label>
                <Select value={settings.defaultChannel} onValueChange={(v) => change({ defaultChannel: v as MessageChannel })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms" className="text-xs">SMS</SelectItem>
                    <SelectItem value="whatsapp" className="text-xs">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold">Reminder template</Label>
                <Select value={settings.recallTemplateId} onValueChange={(v) => change({ recallTemplateId: v })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recallTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold">Booking link</Label>
                <Input value={settings.bookingLink} onChange={(e) => change({ bookingLink: e.target.value })} placeholder={bookingLink() || "https://…"} className="h-8 text-xs" />
                <p className="text-[10px] text-muted-foreground">Leave blank to use your online booking page.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Templates */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-col gap-2 border-b bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Message templates</CardTitle>
            <CardDescription className="text-xs">Reminder templates are used for overdue treatment; campaign templates are presets on the SMS & Campaigns page.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => addTemplate("recall")}>
              <Plus className="h-3.5 w-3.5" />
              Reminder
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => addTemplate("campaign")}>
              <Plus className="h-3.5 w-3.5" />
              Campaign
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[220px_1fr]">
          <ul className="space-y-1">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  aria-current={t.id === selected?.id}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${t.id === selected?.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                >
                  <span className="block font-semibold">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {t.kind === "recall" ? "Reminder" : "Campaign"}
                    {!t.isActive && " · off"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <div className="space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Name</Label>
                  <Input value={selected.name} onChange={(e) => updateTemplate({ name: e.target.value })} className="h-8 text-xs" />
                </div>
                <label className="flex items-end gap-2 pb-1.5">
                  <Switch checked={selected.isActive} onCheckedChange={(on) => updateTemplate({ isActive: on })} />
                  Available to use
                </label>
              </div>
              <div className="flex flex-wrap gap-1">
                {MESSAGE_PLACEHOLDERS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    title={p.label}
                    onClick={() => insert(p.key)}
                    className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] hover:border-primary hover:text-primary"
                  >
                    {`{{${p.key}}}`}
                  </button>
                ))}
              </div>
              <Textarea ref={bodyRef} value={selected.body} onChange={(e) => updateTemplate({ body: e.target.value })} className="min-h-28 text-xs" />
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Preview</p>
                <p className="whitespace-pre-wrap">{preview}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {seg.chars} characters · {seg.segments} SMS{seg.unicode ? " (Bangla: 70 characters per SMS)" : ""}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {DEFAULT_MESSAGE_TEMPLATES.some((d) => d.id === selected.id) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => updateTemplate({ body: DEFAULT_MESSAGE_TEMPLATES.find((d) => d.id === selected.id)!.body })}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore original
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs text-destructive"
                  onClick={() => {
                    if (templates.length <= 1) return;
                    const rest = templates.filter((t) => t.id !== selected.id);
                    setTemplates(rest);
                    setSelectedId(rest[0].id);
                    setDirty(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
