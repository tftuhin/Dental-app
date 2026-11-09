import type { Metadata } from "next";
import { Users, Building2, MessageSquare, FolderInput, GraduationCap, ClipboardList, PhoneCall, FileText } from "lucide-react";
import { CheckList, PageIntro, Section, SectionHeading } from "@/components/site/blocks";
import { DemoForm } from "@/components/site/demo-form";
import { Reveal } from "@/components/site/showcase";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Tell us about your clinic and we'll send a quote for DentalOSbd, based on your doctors, chairs and what you need.",
};

const INCLUDED = [
  "Appointments, queue and an online booking page for Facebook, Google and your website",
  "Clinical notes, odontogram and periodontal chart",
  "Orthodontic and prosthodontic records",
  "Consent forms you can edit",
  "Prescriptions with the Bangladeshi medicine list",
  "Billing, dues, refunds and the collections report",
  "Patient reminders and campaigns by SMS or WhatsApp",
  "A personal sign-in for each member of staff",
  "Settings for your fee list, doctors, chairs and opening hours",
];

const FACTORS = [
  {
    icon: Users,
    title: "Doctors and chairs",
    text: "A single-chair chamber and a six-chair practice need different things. The number of doctors who see patients is the main thing we look at.",
  },
  {
    icon: Building2,
    title: "Branches",
    text: "If you run more than one chamber or branch, tell us how many, so we can price and set them up together.",
  },
  {
    icon: MessageSquare,
    title: "SMS volume",
    text: "Reminders sent from your own phone cost only your SIM's normal rates. If you want bulk SMS with your clinic's name as the sender, mention it.",
  },
  {
    icon: FolderInput,
    title: "Bringing your old records",
    text: "If your patient list is in Excel or another system, tell us. We'll look at it and let you know what can be brought across.",
  },
  {
    icon: GraduationCap,
    title: "Training",
    text: "Let us know whether a video call is enough for your team, or whether you'd prefer someone to train the front desk and doctors at the clinic.",
  },
];

const STEPS = [
  { icon: ClipboardList, title: "Tell us about the clinic", text: "Doctors, chairs, branches and what you use today. Two minutes with the form below." },
  { icon: PhoneCall, title: "A short call", text: "We check what you need and answer questions, by phone or WhatsApp, whichever suits you." },
  { icon: FileText, title: "Your quote", text: "A written quote for your clinic. Take your time to decide." },
];

export default function PricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Pricing"
        title="A quote that fits your clinic"
        intro="A one-chair chamber and a busy multi-doctor practice need different things, so we price each clinic on its own. Tell us a little about yours and we'll send you a quote."
      />

      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="relative h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <span className="font-display absolute right-6 top-5 text-6xl font-extrabold text-slate-100">{i + 1}</span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25">
                  <s.icon className="h-6 w-6" />
                </span>
                <h2 className="font-display relative mt-5 text-xl font-bold text-slate-900">{s.title}</h2>
                <p className="relative mt-2 leading-relaxed text-slate-600">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="bg-slate-950 text-white">
        <div aria-hidden className="site-grid absolute inset-0 opacity-70" />
        <div className="grid gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHeading light eyebrow="Included" title="What DentalOSbd includes" intro="Every part of the system described on the features page." />
            <CheckList items={INCLUDED} light className="mt-8" />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-display text-2xl font-bold">What the quote depends on</h2>
            <ul className="mt-6 space-y-3">
              {FACTORS.map((f) => (
                <li key={f.title} className="flex gap-4 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                  <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      <Section id="quote" className="bg-gradient-to-b from-teal-50/60 to-white">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-5">
            <SectionHeading eyebrow="Get a quote" title="Ask for a quote" />
            <p className="text-lg leading-relaxed text-slate-600">
              Fill in what you know. If you&apos;re not sure about something, leave it blank and we&apos;ll ask when we call.
            </p>
            <p className="leading-relaxed text-slate-600">
              Prefer to see the software first? Choose &quot;Book a demo&quot; in the form. We&apos;ll show you a full patient visit and answer
              questions from your team.
            </p>
          </div>
          <DemoForm defaultInterest="quote" />
        </div>
      </Section>
    </>
  );
}
