"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, FileSignature, MessageSquare, Pill, Receipt } from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import { BillMock, ConsentMock, MockWindow, OdontogramMock, PhoneMock, PrescriptionMock, QueueMock } from "./mocks";

const STEPS = [
  {
    key: "queue",
    icon: CalendarDays,
    label: "Queue",
    title: "Reception sees the whole day at a glance",
    text: "Walk-ins, phone bookings and online requests share one list with daily serial numbers. Check a patient in and the doctor's screen updates on its own.",
    mock: <QueueMock />,
    url: "Appointments",
  },
  {
    key: "chart",
    icon: ToothIcon,
    label: "Chart",
    title: "The doctor charts as they examine",
    text: "Tap tooth surfaces to mark caries, restorations or planned treatment. Findings, vitals and X-rays sit in the same visit record, with allergies shown before anything else.",
    mock: <OdontogramMock />,
    url: "Visit · Odontogram",
  },
  {
    key: "consent",
    icon: FileSignature,
    label: "Consent",
    title: "Consent, printed and signed before treatment",
    text: "The form fills itself with the patient's details, the procedure, tooth and cost, and fits one A4 page. The patient moves on once both signatures are confirmed.",
    mock: <ConsentMock />,
    url: "Consent form",
  },
  {
    key: "rx",
    icon: Pill,
    label: "Prescription",
    title: "Prescriptions in local brands, with a safety net",
    text: "Pick from over 1,500 medicines sold in Bangladesh, dosed the way you write them. Or let the AI draft it from the visit. Allergy clashes are flagged, and the follow-up visit is booked as you sign.",
    mock: <PrescriptionMock />,
    url: "Prescription",
  },
  {
    key: "bill",
    icon: Receipt,
    label: "Billing",
    title: "The bill builds itself from the visit",
    text: "Everything the doctor did is already on the invoice. Take cash, bKash, Nagad or card, leave the rest as a due, and print receipts in two copies.",
    mock: <BillMock />,
    url: "Billing",
  },
  {
    key: "remind",
    icon: MessageSquare,
    label: "Reminder",
    title: "And the patient comes back for the next sitting",
    text: "When a planned treatment is overdue, a reminder is drafted for the doctor to approve. It goes out by SMS or WhatsApp from your clinic's own number, in Bangla or English.",
    mock: <PhoneMock />,
    url: "",
  },
];

/** Home page: step through a visit, with an illustration of each screen. */
export function VisitShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const step = STEPS[active];

  // Moves on by itself until someone picks a step
  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <div role="tablist" aria-label="Steps of a visit" className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-controls="visit-panel"
              onClick={() => {
                setActive(i);
                setPaused(true);
              }}
              className={`group flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all ${
                active === i
                  ? "border-teal-600 bg-teal-600 text-white shadow-lg shadow-teal-600/25"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-800"
              }`}
            >
              <s.icon className="h-5 w-5" />
              {s.label}
            </button>
          ))}
        </div>
        <div key={step.key} className="site-fade-in mt-8 space-y-3">
          <p className="font-display text-sm font-semibold text-teal-700">
            Step {active + 1} of {STEPS.length}
          </p>
          <h3 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{step.title}</h3>
          <p className="text-lg leading-relaxed text-slate-600">{step.text}</p>
        </div>
        <div className="mt-8 h-1 overflow-hidden rounded-full bg-slate-100" aria-hidden>
          <div className="h-full rounded-full bg-teal-600 transition-all duration-500" style={{ width: `${((active + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>
      <div id="visit-panel" role="tabpanel" key={step.key} className="site-fade-in">
        {step.url ? <MockWindow title={`app · ${step.url}`}>{step.mock}</MockWindow> : <div className="rounded-2xl">{step.mock}</div>}
      </div>
    </div>
  );
}

/**
 * Fades content up as it scrolls into view. Content is visible by default
 * (no JavaScript, search engines, screenshots); only blocks that start below
 * the screen are hidden and then faded in. Skipped for reduced motion.
 */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it
    const raf = requestAnimationFrame(() => setHidden(true));
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setHidden(false);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${hidden ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"} ${className}`}
      style={{ transitionDelay: hidden ? "0ms" : `${delay}ms` }}
    >
      {children}
    </div>
  );
}
