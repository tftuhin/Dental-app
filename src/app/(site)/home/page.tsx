import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Pill,
  Receipt,
  MessageSquare,
  BarChart3,
  Ruler,
  Crown,
  FileSignature,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import { CtaBand, PrimaryButton, SecondaryButton, Section, SectionHeading } from "@/components/site/blocks";
import { ProductPreview } from "@/components/site/product-preview";
import { COMPANY } from "@/site/config";

export const metadata: Metadata = {
  title: { absolute: `${COMPANY.product}: dental practice management software for Bangladesh` },
  description:
    "One system for the front desk, the doctor's room and the cash counter. Appointments with daily serials, dental charts, prescriptions with local medicine brands, bills with bKash and dues, and reminders that bring patients back.",
};

const VISIT = [
  {
    icon: CalendarDays,
    title: "Booked",
    text: "Online, by phone or at the desk. Each day gets its own serial numbers, and the next free slot is found for you.",
  },
  {
    icon: UserCheck,
    title: "Checked in",
    text: "Reception marks the patient as arrived and, if you want, takes the consultation fee there and then.",
  },
  {
    icon: Stethoscope,
    title: "Seen",
    text: "The doctor records the complaint, findings, X-rays and chart in one screen, with allergies shown up top.",
  },
  {
    icon: FileSignature,
    title: "Consent signed",
    text: "Before a procedure or surgery, a consent form is printed with the patient's details already filled in.",
  },
  {
    icon: Pill,
    title: "Prescribed",
    text: "Pick from Bangladeshi medicine brands. Allergy clashes are flagged and the follow-up visit is booked.",
  },
  {
    icon: Receipt,
    title: "Billed",
    text: "The bill builds itself from the visit. Part payments become dues, and receipts print in two copies.",
  },
];

const MODULES = [
  { icon: CalendarDays, title: "Appointments and queue", text: "Daily serials, check-in, no-shows and rescheduling." },
  { icon: ToothIcon, title: "Odontogram and perio chart", text: "Surface-level tooth chart and six-point probing." },
  { icon: Ruler, title: "Orthodontics", text: "Angle class, overjet, appliance plan and adjustment visits." },
  { icon: Crown, title: "Prosthodontics", text: "Crowns, bridges and dentures tracked through the lab." },
  { icon: Pill, title: "Prescriptions", text: "Local brands, dosage presets, printed on your letterhead." },
  { icon: Receipt, title: "Billing and dues", text: "Cash, bKash, Nagad and card. Dues and refunds included." },
  { icon: MessageSquare, title: "Reminders and campaigns", text: "SMS or WhatsApp, approved by the doctor before sending." },
  { icon: BarChart3, title: "Collections report", text: "Daily and monthly takings by doctor and by service." },
];

const LOCAL = [
  "Every amount in taka, with receipts that print the total in words",
  "bKash and Nagad payments recorded with their transaction ID",
  "More than 1,500 medicine brands sold in Bangladesh, already loaded",
  "BMDC registration numbers on prescriptions and certificates",
  "Reminders in Bangla or English, sent from your own phone if you like",
  "Works on the slow connection in the chamber: changes are kept and sent when the line comes back",
];

const FAQ_TEASER = [
  {
    q: "Do we need to install anything?",
    a: "No. DentalOS1 runs in Chrome, Edge or any modern browser, on the computers you already have. Each staff member signs in with their own account.",
  },
  {
    q: "Can reception and the doctors use it at the same time?",
    a: "Yes. Every computer in the clinic sees the same queue and records, and changes made at the desk show up in the doctor's room shortly after, without anyone refreshing the page.",
  },
  {
    q: "We don't do orthodontics. Can we hide that part?",
    a: "Yes. Odontogram, perio chart, orthodontics, prosthodontics, the AI assistant and consent forms can each be switched off in settings.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-teal-50 via-white to-white" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-sm font-medium text-teal-800">
              <ToothIcon className="h-4 w-4" />
              Dental practice software for Bangladesh
            </p>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
              Run your dental clinic from one screen, from booking to bill.
            </h1>
            <p className="text-lg leading-relaxed text-slate-600">
              DentalOS1 keeps the queue, the chart, the prescription and the payment together, so your front desk and your doctors stop passing
              paper back and forth. It is built around how clinics here really work: walk-ins, serial numbers, bKash payments, and patients who
              need a nudge to come back for the second sitting.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="/contact">
                Book a demo
                <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
              <SecondaryButton href="/features">See what it does</SecondaryButton>
            </div>
            <p className="text-sm text-slate-500">Runs in the browser. Nothing to install, nothing to back up yourself.</p>
          </div>
          <ProductPreview />
        </div>
      </section>

      {/* A visit, end to end */}
      <Section className="bg-slate-50">
        <SectionHeading
          eyebrow="How a visit flows"
          title="A patient's visit, without the paper trail"
          intro="Every step hands the patient on to the next one. Nobody has to re-type the name, the phone number or what the doctor did."
        />
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VISIT.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-slate-400">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* What changes */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-slate-900">The desk always knows who&apos;s next</h3>
            <p className="leading-relaxed text-slate-600">
              Online bookings land in the queue on their own. Patients who don&apos;t turn up are marked as no-shows three hours after their slot and
              can be rebooked from the same screen. The serial number on the screen is the one the patient was given.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-slate-900">Doctors write less and see more</h3>
            <p className="leading-relaxed text-slate-600">
              Symptom chips, quick diagnoses and dosage presets cut the typing. The patient&apos;s history, allergies, past prescriptions and charts
              sit beside the notes, not in a cabinet down the corridor.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-slate-900">You can see where the money went</h3>
            <p className="leading-relaxed text-slate-600">
              Every taka is tied to a visit and a payment method. Outstanding dues stay on the patient&apos;s file until they&apos;re paid, and the
              collections report splits the day by doctor and by type of work.
            </p>
          </div>
        </div>
      </Section>

      {/* Modules */}
      <Section className="bg-slate-50">
        <SectionHeading
          eyebrow="Everything in one place"
          title="The parts of the clinic it covers"
          intro="Use all of it, or switch off what your clinic doesn't need. Turning a section off hides it; nothing already recorded is lost."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <div key={m.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <m.icon className="h-6 w-6 text-teal-700" />
              <h3 className="mt-3 font-semibold text-slate-900">{m.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{m.text}</p>
            </div>
          ))}
        </div>
        <Link href="/features" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:underline">
          Read the full feature list
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Section>

      {/* Local */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Made for clinics here"
            title="The small details that foreign software gets wrong"
            intro="Most practice software is written for clinics in other countries and then translated. DentalOS1 starts from the way a chamber in Dhaka, Chattogram or Sylhet runs its day."
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {LOCAL.map((item) => (
              <li key={item} className="rounded-xl border border-slate-200 p-4 text-[15px] leading-relaxed text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Bringing patients back */}
      <Section className="bg-teal-900 text-white">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-300">Patients who come back</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">The second sitting is where a lot of treatment gets lost</h2>
            <p className="text-lg leading-relaxed text-teal-50">
              When the doctor finishes the prescription, they note what the patient needs next and roughly when: the crown after the root
              canal, the scaling in six months. If the patient hasn&apos;t come back by then, DentalOS1 drafts a reminder and asks the doctor to
              check it before it goes out by SMS or WhatsApp.
            </p>
          </div>
          <div className="space-y-3 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            {[
              ["Doctor plans", "Crown fitting on #36, around 15 December"],
              ["System waits", "Patient hasn't booked by 18 December"],
              ["Doctor approves", "Reviews the message on next sign-in"],
              ["Patient hears from you", "SMS in Bangla, from the clinic's own number"],
            ].map(([t, d], i) => (
              <div key={t} className="flex gap-4 rounded-xl bg-white/5 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-400 text-sm font-bold text-teal-950">{i + 1}</span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-teal-100">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Security teaser + FAQ */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <ShieldCheck className="h-8 w-8 text-teal-700" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Patient records stay with your clinic</h2>
            <p className="leading-relaxed text-slate-600">
              Each clinic&apos;s records are kept apart from every other clinic&apos;s. Staff sign in with their own accounts, connections are
              encrypted, and signing out clears the clinic&apos;s data from that computer.
            </p>
            <Link href="/security" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:underline">
              How we look after data
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Questions clinics ask first</h2>
            <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {FAQ_TEASER.map((f) => (
                <div key={f.q} className="py-5">
                  <dt className="font-semibold text-slate-900">{f.q}</dt>
                  <dd className="mt-1.5 leading-relaxed text-slate-600">{f.a}</dd>
                </div>
              ))}
            </dl>
            <Link href="/faq" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:underline">
              More questions and answers
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
