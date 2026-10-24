"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PeriodontalProbeIcon } from "@/components/icons/dental-icons";
import { Activity, AlertCircle, CheckCircle2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  ToothPerioState,
  getStoredPerioChart,
  saveStoredPerioChart,
  resetStoredPerioChart,
} from "@/lib/dental-chart-store";

export type { ToothPerioState };

interface PeriodontalChartProps {
  patientId?: string;
  initialData?: Record<number, ToothPerioState>;
  readOnly?: boolean;
}

export function PeriodontalChart({
  patientId = "DENT-2026-00042",
  initialData,
  readOnly = false,
}: PeriodontalChartProps) {
  const [activeArch, setActiveArch] = useState<"maxilla" | "mandible">("maxilla");
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Initialize from persistent store or initialData
  const [perioData, setPerioData] = useState<Record<number, ToothPerioState>>(() => {
    if (initialData) return initialData;
    return getStoredPerioChart(patientId);
  });

  // Re-sync when patientId or initialData changes
  useEffect(() => {
    if (initialData) {
      setPerioData(initialData);
      return;
    }
    const loaded = getStoredPerioChart(patientId);
    setPerioData(loaded);
  }, [patientId, initialData]);

  // Sync across tabs/components when perio chart updates
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ patientId: string }>;
      if (!customEvent.detail?.patientId || customEvent.detail.patientId === patientId) {
        setPerioData(getStoredPerioChart(patientId));
      }
    };

    window.addEventListener("dentai-perio-updated", handleSync);
    return () => window.removeEventListener("dentai-perio-updated", handleSync);
  }, [patientId]);

  // Calculate Periodontal Statistics
  const totalSites = 32 * 6;
  let bleedingSites = 0;
  let deepPockets = 0; // >= 4mm
  let severePockets = 0; // >= 6mm

  Object.values(perioData).forEach((tooth) => {
    tooth.bop.forEach((b) => {
      if (b) bleedingSites++;
    });
    tooth.probingDepths.forEach((d) => {
      if (d >= 4) deepPockets++;
      if (d >= 6) severePockets++;
    });
  });

  const bopPercentage = Math.round((bleedingSites / totalSites) * 100);
  const deepPocketsPercentage = Math.round((deepPockets / totalSites) * 100);

  const toggleBop = (toothNum: number, siteIndex: number) => {
    if (readOnly) return;
    setPerioData((prev) => {
      const tooth = prev[toothNum];
      const newBop = [...tooth.bop] as [boolean, boolean, boolean, boolean, boolean, boolean];
      newBop[siteIndex] = !newBop[siteIndex];
      const updated = {
        ...prev,
        [toothNum]: { ...tooth, bop: newBop },
      };
      // Auto-save to localStorage
      saveStoredPerioChart(patientId, updated);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      return updated;
    });
  };

  const updateDepth = (toothNum: number, siteIndex: number, delta: number) => {
    if (readOnly) return;
    setPerioData((prev) => {
      const tooth = prev[toothNum];
      const newDepths = [...tooth.probingDepths] as [number, number, number, number, number, number];
      const updated = Math.max(1, Math.min(12, newDepths[siteIndex] + delta));
      newDepths[siteIndex] = updated;
      const nextData = {
        ...prev,
        [toothNum]: { ...tooth, probingDepths: newDepths },
      };
      // Auto-save to localStorage
      saveStoredPerioChart(patientId, nextData);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      return nextData;
    });
  };

  const handleManualSave = () => {
    saveStoredPerioChart(patientId, perioData);
    setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    toast.success(`Periodontal probing chart saved for Patient #${patientId}`);
  };

  const handleResetChart = () => {
    const fresh = resetStoredPerioChart(patientId);
    setPerioData(fresh);
    setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    toast.info(`Periodontal chart reset to baseline for Patient #${patientId}`);
  };

  const teethToRender =
    activeArch === "maxilla"
      ? Array.from({ length: 16 }, (_, i) => i + 1)
      : Array.from({ length: 16 }, (_, i) => 32 - i);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PeriodontalProbeIcon className="h-5 w-5 text-teal-600" />
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">
                6-Point Periodontal Probing & Bleeding Chart
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                Patient: {patientId}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Distobuccal, Midbuccal, Mesiobuccal & Lingual sites with Bleeding on Probing (BOP)
            </p>
          </div>
        </div>

        {/* Arch Switcher & Save Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border p-0.5 bg-muted/40 text-xs">
            <button
              onClick={() => setActiveArch("maxilla")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeArch === "maxilla"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Maxilla (Teeth 1-16)
            </button>
            <button
              onClick={() => setActiveArch("mandible")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeArch === "mandible"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mandible (Teeth 17-32)
            </button>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-1.5 border-l pl-2">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono hidden sm:inline-flex">
                <CheckCircle2 className="h-3 w-3" />
                {lastSaved ? `Saved ${lastSaved}` : "Auto-saved"}
              </span>

              <Button
                type="button"
                size="sm"
                onClick={handleManualSave}
                className="h-7 px-2.5 text-xs font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
              >
                <Save className="h-3.5 w-3.5" />
                Save Chart
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleResetChart}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                title="Reset to baseline"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Perio Indices Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg border text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">BOP Score</span>
            <span className={`font-bold text-sm ${bopPercentage > 15 ? "text-red-600" : "text-emerald-600"}`}>
              {bopPercentage}% ({bleedingSites} sites)
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Pockets ≥ 4mm</span>
            <span className={`font-bold text-sm ${deepPockets > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {deepPocketsPercentage}% ({deepPockets} sites)
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Severe Pockets ≥ 6mm</span>
            <span className={`font-bold text-sm ${severePockets > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {severePockets} sites
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Periodontal Diagnosis</span>
            <span className="font-bold text-sm text-foreground">
              {severePockets > 0 ? "Stage III/IV Generalized" : deepPockets > 0 ? "Stage II Moderate" : "Intact Gingiva"}
            </span>
          </div>
        </div>

        {/* Teeth Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-1.5 overflow-x-auto pb-2">
          {teethToRender.map((toothNum) => {
            const tooth = perioData[toothNum];
            const hasSevere = tooth.probingDepths.some((d) => d >= 6);
            const hasDeep = tooth.probingDepths.some((d) => d >= 4);

            return (
              <div
                key={toothNum}
                className={`flex flex-col items-center p-1.5 rounded-lg border text-center transition-all ${
                  hasSevere
                    ? "border-red-400 bg-red-50/50 dark:bg-red-950/20"
                    : hasDeep
                    ? "border-amber-300 bg-amber-50/40 dark:bg-amber-950/20"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-xs font-bold text-foreground mb-1">
                  #{toothNum}
                </span>

                {/* Buccal Sites (DB, B, MB) */}
                <div className="w-full space-y-0.5 border-b pb-1 mb-1">
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground block">
                    Buccal
                  </span>
                  <div className="grid grid-cols-3 gap-0.5 text-center">
                    {[0, 1, 2].map((idx) => {
                      const depth = tooth.probingDepths[idx];
                      const bop = tooth.bop[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleBop(toothNum, idx)}
                          className="cursor-pointer group flex flex-col items-center"
                          title="Click to toggle BOP"
                        >
                          <span
                            className={`text-[11px] font-bold rounded px-0.5 ${
                              depth >= 6
                                ? "text-red-600 font-extrabold"
                                : depth >= 4
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {depth}
                          </span>
                          <span
                            className={`h-1.5 w-1.5 rounded-full mt-0.5 ${
                              bop ? "bg-red-500 animate-pulse" : "bg-transparent"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lingual Sites (DL, L, ML) */}
                <div className="w-full space-y-0.5">
                  <div className="grid grid-cols-3 gap-0.5 text-center">
                    {[3, 4, 5].map((idx) => {
                      const depth = tooth.probingDepths[idx];
                      const bop = tooth.bop[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleBop(toothNum, idx)}
                          className="cursor-pointer group flex flex-col items-center"
                          title="Click to toggle BOP"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full mb-0.5 ${
                              bop ? "bg-red-500 animate-pulse" : "bg-transparent"
                            }`}
                          />
                          <span
                            className={`text-[11px] font-bold rounded px-0.5 ${
                              depth >= 6
                                ? "text-red-600 font-extrabold"
                                : depth >= 4
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {depth}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground block pt-0.5">
                    Lingual
                  </span>
                </div>

                {/* Mobility / Furcation badge */}
                {(tooth.mobility > 0 || (tooth.furcation ?? 0) > 0) && (
                  <div className="mt-1 flex gap-1">
                    {tooth.mobility > 0 && (
                      <Badge variant="destructive" className="text-[8px] h-3.5 px-1 font-mono">
                        M{tooth.mobility}
                      </Badge>
                    )}
                    {(tooth.furcation ?? 0) > 0 && (
                      <Badge variant="secondary" className="text-[8px] h-3.5 px-1 font-mono">
                        F{tooth.furcation}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-muted-foreground">1-3mm</span>
            <span>Normal Sulcus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-amber-600">4-5mm</span>
            <span>Moderate Pocket</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-red-600">≥6mm</span>
            <span>Deep Periodontal Pocket</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>Bleeding on Probing (Click site to toggle)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
