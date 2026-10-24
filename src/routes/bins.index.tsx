import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Layers3, FolderOpen } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { listCategories } from "@/lib/bin-categories.api";

const TITLE = "BIN Categories — Binly";
const DESCRIPTION = "Browse curated BIN lists by category, hand-picked and organized by the Binly community.";
const URL = "https://binly.xyz/bins";

export const Route = createFileRoute("/bins/")({
  loader: async () => ({ categories: await listCategories().catch(() => []) }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: BinsIndex,
});

function BinsIndex() {
  const { categories } = Route.useLoaderData();
  const totalBins = categories.reduce((total, category) => total + (category.bin_count ?? 0), 0);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Layers3 className="h-4 w-4" aria-hidden />
          <span>BINLY COLLECTIONS</span>
        </div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-8 border-b border-border pb-8">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">BIN Categories<span className="text-muted-foreground">.</span></h1>
          <dl className="flex gap-8">
            <div><dt className="text-xs text-muted-foreground">Collections</dt><dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{categories.length.toLocaleString()}</dd></div>
            <div><dt className="text-xs text-muted-foreground">BIN entries</dt><dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{totalBins.toLocaleString()}</dd></div>
          </dl>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-medium">All collections</h2>
          <ArrowDownRight className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        {categories.length === 0 ? (
          <p className="mt-6 border-y border-border py-8 text-sm text-muted-foreground">No categories published yet.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {categories.map((c, index) => (
              <li key={c.id}>
                <Link to="/bins/$slug" params={{ slug: c.slug }} className="group flex h-full min-h-56 flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="flex items-center justify-between text-muted-foreground">
                    <FolderOpen className="h-6 w-6" aria-hidden />
                    <span className="font-mono text-xs">{String(index + 1).padStart(2, "0")}</span>
                  </span>
                  <span className="mt-8 block break-words font-display text-2xl font-semibold">{c.name}</span>
                  {c.description && <span className="mt-2 line-clamp-2 block text-sm text-muted-foreground">{c.description}</span>}
                  <span className="mt-auto flex items-center justify-between gap-4 pt-6">
                    <span className="text-sm text-muted-foreground"><span className="font-semibold tabular-nums text-foreground">{c.bin_count}</span> {c.bin_count === 1 ? "BIN" : "BINs"}</span>
                    <ArrowUpRight className="h-5 w-5 transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" aria-hidden />
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
