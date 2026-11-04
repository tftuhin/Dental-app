import { Suspense } from "react";
import { ProcedureStudio } from "@/components/clinical/procedure-studio";

export default function ProceduresPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading Examination & Procedure…</div>}>
        <ProcedureStudio />
      </Suspense>
    </div>
  );
}
