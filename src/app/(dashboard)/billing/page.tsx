import { Suspense } from "react";
import { BillingStudio } from "@/components/billing/billing-studio";

export default function BillingPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading Billing Studio...</div>}>
        <BillingStudio />
      </Suspense>
    </div>
  );
}
