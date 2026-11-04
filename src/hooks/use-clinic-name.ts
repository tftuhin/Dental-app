"use client";

import { useEffect, useState } from "react";
import { getClinicSetup } from "@/lib/clinic-setup-store";

/**
 * Clinic name for the shell. Without a database the server only knows
 * "My Clinic", so fall back to the name saved in Settings → Clinic Setup.
 */
export function useClinicName(serverName: string): string {
  const [name, setName] = useState(serverName);
  useEffect(() => {
    if (serverName !== "My Clinic") return;
    const load = () => setName(getClinicSetup().name || serverName);
    load();
    window.addEventListener("dentai-clinic-setup-updated", load);
    return () => window.removeEventListener("dentai-clinic-setup-updated", load);
  }, [serverName]);
  return name;
}
