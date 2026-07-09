import { createFileRoute } from "@tanstack/react-router";

import { AdBanner } from "@/components/ad-banner";
import { BinLookup } from "@/components/bin-lookup";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Binly",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          description:
            "Binly is a professional BIN/IIN lookup tool. Identify the issuing bank, scheme, brand, card type, country and currency behind any card BIN.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <AdBanner />
      <section className="border-b border-border/60 bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto w-full max-w-4xl px-4 pb-2 pt-8 text-center sm:pt-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Binly · BIN Intelligence
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Identify any bank card in <span className="bg-gradient-accent bg-clip-text text-transparent">seconds</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Enter the first 6 digits of a card to reveal the issuing bank, scheme, brand, country and currency — powered by a live, cached BIN database.
          </p>
        </div>
      </section>
      <main className="flex-1 py-6">
        <BinLookup />
      </main>
      <SiteFooter />
    </div>
  );
}

