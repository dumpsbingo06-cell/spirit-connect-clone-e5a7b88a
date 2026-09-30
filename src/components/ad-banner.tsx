import { useMemo } from "react";
import type { AdBanner as AdBannerRow } from "@/lib/banners.api";
import { useStaggeredRotation } from "@/components/popular-bins";

const TILE_WIDTH = "w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]";

export function AdBanner({ banners = [] }: { banners?: AdBannerRow[] }) {
  const visible = useMemo(() => banners.filter((x) => x.active && x.image_url), [banners]);
  // Gentle visual rotation: tiles keep their DOM position (GIFs never restart),
  // only their display order shifts over time.
  const offset = useStaggeredRotation(visible.length);
  if (visible.length === 0) return null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-3 py-3">
      {visible.map((b, i) => (
        <BannerTile
          key={b.id}
          banner={b}
          priority={i < 3}
          order={(i + offset) % visible.length}
        />
      ))}
    </div>
  );
}

function BannerTile({ banner, priority, order }: { banner: AdBannerRow; priority: boolean; order: number }) {
  const bg = banner.background_color ?? "#1f2937";
  const img = (
    <img
      src={banner.image_url!}
      alt={banner.label || `Banner ${banner.slot}`}
      className="h-full w-full object-cover"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
  const inner = (
    <div
      className="flex h-[72px] w-full items-center justify-center overflow-hidden rounded-md border border-white/10 shadow-sm transition-transform hover:scale-[1.01]"
      style={{ background: bg }}
    >
      {img}
    </div>
  );
  if (banner.link_url) {
    return (
      <a
        href={banner.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`block ${TILE_WIDTH}`}
        style={{ order }}
      >
        {inner}
      </a>
    );
  }
  return (
    <div className={TILE_WIDTH} style={{ order }}>
      {inner}
    </div>
  );
}
