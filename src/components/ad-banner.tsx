import { useEffect, useState } from "react";
import { listBanners, type AdBanner } from "@/lib/banners.api";

const CACHE_KEY = "ad_banners_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

function readCache(): AdBanner[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: AdBanner[] };
    if (!parsed?.data || Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data: AdBanner[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch { /* ignore */ }
}

export function AdBanner() {
  const [banners, setBanners] = useState<AdBanner[]>(() => {
    const cached = readCache();
    return cached ? cached.filter((x) => x.active && x.image_url) : [];
  });

  useEffect(() => {
    // Warm the browser cache for every banner image immediately, in parallel.
    banners.forEach((b) => {
      if (b.image_url) {
        const img = new Image();
        img.decoding = "async";
        img.src = b.image_url;
      }
    });
  }, [banners]);

  useEffect(() => {
    listBanners()
      .then((b) => {
        writeCache(b);
        setBanners(b.filter((x) => x.active && x.image_url));
      })
      .catch(() => {});
  }, []);

  if (banners.length === 0) return null;

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-2 px-3 py-3 sm:grid-cols-2 lg:grid-cols-3">
      {banners.map((b, i) => (
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
