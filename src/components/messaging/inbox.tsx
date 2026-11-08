"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Inbox as InboxIcon, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  INBOX_EVENT,
  InboxMessage,
  MESSAGE_LOG_EVENT,
  getInbox,
  getMessageLog,
  getMessagingSettings,
  logMessages,
  markInboxRead,
  phoneKey,
} from "@/lib/messaging-store";
import { getAllPatients, PatientProfile } from "@/lib/patients-store";
import { sendOne } from "@/lib/message-sender";
import { toastWithLink } from "@/lib/notifications-store";

interface ThreadItem {
  id: string;
  direction: "in" | "out";
  body: string;
  at: string;
  status?: string;
}

interface Conversation {
  key: string;
  phone: string;
  patient?: PatientProfile;
  items: ThreadItem[];
  unread: number;
  last: string;
}

function useInboxData() {
  const [inbox, setInbox] = useState(getInbox);
  const [log, setLog] = useState(getMessageLog);
  useEffect(() => {
    const loadIn = () => setInbox(getInbox());
    const loadLog = () => setLog(getMessageLog());
    window.addEventListener(INBOX_EVENT, loadIn);
    window.addEventListener(MESSAGE_LOG_EVENT, loadLog);
    return () => {
      window.removeEventListener(INBOX_EVENT, loadIn);
      window.removeEventListener(MESSAGE_LOG_EVENT, loadLog);
    };
  }, []);
  return { inbox, log };
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const today = new Date().toDateString() === d.toDateString();
  return today ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** SMS & Campaigns → Inbox: patients' SMS replies, as conversations with what the clinic sent them. */
export function SmsInbox() {
  const { data: session } = useSession();
  const { inbox, log } = useInboxData();
  const [patients] = useState(getAllPatients);
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const conversations = useMemo(() => {
    const byPhone = new Map<string, PatientProfile>();
    for (const p of patients) for (const ph of [p.phone, p.phone2 || ""]) if (phoneKey(ph)) byPhone.set(phoneKey(ph), p);
    const map = new Map<string, Conversation>();
    const get = (phone: string) => {
      const key = phoneKey(phone);
      let c = map.get(key);
      if (!c) {
        c = { key, phone, patient: byPhone.get(key), items: [], unread: 0, last: "" };
        map.set(key, c);
      }
      return c;
    };
    for (const m of inbox) {
      if (!phoneKey(m.from)) continue;
      const c = get(m.from);
      c.items.push({ id: m.id, direction: "in", body: m.body, at: m.receivedAt });
      if (!m.read) c.unread++;
    }
    // Only numbers that have written to the clinic get a conversation; show what was sent to them too
    for (const m of log) {
      if (m.channel !== "sms") continue;
      const c = map.get(phoneKey(m.phone));
      if (c) c.items.push({ id: m.id, direction: "out", body: m.body, at: m.sentAt, status: m.status });
    }
    for (const c of map.values()) {
      c.items.sort((a, b) => a.at.localeCompare(b.at));
      c.last = c.items[c.items.length - 1]?.at || "";
    }
    return [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
  }, [inbox, log, patients]);

  const current = conversations.find((c) => c.key === selected) || null;

  // Opening a conversation marks its messages read
  useEffect(() => {
    if (!current) return;
    markInboxRead(inbox.filter((m) => !m.read && phoneKey(m.from) === current.key).map((m) => m.id));
    endRef.current?.scrollIntoView({ block: "end" });
  }, [current, inbox]);

  const send = async () => {
    if (!current || !reply.trim()) return;
    setSending(true);
    const outcome = await sendOne(current.phone, reply.trim(), "sms");
    setSending(false);
    logMessages([
      {
        patientId: current.patient?.customId,
        patientName: current.patient?.name || current.phone,
        phone: current.phone,
        channel: "sms",
        body: reply.trim(),
        kind: "direct",
        status: outcome.status,
        error: outcome.error,
        by: session?.user?.name || undefined,
      },
    ]);
    if (outcome.status === "failed") toast.error(`Not sent: ${outcome.error}`);
    else setReply("");
  };

  const androidMode = getMessagingSettings().smsMode === "android";

  if (conversations.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center text-xs text-muted-foreground">
        <InboxIcon className="mx-auto mb-2 h-6 w-6" />
        <p className="font-semibold text-foreground">No replies yet.</p>
        <p className="mt-1">
          {androidMode
            ? "SMS that patients send to the clinic's Android phone will appear here."
            : "Replies arrive here when SMS are sent from the clinic's Android phone."}{" "}
          {!androidMode && (
            <Link href="/settings?tab=messages" className="text-primary hover:underline">
              Set it up in Settings → Messages
            </Link>
          )}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-4 py-3">
          <CardTitle className="text-xs font-bold">Conversations ({conversations.length})</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[60vh] overflow-y-auto p-0">
          <ul>
            {conversations.map((c) => {
              const lastItem = c.items[c.items.length - 1];
              return (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => setSelected(c.key)}
                    aria-current={selected === c.key}
                    className={`w-full border-b px-4 py-2.5 text-left text-xs hover:bg-muted/50 ${selected === c.key ? "bg-primary/5" : ""}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate ${c.unread ? "font-bold" : "font-semibold"}`}>{c.patient?.name || c.phone}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{formatWhen(c.last)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-muted-foreground">
                        {lastItem?.direction === "out" ? "You: " : ""}
                        {lastItem?.body}
                      </span>
                      {c.unread > 0 && <Badge className="h-4 shrink-0 bg-primary px-1.5 text-[10px]">{c.unread}</Badge>}
                    </span>
                    {!c.patient && <span className="text-[10px] text-amber-700">Unknown number</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card className="flex min-h-[60vh] flex-col shadow-xs">
        {current ? (
          <>
            <CardHeader className="border-b bg-muted/20 px-4 py-3">
              <CardTitle className="flex items-center justify-between gap-2 text-xs font-bold">
                <span>
                  {current.patient ? (
                    <Link href={`/patients/${current.patient.id}`} className="hover:underline">
                      {current.patient.name} <span className="font-mono font-normal text-muted-foreground">{current.patient.customId}</span>
                    </Link>
                  ) : (
                    "Unknown number"
                  )}
                </span>
                <span className="font-mono font-normal">{current.phone}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 overflow-y-auto p-4">
              {current.items.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                      m.direction === "out" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`mt-0.5 text-[10px] ${m.direction === "out" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.at).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}
                      {m.status === "failed" ? " · failed" : ""}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </CardContent>
            <div className="flex items-end gap-2 border-t p-3">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void send();
                }}
                placeholder="Write a reply… (Ctrl+Enter to send)"
                className="min-h-14 flex-1 text-xs"
                aria-label="Reply"
              />
              <Button size="sm" className="gap-1.5 text-xs" onClick={send} disabled={sending || !reply.trim()}>
                <Send className="h-3.5 w-3.5" />
                Send SMS
              </Button>
            </div>
          </>
        ) : (
          <div className="m-auto p-8 text-center text-xs text-muted-foreground">
            <Smartphone className="mx-auto mb-2 h-6 w-6" />
            Choose a conversation.
          </div>
        )}
      </Card>
    </div>
  );
}

/** Unread replies, for the tab badge. */
export function useUnreadInbox(): number {
  const [n, setN] = useState(() => getInbox().filter((m) => !m.read).length);
  useEffect(() => {
    const load = () => setN(getInbox().filter((m) => !m.read).length);
    window.addEventListener(INBOX_EVENT, load);
    return () => window.removeEventListener(INBOX_EVENT, load);
  }, []);
  return n;
}

/** Runs in the app shell: announces SMS replies as they arrive. */
export function InboxWatch() {
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    seen.current = new Set(getInbox().map((m) => m.id));
    const onChange = () => {
      const fresh: InboxMessage[] = getInbox().filter((m) => !m.read && !seen.current!.has(m.id));
      for (const m of getInbox()) seen.current!.add(m.id);
      if (fresh.length === 0) return;
      const patients = getAllPatients();
      const who = (from: string) => patients.find((p) => phoneKey(p.phone) === phoneKey(from))?.name || from;
      toastWithLink("/sms?tab=inbox", () =>
        toast.info(fresh.length === 1 ? `New SMS from ${who(fresh[0].from)}: ${fresh[0].body.slice(0, 80)}` : `${fresh.length} new SMS replies`)
      );
    };
    window.addEventListener(INBOX_EVENT, onChange);
    return () => window.removeEventListener(INBOX_EVENT, onChange);
  }, []);
  return null;
}
