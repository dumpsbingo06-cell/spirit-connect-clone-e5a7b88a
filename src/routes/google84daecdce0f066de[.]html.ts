import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// Google Search Console ownership verification file.
const BODY = "google-site-verification: google84daecdce0f066de.html";

export const Route = createFileRoute("/google84daecdce0f066de.html")({
  server: {
    handlers: {
      GET: () =>
        new Response(BODY, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
