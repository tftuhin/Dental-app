// ============================================================
// DENTALOS1 — Public website settings
//
// The marketing website and the application are one Next.js project.
// Set these two addresses in the hosting environment (Vercel → Settings →
// Environment Variables) once the domain is bought:
//
//   NEXT_PUBLIC_SITE_URL = https://dentalos1.com        (the website)
//   NEXT_PUBLIC_APP_URL  = https://app.dentalos1.com    (the application)
//
// The proxy (src/proxy.ts) then shows the website on the first and the app
// on the second. Until they are set, the website can be previewed on any
// address at /home, /features, /pricing, etc.
//
// ⚠ Replace every value marked TODO before launch.
// ============================================================

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");

/** Link to a website page: "/" on the real domain, "/home" while previewing without one. */
export function siteHref(path: string): string {
  if (path === "/" && !SITE_URL) return "/home";
  return path;
}

/** Link into the application (login, booking page...), on the app subdomain when it's set. */
export function appHref(path: string): string {
  return `${APP_URL}${path}`;
}

export const COMPANY = {
  product: "DentalOS1",
  // TODO: legal company name, as registered
  legalName: "DentalOS1 Technologies Ltd.",
  // TODO: office address
  address: "House 00, Road 00, Dhanmondi, Dhaka 1209, Bangladesh",
  // TODO: sales phone and WhatsApp (international format)
  phone: "+880 1700-000000",
  whatsapp: "+880 1700-000000",
  // TODO: inboxes
  email: "hello@dentalos1.com",
  supportEmail: "support@dentalos1.com",
  privacyEmail: "privacy@dentalos1.com",
  // TODO: office hours
  hours: "Saturday to Thursday, 10 am to 7 pm",
  /** Date shown on the legal pages. */
  legalUpdated: "8 November 2026",
};

/** Website pages, for the menu, footer and sitemap. */
export const SITE_PAGES = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const LEGAL_PAGES = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
] as const;

/** Every path the website owns (the proxy uses this to tell site pages from app pages). */
export const SITE_PATHS = ["/home", ...SITE_PAGES.map((p) => p.href), ...LEGAL_PAGES.map((p) => p.href)];
