"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getClinicSetup } from "@/lib/clinic-setup-store";

const EVENT = "dentai-clinic-setup-updated";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/**
 * Clinic name for the shell. Without a database the server only knows
 * "My Clinic", so fall back to the name saved in Settings → Clinic Setup.
 */
export function useClinicName(serverName: string): string {
  const getSnapshot = useCallback(
    () => (serverName === "My Clinic" ? getClinicSetup().name || serverName : serverName),
    [serverName]
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => serverName);
}
