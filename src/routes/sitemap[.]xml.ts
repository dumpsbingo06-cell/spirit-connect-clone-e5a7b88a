import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { listBinCountries, countrySlug } from "@/lib/bin-directory.api";

const BASE_URL = "https://binly.xyz";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/bin-list", changefreq: "daily", priority: "0.9" },
          { path: "/contact", changefreq: "monthly", priority: "0.3" },
        ];

        const countries = await listBinCountries().catch(() => []);
        for (const c of countries) {
          entries.push({
            path: `/bin-list/${countrySlug(c.country_name)}`,
            changefreq: "weekly",
            priority: "0.8",
          });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
