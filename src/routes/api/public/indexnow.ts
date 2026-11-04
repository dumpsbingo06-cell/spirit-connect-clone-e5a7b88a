import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const INDEXNOW_KEY = "4494cee2fb294dc79f17ae94adf54960";
const SITE_HOST = "www.binly.xyz";
const SITE_ORIGIN = `https://${SITE_HOST}`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

/**
 * IndexNow submission endpoint. Clients POST { urls: string[] } and the server
 * forwards them to api.indexnow.org. Key ownership is proven by the public
 * key file at https://www.binly.xyz/4494cee2fb294dc79f17ae94adf54960.txt.
 */
export const Route = createFileRoute("/api/public/indexnow")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { urls?: unknown } | null;
        const raw = Array.isArray(body?.urls) ? body!.urls : [];
        const urls = raw
          .filter((u): u is string => typeof u === "string")
          .map((u) => {
            try {
              const parsed = new URL(u, SITE_ORIGIN);
              if (parsed.hostname !== SITE_HOST || parsed.protocol !== "https:") return null;
              return parsed.href;
            } catch {
              return null;
            }
          })
          .filter((u): u is string => Boolean(u))
          .slice(0, 100);

        if (urls.length === 0) {
          return Response.json({ error: "No valid URLs" }, { status: 400 });
        }

        try {
          const res = await fetch(INDEXNOW_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              host: SITE_HOST,
              key: INDEXNOW_KEY,
              keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
              urlList: urls,
            }),
          });
          return Response.json({ submitted: urls.length, status: res.status });
        } catch {
          return Response.json({ error: "IndexNow unreachable" }, { status: 502 });
        }
      },
    },
  },
});
