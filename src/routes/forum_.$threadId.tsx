import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Lock, Pin, Trash2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { isCurrentUserAdmin } from "@/lib/banners.api";
import {
  getThread,
  bumpThreadViews,
  createReply,
  deleteThread,
  setThreadFlags,
  getMyProfile,
  saveMyProfile,
  type ForumThread,
  type ForumPost,
} from "@/lib/forum.api";

export const Route = createFileRoute("/forum_/$threadId")({
  head: () => ({
    meta: [
      { title: "Forum thread — Binly Community" },
      {
        name: "description",
        content: "Read and reply to this discussion in the Binly community forum.",
      },
      { property: "og:title", content: "Binly Community — forum thread" },
      { property: "og:description", content: "Read and reply to this Binly community discussion." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { user } = useSession();
  const nav = useNavigate();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [username, setUsername] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  async function load() {
    const res = await getThread(threadId);
    setThread(res?.thread ?? null);
    setPosts(res?.posts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    void bumpThreadViews(threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    if (!user) return;
    getMyProfile().then((p) => setNeedsName(!p));
    isCurrentUserAdmin()
      .then(({ admin }) => setIsAdmin(admin))
      .catch(() => setIsAdmin(false));
  }, [user]);

  async function send() {
    setError(null);
    setBusy(true);
    try {
      if (needsName) await saveMyProfile(username);
      await createReply(threadId, reply);
      setReply("");
      setNeedsName(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reply.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto flex-1 px-4 py-20 text-center">
          <p className="text-sm text-muted-foreground">This thread no longer exists.</p>
          <Link to="/forum" className="mt-3 inline-block text-primary hover:underline">
            Back to the forum
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link
          to="/forum"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All threads
        </Link>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">{thread.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {thread.author_name} · {new Date(thread.created_at).toLocaleString()} ·{" "}
          {thread.view_count} views
        </p>

        {isAdmin && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await setThreadFlags(thread.id, { pinned: !thread.pinned });
                await load();
              }}
            >
              <Pin className="mr-1.5 h-3.5 w-3.5" /> {thread.pinned ? "Unpin" : "Pin"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await setThreadFlags(thread.id, { locked: !thread.locked });
                await load();
              }}
            >
              <Lock className="mr-1.5 h-3.5 w-3.5" /> {thread.locked ? "Unlock" : "Lock"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (!confirm("Delete this thread?")) return;
                await deleteThread(thread.id);
                nav({ to: "/forum" });
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <article className="mt-5 whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm leading-relaxed shadow-card">
          {thread.body}
        </article>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {posts.length} {posts.length === 1 ? "reply" : "replies"}
        </h2>
        <div className="mt-3 space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="rounded-xl border border-border/70 bg-card/60 p-4">
              <p className="text-xs font-medium text-foreground">
                {p.author_name}{" "}
                <span className="font-normal text-muted-foreground">
                  · {new Date(p.created_at).toLocaleString()}
                </span>
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-card">
          {thread.locked ? (
            <p className="text-sm text-muted-foreground">This thread is locked.</p>
          ) : !user ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Sign in to join the discussion.</p>
              <Button size="sm" onClick={() => nav({ to: "/auth" })}>
                Sign in
              </Button>
            </div>
          ) : (
            <>
              {needsName && (
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Pick a public username"
                  maxLength={24}
                  className="mb-3"
                />
              )}
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                placeholder="Write a reply…"
              />
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
              <Button onClick={send} disabled={busy} size="sm" className="mt-3">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post reply
              </Button>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
