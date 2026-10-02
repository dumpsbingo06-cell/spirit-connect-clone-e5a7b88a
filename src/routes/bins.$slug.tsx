import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCategoryBySlug, listCategoryBins } from "@/lib/bin-categories.api";

export const Route = createFileRoute("/bins/$slug")({
  loader: async ({ params }) => {
    const category = await getCategoryBySlug(params.slug);
    if (!category) throw notFound();
    const bins = await listCategoryBins(category.id);
    return { category, bins };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category.name ?? "BIN Category";
    const title = `${name} — BIN List | Binly`;
    const desc =
      loaderData?.category.description ||
      `${loaderData?.bins.length ?? 0} curated ${name} on Binly. Check any of them instantly with our free BIN lookup.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
      links: loaderData ? [{ rel: "canonical", href: `https://binly.xyz/bins/${loaderData.category.slug}` }] : [],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Category not found</h1>
        <Link to="/bins" className="mt-4 inline-block text-primary">See all categories</Link>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: () => <p className="p-8 text-center">Could not load this category.</p>,
  component: CategoryPage,
});

function CategoryPage() {
  const { category, bins } = Route.useLoaderData();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <Link to="/bins" className="text-sm text-muted-foreground hover:text-foreground">← All categories</Link>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{category.name}</h1>
        {category.description && <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p>}
        <p className="mt-2 text-sm text-muted-foreground">{bins.length} BINs</p>
        {bins.length === 0 ? (
          <p className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No BINs added yet.</p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-3">BIN</th><th className="px-4 py-3">Note</th></tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {bins.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-2.5 font-mono font-semibold">{b.bin}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{b.note || "—"}</td>
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
