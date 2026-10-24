"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToothIcon } from "@/components/icons/dental-icons";
import { Sparkles, RefreshCw, ZoomIn, Info, CheckCircle2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  SurfaceType,
  SurfaceCondition,
  ToothCondition,
  ToothState,
  FDI_MAP,
  CONDITION_COLORS,
  getStoredOdontogram,
  saveStoredOdontogram,
  resetStoredOdontogram,
} from "@/lib/dental-chart-store";

export type { SurfaceType, SurfaceCondition, ToothCondition, ToothState };
export { FDI_MAP, CONDITION_COLORS };

interface OdontogramProps {
  patientId?: string;
  initialChart?: Record<number, ToothState>;
  onToothSelect?: (toothNumber: number) => void;
  onSurfaceChange?: (toothNumber: number, surface: SurfaceType, condition: SurfaceCondition) => void;
  readOnly?: boolean;
}

export function Odontogram({
  patientId = "DENT-2026-00042",
  initialChart,
  onToothSelect,
  onSurfaceChange,
  readOnly = false,
}: OdontogramProps) {
  const [notation, setNotation] = useState<"universal" | "fdi">("universal");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<SurfaceCondition>("caries");
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Initialize all 32 teeth from persistent store or initialChart
  const [teeth, setTeeth] = useState<Record<number, ToothState>>(() => {
    if (initialChart) return initialChart;
    return getStoredOdontogram(patientId);
  });

  // Re-sync when patientId or initialChart changes
  useEffect(() => {
    if (initialChart) {
      setTeeth(initialChart);
      return;
    }
    const loaded = getStoredOdontogram(patientId);
    setTeeth(loaded);
  }, [patientId, initialChart]);

  // Sync across tabs/components when odontogram updates
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ patientId: string }>;
      if (!customEvent.detail?.patientId || customEvent.detail.patientId === patientId) {
        setTeeth(getStoredOdontogram(patientId));
      }
    };

    window.addEventListener("dentai-odontogram-updated", handleSync);
    return () => window.removeEventListener("dentai-odontogram-updated", handleSync);
  }, [patientId]);

  const handleSurfaceClick = (toothNum: number, surface: SurfaceType) => {
    if (readOnly) return;
    setTeeth((prev) => {
      const current = prev[toothNum];
      const newCondition = current.surfaces[surface] === activeTool ? "sound" : activeTool;
      const updated = {
        ...prev,
        [toothNum]: {
          ...current,
          surfaces: {
            ...current.surfaces,
            [surface]: newCondition,
          },
        },
      };
      // Auto-save to localStorage
      saveStoredOdontogram(patientId, updated);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      if (onSurfaceChange) onSurfaceChange(toothNum, surface, newCondition);
      return updated;
    });
  };

  const handleToothClick = (toothNum: number) => {
    setSelectedTooth(toothNum);
    if (onToothSelect) onToothSelect(toothNum);
  };

  const setOverallToothCondition = (toothNum: number, cond: ToothCondition) => {
    if (readOnly) return;
    setTeeth((prev) => {
      const updated = {
        ...prev,
        [toothNum]: {
          ...prev[toothNum],
          condition: cond,
        },
      };
      // Auto-save to localStorage
      saveStoredOdontogram(patientId, updated);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      return updated;
    });
  };

  const handleManualSave = () => {
    saveStoredOdontogram(patientId, teeth);
    setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    toast.success(`Dental chart saved for Patient #${patientId}`);
  };

  const handleResetChart = () => {
    const fresh = resetStoredOdontogram(patientId);
    setTeeth(fresh);
    setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    toast.info(`Odontogram chart reset to baseline for Patient #${patientId}`);
  };

  // Render individual 5-surface anatomically-proportioned tooth SVG
  const renderToothSVG = (toothNum: number) => {
    const tooth = teeth[toothNum];
    const isSelected = selectedTooth === toothNum;
    const isMaxillary = toothNum <= 16;
    const isMolarOrPremolar =
      (toothNum >= 1 && toothNum <= 5) ||
      (toothNum >= 12 && toothNum <= 21) ||
      (toothNum >= 28 && toothNum <= 32);

    const label = notation === "universal" ? tooth.number : tooth.fdiNumber;

    return (
      <div
        key={toothNum}
        onClick={() => handleToothClick(toothNum)}
        className={`relative flex flex-col items-center p-1 rounded-md transition-all cursor-pointer ${
          isSelected
            ? "ring-2 ring-primary bg-primary/10 shadow-sm"
            : "hover:bg-muted/50"
        } ${tooth.condition === "missing" ? "opacity-30" : ""}`}
      >
        {/* Upper Arch Tooth Number on Top, Lower Arch on Bottom */}
        {isMaxillary && (
          <span className="text-[10px] font-bold text-muted-foreground mb-0.5">
            {label}
          </span>
        )}

        {/* 5-Surface Tooth SVG representation */}
        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Buccal/Facial (Top in diagram) */}
            <polygon
              points="15,15 85,15 70,30 30,30"
              fill={CONDITION_COLORS[tooth.surfaces.buccal]}
              stroke="#64748b"
              strokeWidth="2"
              className="tooth-surface"
              onClick={(e) => {
                e.stopPropagation();
                handleSurfaceClick(toothNum, "buccal");
              }}
            />

            {/* Lingual/Palatal (Bottom in diagram) */}
            <polygon
              points="30,70 70,70 85,85 15,85"
              fill={CONDITION_COLORS[tooth.surfaces.lingual]}
              stroke="#64748b"
              strokeWidth="2"
              className="tooth-surface"
              onClick={(e) => {
                e.stopPropagation();
                handleSurfaceClick(toothNum, "lingual");
              }}
            />

            {/* Mesial (Left or Right depending on quadrant) */}
            <polygon
              points="15,15 30,30 30,70 15,85"
              fill={CONDITION_COLORS[tooth.surfaces.mesial]}
              stroke="#64748b"
              strokeWidth="2"
              className="tooth-surface"
              onClick={(e) => {
                e.stopPropagation();
                handleSurfaceClick(toothNum, "mesial");
              }}
            />

            {/* Distal */}
            <polygon
              points="85,15 70,30 70,70 85,85"
              fill={CONDITION_COLORS[tooth.surfaces.distal]}
              stroke="#64748b"
              strokeWidth="2"
              className="tooth-surface"
              onClick={(e) => {
                e.stopPropagation();
                handleSurfaceClick(toothNum, "distal");
              }}
            />

            {/* Center: Occlusal (or Incisal for anterior) */}
            <rect
              x="30"
              y="30"
              width="40"
              height="40"
              fill={CONDITION_COLORS[tooth.surfaces.occlusal]}
              stroke="#64748b"
              strokeWidth="2"
              className="tooth-surface"
              onClick={(e) => {
                e.stopPropagation();
                handleSurfaceClick(toothNum, "occlusal");
              }}
            />

            {/* Condition Overlays */}
            {tooth.condition === "rct" && (
              <line
                x1="20"
                y1="50"
                x2="80"
                y2="50"
                stroke="#a855f7"
                strokeWidth="6"
                strokeDasharray="4 2"
              />
            )}
            {tooth.condition === "crown" && (
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#d97706"
                strokeWidth="4"
              />
            )}
            {tooth.condition === "implant" && (
              <path
                d="M40 25 L60 25 L55 75 L45 75 Z"
                fill="#0284c7"
                stroke="#0369a1"
                strokeWidth="2"
              />
            )}
            {tooth.condition === "missing" && (
              <path
                d="M15 15 L85 85 M85 15 L15 85"
                stroke="#ef4444"
                strokeWidth="5"
                opacity="0.8"
              />
            )}
          </svg>
        </div>

        {/* Lower Arch Tooth Number on Bottom */}
        {!isMaxillary && (
          <span className="text-[10px] font-bold text-muted-foreground mt-0.5">
            {label}
          </span>
        )}
      </div>
    );
  };

  // Group teeth into Upper (Maxilla 1-16) and Lower (Mandible 17-32)
  const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 1);
  const lowerTeeth = Array.from({ length: 16 }, (_, i) => 32 - i); // Lower arch ordered 32 down to 17

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ToothIcon className="h-5 w-5 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">Interactive Odontogram</CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                Patient: {patientId}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Click individual tooth surfaces to annotate caries, restorations, or crowns
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Notation Toggle */}
          <div className="flex rounded-md border p-0.5 bg-muted/40 text-xs">
            <button
              onClick={() => setNotation("universal")}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                notation === "universal"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Universal (1-32)
            </button>
            <button
              onClick={() => setNotation("fdi")}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                notation === "fdi"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              FDI Two-Digit
            </button>
          </div>

          {/* Active Tool Selector */}
          {!readOnly && (
            <div className="flex items-center gap-1 border-l pl-2">
              <span className="text-xs text-muted-foreground mr-1">Tool:</span>
              <Button
                size="sm"
                variant={activeTool === "caries" ? "default" : "outline"}
                className={`h-7 px-2 text-xs gap-1 ${
                  activeTool === "caries" ? "bg-red-600 hover:bg-red-700" : ""
                }`}
                onClick={() => setActiveTool("caries")}
              >
                <div className="w-2 h-2 rounded-full bg-red-400" />
                Caries
              </Button>
              <Button
                size="sm"
                variant={activeTool === "restoration" ? "default" : "outline"}
                className={`h-7 px-2 text-xs gap-1 ${
                  activeTool === "restoration" ? "bg-blue-600 hover:bg-blue-700" : ""
                }`}
                onClick={() => setActiveTool("restoration")}
              >
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                Restoration
              </Button>
              <Button
                size="sm"
                variant={activeTool === "planned" ? "default" : "outline"}
                className={`h-7 px-2 text-xs gap-1 ${
                  activeTool === "planned" ? "bg-amber-600 hover:bg-amber-700" : ""
                }`}
                onClick={() => setActiveTool("planned")}
              >
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                Planned
              </Button>
            </div>
          )}

          {/* Save Status & Action Controls */}
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
                className="h-7 px-2.5 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
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

      <CardContent className="p-4 space-y-6">
        {/* Upper Maxillary Arch */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-2">
            <span>Maxillary Right (Q1)</span>
            <span className="uppercase tracking-wider font-bold">Maxilla (Upper Arch)</span>
            <span>Maxillary Left (Q2)</span>
          </div>
          <div className="flex items-center justify-start md:justify-center gap-1 sm:gap-1.5 overflow-x-auto px-2 py-2 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border scrollbar-thin">
            {upperTeeth.map((num) => renderToothSVG(num))}
          </div>
        </div>

        {/* Arch Divider Line */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-dashed border-muted-foreground/30" />
          <span className="absolute bg-card px-3 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
            Occlusal Plane
          </span>
        </div>

        {/* Lower Mandibular Arch */}
        <div className="space-y-1">
          <div className="flex items-center justify-start md:justify-center gap-1 sm:gap-1.5 overflow-x-auto px-2 py-2 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border scrollbar-thin">
            {lowerTeeth.map((num) => renderToothSVG(num))}
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-2">
            <span>Mandibular Right (Q4)</span>
            <span className="uppercase tracking-wider font-bold">Mandible (Lower Arch)</span>
            <span>Mandibular Left (Q3)</span>
          </div>
        </div>

        {/* Selected Tooth Quick Context Inspector */}
        {selectedTooth && (
          <div className="mt-4 p-3 rounded-lg border bg-muted/30 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
                #{notation === "universal" ? selectedTooth : FDI_MAP[selectedTooth]}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Tooth #{selectedTooth} ({notation === "universal" ? `FDI: ${FDI_MAP[selectedTooth]}` : `Universal: ${selectedTooth}`})
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Condition: <strong className="capitalize text-foreground">{teeth[selectedTooth].condition}</strong> · 
                  Surfaces: {Object.entries(teeth[selectedTooth].surfaces)
                    .filter(([_, v]) => v !== "sound")
                    .map(([k, v]) => `${k} (${v})`)
                    .join(", ") || "Sound"}
                </p>
              </div>
            </div>

            {!readOnly && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setOverallToothCondition(selectedTooth, "crown")}
                >
                  Crown
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setOverallToothCondition(selectedTooth, "rct")}
                >
                  RCT
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setOverallToothCondition(selectedTooth, "implant")}
                >
                  Implant
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-red-600 hover:text-red-700"
                  onClick={() => setOverallToothCondition(selectedTooth, "missing")}
                >
                  Missing
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setOverallToothCondition(selectedTooth, "present")}
                >
                  Reset
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
