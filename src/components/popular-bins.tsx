import { useEffect, useState } from "react";
import { TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { type PopularBin } from "@/lib/bin-directory.api";
import { BrandLogo } from "@/components/brand-logo";
import { countrySlug } from "@/lib/bin-directory.api";

const SCHEME_CLASS: Record<string, string> = {
  visa: "text-[#1a1f71]",
  mastercard: "text-[#eb001b]",
  amex: "text-[#006fcf]",
};

export function PopularBins({ bins }: { bins: PopularBin[] }) {
  if (bins.length === 0) return null;
  return (
    <section className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6" aria-label="Popular BINs">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Popular BINs
        </h2>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {bins.map((b) => {
          const slug = b.country_name ? countrySlug(b.country_name) : null;
          const schemeKey = (b.scheme ?? "").toLowerCase();
          const inner = (
            <div className="group flex h-full items-center gap-3 rounded-lg border border-border/70 bg-card/70 px-3 py-2.5 shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:bg-accent/40">
              <BrandLogo
                name={b.scheme}
                className="h-6 w-9 shrink-0 rounded-sm border border-border bg-white object-contain p-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                    {b.bin.slice(0, 6)}
                  </span>
                  {b.country_emoji ? <span aria-hidden>{b.country_emoji}</span> : null}
                </div>
                <div
                  className={`truncate text-xs text-muted-foreground ${
                    SCHEME_CLASS[schemeKey] ? `font-medium ${SCHEME_CLASS[schemeKey]}` : ""
                  }`}
                  title={b.bank_name ?? b.scheme ?? undefined}
                >
                  {b.bank_name ?? b.scheme ?? "Unknown issuer"}
                </div>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </div>
          );
          return (
            <li key={b.bin}>
              {slug ? (
                <Link to="/bin-list/$country" params={{ country: slug }} className="block h-full">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Gently rotates the display order of banner tiles without moving DOM nodes
 * (so GIFs never restart). Purely visual — safe for hydration. */
export function useStaggeredRotation(count: number, intervalMs = 15000) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setOffset((o) => (o + 1) % count), intervalMs);
    return () => clearInterval(t);
  }, [count, intervalMs]);
  return offset;
}
