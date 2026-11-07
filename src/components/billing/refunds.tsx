"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Undo2, Search, Printer, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClinicalQueuePatient, getVisit } from "@/lib/clinical-flow-store";
import { BillKind, getRefundableBills, netPaid, recordRefund } from "@/lib/billing-store";
import { printRefundVoucher } from "@/lib/refund-voucher";
import { formatBDT } from "@/lib/currency";
import { PAYMENT_METHODS } from "./due-payments";

const REASONS = [
  "Treatment cancelled",
  "Treatment not done today",
  "Charged by mistake",
  "Overpayment",
  "Patient dissatisfied",
];

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

interface RefundDialogProps {
  visitId: string;
  kind: BillKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefunded?: (visit: ClinicalQueuePatient) => void;
}

/** Give money back on one paid bill, then print the refund voucher. */
export function RefundDialog(props: RefundDialogProps) {
  if (!props.open) return null;
  return <RefundDialogInner {...props} />;
}

function RefundDialogInner({ visitId, kind, open, onOpenChange, onRefunded }: RefundDialogProps) {
  const { data: session } = useSession();
  const [visit] = useState(() => getVisit(visitId));
  const inv = visit?.[kind];
  const available = inv ? netPaid(inv) : 0;
  const [amount, setAmount] = useState<number | "">(available || "");
  const [method, setMethod] = useState(inv?.paymentMethod && PAYMENT_METHODS.some((m) => m.value === inv.paymentMethod) ? inv.paymentMethod : "cash");
  const [trxId, setTrxId] = useState("");
  const [reason, setReason] = useState("");
  const needsTrx = method === "bkash" || method === "nagad";
  const amountNum = Number(amount) || 0;

  const handleRefund = () => {
    if (!visit) return;
    const result = recordRefund(visit.id, kind, {
      amount: amountNum,
      method,
      trxId,
      reason,
      by: session?.user?.name || undefined,
    });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    const fresh = result.visit[kind];
    if (fresh && !printRefundVoucher(result.visit, fresh, result.refund)) {
      toast.warning("Refund saved. Allow pop-ups to print the voucher.");
    } else {
      toast.success(`${formatBDT(result.refund.amount)} refunded to ${visit.patient}.`);
    }
    onRefunded?.(result.visit);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Undo2 className="h-5 w-5 text-rose-600" />
            Refund
          </DialogTitle>
          <DialogDescription className="text-xs">
            {visit && inv ? (
              <>
                {visit.patient} ({visit.patientId}) · {kind === "checkInInvoice" ? "Consultation fee" : "Invoice"} {inv.invoiceNumber} ·
                Visit {formatDate(visit.date)}
              </>
            ) : (
              "Bill not found."
            )}
          </DialogDescription>
        </DialogHeader>

        {inv && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border p-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Bill</p>
                <p className="font-bold">{formatBDT(inv.total)}</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Paid</p>
                <p className="font-bold text-emerald-700">{formatBDT(inv.paidAmount)}</p>
              </div>
              <div className="rounded-lg border border-rose-300 bg-rose-50 p-2 dark:bg-rose-950/30">
                <p className="text-[10px] font-semibold uppercase text-rose-800 dark:text-rose-300">Can refund</p>
                <p className="font-bold text-rose-700">{formatBDT(available)}</p>
              </div>
            </div>

            {(inv.refunds?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1 font-semibold">Earlier refunds</p>
                <ul className="divide-y rounded-lg border">
                  {inv.refunds!.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                      <span>
                        {formatDate(r.refundedAt)} · {r.method.toUpperCase()} · {r.reason}
                      </span>
                      <span className="flex items-center gap-2">
                        <b>{formatBDT(r.amount)}</b>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          aria-label={`Reprint refund voucher ${r.refundNumber}`}
                          onClick={() => visit && printRefundVoucher(visit, inv, r)}
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {available > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Amount to refund (৳) *</Label>
                    <div className="mt-1 flex gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={available}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                      <Button type="button" size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => setAmount(available)}>
                        All
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Paid back by</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {needsTrx && (
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold">Transaction ID *</Label>
                      <Input value={trxId} onChange={(e) => setTrxId(e.target.value)} className="mt-1 h-8 font-mono text-xs" />
                    </div>
                  )}
                  <div className="col-span-2">
                    <Label className="text-xs font-semibold">Reason *</Label>
                    <div className="mb-1 mt-1 flex flex-wrap gap-1">
                      {REASONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setReason(r)}
                          className={`rounded-full border px-2 py-0.5 text-[11px] ${reason === r ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-14 text-xs" placeholder="Why is the money being returned?" />
                  </div>
                </div>
                <p className="text-muted-foreground">
                  The refund comes off the bill and the amount paid, so what the patient still owes doesn&apos;t change. It shows as
                  a refund in today&apos;s collections.
                </p>
              </>
            ) : (
              <p className="rounded-lg border border-dashed p-3 text-center text-muted-foreground">Everything paid on this bill has been refunded.</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {available > 0 && (
            <Button
              size="sm"
              className="gap-1.5 bg-rose-600 text-xs text-white hover:bg-rose-700"
              onClick={handleRefund}
              disabled={!(amountNum > 0) || amountNum > available || !reason.trim()}
            >
              <Undo2 className="h-3.5 w-3.5" />
              Refund {amountNum > 0 ? formatBDT(amountNum) : ""} & print voucher
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Billing page: find any paid bill (any date) and refund it. */
export function RefundsPanel() {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [bills, setBills] = useState(getRefundableBills);
  const [refundFor, setRefundFor] = useState<{ visitId: string; kind: BillKind } | null>(null);

  useEffect(() => {
    const load = () => setBills(getRefundableBills());
    window.addEventListener("dentai-appointments-updated", load);
    return () => window.removeEventListener("dentai-appointments-updated", load);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const list = q
      ? bills.filter(
          (b) =>
            b.visit.patient.toLowerCase().includes(q) ||
            b.visit.patientId.toLowerCase().includes(q) ||
            b.invoice.invoiceNumber.toLowerCase().includes(q) ||
            (digits.length >= 4 && b.visit.phone.replace(/\D/g, "").includes(digits))
        )
      : bills;
    return list.slice(0, 25);
  }, [bills, query]);

  return (
    <Card className="shadow-xs">
      <CardHeader className="px-4 py-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          <CardTitle className="flex items-center gap-2 text-xs font-bold">
            <Undo2 className="h-4 w-4 text-rose-600" />
            Refund a payment
          </CardTitle>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-3 border-t p-4">
          <div className="relative sm:w-80">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, ID, phone or invoice"
              className="h-7 pl-7 text-xs"
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background text-[10px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 text-left">Patient</th>
                  <th className="px-2 py-1.5 text-left">Visit</th>
                  <th className="px-2 py-1.5 text-left">Bill</th>
                  <th className="px-2 py-1.5 text-right">Paid</th>
                  <th className="px-2 py-1.5 text-right">Refunded</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-muted-foreground">
                      {query ? `No paid bills match "${query}".` : "No paid bills yet."}
                    </td>
                  </tr>
                )}
                {filtered.map((b) => (
                  <tr key={`${b.visit.id}-${b.kind}`} className="border-t">
                    <td className="px-2 py-1.5">
                      <span className="font-semibold">{b.visit.patient}</span>
                      <span className="block font-mono text-[10px] text-muted-foreground">{b.visit.patientId}</span>
                    </td>
                    <td className="px-2 py-1.5">{formatDate(b.visit.date)}</td>
                    <td className="px-2 py-1.5">
                      <span className="font-mono text-[11px]">{b.invoice.invoiceNumber}</span>
                      {b.kind === "checkInInvoice" && <span className="block text-[10px] text-muted-foreground">Consultation (check-in)</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right">{formatBDT(b.invoice.paidAmount, false)}</td>
                    <td className="px-2 py-1.5 text-right text-rose-700">
                      {b.invoice.refundedAmount ? formatBDT(b.invoice.refundedAmount, false) : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => setRefundFor({ visitId: b.visit.id, kind: b.kind })}
                      >
                        {b.refundable > 0 ? "Refund" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
      {refundFor && (
        <RefundDialog
          visitId={refundFor.visitId}
          kind={refundFor.kind}
          open={!!refundFor}
          onOpenChange={(o) => !o && setRefundFor(null)}
        />
      )}
    </Card>
  );
}
