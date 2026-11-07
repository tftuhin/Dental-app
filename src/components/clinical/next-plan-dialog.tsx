"use client";

import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClinicalQueuePatient, shiftISODate, toISODate } from "@/lib/clinical-flow-store";
import { getActiveCatalog } from "@/lib/procedures-catalog-store";
import { formatDisplayDate, getMessagingSettings, getRecallForVisit, saveRecallPlan } from "@/lib/messaging-store";

const QUICK = [
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 91 },
  { label: "6 months", days: 182 },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: ClinicalQueuePatient;
}

/**
 * After the prescription is released: the doctor notes the next procedure
 * and a tentative date. If the patient doesn't come back by then, a reminder
 * is drafted for the doctor to approve.
 */
export function NextPlanDialog(props: Props) {
  if (!props.open) return null;
  return <NextPlanDialogInner {...props} />;
}

function NextPlanDialogInner({ open, onOpenChange, visit }: Props) {
  const existing = useMemo(() => getRecallForVisit(visit.id), [visit.id]);
  const today = toISODate();
  const [procedure, setProcedure] = useState(existing?.procedure || "");
  const [dueDate, setDueDate] = useState(existing?.dueDate || "");
  const [note, setNote] = useState(existing?.note || "");
  const catalog = useMemo(() => getActiveCatalog().filter((c) => c.category !== "consumable"), []);
  const grace = getMessagingSettings().recallGraceDays;

  const save = () => {
    if (!procedure.trim()) {
      toast.error("Enter the next procedure.");
      return;
    }
    if (!dueDate || dueDate <= today) {
      toast.error("Choose a tentative date after today.");
      return;
    }
    saveRecallPlan({
      id: existing?.id,
      visitId: visit.id,
      patientId: visit.patientId,
      patientRecordId: visit.patientRecordId,
      patientName: visit.patient,
      phone: visit.phone,
      doctor: visit.doctor,
      procedure: procedure.trim(),
      dueDate,
      note: note.trim(),
      fromDate: visit.date || today,
    });
    toast.success(`Next visit noted: ${procedure.trim()} by ${formatDisplayDate(dueDate)}.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <CalendarClock className="h-5 w-5 text-violet-600" />
            Next treatment for {visit.patient}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Saved on the patient&apos;s record. If they haven&apos;t come back {grace > 0 ? `${grace} days after` : "by"} this date,
            a reminder is drafted for you to review and send.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Next procedure *</Label>
            <Input
              list="next-plan-procedures"
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              placeholder="e.g. Crown fitting on #36"
              className="h-8 text-xs"
              autoFocus
            />
            <datalist id="next-plan-procedures">
              {catalog.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Tentative date *</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              <Input type="date" min={shiftISODate(today, 1)} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-8 w-40 text-xs" />
              {QUICK.map((q) => (
                <Button key={q.label} type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setDueDate(shiftISODate(today, q.days))}>
                  {q.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Note for the patient&apos;s record</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why it's needed, what to prepare, anything the next doctor should know…"
              className="min-h-20 text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            {existing ? "Close" : "Skip"}
          </Button>
          <Button size="sm" className="text-xs" onClick={save}>
            Save plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
