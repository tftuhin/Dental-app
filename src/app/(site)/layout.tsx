import type { Metadata } from "next";
import { Noto_Sans_Bengali, Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { COMPANY, SITE_URL } from "@/site/config";

// The public website (main domain). The application's own pages are not
// indexed; these are.
export const metadata: Metadata = {
  title: {
    default: `${COMPANY.product}: AI-powered dental clinic operation software`,
    template: `%s | ${COMPANY.product}`,
  },
  description:
    "Make your chamber AI-powered: an AI clinical assistant, AI prescription drafts, and appointments, charts, consent, billing and reminders for dental clinics in one system.",
  robots: { index: true, follow: true },
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  openGraph: {
    type: "website",
    siteName: COMPANY.product,
    locale: "en_BD",
  },
};

const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
// For ৳ and Bangla text, which the Latin fonts don't include
const bangla = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["400", "600", "700"], variable: "--font-bangla" });

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${display.variable} ${bangla.variable} flex min-h-screen flex-col bg-white text-slate-900`}
      style={{ fontFamily: "var(--font-sans), var(--font-bangla), ui-sans-serif, system-ui, sans-serif" }}
    >
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
