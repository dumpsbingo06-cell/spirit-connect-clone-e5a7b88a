import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { ArrowLeft, Loader2, Send, RefreshCw, Lock } from "lucide-react";
import {
  getTicketThread,
  postTicketReplyAsUser,
  type TicketThread,
} from "@/lib/site.api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const searchSchema = z.object({ token: z.string().uuid().optional().catch(undefined) });

export const Route = createFileRoute("/ticket/$id")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Support ticket — Binly" }] }),
  component: TicketPage,
});

function TicketPage() {
  const { id } = Route.useParams();
  const { token } = useSearch({ from: "/ticket/$id" });
  const [thread, setThread] = useState<TicketThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    if (!token) {
      setErr("Missing access token. Use the exact link you received after submitting your message.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const t = await getTicketThread(id, token);
      if (!t) setErr("Ticket not found, or the token is invalid.");
      setThread(t);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread?.replies.length]);

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!token || !body.trim()) return;
    setSending(true);
    try {
      await postTicketReplyAsUser(id, token, body);
      setBody("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-glow">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary">Support ticket</p>
              <h1 className="mt-1 font-display text-2xl font-semibold">
                {thread?.name ?? "Ticket"}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Ticket ID: <span className="font-mono">{id.slice(0, 8)}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {thread && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    thread.status === "open"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {thread.status}
                </span>
              )}
              <button onClick={load} className="text-muted-foreground hover:text-foreground" aria-label="Refresh">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {loading && !thread ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : err ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</p>
          ) : thread ? (
            <>
              <div className="space-y-3">
                <Bubble side="user" label="You" time={thread.created_at} body={thread.message} />
                {thread.replies.map((r) => (
                  <Bubble
                    key={r.id}
                    side={r.from_admin ? "admin" : "user"}
                    label={r.from_admin ? "Support" : "You"}
                    time={r.created_at}
                    body={r.body}
                  />
                ))}
                <div ref={bottomRef} />
              </div>

              {thread.status === "open" ? (
                <form onSubmit={onReply} className="mt-6 space-y-2">
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    maxLength={4000}
                    placeholder="Write a reply…"
                    required
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{body.length}/4000</span>
                    <Button type="submit" disabled={sending || !body.trim()} className="gap-2">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send reply
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" /> This ticket is closed. Start a new message from the contact page.
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Bubble({
  side,
  label,
  time,
  body,
}: {
  side: "admin" | "user";
  label: string;
  time: string;
  body: string;
}) {
  const isAdmin = side === "admin";
  return (
    <div className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm ${
          isAdmin
            ? "border-primary/30 bg-primary/10 text-foreground"
            : "border-border bg-background text-foreground"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="font-semibold">{label}</span>
          <time>{new Date(time).toLocaleString()}</time>
        </div>
        <p className="whitespace-pre-wrap text-sm">{body}</p>
      </div>
    </div>
  );
}
