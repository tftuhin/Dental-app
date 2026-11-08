import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

/** Page section with consistent width and spacing. */
export function Section({ id, className = "", children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">{children}</p>;
}

export function SectionHeading({ eyebrow, title, intro, center = false }: { eyebrow?: string; title: string; intro?: React.ReactNode; center?: boolean }) {
  return (
    <div className={`max-w-2xl space-y-3 ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {intro && <p className="text-lg leading-relaxed text-slate-600">{intro}</p>}
    </div>
  );
}

/** Heading block at the top of an inner page. */
export function PageIntro({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro: React.ReactNode }) {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-b from-teal-50/70 to-white px-4 pb-14 pt-14 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
        <p className="text-lg leading-relaxed text-slate-600">{intro}</p>
      </div>
    </div>
  );
}

export function CheckList({ items, className = "" }: { items: React.ReactNode[]; className?: string }) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-700">
          <Check className="mt-1 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">
      {children}
    </Link>
  );
}

export function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:border-slate-400">
      {children}
    </Link>
  );
}

/** Closing call to action used at the bottom of most pages. */
export function CtaBand({
  title = "See it with your own clinic's day in mind",
  text = "Book a 30-minute demo. We'll walk through a patient visit from booking to receipt and answer questions from your doctors and front desk.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl bg-teal-800 px-6 py-10 text-white sm:px-10 md:flex-row md:items-center">
        <div className="max-w-xl space-y-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          <p className="leading-relaxed text-teal-50">{text}</p>
        </div>
        <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-teal-900 hover:bg-teal-50">
          Book a demo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
