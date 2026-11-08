import type { Metadata } from "next";
import { Users, Building2, MessageSquare, FolderInput, GraduationCap } from "lucide-react";
import { CheckList, PageIntro, Section, SectionHeading } from "@/components/site/blocks";
import { DemoForm } from "@/components/site/demo-form";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Tell us about your clinic and we'll send a quote for DentalOS1, based on your doctors, chairs and what you need.",
};

const INCLUDED = [
  "Appointments, queue and the public booking page",
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
    title: "Training at the clinic",
    text: "Let us know whether a video call is enough for your team, or whether you'd prefer someone to train the front desk and doctors at the clinic.",
  },
];

export default function PricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Pricing"
        title="A quote for your clinic"
        intro="A one-chair chamber and a busy multi-doctor practice need different things, so we price each clinic on its own. Tell us a little about yours and we'll send you a quote."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-5">
            <SectionHeading title="What DentalOS1 includes" intro="Every part of the system described on the features page." />
            <CheckList items={INCLUDED} />
          </div>
          <div className="space-y-5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">What the quote depends on</h2>
            <ul className="space-y-4">
              {FACTORS.map((f) => (
                <li key={f.title} className="flex gap-4 rounded-xl border border-slate-200 p-5">
                  <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                  <div>
                    <h3 className="font-semibold text-slate-900">{f.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="bg-slate-50" id="quote">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Ask for a quote</h2>
            <p className="text-lg leading-relaxed text-slate-600">
              Fill in what you know. If you&apos;re not sure about something, leave it blank and we&apos;ll ask when we call.
            </p>
            <p className="leading-relaxed text-slate-600">
              If you&apos;d like to see the software before talking about price, choose &quot;Book a demo&quot; instead. We&apos;ll show you a
              full patient visit and answer questions from your team.
            </p>
          </div>
          <DemoForm defaultInterest="quote" />
        </div>
      </Section>
    </>
  );
}
