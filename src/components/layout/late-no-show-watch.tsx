"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { toastWithLink } from "@/lib/notifications-store";
import { markLateNoShows, NO_SHOW_AFTER_MINUTES } from "@/lib/clinical-flow-store";

const CHECK_MS = 60_000;

/**
 * Booked patients who haven't checked in 3 hours after their appointment
 * time are marked as no-shows: on load, every minute and on tab focus.
 */
export function LateNoShowWatch() {
  useEffect(() => {
    const check = () => {
      const marked = markLateNoShows();
      if (marked.length === 0) return;
      // Only announce today's; older days are just tidied up
      const today = new Date().toDateString();
      const recent = marked.filter((a) => a.date && new Date(`${a.date}T00:00:00`).toDateString() === today);
      if (recent.length === 0) return;
      toastWithLink("/appointments", () => toast.warning(
        recent.length === 1
          ? `${recent[0].patient} marked as no-show`
          : `${recent.length} patients marked as no-show`,
        {
          description: `Not checked in ${NO_SHOW_AFTER_MINUTES / 60} hours after the appointment time. ${recent
            .map((a) => `${a.patient} (${a.time})`)
            .slice(0, 3)
            .join(", ")}`,
          duration: 8_000,
        }
      ));
    };
    check();
    const timer = window.setInterval(check, CHECK_MS);
    window.addEventListener("focus", check);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, []);

  return null;
}
