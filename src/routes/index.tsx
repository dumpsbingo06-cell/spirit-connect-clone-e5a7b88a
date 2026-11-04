import { createFileRoute, Link } from "@tanstack/react-router";

import { AdBanner } from "@/components/ad-banner";
import { BinLookup } from "@/components/bin-lookup";
import { PopularBins } from "@/components/popular-bins";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { listBanners } from "@/lib/banners.api";
import { listPopularBins } from "@/lib/bin-directory.api";
import { getSiteSettings } from "@/lib/site.api";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [banners, settings, popular] = await Promise.all([
      listBanners().catch(() => []),
      getSiteSettings().catch(() => null),
      listPopularBins().catch(() => []),
    ]);
    return { banners, settings, popular };
  },
  head: () => ({
    meta: [
      { title: "BIN Lookup & BIN Checker — Free BIN / IIN Search | Binly" },
      {
        name: "description",
        content:
          "Free BIN lookup and BIN checker. Enter the first 6–8 digits of any card to search a growing BIN/IIN database and find the issuing bank, scheme, brand, card type, country and currency.",
      },
      { property: "og:title", content: "BIN Lookup & BIN Checker — Binly" },
      {
        property: "og:description",
        content:
          "Identify the issuing bank, scheme, brand, country and currency behind any card BIN in seconds.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.binly.xyz/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.binly.xyz/" }],
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
  const { banners, settings, popular } = Route.useLoaderData();
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
          <PopularBins bins={popular} />
          <section className="mx-auto mt-16 w-full max-w-3xl px-4">
            <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
              Free BIN lookup &amp; BIN checker
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Binly is a free BIN lookup and BIN checker for anyone who needs to know more about a payment card before
              accepting it. Enter the first 6–8 digits of a credit or debit card into the BIN search above, and Binly
              returns the issuing bank, card scheme, brand, card type, level, country and currency — instantly, with no
              sign-up.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Every check also feeds the public{" "}
              <Link to="/bin-list" className="text-primary underline-offset-4 hover:underline">
                BIN/IIN database
              </Link>
              , where BINs are organised by country, bank and scheme so merchants, risk teams and developers can browse
              a complete BIN list without running individual searches. Prefer curated groups? Explore the community{" "}
              <Link to="/bins" className="text-primary underline-offset-4 hover:underline">
                BIN categories
              </Link>{" "}
              or{" "}
              <Link to="/contact" className="text-primary underline-offset-4 hover:underline">
                contact the Binly team
              </Link>{" "}
              about BIN data.
            </p>
          </section>
        </main>


        <SiteFooter />
      </div>
    </div>
  );
}

