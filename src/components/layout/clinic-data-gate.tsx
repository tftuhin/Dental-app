"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AlertTriangle, CloudOff, Loader2, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  announceAllStores,
  getSyncStatus,
  importBrowserData,
  initClinicStorage,
  subscribeSyncStatus,
  type SyncStatus,
} from "@/lib/clinic-storage";
import { importBrowserMedicines } from "@/lib/medicines-store";
import { INITIAL_PATIENTS } from "@/lib/patients-store";
import { INITIAL_APPOINTMENTS, INITIAL_TIMELINE_EVENTS } from "@/lib/clinical-flow-store";

/** Sample records from the local demo: never copied into a real clinic's database. */
function sampleIds(): Record<string, Set<string>> {
  return {
    patients: new Set(INITIAL_PATIENTS.map((p) => p.id)),
    appointments: new Set(INITIAL_APPOINTMENTS.map((a) => a.id)),
    timeline: new Set(INITIAL_TIMELINE_EVENTS.map((e) => e.id)),
  };
}

type GateState = { kind: "loading" } | { kind: "ready" } | { kind: "error"; message: string };

/**
 * Loads the clinic's data (from the database, or this browser in the local
 * demo) before rendering pages, so every page reads complete records.
 */
export function ClinicDataGate({ storageKey, children }: { storageKey: string; children: React.ReactNode }) {
  const [state, setState] = useState<GateState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    initClinicStorage(storageKey)
      .then((res) => {
        if (cancelled) return;
        if (res.mode === "server") {
          const moved = importBrowserData(sampleIds()) + importBrowserMedicines();
          if (moved > 0) {
            toast.success(`Moved ${moved} record${moved === 1 ? "" : "s"} from this computer into the clinic database.`);
          }
        } else {
          importBrowserMedicines();
          if (res.reason === "no-clinic") {
            toast.warning("Your account isn't linked to a clinic, so data is saved only on this computer.");
          }
        }
        setState({ kind: "ready" });
        // Parts of the shell rendered before the data arrived: let them reload
        announceAllStores();
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Could not load clinic data:", err);
        setState({ kind: "error", message: "Could not load the clinic's data. Check the internet connection." });
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey, attempt]);

  // Tell the user when the server refused a change (e.g. an attachment too large)
  useEffect(() => {
    const onRejected = (e: Event) => toast.error(String((e as CustomEvent).detail || "A change could not be saved."));
    window.addEventListener("dentalos1-sync-rejected", onRejected);
    return () => window.removeEventListener("dentalos1-sync-rejected", onRejected);
  }, []);

  if (state.kind === "ready") return <>{children}</>;

  if (state.kind === "error") {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm">
        <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-destructive" />
        <p className="font-semibold">{state.message}</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-4 gap-1.5"
          onClick={() => {
            setState({ kind: "loading" });
            setAttempt((n) => n + 1);
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground" role="status">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading clinic data…
    </div>
  );
}

const SERVER_STATUS: SyncStatus = { mode: "loading", state: "idle", pending: 0 };

/** Small header badge: whether changes are saved to the clinic database. */
export function SyncStatusBadge() {
  const s = useSyncExternalStore(subscribeSyncStatus, getSyncStatus, () => SERVER_STATUS);
  if (s.mode !== "server") return null;

  if (s.state === "offline" || s.state === "error") {
    return (
      <span
        className="hidden items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 sm:inline-flex"
        title={s.message}
        role="status"
      >
        <CloudOff className="h-3 w-3" />
        {s.state === "error" ? "Not saved" : "Offline"}
        {s.pending > 0 ? ` · ${s.pending} waiting` : ""}
      </span>
    );
  }
  if (s.state === "saving") {
    return (
      <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex" role="status">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  return (
    <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex" role="status">
      <Check className="h-3 w-3 text-emerald-600" />
      Saved
    </span>
  );
}
