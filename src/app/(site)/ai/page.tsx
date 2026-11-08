import type { Metadata } from "next";
import Link from "next/link";
import {
  Stethoscope,
  Pill,
  ShieldCheck,
  UserCheck,
  Eye,
  ToggleRight,
  ListChecks,
  Bell,
  CalendarClock,
  Filter,
  AlertTriangle,
  ArrowRight,
  FileText,
  Microscope,
  Syringe,
  Brain,
} from "lucide-react";
import { CheckList, CtaBand, Eyebrow, PrimaryButton, SecondaryButton, Section, SectionHeading } from "@/components/site/blocks";
import { CopilotMock, MockWindow, RxDraftMock } from "@/components/site/mocks";
import { Reveal } from "@/components/site/showcase";

export const metadata: Metadata = {
  title: "AI assistant for dentists",
  description:
    "DentalOS1's AI Clinical Copilot suggests differential diagnoses, tests, procedures and allergy-checked medicines from your consultation notes, and drafts the prescription from the visit for you to review and sign.",
};

const COPILOT_READS = [
  "The chief complaint and the symptoms you ticked",
  "Your clinical notes and the tooth you're working on",
  "Examination findings: percussion, cold test and mobility",
  "The patient's age, sex, allergies and medical conditions",
];

const COPILOT_GIVES = [
  { icon: Brain, title: "Differential diagnoses", text: "Two to four likely diagnoses with ICD-10 codes and a line of reasoning for each." },
  { icon: Microscope, title: "Tests to order", text: "Which X-rays or investigations would settle the question, and why." },
  { icon: Syringe, title: "Procedures", text: "Treatment options by priority, with CDT codes, ready to compare with your plan." },
  { icon: Pill, title: "Medicines, allergy-checked", text: "Suggested drugs with dose and duration, each checked against the patient's allergies." },
];

const RX_POINTS = [
  "Built from today's visit: the diagnosis, findings, procedures done and your notes",
  "Uses brands from your clinic's own medicine list where one fits",
  "Doses written the way you write them: 1+0+1, 5 days, after food",
  "Leaves out anything the patient is allergic to, and cross-reacting drugs",
  "Takes medical conditions into account: NSAID caution in asthma or kidney disease, limits in liver disease, safety in pregnancy",
  "Skips antibiotics when they aren't indicated, and says so",
  "Adds the investigations still needed and short advice for the patient",
  "Explains its choices in a few sentences, so you can check the reasoning, not just the result",
];

const GUARDRAILS = [
  {
    icon: UserCheck,
    title: "The doctor decides",
    text: "Suggestions appear beside your notes. Nothing becomes part of the record until you add it, and nothing is prescribed until you sign.",
  },
  {
    icon: Eye,
    title: "Reasoning you can see",
    text: "Every diagnosis comes with its rationale, and every prescription draft explains how allergies and conditions were handled.",
  },
  {
    icon: ShieldCheck,
    title: "A second allergy check",
    text: "Separately from the AI, DentalOS1 checks every medicine you add against the allergies on file and warns you before you sign.",
  },
  {
    icon: ToggleRight,
    title: "Off with one switch",
    text: "If your clinic would rather not use AI, turn the assistant off in settings. Every other part of DentalOS1 works the same without it.",
  },
];

const NOT_AI = [
  { icon: AlertTriangle, title: "Allergy warnings", text: "Every medicine checked against the patient's recorded allergies, every time." },
  { icon: Bell, title: "Recall reminders", text: "Drafted from your template when a planned treatment is overdue, sent after the doctor approves." },
  { icon: CalendarClock, title: "Next free slot", text: "Found for the chosen doctor around opening hours, the break and existing bookings." },
  { icon: Filter, title: "Patient lists", text: "Campaign audiences by last visit, condition, treatment, dues or birthday month." },
];

const AI_FAQ = [
  {
    q: "Does the AI make the diagnosis?",
    a: "No. It offers possibilities and reasons for the doctor to weigh. The diagnosis, the treatment and the prescription are always the doctor's.",
  },
  {
    q: "Which AI does it use?",
    a: "A large language model from an established provider (Anthropic, OpenAI or Groq), chosen when DentalOS1 is set up. The prompts are written for dental practice in Bangladesh.",
  },
  {
    q: "What patient information is sent, and when?",
    a: "Only when a doctor presses the button: the details of the visit being reviewed, such as complaint, findings, age, sex, allergies and conditions. Nothing is sent in the background.",
  },
  {
    q: "Does it know the medicines we stock?",
    a: "The prescription draft is given your clinic's medicine list and prefers those brands, so the draft usually matches what your patients can buy downstairs.",
  },
  {
    q: "Can we use DentalOS1 without AI?",
    a: "Yes. Switch the AI assistant off in Settings → Clinical Modules. The copilot tab and the draft button disappear; everything else is unchanged.",
  },
];

export default function AiPage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-slate-950 px-4 pb-24 pt-16 text-white sm:px-6 sm:pt-24">
        <div aria-hidden className="site-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
        <div aria-hidden className="absolute -left-32 top-0 h-[26rem] w-[26rem] rounded-full bg-amber-400/15 blur-3xl" />
        <div aria-hidden className="absolute -right-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-teal-500/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1fr_1.05fr]">
          <div className="space-y-7">
            <Eyebrow light>Make your chamber AI-powered</Eyebrow>
            <h1 className="font-display text-5xl font-extrabold leading-[1.03] sm:text-6xl">
              A second opinion in the chair.{" "}
              <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-teal-300 bg-clip-text text-transparent">The decision stays yours.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              DentalOS1&apos;s AI reads the consultation you&apos;ve just written and suggests what to consider: likely diagnoses, tests,
              treatment and allergy-safe medicines. When you move on to the prescription, it drafts that too, from the same visit, for you to
              check and sign.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="/contact" light>
                See the AI in a demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </PrimaryButton>
              <SecondaryButton href="#copilot" light>
                How it works
              </SecondaryButton>
            </div>
          </div>
          <div className="relative">
            <div aria-hidden className="absolute inset-6 rounded-[2rem] bg-amber-300/20 blur-2xl" />
            <MockWindow title="app · Visit · Clinical Copilot" className="relative">
              <CopilotMock />
            </MockWindow>
          </div>
        </div>
      </section>

      {/* ─── Two tools ─── */}
      <section className="border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-4 py-10 md:grid-cols-2">
          {[
            { icon: Stethoscope, href: "#copilot", title: "Clinical Copilot", text: "Differential diagnoses, tests, procedures and medicines, from your notes." },
            { icon: FileText, href: "#prescription", title: "Prescription drafts", text: "A complete prescription from today's visit, in your brands and your dosing." },
          ].map((t) => (
            <a key={t.title} href={t.href} className="group flex items-start gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-teal-300 hover:shadow-md">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/25">
                <t.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="font-display flex items-center gap-1.5 text-lg font-bold text-slate-900">
                  {t.title}
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="text-slate-600">{t.text}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ─── Copilot ─── */}
      <Section id="copilot">
        <div className="grid items-start gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHeading
              eyebrow="Clinical Copilot"
              title="Think through the case before you pick up the handpiece"
              intro="Open the Copilot tab in the consultation and ask. It works from what you've already recorded, so there's nothing extra to type."
            />
            <div className="mt-8 rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">What it reads</p>
              <CheckList items={COPILOT_READS} className="mt-4" />
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {COPILOT_GIVES.map((g, i) => (
              <Reveal key={g.title} delay={i * 80}>
                <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/25">
                    <g.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display mt-4 text-lg font-bold text-slate-900">{g.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-slate-600">{g.text}</p>
                </div>
              </Reveal>
            ))}
            <Reveal delay={320} className="sm:col-span-2">
              <div className="rounded-3xl bg-gradient-to-br from-teal-700 to-slate-900 p-6 text-white">
                <ListChecks className="h-6 w-6 text-teal-200" />
                <p className="mt-3 leading-relaxed text-teal-50">
                  Each answer ends with a short summary of the clinical reasoning. If it&apos;s useful, add it to your notes with one click; if
                  not, ignore it. It never changes the record on its own.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ─── Prescription drafts ─── */}
      <Section id="prescription" className="bg-slate-50">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="lg:order-2">
            <SectionHeading
              eyebrow="Prescription drafts"
              title="The prescription, drafted from the visit"
              intro="One button on the prescription pad. The AI reads what happened in the chair and writes a draft the way you would, then shows you why."
            />
            <CheckList items={RX_POINTS} className="mt-8" />
          </Reveal>
          <Reveal delay={120} className="lg:order-1">
            <div className="relative">
              <div aria-hidden className="absolute inset-8 rounded-[2rem] bg-amber-300/30 blur-3xl" />
              <MockWindow title="app · Prescription" className="relative">
                <RxDraftMock />
              </MockWindow>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Guardrails ─── */}
      <Section className="overflow-hidden bg-slate-950 text-white">
        <div aria-hidden className="site-grid absolute inset-0 opacity-70" />
        <Reveal>
          <SectionHeading
            light
            center
            eyebrow="Built to be trusted"
            title="AI that assists, never acts alone"
            intro="Clinical software should make a careful doctor faster, not replace their judgment. These rules are part of how the assistant is built."
          />
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GUARDRAILS.map((g, i) => (
            <Reveal key={g.title} delay={i * 80}>
              <div className="h-full rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10">
                <g.icon className="h-7 w-7 text-amber-300" />
                <h3 className="font-display mt-4 text-lg font-bold">{g.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{g.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ─── Data ─── */}
      <Section>
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-12">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div className="space-y-3">
              <h2 className="font-display text-3xl font-extrabold text-slate-900">What the AI sees, and when</h2>
              <p className="text-lg leading-relaxed text-slate-600">
                Nothing goes to the AI in the background. Only when a doctor presses the button are the details of that one visit sent to the
                AI provider: the complaint, symptoms, findings and notes, and the patient&apos;s age, sex, allergies and medical
                conditions. A prescription draft also includes the diagnosis, procedures done, vitals and your clinic&apos;s medicine list.
                The patient&apos;s name and phone number are not sent. The answer comes back to that screen. Clinics that would rather not send any patient details to an AI service can switch the assistant
                off completely.
              </p>
              <Link href="/privacy" className="inline-flex items-center gap-1.5 font-semibold text-teal-800 hover:underline">
                Read our privacy policy
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Smart, not AI ─── */}
      <Section className="bg-slate-50">
        <Reveal>
          <SectionHeading
            eyebrow="Smart, but not AI"
            title="Plenty of the help needs no AI at all"
            intro="We'd rather be clear about this. These features run on fixed rules you can predict, every time, with nothing sent anywhere."
          />
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NOT_AI.map((n, i) => (
            <Reveal key={n.title} delay={i * 70}>
              <div className="h-full rounded-3xl border border-slate-200 bg-white p-6">
                <n.icon className="h-6 w-6 text-teal-700" />
                <h3 className="font-display mt-3 text-lg font-bold text-slate-900">{n.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{n.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ─── FAQ ─── */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHeading center eyebrow="Questions" title="Asked about the AI" />
          <div className="mt-10 space-y-3">
            {AI_FAQ.map((f, i) => (
              <details key={f.q} className="group rounded-2xl bg-white p-5 ring-1 ring-slate-200 open:shadow-md" open={i === 0}>
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
        </div>
      </Section>

      <CtaBand title="Watch the AI work on a real case" text="In a demo, we'll run the Copilot and a prescription draft on the kind of patient your clinic sees every day." />
    </>
  );
}
