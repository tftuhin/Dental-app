import { SITE_URL } from "@/site/config";

// Search engines may index the website (main domain) but not the application.
export const dynamic = "force-dynamic";

function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function GET(request: Request) {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").replace(/^www\./, "");
  const isSite = !!SITE_URL && host === hostOf(SITE_URL);
  const body = isSite
    ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
