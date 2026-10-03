import { useEffect, useState } from "react";
import { TrendingUp, ChevronRight, FolderOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { type PopularBin } from "@/lib/bin-directory.api";
import { BrandLogo } from "@/components/brand-logo";

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
          return (
            <li key={`${b.category_slug}-${b.bin}`}>
              <Link
                to="/bins/$slug"
                params={{ slug: b.category_slug }}
                className="group flex h-full items-center gap-3 rounded-lg border border-border/70 bg-card/70 px-3 py-3 shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:bg-accent/40"
                aria-label={`View ${b.bin} in ${b.category_name}`}
              >
              <BrandLogo
                name={b.scheme}
                className="h-7 w-10 shrink-0 rounded-sm border border-border bg-card object-contain p-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                    {b.bin.slice(0, 6)}
                  </span>
                  {b.country_emoji ? <span aria-hidden>{b.country_emoji}</span> : null}
                </div>
                <div className="truncate text-xs text-muted-foreground" title={b.bank_name ?? undefined}>
                  {b.bank_name ?? "Details pending"}
                </div>
                <div className="mt-1 flex items-center gap-1 truncate text-[11px] font-medium text-foreground">
                  <FolderOpen className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                  <span className="truncate">{b.category_name}</span>
                </div>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
              </Link>
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
