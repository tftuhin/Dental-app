"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { importOnlineBookings } from "@/lib/online-bookings";

const POLL_MS = 60_000;

/**
 * Brings bookings from the public booking page into this browser's queue:
 * on load, every minute, and whenever the tab regains focus.
 */
export function OnlineBookingSync() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (document.visibilityState === "hidden") return;
      const added = await importOnlineBookings();
      if (cancelled) return;
      for (const { appointment, isNewPatient, movedFromRequested, request } of added) {
        const when = `${appointment.date} at ${appointment.time}`;
        toast.success(`New online booking: ${appointment.patient}`, {
          description: [
            `${appointment.service} · ${when}`,
            movedFromRequested ? `(asked for ${request.preferredDate} ${request.preferredTime}, which was taken)` : "",
            isNewPatient ? `New patient ${appointment.patientId}` : `Returning patient ${appointment.patientId}`,
          ]
            .filter(Boolean)
            .join("\n"),
          duration: 10_000,
          action: {
            label: "View",
            onClick: () => {
              router.push(`/appointments?date=${appointment.date}`);
              window.dispatchEvent(new CustomEvent("dentai-show-queue-date", { detail: appointment.date }));
            },
          },
        });
      }
    };

    sync();
    const timer = window.setInterval(sync, POLL_MS);
    const onFocus = () => sync();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  return null;
}
