"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck, Clock, KeyRound, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AccessRequest,
  ACCESS_REQUESTS_EVENT,
  getAccessRequests,
  myRequestFor,
  requestAccess,
  requestsForMe,
  setRequestStatus,
  useStaffRole,
} from "@/lib/access-store";
import { announceOnce } from "@/lib/notifications-store";

export interface PrivatePatientRef {
  patientKey: string;
  patientRecordId?: string;
  patientName: string;
  owners: string[];
}

/** Ask the treating doctor for access to one patient. */
export function RequestAccessDialog({
  patient,
  open,
  onOpenChange,
}: {
  patient: PrivatePatientRef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const me = useStaffRole();
  const [reason, setReason] = useState("");
  if (!patient) return null;
  const existing = myRequestFor([patient.patientKey, patient.patientRecordId], me.email);
  const owners = patient.owners.length > 0 ? patient.owners.join(", ") : "the treating doctor";

  const send = () => {
    requestAccess({ ...patient, reason, me });
    toast.success(`Request sent to ${owners}. You'll get access once they approve it.`);
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Lock className="h-5 w-5 text-amber-600" />
            {patient.patientName} is {owners}&apos;s patient
          </DialogTitle>
          <DialogDescription className="text-xs">
            Patient privacy is on in this clinic. To see this patient&apos;s clinical details, ask {owners} for access. Once given, it lasts
            until they take it back.
          </DialogDescription>
        </DialogHeader>
        {existing?.status === "pending" ? (
          <p className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            <Clock className="h-4 w-4" />
            You asked on {new Date(existing.createdAt).toLocaleDateString("en-GB")}. Waiting for {existing.ownerNames.join(", ") || owners}.
          </p>
        ) : (
          <div className="space-y-1.5">
            {existing && (existing.status === "denied" || existing.status === "revoked") && (
              <p className="text-xs text-muted-foreground">
                Your last request was {existing.status === "denied" ? "declined" : "withdrawn"}. You can ask again.
              </p>
            )}
            <label className="text-xs font-semibold" htmlFor="access-reason">
              Why do you need access? (optional)
            </label>
            <Textarea
              id="access-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Covering today's appointment while Dr. B is away"
              className="min-h-16 text-xs"
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {existing?.status !== "pending" && (
            <Button size="sm" className="gap-1.5 text-xs" onClick={send}>
              <KeyRound className="h-3.5 w-3.5" />
              Request access
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Shown in place of clinical details for another doctor's patient. */
export function PrivatePatientNotice({ patient }: { patient: PrivatePatientRef }) {
  const me = useStaffRole();
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  useEffect(() => {
    const on = () => force((n) => n + 1);
    window.addEventListener(ACCESS_REQUESTS_EVENT, on);
    return () => window.removeEventListener(ACCESS_REQUESTS_EVENT, on);
  }, []);
  const existing = myRequestFor([patient.patientKey, patient.patientRecordId], me.email);
  const owners = patient.owners.join(", ") || "another doctor";

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-8 text-center dark:bg-amber-950/20">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Lock className="h-6 w-6" />
      </span>
      <div>
        <p className="font-semibold">Clinical details are private to {owners}</p>
        <p className="mt-1 text-sm text-muted-foreground">Patient privacy is on in this clinic. You can see contact details only.</p>
      </div>
      {existing?.status === "pending" ? (
        <Badge className="gap-1 bg-amber-100 text-amber-800">
          <Clock className="h-3 w-3" />
          Request sent, waiting for approval
        </Badge>
      ) : (
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <KeyRound className="h-4 w-4" />
          Request access
        </Button>
      )}
      <RequestAccessDialog patient={patient} open={open} onOpenChange={setOpen} />
    </div>
  );
}

/** One request, with approve / decline / revoke for the treating doctor. */
export function AccessRequestRow({ r, mode }: { r: AccessRequest; mode: "incoming" | "outgoing" }) {
  const me = useStaffRole();
  const statusTone: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    denied: "bg-red-100 text-red-800",
    revoked: "bg-slate-100 text-slate-700",
    cancelled: "bg-slate-100 text-slate-500",
  };
  const label: Record<string, string> = { pending: "Waiting", approved: "Access given", denied: "Declined", revoked: "Revoked", cancelled: "Cancelled" };
  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">
          {mode === "incoming" ? r.requesterName : `To ${r.ownerNames.join(", ") || "treating doctor"}`} · {r.patientName}{" "}
          <span className="font-mono font-normal text-muted-foreground">{r.patientKey}</span>
        </p>
        {r.reason && <p className="text-muted-foreground">“{r.reason}”</p>}
        <p className="text-[11px] text-muted-foreground">
          Asked {new Date(r.createdAt).toLocaleDateString("en-GB")}
          {r.decidedAt ? ` · ${label[r.status].toLowerCase()} ${new Date(r.decidedAt).toLocaleDateString("en-GB")}` : ""}
          {r.decidedBy ? ` by ${r.decidedBy}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <Badge className={`text-[10px] ${statusTone[r.status]}`}>{label[r.status]}</Badge>
        {mode === "incoming" && r.status === "pending" && (
          <>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => setRequestStatus(r.id, "denied", me.name)}>
              <X className="h-3 w-3" />
              Decline
            </Button>
            <Button size="sm" className="h-7 gap-1 text-[11px]" onClick={() => setRequestStatus(r.id, "approved", me.name)}>
              <ShieldCheck className="h-3 w-3" />
              Give access
            </Button>
          </>
        )}
        {mode === "incoming" && r.status === "approved" && (
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setRequestStatus(r.id, "revoked", me.name)}>
            Revoke
          </Button>
        )}
        {mode === "incoming" && (r.status === "denied" || r.status === "revoked") && (
          <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setRequestStatus(r.id, "approved", me.name)}>
            Give access
          </Button>
        )}
        {mode === "outgoing" && r.status === "pending" && (
          <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setRequestStatus(r.id, "cancelled", me.name)}>
            Cancel
          </Button>
        )}
      </div>
    </li>
  );
}

/**
 * In the app shell: after a doctor signs in, shows access requests waiting
 * for them (once per sign-in), and tells requesters when they are answered.
 */
export function AccessWatch() {
  const me = useStaffRole();
  const [open, setOpen] = useState(false);
  const [waiting, setWaiting] = useState<AccessRequest[]>([]);
  const known = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    if (!me.isDoctor || !me.email) return;
    const check = (initial: boolean) => {
      const mine = requestsForMe(me).filter((r) => r.status === "pending");
      setWaiting(mine);
      // Answers to my own requests
      const all = getAccessRequests();
      if (known.current && !initial) {
        for (const r of all) {
          if (r.requesterEmail.toLowerCase() !== me.email) continue;
          const before = known.current.get(r.id);
          if (before && before !== r.status && announceOnce(`access:${r.id}:${r.status}`)) {
            if (r.status === "approved") toast.success(`${r.decidedBy || "The doctor"} gave you access to ${r.patientName}.`);
            if (r.status === "denied") toast.info(`${r.decidedBy || "The doctor"} declined access to ${r.patientName}.`);
            if (r.status === "revoked") toast.info(`Your access to ${r.patientName} was withdrawn.`);
          }
        }
      }
      known.current = new Map(all.map((r) => [r.id, r.status]));
      // Open only when there's a request this doctor hasn't been shown yet
      const fresh = mine.filter((r) => announceOnce(`access-prompt:${me.email}:${r.id}`));
      if (fresh.length > 0) setOpen(true);
    };
    const t = setTimeout(() => check(true), 2000);
    const onChange = () => check(false);
    window.addEventListener(ACCESS_REQUESTS_EVENT, onChange);
    return () => {
      clearTimeout(t);
      window.removeEventListener(ACCESS_REQUESTS_EVENT, onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.email, me.isDoctor]);

  return (
    <Dialog open={open && waiting.length > 0} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <KeyRound className="h-5 w-5 text-amber-600" />
            {waiting.length} doctor{waiting.length === 1 ? "" : "s"} asking to see your patients
          </DialogTitle>
          <DialogDescription className="text-xs">
            Giving access lets that doctor see the patient&apos;s full record until you revoke it in Settings → Patient Privacy.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {waiting.map((r) => (
            <AccessRequestRow key={r.id} r={r} mode="incoming" />
          ))}
        </ul>
        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setOpen(false)}>
            Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
