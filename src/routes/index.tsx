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
    <div className="relative flex min-h-screen flex-col bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[520px] bg-gradient-to-b from-primary/10 via-accent/5 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[520px] opacity-40 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.52_0.16_250_/_0.15)_1px,transparent_0)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <div className="relative z-10 flex flex-1 flex-col">
        <SiteHeader />
        <AdBanner />
        <main className="flex-1 py-10 sm:py-14">
          <BinLookup />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

