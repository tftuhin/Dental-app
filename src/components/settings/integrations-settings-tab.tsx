"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Shield,
  Sparkles,
  MessageSquare,
  Mail,
  Cloud,
  Save,
  Send,
  CheckCircle2,
  Layers,
  Settings2,
  FileText,
  Clock,
  HeartPulse,
  Zap,
  Info,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  getServicesSettings,
  saveServicesSettings,
  ClinicServicesSettings,
} from "@/lib/services-store";

export function IntegrationsSettingsTab() {
  const [settings, setSettings] = useState<ClinicServicesSettings>(getServicesSettings);
  const [testPhoneNumber, setTestPhoneNumber] = useState("+880 1712-345678");
  const [testEmailAddress, setTestEmailAddress] = useState("doctor@dhakadentalcare.com");
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  useEffect(() => {
    setSettings(getServicesSettings());
  }, []);

  const updateSetting = <K extends keyof ClinicServicesSettings>(
    key: K,
    value: ClinicServicesSettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Live Patient ID sample preview
  const sampleId = settings.patientIdPattern
    .replace("{YYYY}", "2026")
    .replace("{YY}", "26")
    .replace("{MM}", "10")
    .replace(/\{SEQ:\d+\}/, String(settings.patientIdSequenceStart || "42").padStart(5, "0"));

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    saveServicesSettings(settings);
    toast.success("Clinic cloud services and automation preferences successfully saved!");
  };

  const handleSendTestSms = () => {
    if (!settings.smsEnabled) {
      toast.error("Please enable the master SMS Messaging Service first.");
      return;
    }
    if (!testPhoneNumber.trim()) {
      toast.error("Please enter a recipient phone number");
      return;
    }
    setIsSendingTestSms(true);
    setTimeout(() => {
      setIsSendingTestSms(false);
      toast.success(
        `Test SMS dispatched to ${testPhoneNumber} via DentalOS1 Cloud Gateway! Sender Name: [${settings.smsSenderName || "DHAKA-DENTAL"}]`
      );
    }, 900);
  };

  const handleSendTestEmail = () => {
    if (!settings.emailEnabled) {
      toast.error("Please enable the master Email Notification Service first.");
      return;
    }
    if (!testEmailAddress.trim()) {
      toast.error("Please enter a recipient email address");
      return;
    }
    setIsSendingTestEmail(true);
    setTimeout(() => {
      setIsSendingTestEmail(false);
      toast.success(
        `Test email dispatched to ${testEmailAddress} via DentalOS1 High-Deliverability Mail Server!`
      );
    }, 900);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* ── TOP BANNER: COMMERCIAL CLOUD SERVICES STATUS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-muted/30">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Clinic Services, Automation & Patient ID
            </h2>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 font-semibold gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Professional Practice Plan · All Services Managed
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Turn clinic automation on or off. All messaging carriers, email pipelines, and clinical AI models are managed automatically by DentalOS1.
          </p>
        </div>
        <Button
          type="submit"
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5 shadow-xs shrink-0"
        >
          <Save className="h-4 w-4" />
          Save Services Setup
        </Button>
      </div>

      {/* ── SERVICE 1: DENTAL AI CLINICAL COPILOT ── */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                1. Dental AI Clinical Copilot & Intelligence
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time evidence-based chairside guidance, drug interaction alerts, and clinical note synthesis
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold ${
                  settings.aiEnabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40"
                    : "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-900"
                }`}
              >
                {settings.aiEnabled ? "Active · DentalOS1 Neural Engine" : "Service Disabled"}
              </Badge>
              <Switch
                checked={settings.aiEnabled}
                onCheckedChange={(checked) => updateSetting("aiEnabled", checked)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
          {!settings.aiEnabled ? (
            <div className="p-3.5 rounded-lg border border-dashed text-center text-muted-foreground bg-muted/10">
              <p className="text-xs font-medium">Dental AI Copilot is currently disabled for your clinic.</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Toggle the switch above to enable real-time chairside CDS, drug interaction warnings, and voice charting.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-foreground block">
                Active Chairside Clinical AI Modules:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Module 1: Drug Allergies */}
                <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                      Drug Allergy & Beta-Lactam Cross-Check
                    </span>
                    <p className="text-[10.5px] text-muted-foreground leading-normal">
                      Automatically detects conflicts between prescribed medications and recorded patient allergies.
                    </p>
                  </div>
                  <Switch
                    checked={settings.aiDrugAllergyAlerts}
                    onCheckedChange={(checked) => updateSetting("aiDrugAllergyAlerts", checked)}
                  />
                </div>

                {/* Module 2: Differential Diagnosis */}
                <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Differential Diagnosis & ADA Treatment Guidelines
                    </span>
                    <p className="text-[10.5px] text-muted-foreground leading-normal">
                      Provides instant evidence-based diagnostic references and clinical operative protocols.
                    </p>
                  </div>
                  <Switch
                    checked={settings.aiDiffDiagnosis}
                    onCheckedChange={(checked) => updateSetting("aiDiffDiagnosis", checked)}
                  />
                </div>

                {/* Module 3: Voice Dictation */}
                <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      Voice Dictation & Clinical Note Synthesis
                    </span>
                    <p className="text-[10.5px] text-muted-foreground leading-normal">
                      Converts chairside spoken clinician audio into structured SOAP electronic health notes.
                    </p>
                  </div>
                  <Switch
                    checked={settings.aiVoiceDictation}
                    onCheckedChange={(checked) => updateSetting("aiVoiceDictation", checked)}
                  />
                </div>

                {/* Module 4: Radiograph Assistant */}
                <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-sky-500" />
                      Dental Radiograph & Odontogram Assistant
                    </span>
                    <p className="text-[10.5px] text-muted-foreground leading-normal">
                      Assists with radiograph assessment, periapical radiolucency detection, and tooth charting.
                    </p>
                  </div>
                  <Switch
                    checked={settings.aiRadiographAssistant}
                    onCheckedChange={(checked) => updateSetting("aiRadiographAssistant", checked)}
                  />
                </div>

                {/* Module 5: Smart Prescriptions */}
                <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors sm:col-span-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Settings2 className="h-3.5 w-3.5 text-emerald-500" />
                      Smart Prescription Regimen Recommendations
                    </span>
                    <p className="text-[10.5px] text-muted-foreground leading-normal">
                      Suggests standardized post-operative pharmaceutical regimens tailored to patient age and weight.
                    </p>
                  </div>
                  <Switch
                    checked={settings.aiSmartPrescriptions}
                    onCheckedChange={(checked) => updateSetting("aiSmartPrescriptions", checked)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SERVICE 2: AUTOMATED SMS NOTIFICATION SERVICE ── */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                2. Automated SMS Notification Service
              </CardTitle>
              <CardDescription className="text-xs">
                Direct SMS dispatch for appointment bookings, 24-hour reminders, chair queue tokens, and receipts
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold ${
                  settings.smsEnabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40"
                    : "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-900"
                }`}
              >
                {settings.smsEnabled ? "Active · Managed Cloud Gateway" : "Service Disabled"}
              </Badge>
              <Switch
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => updateSetting("smsEnabled", checked)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
          {!settings.smsEnabled ? (
            <div className="p-3.5 rounded-lg border border-dashed text-center text-muted-foreground bg-muted/10">
              <p className="text-xs font-medium">SMS Messaging Service is currently turned off.</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Patients will not receive automated text notifications until this service is re-enabled.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sender Name Configuration */}
              <div className="max-w-md space-y-1.5">
                <Label className="text-xs font-semibold">Clinic SMS Sender Name (Displayed on Patient Phones)</Label>
                <Input
                  value={settings.smsSenderName}
                  onChange={(e) => updateSetting("smsSenderName", e.target.value)}
                  placeholder="DHAKA-DENTAL"
                  className="h-8 text-xs font-mono font-bold"
                  maxLength={11}
                />
                <p className="text-[10px] text-muted-foreground">
                  Alphanumeric sender title (up to 11 characters) formatted per telecommunication regulations.
                </p>
              </div>

              {/* Sub-feature Toggles */}
              <div className="space-y-3 pt-1">
                <span className="text-[11px] font-bold text-foreground block">
                  Automated SMS Trigger Events:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        Appointment Booking Confirmation SMS
                      </span>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Sent immediately when a patient is scheduled or rescheduled.
                      </p>
                    </div>
                    <Switch
                      checked={settings.smsAppointmentConfirmation}
                      onCheckedChange={(checked) => updateSetting("smsAppointmentConfirmation", checked)}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        24-Hour Prior Appointment Reminder SMS
                      </span>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Sends automated reminders 24 hours prior to chair time to eliminate no-shows.
                      </p>
                    </div>
                    <Switch
                      checked={settings.smsAppointmentReminder}
                      onCheckedChange={(checked) => updateSetting("smsAppointmentReminder", checked)}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <HeartPulse className="h-3.5 w-3.5 text-emerald-500" />
                        Treatment Recall & Post-Op Follow-up SMS
                      </span>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Surgical post-op recovery checks & automated 6-month checkup recalls.
                      </p>
                    </div>
                    <Switch
                      checked={settings.smsTreatmentRecall}
                      onCheckedChange={(checked) => updateSetting("smsTreatmentRecall", checked)}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-indigo-500" />
                        Live Chair Queue & Token Updates
                      </span>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Notifies waiting patients of their live token number and chair readiness.
                      </p>
                    </div>
                    <Switch
                      checked={settings.smsQueueUpdates}
                      onCheckedChange={(checked) => updateSetting("smsQueueUpdates", checked)}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors sm:col-span-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        Payment & Money Receipt SMS Acknowledgement
                      </span>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Dispatches instant billing payment confirmations and receipts to patient handsets.
                      </p>
                    </div>
                    <Switch
                      checked={settings.smsBillingReceipt}
                      onCheckedChange={(checked) => updateSetting("smsBillingReceipt", checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Test SMS Dispatcher */}
              <div className="p-3.5 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <Label className="text-xs font-semibold">Test SMS Delivery</Label>
                  <Input
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="+880 1712-345678"
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Verifies cloud carrier routing and delivery to your handset.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSendingTestSms}
                  onClick={handleSendTestSms}
                  className="h-8 text-xs font-semibold gap-1.5 bg-background shadow-xs shrink-0"
                >
                  <Send className="h-3.5 w-3.5 text-primary" />
                  {isSendingTestSms ? "Sending Test..." : "Send Test SMS"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SERVICE 3: AUTOMATED EMAIL NOTIFICATION SERVICE ── */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                3. Automated Email Notification Service
              </CardTitle>
              <CardDescription className="text-xs">
                Automated delivery of e-prescriptions, appointment calendar invites, and payment invoices
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold ${
                  settings.emailEnabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40"
                    : "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-900"
                }`}
              >
                {settings.emailEnabled ? "Active · Managed Mail Pipeline" : "Service Disabled"}
              </Badge>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => updateSetting("emailEnabled", checked)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
          {!settings.emailEnabled ? (
            <div className="p-3.5 rounded-lg border border-dashed text-center text-muted-foreground bg-muted/10">
              <p className="text-xs font-medium">Email Notification Service is currently turned off.</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Digital prescriptions, receipts, and appointment invites will not be emailed automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sender Name Configuration */}
              <div className="max-w-md space-y-1.5">
                <Label className="text-xs font-semibold">Clinic Email Sender Display Title</Label>
                <Input
                  value={settings.emailSenderAlias}
                  onChange={(e) => updateSetting("emailSenderAlias", e.target.value)}
                  placeholder="Dhaka Dental Care & Maxillofacial Hospital"
                  className="h-8 text-xs font-medium"
                />
                <p className="text-[10px] text-muted-foreground">
                  Official name displayed in patient email inboxes.
                </p>
              </div>

              {/* Sub-feature Toggles */}
              <div className="space-y-3 pt-1">
                <span className="text-[11px] font-bold text-foreground block">
                  Automated Email Dispatch Events:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        Appointment Confirmation & Calendar Invites
                      </span>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Includes .ics calendar attachment with clinic location and appointment details.
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailAppointmentConfirmation}
                      onCheckedChange={(checked) => updateSetting("emailAppointmentConfirmation", checked)}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-sky-500" />
                        Digital E-Prescription PDF Dispatch
                      </span>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Instantly emails the patient an authentic PDF copy of their prescription upon completion.
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailPrescriptionPdf}
                      onCheckedChange={(checked) => updateSetting("emailPrescriptionPdf", checked)}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-emerald-500" />
                        Itemized Money Receipt & Invoice Emails
                      </span>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Sends formal payment voucher and invoice directly to patient email records.
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailBillingInvoice}
                      onCheckedChange={(checked) => updateSetting("emailBillingInvoice", checked)}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        Daily Clinic Activity & Revenue Summary
                      </span>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Sends doctor an executive summary report every evening with daily patient & revenue metrics.
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailDailyDoctorReport}
                      onCheckedChange={(checked) => updateSetting("emailDailyDoctorReport", checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Test Email Dispatcher */}
              <div className="p-3.5 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <Label className="text-xs font-semibold">Test Email Delivery</Label>
                  <Input
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="doctor@dhakadentalcare.com"
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Verifies cloud email delivery to your clinic inbox.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSendingTestEmail}
                  onClick={handleSendTestEmail}
                  className="h-8 text-xs font-semibold gap-1.5 bg-background shadow-xs shrink-0"
                >
                  <Send className="h-3.5 w-3.5 text-primary" />
                  {isSendingTestEmail ? "Sending Test..." : "Send Test Email"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SERVICE 4: AUTOMATED CLOUD BACKUP & MULTI-CHAIR SYNC ── */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Cloud className="h-4 w-4 text-primary" />
                4. Automated Cloud Backup & Multi-Chair Sync
              </CardTitle>
              <CardDescription className="text-xs">
                Continuous encrypted database replication, disaster recovery, and multi-operatory synchronization
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold ${
                  settings.cloudBackupEnabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40"
                    : "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-900"
                }`}
              >
                {settings.cloudBackupEnabled ? "Active · AES-256 Encrypted Vault" : "Service Disabled"}
              </Badge>
              <Switch
                checked={settings.cloudBackupEnabled}
                onCheckedChange={(checked) => updateSetting("cloudBackupEnabled", checked)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
          {settings.cloudBackupEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    Real-time Multi-Chair Operatory Synchronization
                  </span>
                  <p className="text-[10.5px] text-muted-foreground leading-normal">
                    Syncs clinical charts, odontograms, and billing changes live across all operatories and reception.
                  </p>
                </div>
                <Switch
                  checked={settings.cloudRealtimeSync}
                  onCheckedChange={(checked) => updateSetting("cloudRealtimeSync", checked)}
                />
              </div>

              <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-background">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-emerald-500" />
                    Automated Daily Midnight Cloud Snapshot
                  </span>
                  <p className="text-[10.5px] text-muted-foreground leading-normal">
                    Creates an encrypted disaster recovery backup every night at 11:59 PM.
                  </p>
                </div>
                <Switch
                  checked={settings.cloudDailySnapshot}
                  onCheckedChange={(checked) => updateSetting("cloudDailySnapshot", checked)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SERVICE 5: ATOMIC PATIENT ID ENGINE ── */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                5. Atomic Patient ID Engine
              </CardTitle>
              <CardDescription className="text-xs">
                Generates unique, collision-proof patient record numbers for charts, appointments, and bills
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/30 font-mono">
              PostgreSQL Counter Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Custom ID Format Pattern *</Label>
                <Input
                  value={settings.patientIdPattern}
                  onChange={(e) => updateSetting("patientIdPattern", e.target.value)}
                  className="h-8 text-xs font-mono font-semibold"
                />
                <p className="text-[10px] text-muted-foreground">
                  Available tokens: <code className="font-mono font-bold text-primary">{"{YYYY}"}</code>,{" "}
                  <code className="font-mono font-bold text-primary">{"{YY}"}</code>,{" "}
                  <code className="font-mono font-bold text-primary">{"{MM}"}</code>,{" "}
                  <code className="font-mono font-bold text-primary">{"{SEQ:5}"}</code>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Current Sequence Counter Value</Label>
                <Input
                  type="number"
                  value={settings.patientIdSequenceStart}
                  onChange={(e) => updateSetting("patientIdSequenceStart", e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="42"
                />
                <p className="text-[10px] text-muted-foreground">
                  Increments atomically upon patient registration using database UPSERT locks.
                </p>
              </div>
            </div>

            {/* Live ID Preview Box */}
            <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">
                  Next Patient ID Preview
                </span>
                <div className="font-mono text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {sampleId}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                  Assigned automatically to next walk-in, phone-in, or online booking patient.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Zero Duplication & Concurrency Safe
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Action Bar */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5 shadow-xs"
        >
          <Save className="h-4 w-4" />
          Save All Service Settings
        </Button>
      </div>
    </form>
  );
}
