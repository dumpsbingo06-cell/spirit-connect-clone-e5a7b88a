import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, FolderOpen, Layers3 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { listCategories } from "@/lib/bin-categories.api";

const TITLE = "BIN Categories — Curated Card BIN Collections | Binly";
const DESCRIPTION =
  "Browse curated BIN collections — Walmart BINs, Gummy Bear BINs and more. Every BIN shows its issuing bank, scheme, brand, card type and country, checked free with the Binly BIN lookup.";
const URL = "https://www.binly.xyz/bins";

export const Route = createFileRoute("/bins/")({
  loader: async () => ({ categories: await listCategories().catch(() => []) }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
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
            { "@type": "ListItem", position: 2, name: "BIN Categories", item: URL },
          ],
        }),
      },
    ],
  }),
  component: BinsIndex,
});

function BinsIndex() {
  const { categories } = Route.useLoaderData();
  const totalBins = categories.reduce((total, category) => total + (category.bin_count ?? 0), 0);
  return (
    <div className="forum-page flex min-h-screen flex-col">
      <SiteHeader variant="forum" />
      <div aria-hidden className="forum-pattern pointer-events-none absolute inset-x-0 top-14 h-72 opacity-40" />
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-forum-line pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-forum-accent">
              <Layers3 className="h-4 w-4" aria-hidden />
              <span>Binly / Collections</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">BIN Categories</h1>
          </div>
          <dl className="flex gap-6 border-l border-forum-line pl-5">
            <div><dt className="text-xs text-forum-muted">Collections</dt><dd className="mt-1 font-display text-xl font-semibold tabular-nums">{categories.length.toLocaleString()}</dd></div>
            <div><dt className="text-xs text-forum-muted">BIN entries</dt><dd className="mt-1 font-display text-xl font-semibold tabular-nums">{totalBins.toLocaleString()}</dd></div>
          </dl>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-forum-muted">
          These collections are hand-picked by the Binly community — groups of BINs that share something in common, like the store
          they work at, the bank that issued them, or the type of card. Open a collection to see every BIN with its full card
          details, or browse the{" "}
          <Link to="/bin-list" className="text-forum-accent underline-offset-4 hover:underline">
            complete BIN list by country
          </Link>
          .
        </p>

        <div className="mt-8 flex items-center justify-between border-b border-forum-accent/70 bg-forum-panel px-4 py-3">
          <h2 className="text-sm font-semibold">All collections</h2>
          <span className="text-xs font-medium text-forum-muted">{categories.length.toLocaleString()} listed</span>
        </div>
        {categories.length === 0 ? (
          <p className="border-x border-b border-forum-line bg-forum-panel px-4 py-8 text-sm text-forum-muted">No categories published yet.</p>
        ) : (
          <ul className="divide-y divide-forum-line border-x border-b border-forum-line bg-forum-panel">
            {categories.map((c) => (
              <li key={c.id}>
                <Link to="/bins/$slug" params={{ slug: c.slug }} className="group flex min-h-20 items-center gap-4 px-4 py-4 transition-colors hover:bg-forum-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forum-accent sm:px-5">
                  <FolderOpen className="h-5 w-5 shrink-0 text-forum-accent" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-semibold text-forum-ink group-hover:text-forum-accent">{c.name}</span>
                    {c.description && <span className="mt-1 line-clamp-2 block text-sm text-forum-muted">{c.description}</span>}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold tabular-nums text-forum-ink">{c.bin_count}</span>
                    <span className="text-xs text-forum-muted">{c.bin_count === 1 ? "BIN" : "BINs"}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-forum-muted transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <section className="mt-12 border-t border-forum-line pt-8">
          <h2 className="font-display text-xl font-semibold">What are BIN categories?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-forum-muted">
            A BIN (Bank Identification Number) is the first 6 to 8 digits of a payment card, and it identifies who issued the card.
            Collections group BINs that belong together — for example, BINs known to work at a particular store, BINs from one bank,
            or BINs of one card type like prepaid or business cards. Risk teams, developers and shoppers use them to spot what kind
            of card they are dealing with before accepting or using it.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-forum-muted">
            Every entry in a collection shows its issuing bank, card scheme, brand, card type, level, country and currency. You can
            verify any of them instantly with the free{" "}
              className="text-forum-accent underline-offset-4 hover:underline"
              Binly BIN checker
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
