"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Filter, Users, Send, MessageCircle, MessageSquare, SkipForward, RotateCcw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AudienceFilter, AudienceRow, EMPTY_FILTER, computeAudience, knownConditions } from "@/lib/audience";
import {
  CHANNEL_LABELS,
  MESSAGE_PLACEHOLDERS,
  MessageChannel,
  clinicMessageValues,
  fillMessage,
  firstNameOf,
  formatDisplayDate,
  getMessageTemplates,
  getMessagingSettings,
  logMessages,
  smsSegments,
} from "@/lib/messaging-store";
import { getSmsGatewayStatus, isValidPhone, openSmsApp, openWhatsApp, sendSmsViaGateway } from "@/lib/message-sender";

const LAST_VISIT_OPTIONS: Array<{ value: AudienceFilter["lastVisit"]; label: string }> = [
  { value: "any", label: "Any time" },
  { value: "within", label: "Visited in the last…" },
  { value: "not_since", label: "Not visited for…" },
  { value: "never", label: "Never attended a visit" },
  { value: "range", label: "Last visit between dates" },
];

const DAY_CHOICES = [
  { days: 30, label: "1 month" },
  { days: 91, label: "3 months" },
  { days: 182, label: "6 months" },
  { days: 365, label: "1 year" },
  { days: 730, label: "2 years" },
];

function valuesFor(row: AudienceRow) {
  return {
    ...clinicMessageValues(),
    patient_name: row.patient.name,
    first_name: firstNameOf(row.patient.name),
    patient_id: row.patient.customId,
    last_visit: formatDisplayDate(row.lastVisit),
  };
}

/** SMS & Campaigns → Campaign: pick patients by filters and message them. */
export function CampaignBuilder() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<AudienceFilter>(EMPTY_FILTER);
  const [conditions] = useState(knownConditions);
  const rows = useMemo(() => computeAudience(filter), [filter]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const recipients = rows.filter((r) => !excluded.has(r.patient.id) && isValidPhone(r.patient.phone));

  const templates = useMemo(() => getMessageTemplates().filter((t) => t.isActive && t.kind === "campaign"), []);
  const [templateId, setTemplateId] = useState(templates[0]?.id || "");
  const [body, setBody] = useState(templates[0]?.body || "");
  const [campaign, setCampaign] = useState(templates[0]?.name || "Campaign");
  const [channel, setChannel] = useState<MessageChannel>(() => getMessagingSettings().defaultChannel);
  const [gateway, setGateway] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  // One-by-one sending (WhatsApp, or SMS without a gateway)
  const [queue, setQueue] = useState<AudienceRow[] | null>(null);
  const [pos, setPos] = useState(0);

  useEffect(() => {
    getSmsGatewayStatus().then((s) => setGateway(s.configured));
  }, []);

  const set = (patch: Partial<AudienceFilter>) => {
    setFilter((f) => ({ ...f, ...patch }));
    setExcluded(new Set());
  };
  const pickTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    setTemplateId(id);
    if (t) {
      setBody(t.body);
      setCampaign(t.name);
    }
  };

  const preview = recipients[0] ? fillMessage(body, valuesFor(recipients[0])) : fillMessage(body, { ...clinicMessageValues(), first_name: "Rahima", patient_name: "Rahima Begum" });
  const seg = smsSegments(preview);
  const by = session?.user?.name || undefined;

  const start = async () => {
    if (!body.trim()) {
      toast.error("Write the message first.");
      return;
    }
    if (recipients.length === 0) {
      toast.error("No patients with a phone number match these filters.");
      return;
    }
    if (channel === "sms" && gateway) {
      if (!confirm(`Send this SMS to ${recipients.length} patient${recipients.length === 1 ? "" : "s"} now?`)) return;
      setSending(true);
      try {
        let sent = 0;
        for (let i = 0; i < recipients.length; i += 200) {
          const chunk = recipients.slice(i, i + 200);
          const results = await sendSmsViaGateway(chunk.map((r) => ({ to: r.patient.phone, body: fillMessage(body, valuesFor(r)) })));
          logMessages(
            chunk.map((r, j) => ({
              patientId: r.patient.customId,
              patientName: r.patient.name,
              phone: r.patient.phone,
              channel,
              body: fillMessage(body, valuesFor(r)),
              kind: "campaign" as const,
              campaign,
              status: results[j]?.ok ? ("sent" as const) : ("failed" as const),
              error: results[j]?.error,
              by,
            }))
          );
          sent += results.filter((x) => x.ok).length;
        }
        toast.success(`${sent} of ${recipients.length} SMS sent.`);
      } catch (err) {
        toast.error(`SMS not sent: ${(err as Error).message}`);
      } finally {
        setSending(false);
      }
      return;
    }
    setQueue(recipients);
    setPos(0);
  };

  const current = queue?.[pos];
  const openCurrent = () => {
    if (!current || !queue) return;
    const text = fillMessage(body, valuesFor(current));
    if (channel === "whatsapp") {
      if (!openWhatsApp(current.patient.phone, text)) {
        toast.error("The browser blocked WhatsApp. Allow pop-ups for this site.");
        return;
      }
    } else openSmsApp(current.patient.phone, text);
    logMessages([
      {
        patientId: current.patient.customId,
        patientName: current.patient.name,
        phone: current.patient.phone,
        channel,
        body: text,
        kind: "campaign",
        campaign,
        status: "handed_over",
        by,
      },
    ]);
    setPos((p) => p + 1);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      {/* Filters */}
      <Card className="h-fit shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-4 py-3">
          <CardTitle className="flex items-center justify-between gap-2 text-xs font-bold">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Choose patients
            </span>
            <Button size="sm" variant="ghost" className="h-6 gap-1 text-[11px]" onClick={() => set(EMPTY_FILTER)}>
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 text-xs">
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold">Last visit</Label>
            <Select value={filter.lastVisit} onValueChange={(v) => set({ lastVisit: v as AudienceFilter["lastVisit"] })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAST_VISIT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filter.lastVisit === "within" || filter.lastVisit === "not_since") && (
              <div className="flex flex-wrap gap-1 pt-1">
                {DAY_CHOICES.map((d) => (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => set({ days: d.days })}
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${filter.days === d.days ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
            {filter.lastVisit === "range" && (
              <div className="grid grid-cols-2 gap-1 pt-1">
                <Input type="date" value={filter.from} onChange={(e) => set({ from: e.target.value })} className="h-8 text-xs" aria-label="From" />
                <Input type="date" value={filter.to} onChange={(e) => set({ to: e.target.value })} className="h-8 text-xs" aria-label="To" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-semibold">Health issues (any of)</Label>
            {conditions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No medical conditions or allergies recorded yet.</p>
            ) : (
              <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                {conditions.map((c) => {
                  const on = filter.conditions.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ conditions: on ? filter.conditions.filter((x) => x !== c) : [...filter.conditions, c] })}
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-semibold">Treatment or diagnosis contains</Label>
            <Input value={filter.treatment} onChange={(e) => set({ treatment: e.target.value })} placeholder="e.g. root canal, scaling" className="h-8 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Gender</Label>
              <Select value={filter.gender} onValueChange={(v) => set({ gender: v as AudienceFilter["gender"] })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any" className="text-xs">Any</SelectItem>
                  <SelectItem value="Female" className="text-xs">Female</SelectItem>
                  <SelectItem value="Male" className="text-xs">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Age</Label>
              <div className="flex gap-1">
                <Input type="number" min={0} value={filter.ageMin} onChange={(e) => set({ ageMin: e.target.value })} placeholder="from" className="h-8 px-2 text-xs" />
                <Input type="number" min={0} value={filter.ageMax} onChange={(e) => set({ ageMax: e.target.value })} placeholder="to" className="h-8 px-2 text-xs" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-semibold">Patient status</Label>
            <Select value={filter.status} onValueChange={(v) => set({ status: v as AudienceFilter["status"] })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any" className="text-xs">Any</SelectItem>
                <SelectItem value="new" className="text-xs">New</SelectItem>
                <SelectItem value="in_treatment" className="text-xs">In treatment</SelectItem>
                <SelectItem value="active" className="text-xs">Active</SelectItem>
                <SelectItem value="recall_due" className="text-xs">Recall due</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            {(
              [
                ["hasDues", "Has unpaid dues"],
                ["birthdayThisMonth", "Birthday this month"],
                ["pendingRecall", "Planned treatment not done yet"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" className="h-3.5 w-3.5" checked={filter[key]} onChange={(e) => set({ [key]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-semibold">Name, ID or phone</Label>
            <Input value={filter.search} onChange={(e) => set({ search: e.target.value })} className="h-8 text-xs" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Recipients */}
        <Card className="shadow-xs">
          <CardHeader className="border-b bg-muted/20 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-xs font-bold">
              <Users className="h-4 w-4 text-primary" />
              {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
              {rows.length !== recipients.length && (
                <span className="font-normal text-muted-foreground">
                  ({rows.length} matched; {rows.length - recipients.length} unticked or without a valid phone)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto p-0">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background text-[10px] uppercase text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-1.5">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      className="h-3.5 w-3.5"
                      checked={rows.length > 0 && excluded.size === 0}
                      onChange={(e) => setExcluded(e.target.checked ? new Set() : new Set(rows.map((r) => r.patient.id)))}
                    />
                  </th>
                  <th className="px-2 py-1.5 text-left">Patient</th>
                  <th className="px-2 py-1.5 text-left">Phone</th>
                  <th className="px-2 py-1.5 text-left">Last visit</th>
                  <th className="px-2 py-1.5 text-left">Health issues</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      No patients match these filters.
                    </td>
                  </tr>
                )}
                {rows.slice(0, 500).map((r) => {
                  const valid = isValidPhone(r.patient.phone);
                  const on = !excluded.has(r.patient.id) && valid;
                  return (
                    <tr key={r.patient.id} className="border-t">
                      <td className="px-3 py-1.5">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5"
                          disabled={!valid}
                          checked={on}
                          aria-label={`Include ${r.patient.name}`}
                          onChange={() =>
                            setExcluded((s) => {
                              const n = new Set(s);
                              if (n.has(r.patient.id)) n.delete(r.patient.id);
                              else n.add(r.patient.id);
                              return n;
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="font-semibold">{r.patient.name}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">{r.patient.customId}</span>
                      </td>
                      <td className={`px-2 py-1.5 font-mono text-[11px] ${valid ? "" : "text-destructive"}`}>{r.patient.phone || "—"}</td>
                      <td className="px-2 py-1.5">{r.lastVisit ? formatDisplayDate(r.lastVisit) : "—"}</td>
                      <td className="px-2 py-1.5 text-[11px] text-muted-foreground">
                        {[...(r.patient.medicalConditions || []), ...(r.patient.allergies || [])].join(", ") || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > 500 && <p className="p-2 text-center text-[11px] text-muted-foreground">Showing the first 500; all {recipients.length} are included.</p>}
          </CardContent>
        </Card>

        {/* Message */}
        <Card className="shadow-xs">
          <CardHeader className="border-b bg-muted/20 px-4 py-3">
            <CardTitle className="text-xs font-bold">Message</CardTitle>
            <CardDescription className="text-[11px]">Pick a preset (edit them in Settings → Messages) and adjust the wording for this campaign.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 text-xs">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Preset</Label>
                <Select value={templateId} onValueChange={pickTemplate}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Choose a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Campaign name (for the log)</Label>
                <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Send by</Label>
                <div className="flex gap-1" role="radiogroup">
                  {(["sms", "whatsapp"] as MessageChannel[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={channel === c}
                      onClick={() => setChannel(c)}
                      className={`flex h-8 flex-1 items-center justify-center gap-1 rounded-md border text-[11px] font-semibold ${
                        channel === c ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                      }`}
                    >
                      {c === "sms" ? <MessageSquare className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                      {CHANNEL_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-24 text-xs" />
            <div className="flex flex-wrap gap-1">
              {MESSAGE_PLACEHOLDERS.filter((p) => !["procedure", "due_date"].includes(p.key)).map((p) => (
                <button
                  key={p.key}
                  type="button"
                  title={p.label}
                  onClick={() => setBody((b) => `${b}{{${p.key}}}`)}
                  className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] hover:border-primary hover:text-primary"
                >
                  {`{{${p.key}}}`}
                </button>
              ))}
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
                Preview{recipients[0] ? ` for ${recipients[0].patient.name}` : ""}
              </p>
              <p className="whitespace-pre-wrap">{preview}</p>
              {channel === "sms" && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {seg.chars} characters · {seg.segments} SMS each{seg.unicode ? " (Bangla text uses 70 characters per SMS)" : ""}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                {channel === "whatsapp"
                  ? "Opens each chat in your clinic's WhatsApp with the message filled in; press Send in WhatsApp, then come back for the next one."
                  : gateway
                  ? "Sent automatically through your SMS gateway."
                  : gateway === false
                  ? "No SMS gateway is set up, so each message opens in this device's SMS app one by one."
                  : ""}
              </p>
              <Button size="sm" className="gap-1.5 text-xs" onClick={start} disabled={sending || recipients.length === 0}>
                <Send className="h-3.5 w-3.5" />
                {sending ? "Sending…" : `Send to ${recipients.length}`}
              </Button>
            </div>

            {queue && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                {current ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <b>
                        {pos + 1} of {queue.length}:
                      </b>{" "}
                      {current.patient.name} · <span className="font-mono">{current.patient.phone}</span>
                    </span>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => setPos((p) => p + 1)}>
                        <SkipForward className="h-3 w-3" />
                        Skip
                      </Button>
                      <Button size="sm" className="h-7 gap-1 text-[11px]" onClick={openCurrent}>
                        {channel === "whatsapp" ? <MessageCircle className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                        Open {CHANNEL_LABELS[channel]}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Done: went through all {queue.length} patients.
                    </span>
                    <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setQueue(null)}>
                      Close
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
