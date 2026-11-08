import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Receipt,
  Ruler,
  Crown,
  ShieldCheck,
  X,
  Check,
  Wallet,
  Languages,
  Pill,
  WifiOff,
  BadgeCheck,
  Smartphone,
  KeyRound,
  Building2,
  LogOut,
  Brain,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import { CtaBand, Eyebrow, PrimaryButton, SecondaryButton, Section, SectionHeading } from "@/components/site/blocks";
import { CollectionsMini, CopilotMock, MockWindow, PaidCard, PhoneMock, ReminderApprovalCard, RxDraftMock } from "@/components/site/mocks";
import { Reveal, VisitShowcase } from "@/components/site/showcase";
import { COMPANY } from "@/site/config";

export const metadata: Metadata = {
  title: { absolute: `${COMPANY.product}: AI-powered dental clinic operation software` },
  description:
    "Make your chamber AI-powered. DentalOS1 is AI-powered operation software for dental clinics in Bangladesh: an AI copilot in the chair, prescriptions drafted from the visit, and the queue, consent forms, billing and patient reminders in one place.",
};

const NUMBERS = [
  { value: "6", label: "steps from booking to bill, on one screen" },
  { value: "1,500+", label: "medicine brands sold in Bangladesh, built in" },
  { value: "2", label: "copies of every receipt: patient and office" },
  { value: "0", label: "things to install. It runs in the browser" },
];

const BEFORE_AFTER: Array<[string, string]> = [
  ["Names and phone numbers written in the register, on the card and again on the bill", "Typed once at booking, then carried through every step of the visit"],
  ["“Who's next?” shouted from the doctor's room", "The queue with serial numbers on every computer, updating on its own"],
  ["Consent forms photocopied, filled by hand, sometimes forgotten", "Printed with the patient's details filled in, and required before treatment"],
  ["Dues kept in a notebook and remembered when the patient happens to return", "Every unpaid taka on the patient's file and in today's dues list"],
  ["The crown after the root canal never booked", "A reminder drafted when the patient is overdue, sent once the doctor approves"],
];

const LOCAL = [
  { icon: Wallet, title: "bKash, Nagad, cash and card", text: "Payments recorded with their transaction ID, ready to match against your merchant statement." },
  { icon: Pill, title: "Medicines you prescribe", text: "Brands from Square, Incepta, Beximco, Renata and others, dosed as 1+0+1." },
  { icon: BadgeCheck, title: "BMDC on every page", text: "Registration numbers on prescriptions, certificates and consent forms." },
  { icon: Languages, title: "Bangla messages", text: "Write reminders in Bangla or English. SMS counts adjust for Bangla text." },
  { icon: Smartphone, title: "Your clinic's own number", text: "Send SMS from the clinic phone, or WhatsApp from the account you already use." },
  { icon: WifiOff, title: "When the line drops", text: "Changes are kept on the computer and sent the moment the internet is back." },
];

const FAQ_TEASER = [
  {
    q: "Do we need to install anything?",
    a: "No. DentalOS1 runs in Chrome, Edge or any modern browser, on the computers you already have. Each staff member signs in with their own account.",
  },
  {
    q: "Can reception and the doctors use it at the same time?",
    a: "Yes. Every computer in the clinic works on the same records, and changes made at the desk show up in the doctor's room shortly after, without anyone refreshing.",
  },
  {
    q: "We don't do orthodontics. Can we hide that part?",
    a: "Yes. The odontogram, perio chart, orthodontics, prosthodontics, AI assistant and consent forms can each be switched off in settings.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-slate-950 px-4 pb-24 pt-16 text-white sm:px-6 sm:pt-24">
        <div aria-hidden className="site-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
        <div aria-hidden className="absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-teal-500/25 blur-3xl" />
        <div aria-hidden className="absolute -right-32 bottom-0 h-[24rem] w-[24rem] rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-8">
            <Eyebrow light>AI-powered dental clinic operation software</Eyebrow>
            <h1 className="font-display text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
              Make your chamber{" "}
              <span className="whitespace-nowrap bg-gradient-to-r from-amber-200 via-teal-200 to-teal-400 bg-clip-text text-transparent">AI-powered.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              An AI copilot that thinks through the case with you, prescriptions drafted from the visit, and the whole clinic running in one
              place: queue, chart, consent, billing and reminders. Built for how chambers in Bangladesh really work.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="/contact" light>
                Book a demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </PrimaryButton>
              <SecondaryButton href="#visit" light>
                See a visit, step by step
              </SecondaryButton>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              {["AI copilot in the chair", "Prescriptions drafted by AI", "Runs in any browser"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div aria-hidden className="absolute inset-6 rounded-[2rem] bg-teal-400/20 blur-2xl" />
            <MockWindow title="app · Visit · Clinical Copilot" className="relative">
              <CopilotMock />
            </MockWindow>
            <div className="site-float absolute -bottom-24 -left-8 hidden sm:block" style={{ animationDelay: "1.5s" }}>
              <ReminderApprovalCard />
            </div>
            <div className="site-float absolute -right-6 -top-8 hidden sm:block">
              <PaidCard />
            </div>
          </div>
        </div>
      </section>

      {/* ─── In numbers ─── */}
      <section className="border-b border-slate-200 bg-white px-4 sm:px-6">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 divide-slate-200 py-10 lg:grid-cols-4 lg:divide-x">
          {NUMBERS.map((n, i) => (
            <Reveal key={n.label} delay={i * 80} className="px-4 py-4 text-center lg:px-8">
              <dt className="font-display text-4xl font-extrabold text-teal-700 sm:text-5xl">{n.value}</dt>
              <dd className="mt-2 text-sm leading-snug text-slate-600">{n.label}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* ─── A visit, step by step ─── */}
      <Section id="visit" className="bg-gradient-to-b from-white to-slate-50">
        <Reveal>
          <SectionHeading
            eyebrow="A visit, end to end"
            title="Follow one patient through the clinic"
            intro="Each step hands the patient on to the next. Nobody types the name twice, and nothing is lost between the chair and the counter."
          />
        </Reveal>
        <div className="mt-14">
          <VisitShowcase />
        </div>
      </Section>

      {/* ─── AI ─── */}
      <Section className="overflow-hidden bg-slate-950 text-white">
        <div aria-hidden className="site-grid absolute inset-0 opacity-70" />
        <div aria-hidden className="absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full bg-amber-400/15 blur-3xl" />
        <div aria-hidden className="absolute -left-32 bottom-0 h-[24rem] w-[24rem] rounded-full bg-teal-500/20 blur-3xl" />
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <SectionHeading
              light
              eyebrow="AI assistant"
              title={
                <>
                  A second opinion in the chair.{" "}
                  <span className="bg-gradient-to-r from-amber-200 to-teal-300 bg-clip-text text-transparent">The decision stays yours.</span>
                </>
              }
              intro="The AI reads the consultation you've just written and suggests what to consider. When you reach the prescription pad, it drafts the prescription from the same visit for you to check and sign."
            />
            <div className="mt-8 space-y-3">
              {[
                [Brain, "Clinical Copilot", "Differential diagnoses with ICD-10 codes, tests to order, procedures and allergy-checked medicines."],
                [Sparkles, "Prescription drafts", "Built from the visit in your clinic's brands and 1+0+1 dosing, with the reasoning shown."],
                [UserCheck, "Doctor in charge", "Nothing enters the record or the prescription until the doctor adds or signs it."],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof Brain;
                return (
                  <div key={t as string} className="flex gap-4 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950">
                      <I className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-semibold text-white">{t as string}</span>
                      <span className="text-sm text-slate-400">{d as string}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-8">
              <PrimaryButton href="/ai" light>
                Explore the AI assistant
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </PrimaryButton>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative">
              <div aria-hidden className="absolute inset-6 rounded-[2rem] bg-amber-300/20 blur-2xl" />
              <MockWindow title="app · Prescription" className="relative">
                <RxDraftMock />
              </MockWindow>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Before / after ─── */}
      <Section>
        <Reveal>
          <SectionHeading center eyebrow="What changes" title="Less running around. Fewer things forgotten." />
        </Reveal>
        <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="grid grid-cols-2 bg-slate-50 text-sm font-semibold">
            <div className="flex items-center gap-2 px-6 py-4 text-slate-500">
              <X className="h-4 w-4 text-red-400" />
              Without DentalOS1
            </div>
            <div className="flex items-center gap-2 bg-teal-700 px-6 py-4 text-white">
              <Check className="h-4 w-4" />
              With DentalOS1
            </div>
          </div>
          {BEFORE_AFTER.map(([before, after], i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="grid grid-cols-1 border-t border-slate-200 sm:grid-cols-2">
                <p className="px-6 py-5 text-[15px] leading-relaxed text-slate-500">{before}</p>
                <p className="bg-teal-50/50 px-6 py-5 text-[15px] font-medium leading-relaxed text-slate-800">{after}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ─── Bento ─── */}
      <Section className="bg-slate-50">
        <Reveal>
          <SectionHeading
            eyebrow="Everything in one place"
            title="Every room of the clinic, covered"
            intro="Use all of it, or switch off what your clinic doesn't need. Turning a section off hides it; nothing already recorded is lost."
          />
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <div className="h-full overflow-hidden rounded-3xl bg-slate-900 p-8 text-white">
              <CalendarDays className="h-7 w-7 text-teal-300" />
              <h3 className="font-display mt-4 text-2xl font-bold">Appointments and the daily queue</h3>
              <p className="mt-2 max-w-md text-slate-300">
                Serial numbers per day, the next free slot found for you, online booking that lands in the queue, and no-shows marked when
                patients don&apos;t turn up.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["#01 With doctor", "#02 Checked in", "#03 11:30", "#04 Online", "#05 12:30"].map((t, i) => (
                  <span key={t} className={`rounded-full px-3 py-1 text-xs font-semibold ${i === 0 ? "bg-teal-400 text-slate-950" : "bg-white/10 text-slate-200"}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal className="md:col-span-2" delay={80}>
            <div className="h-full rounded-3xl border border-slate-200 bg-white p-8">
              <ToothIcon className="h-7 w-7 text-teal-700" />
              <h3 className="font-display mt-4 text-xl font-bold text-slate-900">Odontogram and perio</h3>
              <p className="mt-2 text-slate-600">Surface-level tooth chart and six-point probing depths.</p>
              <div className="mt-5 grid grid-cols-8 gap-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} className={`h-4 rounded ${[2, 9].includes(i) ? "bg-red-300" : i === 5 ? "bg-sky-300" : i === 13 ? "bg-amber-300" : "bg-slate-100"}`} />
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal className="md:col-span-2" delay={60}>
            <div className="h-full rounded-3xl border border-slate-200 bg-white p-8">
              <Ruler className="h-7 w-7 text-teal-700" />
              <h3 className="font-display mt-4 text-xl font-bold text-slate-900">Orthodontics</h3>
              <p className="mt-2 text-slate-600">Angle class, overjet and overbite, appliance plan, and every adjustment visit with archwires.</p>
            </div>
          </Reveal>
          <Reveal className="md:col-span-2" delay={120}>
            <div className="h-full rounded-3xl border border-slate-200 bg-white p-8">
              <Crown className="h-7 w-7 text-teal-700" />
              <h3 className="font-display mt-4 text-xl font-bold text-slate-900">Prosthodontics</h3>
              <p className="mt-2 text-slate-600">Crowns, bridges and dentures tracked from preparation, through the lab, to fitting.</p>
              <div className="mt-5 flex gap-1">
                {["Prep", "Impression", "Lab", "Fitted"].map((s, i) => (
                  <span key={s} className={`flex-1 rounded-full py-1 text-center text-[10px] font-semibold ${i < 3 ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal className="md:col-span-2" delay={180}>
            <div className="h-full rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 p-8 text-white">
              <Receipt className="h-7 w-7 text-teal-100" />
              <h3 className="font-display mt-4 text-xl font-bold">Collections, by doctor</h3>
              <p className="mt-2 text-teal-50/90">Daily and monthly takings split by doctor and type of work, refunds taken off.</p>
              <div className="mt-5 [&_span]:!bg-white/30 [&_span:nth-child(6)]:!bg-white">
                <CollectionsMini />
              </div>
            </div>
          </Reveal>
        </div>
        <Link href="/features" className="mt-10 inline-flex items-center gap-1.5 font-semibold text-teal-800 hover:underline">
          See every feature
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Section>

      {/* ─── Local ─── */}
      <Section className="overflow-hidden bg-slate-950 text-white">
        <div aria-hidden className="site-grid absolute inset-0 opacity-70" />
        <div aria-hidden className="absolute -right-10 top-1/2 -translate-y-1/2 select-none font-display text-[22rem] font-extrabold leading-none text-white/[0.03]">
          ৳
        </div>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <SectionHeading
              light
              eyebrow="Made for clinics here"
              title="The small details foreign software gets wrong"
              intro="Most clinic software is written for clinics in other countries and then translated. DentalOS1 starts from how a chamber in Dhaka, Chattogram or Sylhet runs its day."
            />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {LOCAL.map((l, i) => (
              <Reveal key={l.title} delay={i * 70}>
                <div className="h-full rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10 transition hover:bg-white/[0.07]">
                  <l.icon className="h-6 w-6 text-teal-300" />
                  <h3 className="mt-3 font-semibold text-white">{l.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{l.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── Recall ─── */}
      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHeading
              eyebrow="Patients who come back"
              title="The second sitting is where treatment gets lost"
              intro="When the prescription is done, the doctor notes what comes next and roughly when: the crown after the root canal, scaling in six months. If the patient hasn't returned by then, DentalOS1 drafts a reminder and asks the doctor to check it before it goes out."
            />
            <ol className="mt-8 space-y-3">
              {[
                ["Doctor plans", "Crown fitting on #36, around 15 December"],
                ["System waits", "No visit and no booking by 18 December"],
                ["Doctor approves", "Reads and edits the message on next sign-in"],
                ["Patient hears from you", "SMS in Bangla, from the clinic's own number"],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                  <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-sm font-bold text-white">{i + 1}</span>
                  <span>
                    <span className="block font-semibold text-slate-900">{t}</span>
                    <span className="text-sm text-slate-600">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative rounded-[2rem] bg-gradient-to-br from-teal-50 to-cyan-50 p-6 ring-1 ring-teal-100">
              <PhoneMock />
              <div className="site-float absolute -left-4 bottom-10 hidden sm:block">
                <ReminderApprovalCard />
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Security + FAQ ─── */}
      <Section className="bg-slate-50">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.3fr]">
          <Reveal>
            <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
              <ShieldCheck className="h-9 w-9 text-teal-700" />
              <h2 className="font-display mt-4 text-3xl font-extrabold text-slate-900">Patient records stay with your clinic</h2>
              <ul className="mt-6 space-y-4">
                {[
                  [Building2, "Each clinic's records kept apart from every other clinic's"],
                  [KeyRound, "Personal sign-ins; passwords stored as one-way hashes"],
                  [ShieldCheck, "Encrypted connections, records on managed cloud servers"],
                  [LogOut, "Signing out clears the clinic's data from that computer"],
                ].map(([Icon, text]) => {
                  const I = Icon as typeof ShieldCheck;
                  return (
                    <li key={text as string} className="flex gap-3 text-slate-700">
                      <I className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                      {text as string}
                    </li>
                  );
                })}
              </ul>
              <Link href="/security" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-teal-800 hover:underline">
                How we look after data
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-display text-3xl font-extrabold text-slate-900">Questions clinics ask first</h2>
            <div className="mt-6 space-y-3">
              {FAQ_TEASER.map((f) => (
                <details key={f.q} className="group rounded-2xl bg-white p-5 ring-1 ring-slate-200 open:shadow-md" open={f === FAQ_TEASER[0]}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                    {f.q}
                    <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
            <Link href="/faq" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-teal-800 hover:underline">
              More questions and answers
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
