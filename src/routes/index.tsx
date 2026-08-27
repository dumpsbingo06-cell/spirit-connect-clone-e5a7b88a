import { createFileRoute } from "@tanstack/react-router";

import { AdBanner } from "@/components/ad-banner";
import { BinLookup } from "@/components/bin-lookup";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { listBanners } from "@/lib/banners.api";
import { getSiteSettings } from "@/lib/site.api";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [banners, settings] = await Promise.all([
      listBanners().catch(() => []),
      getSiteSettings().catch(() => null),
    ]);
    return { banners, settings };
  },
  head: () => ({
    meta: [
      { title: "BIN Lookup & BIN Checker — Free BIN / IIN Search | Binly" },
      {
        name: "description",
        content:
          "Free BIN lookup and BIN checker. Enter the first 6 digits of any card to find the issuing bank, scheme, brand, card type, country and currency.",
      },
      { property: "og:title", content: "BIN Lookup & BIN Checker — Binly" },
      {
        property: "og:description",
        content:
          "Identify the issuing bank, scheme, brand, country and currency behind any card BIN in seconds.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://binly.xyz/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://binly.xyz/" }],
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
  const { banners, settings } = Route.useLoaderData();
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
        <AdBanner banners={banners} />
        <main className="flex-1 py-10 sm:py-14">
          <BinLookup hero={settings} />
          <p className="mx-auto mt-10 max-w-2xl px-4 text-center text-sm text-muted-foreground">
            Prefer to browse?{" "}
            <Link to="/bin-list" className="text-primary underline-offset-4 hover:underline">
              View the full BIN list by country
            </Link>
            .
          </p>
        </main>


        <SiteFooter />
      </div>
    </div>
  );
}

