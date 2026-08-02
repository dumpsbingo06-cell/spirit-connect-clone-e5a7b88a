import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, Pin, Lock, Plus, Loader2, Eye } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import {
  listCategories,
  listThreads,
  createThread,
  getMyProfile,
  saveMyProfile,
  type ForumCategory,
  type ForumThread,
} from "@/lib/forum.api";

export const Route = createFileRoute("/forum")({
  head: () => ({
    meta: [
      { title: "Binly Community Forum — Cards, BINs & Payments" },
      {
        name: "description",
        content:
          "Join the Binly community forum to discuss BIN data, card schemes, issuer behaviour and fraud prevention with other members.",
      },
      { property: "og:title", content: "Binly Community Forum" },
      {
        property: "og:description",
        content: "Discuss BIN data, card schemes and payments with the Binly community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForumPage,
});

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function ForumPage() {
  const { user, ready } = useSession();
  const nav = useNavigate();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [active, setActive] = useState<string | "all">("all");
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [username, setUsername] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [c, t] = await Promise.all([listCategories(), listThreads()]);
      if (cancelled) return;
      setCategories(c);
      setThreads(t);
      setCategoryId(c[0]?.id ?? "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    getMyProfile().then((p) => setNeedsName(!p));
  }, [user]);

  async function refresh(cat: string | "all") {
    setActive(cat);
    setLoading(true);
    setThreads(await listThreads(cat === "all" ? undefined : cat));
    setLoading(false);
  }

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      if (needsName) await saveMyProfile(username);
      const id = await createThread({ categoryId, title, body });
      setNeedsName(false);
      nav({ to: "/forum/$threadId", params: { threadId: id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Community</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask questions, share BIN findings and talk payments with other members.
            </p>
          </div>
          {ready && user ? (
            <Button size="sm" onClick={() => setComposing((v) => !v)}>
              <Plus className="mr-1.5 h-4 w-4" /> New thread
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => nav({ to: "/auth" })}>
              Sign in to post
            </Button>
          )}
        </div>

        {composing && user && (
          <div className="mt-5 rounded-xl border border-border bg-card p-4 shadow-card">
            {needsName && (
              <div className="mb-3">
                <label className="text-xs font-medium text-muted-foreground">
                  Pick a public username
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. cardgeek"
                  maxLength={24}
                />
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Thread title"
                maxLength={160}
              />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your post…"
              rows={5}
              className="mt-3"
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <div className="mt-3 flex gap-2">
              <Button onClick={submit} disabled={busy} size="sm">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Publish
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <CategoryChip label="All" active={active === "all"} onClick={() => refresh("all")} />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              active={active === c.id}
              onClick={() => refresh(c.id)}
            />
          ))}
        </div>

        <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {loading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <div className="px-4 py-14 text-center text-sm text-muted-foreground">
              No threads here yet — be the first to start the conversation.
            </div>
          ) : (
            threads.map((t) => (
              <Link
                key={t.id}
                to="/forum/$threadId"
                params={{ threadId: t.id }}
                className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold uppercase text-secondary-foreground">
                  {(t.author_name ?? "m").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {t.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                    {t.locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="truncate font-medium text-foreground">{t.title}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {t.author_name} · {timeAgo(t.last_activity_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> {t.reply_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {t.view_count}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
