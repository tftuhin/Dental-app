"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BillSegment, shiftISODate, toISODate } from "@/lib/clinical-flow-store";
import { BILL_SEGMENTS, CollectionEntry, getCollectionEntries, summariseCollections } from "@/lib/billing-store";
import { CATEGORY_LABELS } from "@/lib/procedures-catalog-store";
import { formatBDT } from "@/lib/currency";

type Period = "daily" | "monthly";

const SEGMENT_HEADINGS: Record<BillSegment, string> = {
  consultation: "Consultation / Counselling",
  examination: "Examination & Diagnostics",
  procedure: "Procedure",
  surgery: "Surgery",
  consumable: "Medicine & Disposables",
};

function shiftMonth(ym: string, by: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + by, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(period: Period, day: string, month: string): string {
  if (period === "daily") {
    const [y, m, d] = day.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  }
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Money received per day or month, by doctor and by revenue group. */
export function CollectionsReport() {
  const [period, setPeriod] = useState<Period>("daily");
  const [day, setDay] = useState(toISODate());
  const [month, setMonth] = useState(toISODate().slice(0, 7));
  const [entries, setEntries] = useState<CollectionEntry[]>([]);

  useEffect(() => {
    const load = () => setEntries(getCollectionEntries());
    load();
    window.addEventListener("dentai-appointments-updated", load);
    window.addEventListener("dentalos1-catalog-updated", load);
    return () => {
      window.removeEventListener("dentai-appointments-updated", load);
      window.removeEventListener("dentalos1-catalog-updated", load);
    };
  }, []);

  const [from, to] = period === "daily" ? [day, day] : [`${month}-01`, `${month}-31`];
  const summary = useMemo(() => summariseCollections(from, to, entries), [from, to, entries]);
  const isCurrent = period === "daily" ? day === toISODate() : month === toISODate().slice(0, 7);

  const step = (by: number) =>
    period === "daily" ? setDay((d) => shiftISODate(d, by)) : setMonth((m) => shiftMonth(m, by));

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Collections
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Money received on {periodLabel(period, day, month)}, by doctor and by service group
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-muted/60 p-0.5 text-xs" role="tablist" aria-label="Report period">
            {(["daily", "monthly"] as Period[]).map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={period === p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md font-medium capitalize transition-colors ${
                  period === p ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-r-none"
              onClick={() => step(-1)}
              aria-label={period === "daily" ? "Previous day" : "Previous month"}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              type={period === "daily" ? "date" : "month"}
              value={period === "daily" ? day : month}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                if (period === "daily") setDay(v);
                else setMonth(v);
              }}
              className="h-8 w-[150px] rounded-none border-x-0 text-xs focus-visible:z-10"
              aria-label={period === "daily" ? "Report day" : "Report month"}
            />
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-l-none"
              onClick={() => step(1)}
              aria-label={period === "daily" ? "Next day" : "Next month"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {!isCurrent && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => (period === "daily" ? setDay(toISODate()) : setMonth(toISODate().slice(0, 7)))}
            >
              {period === "daily" ? "Today" : "This month"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Total and each service group */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">Total collected</p>
            <p className="text-lg font-semibold tabular-nums">{formatBDT(summary.total)}</p>
            <p className="text-[11px] text-muted-foreground">
              {summary.payments} payment{summary.payments === 1 ? "" : "s"}
            </p>
            {summary.refunded > 0 && (
              <p className="text-[11px] font-medium text-rose-700 dark:text-rose-400">
                after {formatBDT(summary.refunded)} refunded
              </p>
            )}
          </div>
          {BILL_SEGMENTS.map((seg) => {
            const amount = summary.bySegment[seg];
            const pct = summary.total > 0 ? Math.round((amount / summary.total) * 100) : 0;
            return (
              <div key={seg} className="rounded-lg border p-3">
                <p className="text-[11px] font-medium text-muted-foreground leading-tight">{CATEGORY_LABELS[seg]}</p>
                <p className="text-base font-semibold tabular-nums mt-0.5">{formatBDT(amount)}</p>
                <p className="text-[11px] text-muted-foreground tabular-nums">{pct}% of total</p>
              </div>
            );
          })}
        </div>

        {/* By doctor */}
        {summary.doctors.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
            No payments received {period === "daily" ? "on this day" : "in this month"}.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="py-2 px-3 text-left font-semibold">Doctor</th>
                  <th className="py-2 px-3 text-right font-semibold">Patients</th>
                  {BILL_SEGMENTS.map((seg) => (
                    <th key={seg} className="py-2 px-3 text-right font-semibold whitespace-nowrap">
                      {SEGMENT_HEADINGS[seg]}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.doctors.map((d) => (
                  <tr key={d.doctor} className="hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium whitespace-nowrap">{d.doctor}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{d.patients}</td>
                    {BILL_SEGMENTS.map((seg) => (
                      <td key={seg} className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                        {d.bySegment[seg] > 0 ? formatBDT(d.bySegment[seg]) : "—"}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right tabular-nums font-semibold">{formatBDT(d.total)}</td>
                  </tr>
                ))}
              </tbody>
              {summary.doctors.length > 1 && (
                <tfoot className="border-t bg-muted/30 font-semibold">
                  <tr>
                    <td className="py-2 px-3">All doctors</td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {summary.doctors.reduce((n, d) => n + d.patients, 0)}
                    </td>
                    {BILL_SEGMENTS.map((seg) => (
                      <td key={seg} className="py-2 px-3 text-right tabular-nums">
                        {formatBDT(summary.bySegment[seg])}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right tabular-nums">{formatBDT(summary.total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
