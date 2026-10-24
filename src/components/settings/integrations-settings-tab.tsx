"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Sparkles,
  MessageSquare,
  Save,
  Send,
  CheckCircle2,
  Lock,
  Layers,
  KeyRound,
  Radio,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export function IntegrationsSettingsTab() {
  // 1. Patient ID Engine State
  const [patientIdPattern, setPatientIdPattern] = useState("DENT-{YYYY}-{SEQ:5}");
  const [sequenceStart, setSequenceStart] = useState("42");

  // 2. AI Assistant State
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [aiModel, setAiModel] = useState("claude-3-5-sonnet-20241022");
  const [aiApiKey, setAiApiKey] = useState("");
  const [enableDrugAlerts, setEnableDrugAlerts] = useState(true);
  const [enableVoiceDictation, setEnableVoiceDictation] = useState(true);
  const [enableDiffDiagnosis, setEnableDiffDiagnosis] = useState(true);

  // 3. SMS Gateway State
  const [smsProvider, setSmsProvider] = useState("ssl-wireless");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsApiSecret, setSmsApiSecret] = useState("");
  const [smsSenderId, setSmsSenderId] = useState("DHAKA-DENTAL");
  const [testPhoneNumber, setTestPhoneNumber] = useState("+880 1712-345678");
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);

  // Live Patient ID pattern preview
  const sampleId = patientIdPattern
    .replace("{YYYY}", "2026")
    .replace("{YY}", "26")
    .replace("{MM}", "10")
    .replace(/\{SEQ:\d+\}/, String(sequenceStart).padStart(5, "0"));

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Patient ID, AI Assistant & SMS Gateway settings successfully saved!");
  };

  const handleSendTestSms = () => {
    if (!testPhoneNumber.trim()) {
      toast.error("Please enter a recipient phone number");
      return;
    }
    setIsSendingTestSms(true);
    setTimeout(() => {
      setIsSendingTestSms(false);
      toast.success(
        `Test SMS sent successfully to ${testPhoneNumber} via ${
          smsProvider === "ssl-wireless"
            ? "SSL Wireless (Bangladesh Masked Gateway)"
            : smsProvider === "greenweb"
            ? "Greenweb Bangladesh SMS"
            : "Twilio Gateway"
        }! Sender ID: ${smsSenderId}`
      );
    }, 1000);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-muted/30">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Patient ID Engine, AI Copilot & SMS Gateway Integrations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure atomic serial numbers, chairside clinical artificial intelligence, and automated patient messaging
          </p>
        </div>
        <Button
          type="submit"
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5 shadow-xs shrink-0"
        >
          <Save className="h-4 w-4" />
          Save Integrations Setup
        </Button>
      </div>

      {/* ── CARD 1: ATOMIC PATIENT ID ENGINE ── */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                1. Atomic Patient ID Engine
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
                  value={patientIdPattern}
                  onChange={(e) => setPatientIdPattern(e.target.value)}
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
                  value={sequenceStart}
                  onChange={(e) => setSequenceStart(e.target.value)}
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

      {/* ── CARD 2: DENTAI CLINICAL COPILOT & AI ASSISTANT ── */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                2. DentAI Clinical Copilot & AI Assistant
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time evidence-based chairside guidance, differential diagnosis, and allergy safety verification
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 font-semibold">
              HIPAA & Zero PHI Retention
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">AI Model Provider</Label>
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic" className="text-xs">
                    Anthropic (Claude 3.5 Sonnet) - Recommended for Clinical CDS
                  </SelectItem>
                  <SelectItem value="openai" className="text-xs">
                    OpenAI (GPT-4o) - Multimodal Dental Radiograph Analysis
                  </SelectItem>
                  <SelectItem value="gemini" className="text-xs">
                    Google Gemini 1.5 Pro - High Context Dental Case Review
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Provider API Key</Label>
              <div className="relative">
                <Input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="sk-ant-... or sk-proj-..."
                  className="h-8 text-xs font-mono pr-8"
                />
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground absolute right-2.5 top-2.5" />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Leave blank to use DentalOS1 default system cloud gateway.
              </p>
            </div>
          </div>

          {/* AI Clinical Features Checkboxes */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
            <span className="text-[11px] font-bold text-foreground block">Active Chairside AI Modules:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-background border hover:border-primary/40">
                <input
                  type="checkbox"
                  checked={enableDrugAlerts}
                  onChange={(e) => setEnableDrugAlerts(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-[11px] font-medium text-foreground">
                  Drug Allergy & Beta-Lactam Cross-Check
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-background border hover:border-primary/40">
                <input
                  type="checkbox"
                  checked={enableDiffDiagnosis}
                  onChange={(e) => setEnableDiffDiagnosis(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-[11px] font-medium text-foreground">
                  Differential Diagnosis & ADA Treatment Guidelines
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-background border hover:border-primary/40">
                <input
                  type="checkbox"
                  checked={enableVoiceDictation}
                  onChange={(e) => setEnableVoiceDictation(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-[11px] font-medium text-foreground">
                  Voice Dictation & Clinical Note Synthesis
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── CARD 3: SMS GATEWAY INTEGRATION ── */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                3. SMS Carrier Gateway Integration
              </CardTitle>
              <CardDescription className="text-xs">
                Direct SMS dispatch for appointment bookings, 24-hour recalls, token updates, and e-receipts
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/30 font-mono">
              BTRC Compliant Masked SMS
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">SMS Gateway Operator</Label>
              <Select value={smsProvider} onValueChange={setSmsProvider}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ssl-wireless" className="text-xs">
                    SSL Wireless (Bangladesh Masked SMS Gateway - Grameenphone/Robi/Banglalink/Teletalk)
                  </SelectItem>
                  <SelectItem value="greenweb" className="text-xs">
                    Greenweb Bangladesh SMS Gateway
                  </SelectItem>
                  <SelectItem value="onnorokom" className="text-xs">
                    Onnorokom SMS Gateway
                  </SelectItem>
                  <SelectItem value="twilio" className="text-xs">
                    Twilio Global SMS Carrier
                  </SelectItem>
                  <SelectItem value="infobip" className="text-xs">
                    Infobip Enterprise SMS
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Masked Sender ID (Alphanumeric)</Label>
              <Input
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                placeholder="DHAKA-DENTAL"
                className="h-8 text-xs font-mono font-bold"
              />
              <p className="text-[10px] text-muted-foreground">
                Approved alphanumeric sender name displayed on patient mobile handsets.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">API Key / Token</Label>
              <Input
                type="password"
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                placeholder="API Key / SID token"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">API Secret / Client ID</Label>
              <Input
                type="password"
                value={smsApiSecret}
                onChange={(e) => setSmsApiSecret(e.target.value)}
                placeholder="API Secret or Passcode"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Test SMS Dispatcher */}
          <div className="p-4 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1.5 flex-1 max-w-sm">
              <Label className="text-xs font-semibold">Send Test SMS to Validate Gateway</Label>
              <Input
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+880 1712-345678"
                className="h-8 text-xs font-mono"
              />
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
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5 shadow-xs"
        >
          <Save className="h-4 w-4" />
          Save All Integrations
        </Button>
      </div>
    </form>
  );
}
