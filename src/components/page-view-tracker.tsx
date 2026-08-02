import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackPageView } from "@/lib/analytics.api";

/** Records one page view per client-side navigation. Renders nothing. */
export function PageViewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    void trackPageView(pathname);
  }, [pathname]);

  return null;
}
