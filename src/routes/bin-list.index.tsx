import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { listBinCountries, countrySlug } from "@/lib/bin-directory.api";

const TITLE = "BIN List by Country — Binly";
const DESCRIPTION =
  "Browse BIN / IIN numbers by country. Find issuing banks, card schemes, brands and card types for credit and debit card BINs worldwide.";
const URL = "https://binly.xyz/bin-list";

export const Route = createFileRoute("/bin-list/")({
  loader: async () => ({ countries: await listBinCountries().catch(() => []) }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Binly", item: "https://binly.xyz/" },
            { "@type": "ListItem", position: 2, name: "BIN List by Country", item: URL },
          ],
        }),
      },
    ],
  }),
  component: BinListIndex,
});

function BinListIndex() {
  const { countries } = Route.useLoaderData();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          BIN List by Country
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{countries.length} countries</p>

        {countries.length === 0 ? (
          <p className="mt-10 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No countries available yet.
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c) => (
              <li key={c.country_code}>
                <Link
                  to="/bin-list/$country"
                  params={{ country: countrySlug(c.country_name) }}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/^[a-z]{2}$/i.test(c.country_code) ? (
                    <span
                      aria-hidden
                      className={`fi fi-${c.country_code.toLowerCase()} block h-5 w-8 shrink-0 rounded-sm`}
                    />
                  ) : (
                    <Globe2 className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {c.country_name}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.bin_count} {c.bin_count === 1 ? "BIN" : "BINs"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
