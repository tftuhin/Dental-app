"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Building2,
  Pill,
  Microscope,
  Layers,
} from "lucide-react";
import { ClinicSetupTab } from "@/components/settings/clinic-setup-tab";
import { MedicationsSettingsTab } from "@/components/settings/medications-settings-tab";
import { InvestigationsSettingsTab } from "@/components/settings/investigations-settings-tab";
import { IntegrationsSettingsTab } from "@/components/settings/integrations-settings-tab";

function SettingsContent() {
  const searchParams = useSearchParams();
  const rawTab = searchParams?.get("tab") || "clinic-setup";

  // Map legacy tab names if any
  let initialTab = rawTab;
  if (rawTab === "general") initialTab = "clinic-setup";
  if (rawTab === "patientId" || rawTab === "ai" || rawTab === "sms") initialTab = "integrations";

  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Clinic & Practice Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure clinic profile, operating hours, brand colors, doctors, operatories, pharmacotherapy, diagnostic investigations, and integrations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto h-auto p-1 bg-muted/60 rounded-xl border gap-1">
          {/* Tab 1: Clinic Setup */}
          <TabsTrigger value="clinic-setup" className="text-xs gap-1.5 py-1.5 font-semibold">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            Clinic Setup
          </TabsTrigger>

          {/* Tab 2: Medications Catalog */}
          <TabsTrigger value="medications" className="text-xs gap-1.5 py-1.5 font-semibold">
            <Pill className="h-3.5 w-3.5 text-primary" />
            Medications
          </TabsTrigger>

          {/* Tab 3: Investigations Catalog */}
          <TabsTrigger value="investigations" className="text-xs gap-1.5 py-1.5 font-semibold">
            <Microscope className="h-3.5 w-3.5 text-primary" />
            Investigations
          </TabsTrigger>

          {/* Tab 4: Merged Integrations (Patient ID, AI Assistant, SMS Gateway) */}
          <TabsTrigger value="integrations" className="text-xs gap-1.5 py-1.5 font-semibold">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Integrations & Patient ID
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 Content: Clinic Setup */}
        <TabsContent value="clinic-setup" className="space-y-4">
          <ClinicSetupTab />
        </TabsContent>

        {/* Tab 2 Content: Medications Catalog */}
        <TabsContent value="medications" className="space-y-4">
          <MedicationsSettingsTab />
        </TabsContent>

        {/* Tab 3 Content: Investigations Catalog */}
        <TabsContent value="investigations" className="space-y-4">
          <InvestigationsSettingsTab />
        </TabsContent>

        {/* Tab 4 Content: Merged Integrations (Patient ID, AI Copilot, SMS Gateway) */}
        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
