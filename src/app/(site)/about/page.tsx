import type { Metadata } from "next";
import { CtaBand, PageIntro, Section } from "@/components/site/blocks";
import { COMPANY } from "@/site/config";

export const metadata: Metadata = {
  title: "About",
  description: `Why ${COMPANY.product} exists and the principles behind it.`,
};

const PRINCIPLES = [
  {
    title: "Follow the clinic's day",
    text: "Software should move the way a patient moves through the chamber: desk, chair, prescription, counter. If staff have to work around the screens, the screens are wrong.",
  },
  {
    title: "Fewer clicks for the doctor",
    text: "A doctor's time with the patient matters more than anything typed afterwards. Common diagnoses, symptoms and doses should be a tap away, and nothing should be entered twice.",
  },
  {
    title: "Local by default",
    text: "Taka, bKash, BMDC numbers, Bangladeshi medicine brands, Bangla messages and an internet line that sometimes drops. These aren't settings to hunt for. They're how it works out of the box.",
  },
  {
    title: "The doctor stays in charge",
    text: "Where the software suggests something, whether an AI diagnosis hint or a reminder to a patient, a person decides. Nothing clinical goes out without a doctor seeing it.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About us"
        title="Practice software that fits the way dental clinics here actually work"
        intro={`${COMPANY.product} is built for dental clinics in Bangladesh, from single-chair chambers to busy practices with several doctors.`}
      />
      <Section>
        <div className="mx-auto max-w-3xl space-y-5 text-lg leading-relaxed text-slate-700">
          <h2 className="font-display text-3xl font-extrabold text-slate-900">Why we built it</h2>
          <p>
            Walk into most dental clinics and you&apos;ll find the same things: a register at the front desk, a stack of patient cards, a
            prescription pad, a receipt book, and a phone full of WhatsApp messages from patients asking when to come back. Each one works on
            its own. Together they mean names written four times, dues forgotten, and a second sitting that never happens because nobody
            reminded the patient.
          </p>
          <p>
            The software that exists tends to be one of two kinds. Hospital systems are too large and slow for a chamber with two chairs.
            Foreign dental software is built around insurance claims and card payments, and has never heard of bKash.
          </p>
          <p>
            {COMPANY.product} sits in between. It covers what a dental clinic does in a day, from the booking to the reminder that brings the
            patient back, and leaves out what it doesn&apos;t.
          </p>
        </div>
      </Section>
      <Section className="bg-slate-50">
        <h2 className="font-display text-center text-4xl font-extrabold text-slate-900">What we hold ourselves to</h2>
        <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <h3 className="font-display text-xl font-bold text-slate-900">{p.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
      </Section>
      <CtaBand title="We'd like to hear how your clinic works" text="Tell us what slows your team down. Even if DentalOS1 isn't right for you yet, it helps us build the next part." />
    </>
  );
}
