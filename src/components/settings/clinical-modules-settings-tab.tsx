"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { CLINICAL_MODULE_INFO, saveClinicalModules, useClinicalModules } from "@/lib/clinical-modules-store";

/** Settings → Clinical Modules: switch charting sections on or off for the whole clinic. */
export function ClinicalModulesSettingsTab() {
  const modules = useClinicalModules();

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b bg-muted/20 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <LayoutGrid className="h-4 w-4 text-primary" />
          Clinical modules
        </CardTitle>
        <CardDescription className="text-xs">
          Turn sections off if your clinic doesn&apos;t use them. They disappear from the visit session and the patient profile;
          anything already recorded is kept and comes back when you turn the section on again.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {CLINICAL_MODULE_INFO.map((m) => (
          <div key={m.key} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <Label htmlFor={`module-${m.key}`} className="text-sm font-medium">
                {m.label}
              </Label>
              <p className="text-xs text-muted-foreground">{m.description}</p>
            </div>
            <Switch
              id={`module-${m.key}`}
              checked={modules[m.key]}
              onCheckedChange={(on) => {
                saveClinicalModules({ [m.key]: on });
                toast.success(`${m.label} ${on ? "turned on" : "turned off"}.`);
              }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
