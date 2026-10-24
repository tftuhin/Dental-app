import { Suspense } from "react";
import { PrescriptionStudio } from "@/components/prescriptions/prescription-studio";

export default function PrescriptionsPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading e-Prescription Studio...</div>}>
        <PrescriptionStudio />
      </Suspense>
    </div>
  );
}
