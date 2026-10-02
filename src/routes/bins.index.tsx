import { createFileRoute, Link } from "@tanstack/react-router";
import { Folder } from "lucide-react";

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
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">BIN Categories</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{DESCRIPTION}</p>
        {categories.length === 0 ? (
          <p className="mt-10 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No categories published yet.</p>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id}>
                <Link to="/bins/$slug" params={{ slug: c.slug }} className="flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50">
                  <Folder className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{c.name}</span>
                    {c.description && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{c.description}</span>}
                    <span className="mt-1 block text-xs text-muted-foreground">{c.bin_count} BINs</span>
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
