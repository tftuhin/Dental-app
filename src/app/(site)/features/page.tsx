import type { Metadata } from "next";
import { CalendarDays, Stethoscope, Pill, Receipt, MessageSquare, FolderOpen, SlidersHorizontal, Cloud, FileSignature } from "lucide-react";
import { CheckList, CtaBand, PageIntro, Section } from "@/components/site/blocks";
import { BillMock, ConsentMock, MockWindow, OdontogramMock, PhoneMock, PrescriptionMock, QueueMock } from "@/components/site/mocks";
import { Reveal } from "@/components/site/showcase";
import { SectionTabs } from "@/components/site/section-tabs";

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
      "Add it to your Facebook page's Book now button, your Google Business Profile, or embed it on your own website",
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
      "An AI Assistant that reads your notes and suggests differential diagnoses with ICD-10 codes, tests, procedures and allergy-checked medicines, for you to accept or ignore",
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
      "One-click AI draft built from the visit, in your brands and dosing, with its reasoning shown, for the doctor to review and sign",
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
      "Works on any device with a web browser: Windows or Mac laptops and desktops, Android tablets and iPads, and phones. Nothing to install or update",
      "Every computer in the clinic works on the same records at the same time",
      "If the internet drops, your changes are kept on the computer and sent as soon as it reconnects",
      "Each staff member has their own sign-in, and reminders can only be approved by doctors",
    ],
  },
];

const MOCKS: Record<string, { node: React.ReactNode; title?: string }> = {
  "front-desk": { node: <QueueMock />, title: "app · Appointments" },
  clinical: { node: <OdontogramMock />, title: "app · Visit · Odontogram" },
  consent: { node: <ConsentMock />, title: "Consent form" },
  prescriptions: { node: <PrescriptionMock />, title: "app · Prescription" },
  billing: { node: <BillMock />, title: "app · Billing" },
  messages: { node: <PhoneMock /> },
};

/** Short names for the sticky tab row. */
const TABS = [
  { id: "front-desk", label: "Front desk" },
  { id: "clinical", label: "Doctor's room" },
  { id: "consent", label: "Consent" },
  { id: "prescriptions", label: "Prescriptions" },
  { id: "billing", label: "Billing" },
  { id: "messages", label: "Messages" },
  { id: "records", label: "Records" },
  { id: "settings", label: "Settings" },
  { id: "platform", label: "Platform" },
];

export default function FeaturesPage() {
  const main = AREAS.filter((a) => MOCKS[a.id]);
  const rest = AREAS.filter((a) => !MOCKS[a.id]);
  return (
    <>
      <PageIntro
        eyebrow="Features"
        title="What DentalOS1 does, room by room"
        intro="From the moment a patient books to the reminder that brings them back, here is what your front desk, your doctors and your accounts get, with AI built in for the doctor."
      />
      <SectionTabs items={TABS} />
      {main.map((a, i) => {
        const mock = MOCKS[a.id];
        return (
          <Section key={a.id} id={a.id} className={i % 2 ? "bg-slate-50" : ""}>
            <div className="grid items-center gap-14 lg:grid-cols-2">
              <Reveal className={i % 2 ? "lg:order-2" : ""}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25">
                  <a.icon className="h-6 w-6" />
                </span>
                <h2 className="font-display mt-5 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">{a.title}</h2>
                <p className="mt-3 text-lg leading-relaxed text-slate-600">{a.lead}</p>
                <CheckList items={a.points} className="mt-7" />
              </Reveal>
              <Reveal delay={120} className={i % 2 ? "lg:order-1" : ""}>
                <div className="relative">
                  <div aria-hidden className="absolute inset-8 rounded-[2rem] bg-teal-300/30 blur-3xl" />
                  {mock.title ? (
                    <MockWindow title={mock.title} className="relative">
                      {mock.node}
                    </MockWindow>
                  ) : (
                    <div className="relative">{mock.node}</div>
                  )}
                </div>
              </Reveal>
            </div>
          </Section>
        );
      })}
      <Section className="bg-slate-950 text-white">
        <div aria-hidden className="site-grid absolute inset-0 opacity-70" />
        <div className="grid gap-6 lg:grid-cols-3">
          {rest.map((a, i) => (
            <Reveal key={a.id} delay={i * 80}>
              <div id={a.id} className="h-full scroll-mt-40 rounded-3xl bg-white/[0.04] p-8 ring-1 ring-white/10">
                <a.icon className="h-7 w-7 text-teal-300" />
                <h2 className="font-display mt-4 text-2xl font-bold">{a.title}</h2>
                <p className="mt-2 text-slate-400">{a.lead}</p>
                <CheckList items={a.points} className="mt-6" light />
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
      <CtaBand />
    </>
  );
}
