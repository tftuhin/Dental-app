"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Odontogram } from "@/components/dental/odontogram";
import { PeriodontalChart } from "@/components/dental/perio-chart";
import { ToothIcon } from "@/components/icons/dental-icons";
import {
  Sparkles,
  AlertTriangle,
  FileCheck,
  Receipt,
  Save,
  Send,
  Loader2,
  Stethoscope,
  HeartPulse,
  Pill,
  Check,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface PatientContext {
  id: string;
  name: string;
  age: number;
  gender: string;
  customId: string;
  medicalAlerts: string[];
  currentMedications?: string;
  outstandingBalance: string;
}

const COMMON_SYMPTOMS = [
  "Spontaneous throbbing toothache",
  "Severe nocturnal pain",
  "Sharp sensitivity to cold/hot",
  "Pain upon chewing/percussion",
  "Localized gingival swelling",
  "Gingival bleeding during brushing",
  "Tooth mobility / looseness",
  "Esthetic dissatisfaction (discoloration)",
  "Fractured restoration / cusp",
  "TMJ clicking / crepitus",
  "Halitosis",
];

export function EncounterStudio({ patient }: { patient: PatientContext }) {
  // Clinical state
  const [chiefComplaint, setChiefComplaint] = useState(
    "Severe throbbing pain in lower left molar, awakens patient at night."
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    "Spontaneous throbbing toothache",
    "Severe nocturnal pain",
    "Pain upon chewing/percussion",
  ]);
  const [vitalSigns, setVitalSigns] = useState({
    bp: "125/82",
    pulse: "76",
    temp: "98.6",
  });
  const [soap, setSoap] = useState({
    subjective:
      "Patient reports intense lingering pain for 3 days in mandibular left quadrant, exacerbated by cold and hot liquids.",
    objective:
      "Tooth #19 presents with deep distal occlusal carious lesion. Positive to percussion and palpation. Prolonged lingering pain (>30s) on cold test. Periapical radiograph shows widened PDL space at distal root apex.",
    assessment:
      "1. Symptomatic Irreversible Pulpitis, Tooth #19 (ICD-10: K04.01)\n2. Symptomatic Apical Periodontitis, Tooth #19 (ICD-10: K04.4)",
    plan:
      "1. Non-surgical Root Canal Therapy on Tooth #19 (Pulpectomy initiated today)\n2. Post & Core with Full Ceramic Crown\n3. Analgesic and antibiotic therapy (Allergy check required)\n4. Review in 7 days for obturation",
  });

  const [activeTooth, setActiveTooth] = useState<number | null>(19);

  // Vercel AI SDK Copilot hook
  const {
    completion,
    complete,
    isLoading: isAiLoading,
  } = useCompletion({
    api: "/api/ai/copilot",
    onError: (err) => {
      toast.error("Failed to generate AI recommendations: " + err.message);
    },
    onFinish: () => {
      toast.success("DentAI Copilot recommendations ready!");
    },
  });

  const handleGenerateAiSuggestions = async () => {
    toast.info("Consulting DentAI Clinical Copilot...");
    await complete("", {
      body: {
        patient: {
          age: patient.age,
          gender: patient.gender,
          medicalAlerts: patient.medicalAlerts,
          currentMedications: patient.currentMedications,
        },
        symptoms: selectedSymptoms,
        chiefComplaint,
        clinicalNotes: `${soap.subjective}\n${soap.objective}`,
        activeTooth: activeTooth ? `#${activeTooth}` : undefined,
      },
    });
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const copyToSoapPlan = () => {
    if (!completion) return;
    setSoap((prev) => ({
      ...prev,
      plan: prev.plan + "\n\n[Copilot Recommendations]:\n" + completion,
    }));
    toast.success("Copilot recommendations appended to Clinical Plan!");
  };

  const hasAllergies = patient.medicalAlerts.some((a) =>
    a.toLowerCase().includes("allergy")
  );

  return (
    <div className="space-y-4">
      {/* ─── Patient Banner with Medical Alert Strip ─── */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {patient.name}
                </h2>
                <Badge variant="outline" className="text-xs">
                  {patient.customId}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {patient.age} yrs · {patient.gender} · Balance:{" "}
                <span className="font-semibold text-foreground">
                  {patient.outstandingBalance}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8">
              <Receipt className="mr-1.5 h-3.5 w-3.5" />
              Generate Invoice
            </Button>
            <Button size="sm" className="text-xs h-8 gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Save Encounter
            </Button>
          </div>
        </div>

        {/* Flashing Red Allergy Warning Banner if Allergies Exist */}
        {hasAllergies && (
          <div className="medical-alert-banner px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 animate-bounce" />
              <span>
                CRITICAL MEDICAL ALERT: {patient.medicalAlerts.join(" · ")}
              </span>
            </div>
            <span className="text-[11px] text-red-600/80 uppercase tracking-wider font-bold">
              Contraindications Active
            </span>
          </div>
        )}
      </Card>

      {/* ─── Main Clinical Workspace ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Clinical Charting & SOAP */}
        <div className="lg:col-span-7 space-y-4">
          <Tabs defaultValue="odontogram" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="odontogram" className="text-xs">
                Odontogram (Dental Chart)
              </TabsTrigger>
              <TabsTrigger value="periodontal" className="text-xs">
                Periodontal 6-Point
              </TabsTrigger>
              <TabsTrigger value="vitals" className="text-xs">
                Vitals & Symptoms
              </TabsTrigger>
            </TabsList>

            <TabsContent value="odontogram" className="mt-3">
              <Odontogram
                patientId={patient.customId || patient.id}
                onToothSelect={(num) => setActiveTooth(num)}
              />
            </TabsContent>

            <TabsContent value="periodontal" className="mt-3">
              <PeriodontalChart patientId={patient.customId || patient.id} />
            </TabsContent>

            <TabsContent value="vitals" className="mt-3">
              <Card className="border p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Blood Pressure</Label>
                    <Input
                      value={vitalSigns.bp}
                      onChange={(e) =>
                        setVitalSigns({ ...vitalSigns, bp: e.target.value })
                      }
                      className="text-xs h-8 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Pulse (bpm)</Label>
                    <Input
                      value={vitalSigns.pulse}
                      onChange={(e) =>
                        setVitalSigns({ ...vitalSigns, pulse: e.target.value })
                      }
                      className="text-xs h-8 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Temperature (°F)</Label>
                    <Input
                      value={vitalSigns.temp}
                      onChange={(e) =>
                        setVitalSigns({ ...vitalSigns, temp: e.target.value })
                      }
                      className="text-xs h-8 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold block mb-2">
                    Presenting Symptoms Checklist
                  </Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {COMMON_SYMPTOMS.map((symptom) => (
                      <div
                        key={symptom}
                        className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          id={symptom}
                          checked={selectedSymptoms.includes(symptom)}
                          onCheckedChange={() => toggleSymptom(symptom)}
                        />
                        <label
                          htmlFor={symptom}
                          className="cursor-pointer text-xs font-medium leading-none"
                        >
                          {symptom}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* SOAP Clinical Documentation */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                SOAP Clinical Progress Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-xs font-semibold text-primary">
                  Subjective (Chief Complaint & History of Present Illness)
                </Label>
                <Textarea
                  value={soap.subjective}
                  onChange={(e) =>
                    setSoap({ ...soap, subjective: e.target.value })
                  }
                  rows={2}
                  className="text-xs mt-1 leading-relaxed"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-primary">
                  Objective (Clinical Findings, Tests, Radiographs)
                </Label>
                <Textarea
                  value={soap.objective}
                  onChange={(e) =>
                    setSoap({ ...soap, objective: e.target.value })
                  }
                  rows={3}
                  className="text-xs mt-1 leading-relaxed"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-primary">
                  Assessment (Differential & Confirmed Diagnoses)
                </Label>
                <Textarea
                  value={soap.assessment}
                  onChange={(e) =>
                    setSoap({ ...soap, assessment: e.target.value })
                  }
                  rows={2}
                  className="text-xs mt-1 leading-relaxed"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-primary">
                  Plan (Procedures, Prescriptions, Referrals & Follow-Up)
                </Label>
                <Textarea
                  value={soap.plan}
                  onChange={(e) => setSoap({ ...soap, plan: e.target.value })}
                  rows={3}
                  className="text-xs mt-1 leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols): DentAI Clinical Copilot */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-primary/30 shadow-md bg-gradient-to-b from-card to-primary/5">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    DentAI Clinical Copilot
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Evidence-Based AI Chairside Decision Support
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                Allergy Safe
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generates instant differential diagnoses, CDT procedures, and allergy-vetted pharmacotherapy based on patient age ({patient.age}), medical alerts, and tooth #{activeTooth}.
              </p>

              <Button
                onClick={handleGenerateAiSuggestions}
                disabled={isAiLoading}
                className="w-full gap-2 text-xs font-semibold shadow-sm"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing Clinical Data & Allergies...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Differential & Treatment Recommendations
                  </>
                )}
              </Button>

              {/* Streaming AI Result Window */}
              {(completion || isAiLoading) && (
                <div className="mt-3 p-3.5 rounded-lg border bg-background/80 shadow-inner space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Clinical Recommendations
                    </span>
                    {completion && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                        onClick={copyToSoapPlan}
                      >
                        <Copy className="h-3 w-3" />
                        Append to Plan
                      </Button>
                    )}
                  </div>

                  <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto pr-1">
                    {completion}
                    {isAiLoading && (
                      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
