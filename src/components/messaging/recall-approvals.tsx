"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BellRing, Send, X, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CHANNEL_LABELS,
  MessageChannel,
  RECALLS_EVENT,
  Recall,
  formatDisplayDate,
  logMessages,
  recallsAwaitingFor,
  refreshRecalls,
  smsSegments,
  updateRecall,
} from "@/lib/messaging-store";
import { sendOne } from "@/lib/message-sender";
import { announceOnce } from "@/lib/notifications-store";
import { toISODate } from "@/lib/clinical-flow-store";

function daysOverdue(due: string): number {
  const ms = new Date(`${toISODate()}T00:00:00`).getTime() - new Date(`${due}T00:00:00`).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function RecallCard({ recall, canApprove }: { recall: Recall; canApprove: boolean }) {
  const { data: session } = useSession();
  const [body, setBody] = useState(recall.draft?.body || "");
  const [channel, setChannel] = useState<MessageChannel>(recall.draft?.channel || "sms");
  const [busy, setBusy] = useState(false);
  const seg = smsSegments(body);

  const approve = async () => {
    if (!body.trim()) {
      toast.error("The message is empty.");
      return;
    }
    setBusy(true);
    const outcome = await sendOne(recall.phone, body.trim(), channel);
    setBusy(false);
    logMessages([
      {
        patientId: recall.patientId,
        patientName: recall.patientName,
        phone: recall.phone,
        channel,
        body: body.trim(),
        kind: "recall",
        status: outcome.status,
        error: outcome.error,
        by: session?.user?.name || undefined,
      },
    ]);
    if (outcome.status === "failed") {
      toast.error(`Not sent: ${outcome.error}`);
      return;
    }
    updateRecall(recall.id, {
      status: "sent",
      sentAt: new Date().toISOString(),
      sentBy: session?.user?.name || undefined,
      draft: { body: body.trim(), channel, draftedAt: recall.draft?.draftedAt || new Date().toISOString() },
    });
    toast.success(
      outcome.status === "sent"
        ? `Reminder sent to ${recall.patientName}.`
        : `${CHANNEL_LABELS[channel]} opened with the message for ${recall.patientName}. Press Send there.`
    );
  };

  const dismiss = () => {
    updateRecall(recall.id, { status: "dismissed", closedReason: "Dismissed by doctor", draft: undefined });
    toast.info(`Reminder for ${recall.patientName} dismissed.`);
  };

  return (
    <li className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {recall.patientName} <span className="font-mono text-[11px] font-normal text-muted-foreground">{recall.patientId}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            <Phone className="mr-1 inline h-3 w-3" />
            {recall.phone || "No phone"} · {recall.doctor}
          </p>
        </div>
        <Badge className="bg-amber-100 text-[10px] text-amber-800">{daysOverdue(recall.dueDate)} days overdue</Badge>
      </div>
      <p className="text-xs">
        <b>Planned:</b> {recall.procedure} by {formatDisplayDate(recall.dueDate)}
        {recall.note && <span className="block text-muted-foreground">Note: {recall.note}</span>}
      </p>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-20 text-xs"
        disabled={!canApprove}
        aria-label={`Reminder message for ${recall.patientName}`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Send by">
          {(["sms", "whatsapp"] as MessageChannel[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={channel === c}
              disabled={!canApprove}
              onClick={() => setChannel(c)}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${
                channel === c ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              {c === "sms" ? <MessageSquare className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
              {CHANNEL_LABELS[c]}
            </button>
          ))}
          {channel === "sms" && (
            <span className="ml-1 text-[10px] text-muted-foreground">
              {seg.chars} chars · {seg.segments} SMS{seg.unicode ? " (Bangla)" : ""}
            </span>
          )}
        </div>
        {canApprove ? (
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={dismiss} disabled={busy}>
              <X className="h-3 w-3" />
              Dismiss
            </Button>
            <Button size="sm" className="h-7 gap-1 text-[11px]" onClick={approve} disabled={busy}>
              <Send className="h-3 w-3" />
              Approve & send
            </Button>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">Waiting for the doctor&apos;s approval</span>
        )}
      </div>
    </li>
  );
}

/** Reminders drafted for overdue next-visit plans. Doctors approve; reception can only view. */
export function RecallApprovalList({ recalls, canApprove }: { recalls: Recall[]; canApprove: boolean }) {
  if (recalls.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">No reminders waiting for approval.</p>;
  }
  return (
    <ul className="space-y-3">
      {recalls.map((r) => (
        <RecallCard key={r.id} recall={r} canApprove={canApprove} />
      ))}
    </ul>
  );
}

/**
 * Runs in the app shell: checks recalls every few minutes, and after the
 * doctor signs in shows the reminders waiting for their approval (once per sign-in).
 */
export function RecallWatch() {
  const { data: session } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<Recall[]>([]);

  useEffect(() => {
    // Front desk neither drafts nor approves reminders
    if (!user || user.role === "receptionist") return;
    const who = user.id || user.email;
    const check = () => {
      refreshRecalls();
      const waiting = recallsAwaitingFor(user);
      setMine(waiting);
      // Open only when there's a reminder this doctor hasn't been shown yet
      const fresh = waiting.filter((r) => announceOnce(`recall-prompt:${who}:${r.id}`));
      if (fresh.length > 0) setOpen(true);
    };
    const t = setTimeout(check, 1500);
    const iv = setInterval(check, 10 * 60_000);
    const onChange = () => setMine(recallsAwaitingFor(user));
    window.addEventListener(RECALLS_EVENT, onChange);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
      window.removeEventListener(RECALLS_EVENT, onChange);
    };
  }, [user]);

  return (
    <Dialog open={open && mine.length > 0} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <BellRing className="h-5 w-5 text-amber-600" />
            {mine.length} patient reminder{mine.length === 1 ? "" : "s"} to review
          </DialogTitle>
          <DialogDescription className="text-xs">
            These patients haven&apos;t come back for the treatment you planned. Check each message, then approve to send it.
          </DialogDescription>
        </DialogHeader>
        <RecallApprovalList recalls={mine} canApprove />
        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setOpen(false)}>
            Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
