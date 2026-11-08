import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { COMPANY, SITE_URL } from "@/site/config";

// The public website (main domain). The application's own pages are not
// indexed; these are.
export const metadata: Metadata = {
  title: {
    default: `${COMPANY.product}: dental practice management software for Bangladesh`,
    template: `%s | ${COMPANY.product}`,
  },
  description:
    "Appointments, clinical charts, prescriptions, billing and patient reminders for dental clinics, in one system that works in any browser.",
  robots: { index: true, follow: true },
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  openGraph: {
    type: "website",
    siteName: COMPANY.product,
    locale: "en_BD",
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
