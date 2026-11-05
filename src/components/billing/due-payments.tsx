"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HandCoins, Search, Printer } from "lucide-react";
import { toast } from "sonner";
import { ClinicalQueuePatient, getVisit } from "@/lib/clinical-flow-store";
import {
  buildReceiptFromInvoice,
  getOutstandingVisits,
  getPayments,
  recordDuePayment,
} from "@/lib/billing-store";
import { printReceiptWindow } from "@/lib/receipt-pdf-generator";
import { formatBDT } from "@/lib/currency";

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "card", label: "Card (POS)" },
];

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

/** List of every bill with money still owed (any date), with a Collect button per bill. */
export function DuePayments({ onOpenBill }: { onOpenBill?: (visitId: string) => void }) {
  const [dues, setDues] = useState<ClinicalQueuePatient[]>([]);
  const [query, setQuery] = useState("");
  const [collectFor, setCollectFor] = useState<string | null>(null);

  useEffect(() => {
    const load = () => setDues(getOutstandingVisits());
    load();
    window.addEventListener("dentai-appointments-updated", load);
    return () => window.removeEventListener("dentai-appointments-updated", load);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    if (!q) return dues;
    return dues.filter(
      (v) =>
        v.patient.toLowerCase().includes(q) ||
        v.patientId.toLowerCase().includes(q) ||
        (v.invoice?.invoiceNumber || "").toLowerCase().includes(q) ||
        (digits.length >= 4 && v.phone.replace(/\D/g, "").includes(digits))
    );
  }, [dues, query]);

  const totalDue = dues.reduce((s, v) => s + (v.invoice?.balanceDue || 0), 0);

  if (dues.length === 0) return null;

  return (
    <Card className="border-amber-300 dark:border-amber-800 shadow-xs">
      <CardHeader className="py-3 px-4 border-b bg-amber-50/70 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <CardTitle className="text-xs font-bold flex items-center gap-2 text-amber-900 dark:text-amber-200">
          <HandCoins className="h-4 w-4" />
          Outstanding Dues · {dues.length} bill{dues.length === 1 ? "" : "s"} · {formatBDT(totalDue)}
        </CardTitle>
        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-2 top-2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ID, phone or invoice"
            className="h-7 text-xs pl-7 bg-background"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0 max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/30 text-[10px] uppercase text-muted-foreground sticky top-0">
            <tr>
              <th className="text-left px-4 py-2">Patient</th>
              <th className="text-left px-2 py-2">Visit</th>
              <th className="text-left px-2 py-2">Invoice</th>
              <th className="text-right px-2 py-2">Bill</th>
              <th className="text-right px-2 py-2">Paid</th>
              <th className="text-right px-2 py-2">Due</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-muted-foreground">
                  No dues match &quot;{query}&quot;.
                </td>
              </tr>
            )}
            {filtered.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-2">
                  <span className="font-semibold">{v.patient}</span>
                  <span className="block text-[10px] text-muted-foreground font-mono">
                    {v.patientId} · {v.phone}
                  </span>
                </td>
                <td className="px-2 py-2">{formatDate(v.date)}</td>
                <td className="px-2 py-2 font-mono text-[11px]">{v.invoice?.invoiceNumber}</td>
                <td className="px-2 py-2 text-right">{formatBDT(v.invoice?.total, false)}</td>
                <td className="px-2 py-2 text-right text-emerald-700">{formatBDT(v.invoice?.paidAmount, false)}</td>
                <td className="px-2 py-2 text-right font-bold text-amber-700">{formatBDT(v.invoice?.balanceDue, false)}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {onOpenBill && (
                    <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => onOpenBill(v.id)}>
                      Open bill
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="h-7 text-[11px] bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => setCollectFor(v.id)}
                  >
                    Collect
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>

      {collectFor && (
        <CollectDueDialog
          visitId={collectFor}
          open={!!collectFor}
          onOpenChange={(o) => !o && setCollectFor(null)}
        />
      )}
    </Card>
  );
}

interface CollectDueDialogProps {
  visitId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid?: () => void;
}

/** Take a payment against a bill's balance due, then print the receipt for it. */
export function CollectDueDialog(props: CollectDueDialogProps) {
  // Remount on every open so the form always starts from the bill's current balance
  return <CollectDueDialogInner key={`${props.visitId}-${props.open}`} {...props} />;
}

function CollectDueDialogInner({ visitId, open, onOpenChange, onPaid }: CollectDueDialogProps) {
  const [visit] = useState<ClinicalQueuePatient | undefined>(() => getVisit(visitId));
  const [amount, setAmount] = useState<number | "">(() => visit?.invoice?.balanceDue ?? "");
  const [method, setMethod] = useState("cash");
  const [trxId, setTrxId] = useState("");

  const inv = visit?.invoice;
  const payments = inv ? getPayments(inv) : [];
  const amountNum = Number(amount) || 0;
  const remainingAfter = inv ? Math.max(0, inv.balanceDue - amountNum) : 0;
  const needsTrx = method === "bkash" || method === "nagad";

  const handleRecord = () => {
    if (!visit) return;
    if (needsTrx && !trxId.trim()) {
      toast.error("Enter the transaction ID for mobile payments.");
      return;
    }
    const result = recordDuePayment(visit.id, { amount: amountNum, method, trxId });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    const receipt = buildReceiptFromInvoice(result.visit, result.payment);
    if (receipt) printReceiptWindow(receipt);
    toast.success(
      result.visit.invoice && result.visit.invoice.balanceDue > 0
        ? `${formatBDT(result.payment.amount)} received. ${formatBDT(result.visit.invoice.balanceDue)} still due.`
        : `${formatBDT(result.payment.amount)} received. Bill fully paid.`
    );
    onPaid?.();
    onOpenChange(false);
  };

  const reprint = (paymentId: string) => {
    if (!visit) return;
    const p = payments.find((x) => x.id === paymentId);
    const receipt = buildReceiptFromInvoice(visit, p);
    if (receipt) printReceiptWindow(receipt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-amber-600" />
            Collect Due Payment
          </DialogTitle>
          <DialogDescription className="text-xs">
            {visit ? (
              <>
                {visit.patient} ({visit.patientId}) · Invoice {inv?.invoiceNumber} · Visit {formatDate(visit.date)}
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
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Bill total</p>
                <p className="font-bold">{formatBDT(inv.total)}</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Paid</p>
                <p className="font-bold text-emerald-700">{formatBDT(inv.paidAmount)}</p>
              </div>
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2">
                <p className="text-[10px] uppercase text-amber-800 dark:text-amber-300 font-semibold">Due</p>
                <p className="font-bold text-amber-700">{formatBDT(inv.balanceDue)}</p>
              </div>
            </div>

            {payments.length > 0 && (
              <div>
                <p className="font-semibold mb-1">Payments so far</p>
                <ul className="divide-y rounded-lg border">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                      <span>
                        {formatDate(p.paidAt)} · {p.method.toUpperCase()}
                        {p.trxId ? <span className="font-mono text-muted-foreground"> ({p.trxId})</span> : null}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-semibold">{formatBDT(p.amount)}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => reprint(p.id)}
                          aria-label={`Reprint receipt ${p.receiptNumber}`}
                          title="Reprint this receipt"
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Amount received (৳) *</Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    type="number"
                    min={0}
                    max={inv.balanceDue}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-[11px]"
                    onClick={() => setAmount(inv.balanceDue)}
                  >
                    Full
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="h-8 text-xs mt-1">
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
              After this payment:{" "}
              {remainingAfter > 0 ? (
                <Badge className="bg-amber-100 text-amber-800">{formatBDT(remainingAfter)} still due</Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-800">Bill fully paid</Badge>
              )}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleRecord}
            disabled={!inv || !(amountNum > 0) || amountNum > (inv?.balanceDue ?? 0)}
          >
            <Printer className="h-3.5 w-3.5" />
            Record Payment & Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
