"use client";

import { useCompletion } from "@ai-sdk/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Copy, Loader2, ShieldAlert, Sparkles, Stethoscope } from "lucide-react";
import { toast } from "sonner";

export interface CopilotPanelProps {
  patient: { name: string; age: number; gender: string; alerts: string[] };
  complaint: string;
  symptoms: string[];
  notes: string;
  targetTooth: string;
  vitals: { bp: string; pulse: string; bloodSugar: string };
  findings: { percussion: string; coldTest: string; mobility: string };
  /** Append the AI text to the session's clinical notes. */
  onAppendToNotes: (text: string) => void;
}

/**
 * AI clinical decision support for the notes screen. Kept in its own module
 * (loaded on demand) so the AI SDK isn't part of the Appointments page bundle.
 */
export default function CopilotPanel({
  patient,
  complaint,
  symptoms,
  notes,
  targetTooth,
  vitals,
  findings,
  onAppendToNotes,
}: CopilotPanelProps) {
  const { completion, complete, isLoading } = useCompletion({
    api: "/api/ai/copilot",
    onError: (err) => toast.error("AI recommendations failed: " + err.message),
    onFinish: () => toast.success("AI recommendations ready."),
  });

  const generate = async () => {
    await complete("", {
      body: {
        patient: {
          age: patient.age,
          gender: patient.gender,
          medicalAlerts: patient.alerts,
          currentMedications: "",
        },
        symptoms,
        chiefComplaint: complaint,
        clinicalNotes: `${notes}\nPhysical Examination: Percussion=${findings.percussion}, Cold Vitality=${findings.coldTest}, Mobility=${findings.mobility}`,
        activeTooth: targetTooth,
      },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="col-span-12 lg:col-span-5">
        <Card className="shadow-xs">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Clinical decision support
            </CardTitle>
            <CardDescription className="text-xs">Suggestions for the doctor to review, not a diagnosis.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs">
              <p className="font-medium">{patient.name}</p>
              <p className="text-muted-foreground">
                {patient.age} yrs · {patient.gender}
                {targetTooth && <> · Tooth <span className="font-mono">{targetTooth}</span></>}
              </p>
              {(vitals.bp || vitals.pulse) && (
                <p className="text-muted-foreground">
                  {[vitals.bp && `BP ${vitals.bp}`, vitals.pulse && `Pulse ${vitals.pulse}`, vitals.bloodSugar && `RBS ${vitals.bloodSugar}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {patient.alerts.length > 0 && (
                <p className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  {patient.alerts.join(", ")}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Complaint</Label>
              <p className="rounded-md border bg-background p-2 text-xs text-muted-foreground">
                {complaint || "Not recorded yet"}
              </p>
            </div>

            {symptoms.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {symptoms.map((s) => (
                  <Badge key={s} variant="outline" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            )}

            <Button type="button" onClick={generate} disabled={isLoading} className="w-full gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isLoading ? "Analysing…" : "Suggest diagnoses & treatment"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-7">
        <Card className="shadow-xs h-full flex flex-col">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              Recommendations
            </CardTitle>
            {completion && !isLoading && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  onAppendToNotes(completion);
                  toast.success("Added to clinical notes.");
                }}
                className="gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                Add to notes
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col">
            {completion || isLoading ? (
              <div className="flex-1 max-h-[500px] overflow-y-auto rounded-lg border bg-muted/20 p-3.5">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {completion}
                  {isLoading && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-primary align-middle" />}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                <Sparkles className="mb-2 h-5 w-5" />
                Record the complaint and findings, then ask for suggestions.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
