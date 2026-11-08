"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";
import { COMPANY, LEGAL_PAGES, SITE_PAGES, appHref, siteHref } from "@/site/config";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href={siteHref("/")} className={`flex items-center gap-2 ${className}`} aria-label={`${COMPANY.product} home`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
        <ToothIcon className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900">{COMPANY.product}</span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = SITE_PAGES.filter((p) => p.href !== "/contact");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {nav.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === p.href ? "text-teal-800" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <a href={appHref("/auth/login")} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900">
            Sign in
          </a>
          <Link href="/contact" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">
            Book a demo
          </Link>
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-slate-700 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Main" className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          {SITE_PAGES.map((p) => (
            <Link key={p.href} href={p.href} onClick={() => setOpen(false)} className="block border-b border-slate-100 py-3 text-sm font-medium text-slate-700">
              {p.label}
            </Link>
          ))}
          <div className="mt-4 flex gap-2">
            <a href={appHref("/auth/login")} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-center text-sm font-semibold text-slate-800">
              Sign in
            </a>
            <Link href="/contact" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-teal-700 py-2.5 text-center text-sm font-semibold text-white">
              Book a demo
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-slate-600">
            Practice management for dental clinics: appointments, clinical records, prescriptions, billing and patient reminders in one place.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Product</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {SITE_PAGES.filter((p) => ["/features", "/pricing", "/security", "/faq"].includes(p.href)).map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="hover:text-teal-800">
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Company</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link href="/about" className="hover:text-teal-800">About</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-teal-800">Contact</Link>
            </li>
            {LEGAL_PAGES.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="hover:text-teal-800">
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Talk to us</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <a href={`tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`} className="hover:text-teal-800">{COMPANY.phone}</a>
            </li>
            <li>
              <a href={`mailto:${COMPANY.email}`} className="hover:text-teal-800">{COMPANY.email}</a>
            </li>
            <li>{COMPANY.hours}</li>
            <li>{COMPANY.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            © {new Date().getFullYear()} {COMPANY.legalName}
          </span>
          <a href={appHref("/auth/login")} className="hover:text-teal-800">Clinic sign in</a>
        </div>
      </div>
    </footer>
  );
}
