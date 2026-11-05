"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, Printer, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ClinicalQueuePatient, NO_SHOW_AFTER_MINUTES, appointmentStart } from "@/lib/clinical-flow-store";
import { buildReceiptFromInvoice, checkInVisit, isPrepaidConsultationOn } from "@/lib/billing-store";
import { getActiveCatalog, getDefaultConsultationItem } from "@/lib/procedures-catalog-store";
import { printReceiptWindow } from "@/lib/receipt-pdf-generator";
import { formatBDT } from "@/lib/currency";
import { PAYMENT_METHODS } from "@/components/billing/due-payments";

interface CheckInDialogProps {
  visit: ClinicalQueuePatient | null;
  onOpenChange: (open: boolean) => void;
  onCheckedIn?: (visit: ClinicalQueuePatient) => void;
}

/**
 * Reception check-in: the patient confirms they've arrived. When prepaid
 * consultation is on, the consultation fee is collected here with a receipt.
 */
export function CheckInDialog(props: CheckInDialogProps) {
  // Remount per visit so the form always starts fresh
  return <CheckInDialogInner key={props.visit?.id || "none"} {...props} />;
}

function lateness(visit: ClinicalQueuePatient): string | null {
  const start = appointmentStart(visit);
  if (!start) return null;
  const mins = Math.round((Date.now() - start.getTime()) / 60_000);
  if (mins <= 5) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const left = NO_SHOW_AFTER_MINUTES - mins;
  return `${h > 0 ? `${h} h ` : ""}${m} min late${left > 0 && left <= 60 ? ` · becomes a no-show in ${left} min` : ""}`;
}

function CheckInDialogInner({ visit, onOpenChange, onCheckedIn }: CheckInDialogProps) {
  const [prepaid] = useState(() => isPrepaidConsultationOn());
  const [options] = useState(() => getActiveCatalog("consultation"));
  const [itemId, setItemId] = useState(() => getDefaultConsultationItem(!!visit?.isFollowUp)?.id || options[0]?.id || "");
  const item = options.find((o) => o.id === itemId);
  const [amount, setAmount] = useState<number | "">(() => item?.price ?? "");
  const [method, setMethod] = useState("cash");
  const [trxId, setTrxId] = useState("");
  const [arrived, setArrived] = useState(false);

  if (!visit) return null;
  const amountNum = Number(amount) || 0;
  const needsTrx = method === "bkash" || method === "nagad";
  const late = lateness(visit);
  const canSubmit = arrived && (!prepaid || (amountNum > 0 && (!needsTrx || trxId.trim().length > 0)));

  const chooseItem = (id: string) => {
    setItemId(id);
    const next = options.find((o) => o.id === id);
    if (next) setAmount(next.price);
  };

  const submit = () => {
    if (!canSubmit) return;
    const result = checkInVisit(
      visit.id,
      prepaid
        ? {
            code: item?.code || "D9310",
            name: item?.name || "Consultation Fee",
            amount: amountNum,
            method,
            trxId,
          }
        : undefined
    );
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    const saved = result.visit;
    if (saved.checkInInvoice) {
      const receipt = buildReceiptFromInvoice(saved, undefined, saved.checkInInvoice);
      if (receipt) printReceiptWindow(receipt);
      toast.success(`${saved.patient} checked in. Consultation fee ${formatBDT(saved.checkInInvoice.total)} received.`);
    } else {
      toast.success(`${saved.patient} checked in.`);
    }
    onCheckedIn?.(saved);
    onOpenChange(false);
  };

  return (
    <Dialog open={!!visit} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Check in {visit.patient}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {visit.token} · Serial #{visit.fifoSerial} · {visit.patientId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {visit.date} at {visit.time} · {visit.doctor.split(",")[0]}
            </p>
            <p className="text-muted-foreground">{visit.service}</p>
            {late && (
              <p className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                {late}
              </p>
            )}
          </div>

          {prepaid ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">Consultation fee</Label>
                <div className="grid grid-cols-[1fr_110px] gap-2 mt-1">
                  <Select value={itemId} onValueChange={chooseItem}>
                    <SelectTrigger className="h-8 text-xs" aria-label="Consultation type">
                      <SelectValue placeholder="Consultation" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((o) => (
                        <SelectItem key={o.id} value={o.id} className="text-xs">
                          {o.name} · {formatBDT(o.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="h-8 text-xs"
                    aria-label="Fee amount"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Paid by</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="h-8 text-xs mt-1" aria-label="Payment method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value} className="text-xs">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {needsTrx && (
                  <div>
                    <Label className="text-xs font-semibold">Transaction ID *</Label>
                    <Input
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="e.g. 9BX4K2L7QP"
                      className="h-8 text-xs mt-1 font-mono"
                    />
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">
                Procedures, medicines and other charges are billed at the end of the visit.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground rounded-lg bg-muted/50 p-3">
              The consultation fee will be billed at the end, together with procedures, medicines and other charges.
            </p>
          )}

          <label className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={arrived}
              onChange={(e) => setArrived(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              <span className="font-semibold block">The patient is here and has confirmed their arrival</span>
              <span className="text-muted-foreground">They join the waiting queue for {visit.doctor.split(",")[0]}.</span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" className="text-xs gap-1.5" onClick={submit} disabled={!canSubmit}>
            {prepaid ? <Printer className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
            {prepaid ? `Collect ${formatBDT(amountNum)} & check in` : "Check in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
