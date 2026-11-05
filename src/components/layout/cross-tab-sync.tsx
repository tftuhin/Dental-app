"use client";

import { useEffect } from "react";

// Clinic data lives in localStorage. When another tab changes it, the browser
// fires a "storage" event here; re-broadcast it as the store's own update
// event so every open page reloads its copy. Without this, a page holding an
// older copy of the queue could save over changes made in another tab.
const KEY_EVENTS: Record<string, string> = {
  dentai_appointments_patient_queue_v2: "dentai-appointments-updated",
  "dentalos1-patients-registry-v1": "dentalos1-patients-updated",
  dentai_patient_timelines_v2: "dentai-timeline-updated",
  dentai_clinic_setup_v1: "dentai-clinic-setup-updated",
  dentalos1_procedure_catalog_v1: "dentalos1-catalog-updated",
  dentai_medications_catalog_v3: "dentai-medications-updated",
  dentai_investigations_catalog_v2: "dentai-investigations-updated",
};

export function CrossTabSync() {
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage) return;
      const events = e.key ? [KEY_EVENTS[e.key]].filter(Boolean) : Object.values(KEY_EVENTS);
      for (const name of events) window.dispatchEvent(new Event(name));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
