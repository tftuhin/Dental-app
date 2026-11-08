import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

/** Page section with consistent width and spacing. */
export function Section({ id, className = "", children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`relative scroll-mt-36 px-4 py-20 sm:px-6 sm:py-28 ${className}`}>
      <div className="relative mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
        light ? "bg-white/10 text-teal-200 ring-1 ring-white/15" : "bg-teal-50 text-teal-700 ring-1 ring-teal-100"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${light ? "bg-teal-300" : "bg-teal-500"}`} />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  center = false,
  light = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <div className={`max-w-3xl space-y-5 ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <Eyebrow light={light}>{eyebrow}</Eyebrow>}
      <h2 className={`font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl ${light ? "text-white" : "text-slate-900"}`}>{title}</h2>
      {intro && <p className={`text-lg leading-relaxed sm:text-xl ${light ? "text-slate-300" : "text-slate-600"}`}>{intro}</p>}
    </div>
  );
}

/** Heading block at the top of an inner page. */
export function PageIntro({ eyebrow, title, intro, children }: { eyebrow?: string; title: React.ReactNode; intro: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-teal-50/80 via-white to-white px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div aria-hidden className="site-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div aria-hidden className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-teal-300/30 blur-3xl" />
      <div className="relative mx-auto max-w-3xl space-y-6 text-center">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-slate-900 sm:text-6xl">{title}</h1>
        <p className="text-lg leading-relaxed text-slate-600 sm:text-xl">{intro}</p>
        {children}
      </div>
    </div>
  );
}

export function CheckList({ items, className = "", light = false }: { items: React.ReactNode[]; className?: string; light?: boolean }) {
  return (
    <ul className={`space-y-3.5 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className={`flex gap-3 text-[15px] leading-relaxed ${light ? "text-slate-300" : "text-slate-700"}`}>
          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${light ? "bg-teal-400/20 text-teal-300" : "bg-teal-100 text-teal-700"}`}>
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PrimaryButton({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold shadow-lg transition ${
        light ? "bg-teal-400 text-slate-950 shadow-teal-500/25 hover:bg-teal-300" : "bg-slate-900 text-white shadow-slate-900/20 hover:bg-teal-800"
      }`}
    >
      {children}
    </Link>
  );
}

export function SecondaryButton({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition ${
        light ? "text-white ring-1 ring-white/25 hover:bg-white/10" : "bg-white text-slate-800 ring-1 ring-slate-300 hover:ring-slate-400"
      }`}
    >
      {children}
    </Link>
  );
}

/** Closing call to action used at the bottom of most pages. */
export function CtaBand({
  title = "See it with your own clinic's day in mind",
  text = "Book a 30-minute demo. We'll walk through a patient visit from booking to receipt, AI Assistant included, and answer questions from your doctors and front desk.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 px-6 py-14 text-white shadow-2xl shadow-teal-900/20 sm:px-14">
        <div aria-hidden className="site-grid absolute inset-0" />
        <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-400/30 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h2>
            <p className="text-lg leading-relaxed text-teal-50/90">{text}</p>
          </div>
          <Link href="/contact" className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-teal-900 shadow-lg hover:bg-teal-50">
            Book a demo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
