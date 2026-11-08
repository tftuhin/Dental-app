"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Pill, Microscope, Layers, Receipt, LayoutGrid, FileSignature, MessageCircle } from "lucide-react";
import { ProceduresSettingsTab } from "@/components/settings/procedures-settings-tab";
import { ClinicSetupTab } from "@/components/settings/clinic-setup-tab";
import { MedicationsSettingsTab } from "@/components/settings/medications-settings-tab";
import { InvestigationsSettingsTab } from "@/components/settings/investigations-settings-tab";
import { IntegrationsSettingsTab } from "@/components/settings/integrations-settings-tab";
import { ClinicalModulesSettingsTab } from "@/components/settings/clinical-modules-settings-tab";
import { ConsentSettingsTab } from "@/components/settings/consent-settings-tab";
import { MessagesSettingsTab } from "@/components/settings/messages-settings-tab";

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
      <PageHeader
        title="Settings"
        description="Clinic profile and hours, doctors and chairs, clinical sections, consent forms, price list, medicines, tests and services."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="w-full max-w-full justify-start overflow-x-auto sm:w-auto">
          {/* Tab 1: Clinic Setup */}
          <TabsTrigger value="clinic-setup" className="text-xs gap-1.5 py-1.5 font-semibold">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            Clinic Setup
          </TabsTrigger>

          <TabsTrigger value="modules" className="text-xs gap-1.5 py-1.5 font-semibold">
            <LayoutGrid className="h-3.5 w-3.5 text-primary" />
            Clinical Modules
          </TabsTrigger>

          <TabsTrigger value="consent" className="text-xs gap-1.5 py-1.5 font-semibold">
            <FileSignature className="h-3.5 w-3.5 text-primary" />
            Consent Forms
          </TabsTrigger>

          <TabsTrigger value="messages" className="text-xs gap-1.5 py-1.5 font-semibold">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            Messages
          </TabsTrigger>

          {/* Procedure & fee price list */}
          <TabsTrigger value="procedures" className="text-xs gap-1.5 py-1.5 font-semibold">
            <Receipt className="h-3.5 w-3.5 text-primary" />
            Procedures & Fees
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

          {/* Tab 4: Cloud Services & Patient ID */}
          <TabsTrigger value="integrations" className="text-xs gap-1.5 py-1.5 font-semibold">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Services & Patient ID
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 Content: Clinic Setup */}
        <TabsContent value="clinic-setup" className="space-y-4">
          <ClinicSetupTab />
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <ClinicalModulesSettingsTab />
        </TabsContent>

        <TabsContent value="consent" className="space-y-4">
          <ConsentSettingsTab />
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <MessagesSettingsTab />
        </TabsContent>

        <TabsContent value="procedures" className="space-y-4">
          <ProceduresSettingsTab />
        </TabsContent>

        {/* Tab 2 Content: Medications Catalog */}
        <TabsContent value="medications" className="space-y-4">
          <MedicationsSettingsTab />
        </TabsContent>

        {/* Tab 3 Content: Investigations Catalog */}
        <TabsContent value="investigations" className="space-y-4">
          <InvestigationsSettingsTab />
        </TabsContent>

        {/* Tab 4 Content: Merged Integrations (Patient ID, AI Assistant, SMS Gateway) */}
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
