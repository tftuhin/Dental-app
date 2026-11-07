"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
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
import { PlanItem, formatDisplayDate, getMessagingSettings, getRecallsForVisit, saveVisitPlan } from "@/lib/messaging-store";

const QUICK = [
  { label: "2 wk", days: 14 },
  { label: "1 mo", days: 30 },
  { label: "3 mo", days: 91 },
  { label: "6 mo", days: 182 },
];

type Row = PlanItem & { key: string };

const blankRow = (): Row => ({ key: `row-${Date.now()}-${Math.random()}`, procedure: "", dueDate: "", note: "" });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: ClinicalQueuePatient;
}

/**
 * After the prescription is released: the doctor plans one or more next
 * procedures, each with a tentative date. If the patient doesn't come back
 * for one by its date, a reminder is drafted for the doctor to approve.
 */
export function NextPlanDialog(props: Props) {
  if (!props.open) return null;
  return <NextPlanDialogInner {...props} />;
}

function NextPlanDialogInner({ open, onOpenChange, visit }: Props) {
  const today = toISODate();
  const existing = useMemo(() => getRecallsForVisit(visit.id), [visit.id]);
  const [rows, setRows] = useState<Row[]>(() =>
    existing.length > 0
      ? existing.map((r) => ({ key: r.id, id: r.id, procedure: r.procedure, dueDate: r.dueDate, note: r.note }))
      : [blankRow()]
  );
  const catalog = useMemo(() => getActiveCatalog().filter((c) => c.category !== "consumable"), []);
  const grace = getMessagingSettings().recallGraceDays;
  const sentIds = new Set(existing.filter((r) => r.status === "sent" || r.status === "returned").map((r) => r.id));

  const update = (key: string, patch: Partial<Row>) => setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) => setRows((list) => list.filter((r) => r.key !== key));

  const save = () => {
    const filled = rows.filter((r) => r.procedure.trim() || r.dueDate);
    for (const r of filled) {
      if (!r.procedure.trim()) {
        toast.error("Each planned item needs a procedure.");
        return;
      }
      if (!r.dueDate || (r.dueDate <= today && !sentIds.has(r.id || ""))) {
        toast.error(`Choose a date after today for ${r.procedure.trim()}.`);
        return;
      }
    }
    if (filled.length === 0 && existing.length === 0) {
      onOpenChange(false);
      return;
    }
    const saved = saveVisitPlan(
      {
        visitId: visit.id,
        patientId: visit.patientId,
        patientRecordId: visit.patientRecordId,
        patientName: visit.patient,
        phone: visit.phone,
        doctor: visit.doctor,
        fromDate: visit.date || today,
      },
      filled.map((r) => ({ id: r.id, procedure: r.procedure.trim(), dueDate: r.dueDate, note: r.note.trim() }))
    );
    toast.success(
      saved.length === 0
        ? "Next treatment plan cleared."
        : saved.length === 1
        ? `Next visit noted: ${saved[0].procedure} by ${formatDisplayDate(saved[0].dueDate)}.`
        : `${saved.length} next procedures planned, first by ${formatDisplayDate(saved[0].dueDate)}.`
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <CalendarClock className="h-5 w-5 text-violet-600" />
            Next treatment for {visit.patient}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Add each procedure the patient should have next, with its own date. They&apos;re saved on the patient&apos;s record. If the
            patient hasn&apos;t come back for one {grace > 0 ? `${grace} days after` : "by"} its date, a reminder is drafted for you to
            review and send.
          </DialogDescription>
        </DialogHeader>

        <datalist id="next-plan-procedures">
          {catalog.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>

        <ol className="space-y-3 text-xs">
          {rows.map((r, i) => {
            const locked = sentIds.has(r.id || "");
            return (
              <li key={r.key} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
                    {i + 1}. Procedure{locked ? " · reminder already sent" : ""}
                  </span>
                  {rows.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      aria-label={`Remove ${r.procedure || `procedure ${i + 1}`}`}
                      onClick={() => remove(r.key)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Procedure *</Label>
                    <Input
                      list="next-plan-procedures"
                      value={r.procedure}
                      onChange={(e) => update(r.key, { procedure: e.target.value })}
                      placeholder="e.g. Crown fitting on #36"
                      className="h-8 text-xs"
                      autoFocus={i === rows.length - 1 && !r.procedure}
                      disabled={locked}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Tentative date *</Label>
                    <Input
                      type="date"
                      min={shiftISODate(today, 1)}
                      value={r.dueDate}
                      onChange={(e) => update(r.key, { dueDate: e.target.value })}
                      className="h-8 w-40 text-xs"
                      disabled={locked}
                    />
                  </div>
                </div>
                {!locked && (
                  <div className="flex flex-wrap gap-1">
                    {QUICK.map((q) => (
                      <Button
                        key={q.label}
                        type="button"
                        size="sm"
                        variant={r.dueDate === shiftISODate(today, q.days) ? "default" : "outline"}
                        className="h-6 px-2 text-[11px]"
                        onClick={() => update(r.key, { dueDate: shiftISODate(today, q.days) })}
                      >
                        {q.label}
                      </Button>
                    ))}
                  </div>
                )}
                <Textarea
                  value={r.note}
                  onChange={(e) => update(r.key, { note: e.target.value })}
                  placeholder="Note for the patient's record (why it's needed, what to prepare…)"
                  className="min-h-14 text-xs"
                  aria-label={`Note for procedure ${i + 1}`}
                />
              </li>
            );
          })}
        </ol>

        <Button type="button" variant="outline" size="sm" className="w-fit gap-1.5 text-xs" onClick={() => setRows((l) => [...l, blankRow()])}>
          <Plus className="h-3.5 w-3.5" />
          Add another procedure
        </Button>

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            {existing.length > 0 ? "Close" : "Skip"}
          </Button>
          <Button size="sm" className="text-xs" onClick={save}>
            Save plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
