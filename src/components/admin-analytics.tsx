import { useEffect, useState } from "react";
import { Loader2, Users, Eye, TrendingUp } from "lucide-react";
import { getVisitorStats, type VisitorStats } from "@/lib/analytics.api";

export function AdminAnalytics() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVisitorStats(days)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load analytics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const max = Math.max(1, ...(stats?.daily ?? []).map((d) => d.views));

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">Visitors</h2>
          <p className="text-sm text-muted-foreground">First-party traffic from your own database.</p>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                days === d
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : stats ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={<Eye className="h-4 w-4" />} label="Views today" value={stats.views_today} />
            <Stat
              icon={<Users className="h-4 w-4" />}
              label="Visitors today"
              value={stats.visitors_today}
            />
            <Stat
              icon={<TrendingUp className="h-4 w-4" />}
              label={`Views (${days}d)`}
              value={stats.views_period}
            />
            <Stat
              icon={<Users className="h-4 w-4" />}
              label={`Visitors (${days}d)`}
              value={stats.visitors_period}
            />
          </div>

          <div className="mt-5 flex h-32 items-end gap-[3px]">
            {stats.daily.map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${d.views} views / ${d.visitors} visitors`}
                className="flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
                style={{ height: `${Math.max(3, (d.views / max) * 100)}%` }}
              />
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <TopList
              title="Top pages"
              rows={stats.top_paths.map((p) => ({ label: p.path, value: p.views }))}
            />
            <TopList
              title="Top referrers"
              rows={stats.top_referrers.map((r) => ({ label: r.referrer, value: r.views }))}
            />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            All-time: {stats.total_views.toLocaleString()} views ·{" "}
            {stats.total_visitors.toLocaleString()} unique visitors
          </p>
        </>
      ) : null}
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-display text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2 divide-y divide-border rounded-lg border border-border/70">
        {rows.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">No data yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="truncate text-muted-foreground">{r.label || "direct"}</span>
              <span className="font-medium">{r.value.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
