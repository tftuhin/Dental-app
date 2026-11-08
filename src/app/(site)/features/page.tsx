import type { Metadata } from "next";
import { CalendarDays, Stethoscope, Pill, Receipt, MessageSquare, FolderOpen, SlidersHorizontal, Cloud, FileSignature } from "lucide-react";
import { CheckList, CtaBand, PageIntro, Section } from "@/components/site/blocks";

export const metadata: Metadata = {
  title: "Features",
  description:
    "What DentalOS1 does at the front desk, in the doctor's room and at the cash counter: queue and serials, dental charts, consent forms, prescriptions, billing with dues and refunds, and patient reminders.",
};

const AREAS = [
  {
    id: "front-desk",
    icon: CalendarDays,
    title: "Front desk and appointments",
    lead:
      "The queue is the heart of a busy chamber. DentalOS1 gives each day its own serial numbers and keeps every computer in the clinic looking at the same list.",
    points: [
      "Book walk-ins, phone calls and online requests from one form, with returning patients found by name, ID or phone number",
      "The next free slot for the chosen doctor is suggested, respecting opening hours and the lunch break",
      "A public booking page for your clinic: patients pick a date and time, and the request drops into your queue",
      "Check patients in when they arrive and, if you prefer, collect the consultation fee at the desk",
      "Patients who haven't checked in three hours after their slot are marked as no-shows and can be rebooked in one step",
      "Move between days with the arrow keys to see who is coming tomorrow or who was missed yesterday",
    ],
  },
  {
    id: "clinical",
    icon: Stethoscope,
    title: "In the doctor's room",
    lead:
      "Everything about the patient in front of you, on one screen: complaint, findings, vitals, X-rays and charts, with allergies and medical alerts shown before you start.",
    points: [
      "Symptom chips and a short list of common diagnoses to keep typing to a minimum",
      "Attach X-rays, OPGs and lab reports as images or PDFs to the visit",
      "A 32-tooth odontogram with surface-level conditions, and a six-point periodontal chart with bleeding, mobility and furcation",
      "Orthodontic records: molar and canine class, overjet, overbite, crowding, appliance plan and a log of adjustment visits",
      "Prosthodontic records: crowns, bridges, dentures and implants, each tracked from preparation through the lab to fitting, with shade and material",
      "An optional AI assistant that suggests differential diagnoses and questions to ask, for the doctor to accept or ignore",
    ],
  },
  {
    id: "consent",
    icon: FileSignature,
    title: "Consent before treatment",
    lead:
      "When the doctor sends a patient on for a procedure or surgery, DentalOS1 asks for consent first. The form is filled in for you and fits on a single A4 page.",
    points: [
      "Patient, doctor and clinic details, the planned treatment, tooth, anaesthesia and estimated cost are filled in automatically",
      "Separate forms for general procedures, oral surgery, orthodontics and prosthodontics, each with its own wording",
      "Change the wording in settings, in English or Bangla, using fields like {{patient_name}} that fill themselves",
      "The patient (or guardian) and doctor sign the printout; the visit only moves on once both signatures are confirmed",
      "A refusal is recorded too, with the date and the treatment the patient declined",
    ],
  },
  {
    id: "prescriptions",
    icon: Pill,
    title: "Prescriptions",
    lead: "Write a prescription in the time it takes to say it. The medicine list is the one your patients buy from the pharmacy downstairs.",
    points: [
      "More than 1,500 Bangladeshi medicine brands with generic names, strengths and usual doses; add your own any time",
      "Dosing in the familiar 1+0+1 style, with duration and before or after meals",
      "A warning if a medicine clashes with an allergy on the patient's file",
      "Tests and investigations from a dental list, plus advice and a follow-up date that books the next visit",
      "Printed on your clinic letterhead with the doctor's degrees and BMDC number",
      "After signing, the doctor can plan the next treatments, each with its own tentative date",
    ],
  },
  {
    id: "billing",
    icon: Receipt,
    title: "Billing, dues and refunds",
    lead: "The bill is built from what happened in the visit, so reception doesn't have to ask the doctor what to charge.",
    points: [
      "Consultation, examinations, procedures, surgery and materials used, priced from your own fee list",
      "Cash, bKash, Nagad and card, with transaction IDs kept for mobile payments",
      "Part payments become dues that stay on the patient's file; collect them on any later day with a fresh receipt",
      "Refunds with a reason, printed as a voucher in patient and office copies",
      "Receipts print two to a page, one for the patient and one for your records",
      "A collections report for any day or month, by doctor and by type of work, with refunds taken off",
    ],
  },
  {
    id: "messages",
    icon: MessageSquare,
    title: "Reminders and messages",
    lead: "Bring patients back for the treatment they still need, and keep in touch without a separate phone list.",
    points: [
      "Reminders drafted automatically when a planned treatment is overdue; the doctor reads and approves each one",
      "Campaigns to patients you choose by last visit, medical condition, treatment received, age, dues or birthday month",
      "SMS from a paired phone through Windows Phone Link, automatically from an Android phone in the clinic, or through a bulk SMS company",
      "WhatsApp messages opened in your clinic's own WhatsApp with the text already written",
      "Replies to SMS arrive in an inbox inside DentalOS1, matched to the patient",
      "Editable templates in English and Bangla, with a character count so you know how many SMS a message will take",
    ],
  },
  {
    id: "records",
    icon: FolderOpen,
    title: "Patient records",
    lead: "One file per patient that the whole clinic can rely on.",
    points: [
      "A timeline of every visit, consent, prescription, payment and planned treatment",
      "Medical conditions, allergies and emergency contact on the profile and on every screen that needs them",
      "Medical certificates (sick leave, fitness, treatment completion) printed on your letterhead",
      "Patient IDs in the format you choose: a running number, year and number, initials, date-based, or your own pattern",
    ],
  },
  {
    id: "settings",
    icon: SlidersHorizontal,
    title: "Set it up your way",
    lead: "Clinics work differently. The settings let DentalOS1 follow your routine rather than the other way round.",
    points: [
      "Doctors, chairs, opening days and hours, and the break",
      "Your own fee list, medicine list and investigations",
      "Switch sections on or off: odontogram, perio chart, orthodontics, prosthodontics, AI assistant and consent forms",
      "Choose whether the consultation fee is taken at check-in or billed at the end",
    ],
  },
  {
    id: "platform",
    icon: Cloud,
    title: "Behind the scenes",
    lead: "The parts you shouldn't have to think about.",
    points: [
      "Runs in the browser on Windows, Mac, tablets and phones; nothing to install or update",
      "Every computer in the clinic works on the same records at the same time",
      "If the internet drops, your changes are kept on the computer and sent as soon as it reconnects",
      "Each staff member has their own sign-in, and reminders can only be approved by doctors",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Features"
        title="What DentalOS1 does, area by area"
        intro="From the moment a patient books to the reminder that brings them back, here is what your front desk, your doctors and your accounts get."
      />
      <nav aria-label="On this page" className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {AREAS.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="shrink-0 rounded-full px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              {a.title}
            </a>
          ))}
        </div>
      </nav>
      {AREAS.map((a, i) => (
        <Section key={a.id} id={a.id} className={i % 2 ? "bg-slate-50" : ""}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
            <div className="space-y-3">
              <a.icon className="h-8 w-8 text-teal-700" />
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{a.title}</h2>
              <p className="text-lg leading-relaxed text-slate-600">{a.lead}</p>
            </div>
            <CheckList items={a.points} />
          </div>
        </Section>
      ))}
      <CtaBand />
    </>
  );
}
