"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { VisitStage } from "@/lib/clinical-flow-store";

const STEPS: Array<{ stage: VisitStage; label: string; href: (id: string) => string }> = [
  { stage: "notes", label: "Notes", href: (id) => `/appointments?visitId=${id}` },
  { stage: "procedure", label: "Examination & Procedure", href: (id) => `/procedures?visitId=${id}` },
  { stage: "prescription", label: "Prescription", href: (id) => `/prescriptions?visitId=${id}` },
  { stage: "billing", label: "Billing", href: (id) => `/billing?visitId=${id}` },
];

const ORDER: VisitStage[] = ["waiting", "notes", "procedure", "prescription", "billing", "done"];

/** Where the patient is in today's visit. Earlier steps stay clickable for corrections. */
export function VisitStepper({
  visitId,
  current,
  reached,
  skippedProcedure,
}: {
  visitId: string;
  /** The step the user is looking at. */
  current: VisitStage;
  /** The furthest stage the visit has reached. */
  reached?: VisitStage;
  /** True when the doctor sent the patient straight to prescription. */
  skippedProcedure?: boolean;
}) {
  const reachedIdx = ORDER.indexOf(reached || current);

  return (
    <nav aria-label="Visit progress" className="flex items-center gap-1 flex-wrap text-[11px]">
      {STEPS.map((s, i) => {
        const idx = ORDER.indexOf(s.stage);
        const isCurrent = s.stage === current;
        const isDone = idx < reachedIdx && !isCurrent;
        const isSkipped = s.stage === "procedure" && skippedProcedure && !isCurrent;
        const canOpen = idx <= reachedIdx;
        const pill = (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-semibold ${
              isCurrent
                ? "bg-primary text-primary-foreground border-primary"
                : isSkipped
                ? "bg-muted/40 text-muted-foreground border-dashed line-through"
                : isDone
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-background text-muted-foreground"
            }`}
          >
            {isDone && !isSkipped ? <Check className="h-3 w-3" /> : <span>{i + 1}.</span>}
            {s.label}
          </span>
        );
        return (
          <span key={s.stage} className="flex items-center gap-1">
            {canOpen && !isCurrent ? (
              <Link href={s.href(visitId)} className="hover:opacity-80">
                {pill}
              </Link>
            ) : (
              pill
            )}
            {i < STEPS.length - 1 && <span className="text-muted-foreground">›</span>}
          </span>
        );
      })}
    </nav>
  );
}
