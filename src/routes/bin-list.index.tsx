import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { listBinCountries, countrySlug } from "@/lib/bin-directory.api";

const TITLE = "BIN List by Country — Free Card BIN / IIN Lists | Binly";
const DESCRIPTION =
  "Browse BIN / IIN numbers by country — issuing banks, card schemes, brands and card types for credit and debit cards in the United States, United Kingdom, Canada, India and worldwide. Every list is free and grows as cards are checked.";
const URL = "https://www.binly.xyz/bin-list";

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
            { "@type": "ListItem", position: 1, name: "Binly", item: "https://www.binly.xyz/" },
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
  const totalBins = countries.reduce((sum, c) => sum + (c.bin_count ?? 0), 0);
  const top = [...countries].sort((a, b) => b.bin_count - a.bin_count).slice(0, 6);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          BIN List by Country
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {countries.length} countries · {totalBins.toLocaleString()} BINs
        </p>

        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Every card BIN (the first 6–8 digits of a credit or debit card) belongs to a country — the country of the bank that
          issued it. Pick a country below to see its BIN numbers together with the issuing bank, card scheme, brand, card type
          and level. The lists are built from real BIN checks on Binly, so they keep growing as people look up cards.
        </p>

        {top.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Most BINs:</span>
            {top.map((c) => (
              <Link
                key={c.country_code}
                to="/bin-list/$country"
                params={{ country: countrySlug(c.country_name) }}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground transition-colors hover:bg-accent"
              >
                {c.country_name} ({c.bin_count})
              </Link>
            ))}
          </div>
        )}

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

        <section className="mt-14 border-t border-border pt-8">
          <h2 className="font-display text-xl font-semibold">What is a BIN list?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            A BIN list groups card BINs — the Bank Identification Numbers that start every credit and debit card — by what they have
            in common. Sorted by country, a BIN list answers questions like “which bank issued this card?”, “is it a credit or debit
            card?” and “what currency will it settle in?”. Merchants and payment teams use BIN data to spot prepaid, commercial or
            foreign cards before accepting a payment.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Each country page here shows the BIN, its scheme (Visa, Mastercard, American Express and others), the brand, card type,
            level and issuing bank. Prefer curated groups? Browse the{" "}
            <Link to="/bins" className="text-primary underline-offset-4 hover:underline">
              BIN categories
            </Link>{" "}
            instead, or check a single card with the free{" "}
            <Link to="/" className="text-primary underline-offset-4 hover:underline">
              BIN lookup
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
