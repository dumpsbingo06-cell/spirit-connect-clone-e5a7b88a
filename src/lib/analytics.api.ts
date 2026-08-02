// Lightweight first-party visitor analytics.
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "binly.visitor";

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

export async function trackPageView(path: string): Promise<void> {
  try {
    let referrer = "";
    try {
      const raw = document.referrer;
      if (raw && !raw.startsWith(window.location.origin)) referrer = new URL(raw).hostname;
    } catch {}
    await supabase.from("page_views").insert({
      path: path.slice(0, 300),
      visitor_id: getVisitorId().slice(0, 64),
      referrer: referrer || null,
    });
  } catch {
    // analytics must never break the page
  }
}

export interface DailyPoint {
  day: string;
  views: number;
  visitors: number;
}

export interface VisitorStats {
  total_views: number;
  total_visitors: number;
  views_period: number;
  visitors_period: number;
  views_today: number;
  visitors_today: number;
  daily: DailyPoint[];
  top_paths: { path: string; views: number }[];
  top_referrers: { referrer: string; views: number }[];
}

export async function getVisitorStats(days = 30): Promise<VisitorStats> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("visitor_stats", { p_days: days });
  if (error) throw new Error(error.message);
  return data as VisitorStats;
}
