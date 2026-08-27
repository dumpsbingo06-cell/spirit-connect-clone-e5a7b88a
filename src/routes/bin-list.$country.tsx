import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { findCountryBySlug, listBinsByCountry, countrySlug } from "@/lib/bin-directory.api";

export const Route = createFileRoute("/bin-list/$country")({
  loader: async ({ params }) => {
    const country = await findCountryBySlug(params.country);
    if (!country) throw notFound();
    const bins = await listBinsByCountry(country.country_code, 500).catch(() => []);
    return { country, bins };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Unavailable — Binly" }, { name: "robots", content: "noindex" }],
      };
    }
    const name = loaderData.country.country_name;
    const title = `${name} BIN List — Card BIN / IIN Numbers | Binly`;
    const description = `${loaderData.bins.length} ${name} BIN numbers with issuing bank, card scheme, brand and card type. Free ${name} BIN / IIN lookup and list.`;
    const url = `https://binly.xyz/bin-list/${countrySlug(name)}`;
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
              { "@type": "ListItem", position: 1, name: "Binly", item: "https://binly.xyz/" },
              {
                "@type": "ListItem",
                position: 2,
                name: "BIN List by Country",
                item: "https://binly.xyz/bin-list",
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

function CountryBinList() {
  const { country, bins } = Route.useLoaderData();
  const banks = Array.from(
    new Set(bins.map((b) => b.bank_name).filter((b): b is string => Boolean(b))),
  ).slice(0, 12);

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
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {country.country_name} BIN List
          </h1>
        </div>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          {bins.length} bank identification numbers (BIN / IIN) issued in {country.country_name}
          {country.currency_note ?? ""}. Each row shows the card scheme, brand, card type and the
          issuing bank. Use the{" "}
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            BIN lookup tool
          </Link>{" "}
          to check any card number in detail.
        </p>

        {banks.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Issuing banks include:</span>{" "}
            {banks.join(", ")}.
          </p>
        )}

        {bins.length === 0 ? (
          <p className="mt-10 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No BINs recorded for {country.country_name} yet.
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{country.country_name} BIN numbers</caption>
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
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
      </main>
      <SiteFooter />
    </div>
  );
}
