import type { AdBanner as AdBannerRow } from "@/lib/banners.api";

export function AdBanner({ banners = [] }: { banners?: AdBannerRow[] }) {
  const visible = banners.filter((x) => x.active && x.image_url);
  if (visible.length === 0) return null;

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-2 px-3 py-3 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((b, i) => (
        <BannerTile key={b.id} banner={b} priority={i < 3} />
      ))}
    </div>
  );
}


function BannerTile({ banner, priority }: { banner: AdBanner; priority: boolean }) {
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
      <a href={banner.link_url} target="_blank" rel="noopener noreferrer sponsored" className="block">
        {inner}
      </a>
    );
  }
  return inner;
}
