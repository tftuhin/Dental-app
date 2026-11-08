import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { APP_URL, SITE_PATHS, SITE_URL } from "@/site/config";

// Next.js 16 "proxy" (formerly middleware).
//
// One deployment serves two addresses (see src/site/config.ts):
//  • the main domain (NEXT_PUBLIC_SITE_URL) shows the public website;
//  • the app subdomain (NEXT_PUBLIC_APP_URL) shows the application, where
//    signed-out visitors are sent to the login page.
// Without those settings (local development, previews), both work on one
// address: the website at /home, /features, ... and the app everywhere else.

const publicAppRoutes = ["/auth/login", "/auth/register", "/auth/error", "/book"];

function hostOf(url: string): string {
  try {
    return new URL(url).host.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

const SITE_HOST = hostOf(SITE_URL);
const APP_HOST = hostOf(APP_URL);

const isSitePath = (path: string) => SITE_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const path = nextUrl.pathname;
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").toLowerCase().replace(/^www\./, "");

  // ── Main domain: the website ──
  if (SITE_HOST && host === SITE_HOST) {
    if (path === "/") return NextResponse.rewrite(new URL("/home", nextUrl));
    if (path === "/home") return NextResponse.redirect(new URL("/", nextUrl), 308);
    if (isSitePath(path)) return NextResponse.next();
    // Anything else (login, dashboard, booking pages) lives on the app subdomain
    if (APP_URL) return NextResponse.redirect(new URL(`${path}${nextUrl.search}`, APP_URL), 308);
  }

  // ── App subdomain: website pages belong on the main domain ──
  if (APP_HOST && host === APP_HOST && isSitePath(path) && SITE_URL) {
    return NextResponse.redirect(new URL(path === "/home" ? "/" : path, SITE_URL), 308);
  }

  // ── Website pages on a preview address ──
  if (isSitePath(path)) return NextResponse.next();

  // ── The application ──
  const isLoggedIn = !!session;
  const isPublic = path === "/" || publicAppRoutes.some((route) => path.startsWith(route));

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }
  if (isLoggedIn && path.startsWith("/auth/login")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml)$).*)"],
};
