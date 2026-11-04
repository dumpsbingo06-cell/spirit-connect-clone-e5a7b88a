const SITE_ORIGIN = "https://www.binly.xyz";

/**
 * Fire-and-forget IndexNow notification for new, updated or removed URLs.
 * Calls the same-origin /api/public/indexnow server route, which validates the
 * paths and forwards them to api.indexnow.org.
 */
export function notifyIndexNow(paths: string[]) {
  if (typeof window === "undefined" || paths.length === 0) return;
  const urls = paths.map((p) => `${SITE_ORIGIN}${p.startsWith("/") ? p : `/${p}`}`);
  fetch("/api/public/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
    keepalive: true,
  }).catch(() => {});
}
