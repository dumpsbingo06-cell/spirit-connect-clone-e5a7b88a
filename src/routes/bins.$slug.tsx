import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Building2, CreditCard, Globe2, Layers3, WalletCards } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Link to="/bins" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          ← All categories
        </Link>
        <div className="mt-5 border-b border-border pb-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <Layers3 className="h-4 w-4 text-primary" aria-hidden /> Curated BIN category
              </p>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{category.name}</h1>
              {category.description && <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p>}
            </div>
            <div className="rounded-md border border-border bg-muted px-4 py-3 text-right">
              <div className="text-2xl font-bold text-foreground">{bins.length}</div>
              <div className="text-xs font-medium text-muted-foreground">BIN{bins.length === 1 ? "" : "s"}</div>
            </div>
          </div>
        </div>
        {bins.length === 0 ? (
          <p className="mt-8 rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">No BINs added yet.</p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {bins.map((b) => (
              <li key={b.id} className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 items-center gap-3 lg:w-64">
                    <BrandLogo name={b.scheme} className="h-9 w-14 shrink-0 rounded-sm border border-border bg-card object-contain p-1" />
                    <div className="min-w-0">
                      <div className="font-mono text-lg font-bold text-foreground">{b.bin}</div>
                      <div className="truncate text-sm text-muted-foreground">{b.scheme || "Details pending"}</div>
                    </div>
                  </div>

                  <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
                    <BinFact icon={WalletCards} label="Brand" value={b.brand} />
                    <BinFact icon={CreditCard} label="Type" value={b.card_type} />
                    <BinFact icon={Layers3} label="Level" value={b.card_level} />
                    <BinFact icon={Building2} label="Bank" value={b.bank_name} wide />
                    <BinFact
                      icon={Globe2}
                      label="Country"
                      value={[b.country_emoji, b.country_name].filter(Boolean).join(" ") || null}
                    />
                  </dl>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
                  {b.currency && <span className="rounded bg-muted px-2 py-1 font-medium text-foreground">{b.currency}</span>}
                  {b.prepaid !== null && <span className="rounded bg-muted px-2 py-1 text-muted-foreground">{b.prepaid ? "Prepaid" : "Not prepaid"}</span>}
                  {b.commercial !== null && <span className="rounded bg-muted px-2 py-1 text-muted-foreground">{b.commercial ? "Commercial" : "Consumer"}</span>}
                  {b.note && <p className="w-full text-sm text-muted-foreground sm:ml-auto sm:w-auto">Note: {b.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function BinFact({
  icon: Icon,
  label,
  value,
  wide = false,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string | null;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2 sm:col-span-1" : "min-w-0"}>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-foreground" title={value ?? undefined}>
        {value || "Details pending"}
      </dd>
    </div>
  );
}
