import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  findCountryBySlug,
  listBinsByCountry,
  listBinCountries,
  countrySlug,
  type DirectoryBin,
  type BinCountry,
} from "@/lib/bin-directory.api";

export const Route = createFileRoute("/bin-list/$country")({
  loader: async ({ params }) => {
    const country = await findCountryBySlug(params.country);
    if (!country) throw notFound();
    const [bins, countries] = await Promise.all([
      listBinsByCountry(country.country_code, 500).catch(() => [] as DirectoryBin[]),
      listBinCountries().catch(() => [] as BinCountry[]),
    ]);
    return { country, bins, countries };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Unavailable — Binly" }, { name: "robots", content: "noindex" }],
      };
    }
    const name = loaderData.country.country_name;
    const count = loaderData.bins.length;
    const title = `${name} BIN List — ${count} Card BINs with Banks & Schemes | Binly`;
    const description = `${count} ${name} BIN numbers with the issuing bank, card scheme, brand, card type and level for each one. Free ${name} BIN lookup and checker — the list keeps growing as cards are checked on Binly.`;
    const url = `https://www.binly.xyz/bin-list/${countrySlug(name)}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Binly", item: "https://www.binly.xyz/" },
              {
                "@type": "ListItem",
                position: 2,
                name: "BIN List by Country",
                item: "https://www.binly.xyz/bin-list",
              },
              { "@type": "ListItem", position: 3, name: `${name} BIN List`, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: CountryBinList,
});

function tally(values: (string | null | undefined)[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = (value ?? "").trim();
    if (!key || key.toLowerCase() === "unknown") continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function CountryBinList() {
  const { country, bins, countries } = Route.useLoaderData();

  const banks = new Set(
    bins
      .map((b) => b.bank_name?.trim())
      .filter((n): n is string => Boolean(n) && n!.toLowerCase() !== "unknown"),
  );
  const schemes = tally(bins.map((b) => b.scheme));
  const cardTypes = tally(bins.map((b) => b.card_type));
  const currencies = tally(bins.map((b) => b.currency));
  const related = countries
    .filter((c) => c.country_code !== country.country_code)
    .sort((a, b) => b.bin_count - a.bin_count)
    .slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="px-1">/</span>
          <Link to="/bin-list" className="hover:text-foreground">
            BIN List
          </Link>
          <span className="px-1">/</span>
          <span className="text-foreground">{country.country_name}</span>
        </nav>

        <div className="mt-4 flex items-center gap-3">
          {/^[a-z]{2}$/i.test(country.country_code) && (
            <span
              aria-hidden
              className={`fi fi-${country.country_code.toLowerCase()} block h-7 w-11 shrink-0 rounded`}
            />
          )}
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            {country.country_name} BIN List
          </h1>
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {bins.length} {bins.length === 1 ? "BIN" : "BINs"} from {banks.size} {banks.size === 1 ? "bank" : "banks"} issued in{" "}
          {country.country_name}. Each row shows the card scheme, brand, card type, level and issuing bank — the same details you
          get from the free Binly BIN checker.
        </p>

        {bins.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">BINs</dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums">{bins.length}</dd>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">Issuing banks</dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums">{banks.size}</dd>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">Top scheme</dt>
              <dd className="mt-1 truncate font-display text-xl font-semibold">{schemes[0]?.[0] ?? "—"}</dd>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">Card types</dt>
              <dd className="mt-1 truncate text-sm font-semibold">{cardTypes.map(([t]) => t).slice(0, 3).join(", ") || "—"}</dd>
            </div>
          </dl>
        )}

        {bins.length === 0 ? (
          <p className="mt-10 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No BINs recorded for {country.country_name} yet.{" "}
            <Link to="/" className="text-primary underline-offset-4 hover:underline">
              Check a card
            </Link>{" "}
            and it will appear here.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{country.country_name} BIN numbers</caption>
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">BIN</th>
                  <th scope="col" className="px-4 py-3">Scheme</th>
                  <th scope="col" className="px-4 py-3">Brand</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Level</th>
                  <th scope="col" className="px-4 py-3">Issuing bank</th>
                </tr>
              </thead>
              <tbody>
                {bins.map((b) => (
                  <tr key={b.bin} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">{b.bin}</td>
                    <td className="px-4 py-3 capitalize">{b.scheme ?? "—"}</td>
                    <td className="px-4 py-3">{b.brand ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{b.card_type ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{b.category ?? "—"}</td>
                    <td className="px-4 py-3">{b.bank_name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <section className="mt-14 border-t border-border pt-8">
          <h2 className="font-display text-xl font-semibold">About this {country.country_name} BIN list</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Every entry is a {country.country_name} BIN — the first 6 to 8 digits of a card issued by a {country.country_name}{" "}
            bank. A BIN identifies the issuer before the full card number is ever shared, which is why payment teams check it first:
            it reveals the scheme (Visa, Mastercard, American Express and others), whether the card is credit, debit or prepaid, and
            which bank stands behind it{currencies[0] ? `, usually settling in ${currencies.slice(0, 2).map(([c]) => c).join(" or ")}` : ""}.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            This list is built from real card checks on Binly, so it grows every day. To look up a single card, enter its first
            digits in the{" "}
            <Link to="/" className="text-primary underline-offset-4 hover:underline">
              BIN checker
            </Link>
            , or explore curated{" "}
            <Link to="/bins" className="text-primary underline-offset-4 hover:underline">
              BIN categories
            </Link>{" "}
            like store and bank collections.
          </p>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="font-display text-xl font-semibold">How to read a {country.country_name} BIN</h2>
          <ol className="mt-3 max-w-3xl list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Take the first 6 digits of the card number — that is the BIN.</li>
            <li>Find those digits in the table above to see the bank, scheme, brand and card type.</li>
            <li>Want the currency, prepaid flag and country flag too? Paste the BIN into the free Binly checker for the full breakdown.</li>
          </ol>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="font-display text-xl font-semibold">{country.country_name} BIN list FAQs</h2>
          <dl className="mt-4 max-w-3xl space-y-5 text-sm">
            <div>
              <dt className="font-semibold text-foreground">
                How many {country.country_name} BINs are on this list?
              </dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">
                There {bins.length === 1 ? "is" : "are"} {bins.length} {country.country_name} BIN
                {bins.length === 1 ? "" : "s"} in the table above, issued by {banks.size}{" "}
                {banks.size === 1 ? "bank" : "banks"}. The list is generated from real BIN checks on Binly, so new{" "}
                {country.country_name} card ranges appear automatically as cards are looked up.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Is this {country.country_name} BIN list free?</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">
                Yes. Every country BIN list on Binly is free to browse, and the{" "}
                <Link to="/" className="text-primary underline-offset-4 hover:underline">
                  BIN checker
                </Link>{" "}
                is free to use with no account needed.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">
                Which card schemes are common in {country.country_name}?
              </dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">
                {schemes.length > 0
                  ? `${country.country_name} cards on Binly are mostly ${schemes
                      .slice(0, 3)
                      .map(([s]) => s)
                      .join(", ")}, with ${schemes[0][0]} the most common scheme in this list.`
                  : `Scheme details for ${country.country_name} cards appear here as more cards are checked.`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">What can I do with a {country.country_name} BIN?</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">
                A BIN tells you who issued a card before it is charged. Payment teams use {country.country_name} BIN
                data to tell credit, debit and prepaid cards apart, spot foreign or commercial cards, and route
                payments to the right processor. Check any individual card with the free{" "}
                <Link to="/" className="text-primary underline-offset-4 hover:underline">
                  Binly BIN lookup
                </Link>
                .
              </dd>
            </div>
          </dl>
        </section>

        {related.length > 0 && (
          <section className="mt-10 border-t border-border pt-8">
            <h2 className="font-display text-xl font-semibold">BIN lists for other countries</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {related.map((c) => (
                <li key={c.country_code}>
                  <Link
                    to="/bin-list/$country"
                    params={{ country: countrySlug(c.country_name) }}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:bg-accent"
                  >
                    {/^[a-z]{2}$/i.test(c.country_code) && (
                      <span
                        aria-hidden
                        className={`fi fi-${c.country_code.toLowerCase()} block h-3 w-5 shrink-0 rounded-sm`}
                      />
                    )}
                    {c.country_name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/bin-list" className="text-xs text-primary underline-offset-4 hover:underline">
                  All countries →
                </Link>
              </li>
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
