import { LEGAL_PAGES, SITE_PAGES, SITE_URL } from "@/site/config";

// The website's pages, for search engines. Only meaningful once NEXT_PUBLIC_SITE_URL is set.
export const dynamic = "force-dynamic";

export function GET() {
  if (!SITE_URL) return new Response("Not found", { status: 404 });
  const paths = ["/", ...SITE_PAGES.map((p) => p.href), ...LEGAL_PAGES.map((p) => p.href)];
  const urls = paths
    .map((p) => `  <url><loc>${SITE_URL}${p === "/" ? "" : p}</loc><changefreq>monthly</changefreq><priority>${p === "/" ? "1.0" : "0.7"}</priority></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
