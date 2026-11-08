"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, Phone, Mail, MessageCircle } from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import { COMPANY, LEGAL_PAGES, SITE_PAGES, appHref, siteHref } from "@/site/config";

export function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <Link href={siteHref("/")} className={`group flex items-center gap-2.5 ${className}`} aria-label={`${COMPANY.product} home`}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 text-white shadow-md shadow-teal-900/20">
        <ToothIcon className="h-5 w-5" />
      </span>
      <span className={`font-display text-xl font-extrabold ${light ? "text-white" : "text-slate-900"}`}>
        Dental<span className="text-teal-500">OS1</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const nav = SITE_PAGES.filter((p) => p.href !== "/contact");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="bg-slate-950 px-4 py-2 text-center text-xs text-slate-300 sm:text-sm">
        <span className="mr-2 rounded-full bg-teal-500/15 px-2 py-0.5 text-[11px] font-semibold text-teal-300">New</span>
        Consent forms that fill themselves, and AI prescription drafts built from the visit.{" "}
        <Link href="/features" className="font-semibold text-white underline-offset-4 hover:underline">
          See what&apos;s new
        </Link>
      </div>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "border-b border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-xl" : "border-b border-transparent bg-white"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px]">
          <Logo />
          <nav aria-label="Main" className="hidden items-center rounded-full border border-slate-200 bg-slate-50/80 p-1 md:flex">
            {nav.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  pathname === p.href ? "bg-white text-teal-800 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <a href={appHref("/auth/login")} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
              Sign in
            </a>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-teal-800"
            >
              Book a demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <nav aria-label="Main" className="site-fade-in border-t border-slate-200 bg-white px-4 pb-6 md:hidden">
            {SITE_PAGES.map((p) => (
              <Link key={p.href} href={p.href} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-slate-100 py-3.5 text-base font-medium text-slate-800">
                {p.label}
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a href={appHref("/auth/login")} className="rounded-full border border-slate-300 py-3 text-center text-sm font-semibold text-slate-800">
                Sign in
              </a>
              <Link href="/contact" onClick={() => setOpen(false)} className="rounded-full bg-slate-900 py-3 text-center text-sm font-semibold text-white">
                Book a demo
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

export function SiteFooter() {
  const digits = (s: string) => s.replace(/\D/g, "");
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-300">
      <div aria-hidden className="site-grid absolute inset-0 opacity-60" />
      <div aria-hidden className="absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-teal-600/20 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 py-14 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">Ready when your clinic is.</h2>
            <p className="mt-2 max-w-lg text-slate-400">A 30-minute demo with your doctors and front desk: a full visit from booking to receipt, AI included.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400">
              Book a demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/${digits(COMPANY.whatsapp)}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp us
            </a>
          </div>
        </div>

        <div className="grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
          <div className="space-y-4">
            <Logo light />
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Operation software for dental clinics in Bangladesh. The queue, charts, consent, prescriptions, billing and reminders in one place, with AI built in.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Product</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {SITE_PAGES.filter((p) => ["/features", "/pricing", "/security", "/faq"].includes(p.href)).map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="hover:text-white">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-white">About</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">Contact</Link>
              </li>
              {LEGAL_PAGES.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="hover:text-white">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Talk to us</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-teal-400" />
                <a href={`tel:+${digits(COMPANY.phone)}`} className="hover:text-white">{COMPANY.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-teal-400" />
                <a href={`mailto:${COMPANY.email}`} className="hover:text-white">{COMPANY.email}</a>
              </li>
              <li className="text-slate-400">{COMPANY.hours}</li>
              <li className="text-slate-400">{COMPANY.address}</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {COMPANY.legalName}. AI-powered dental clinic operation software.
          </span>
          <a href={appHref("/auth/login")} className="hover:text-white">
            Clinic sign in →
          </a>
        </div>
      </div>
    </footer>
  );
}
