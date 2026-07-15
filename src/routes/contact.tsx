import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Send, ArrowLeft, CheckCircle2, Copy, MessageSquare } from "lucide-react";
import {
  submitContactMessage,
  listRememberedTickets,
  type TicketHandle,
} from "@/lib/site.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Binly" },
      { name: "description", content: "Reach the Binly team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<TicketHandle | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [remembered, setRemembered] = useState<ReturnType<typeof listRememberedTickets>>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRemembered(listRememberedTickets());
  }, [ticket]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const t = await submitContactMessage({ subject, message, email });
      setTicket(t);
      setSubject("");
      setEmail("");
      setMessage("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  const ticketUrl = ticket
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/ticket/${ticket.id}?token=${ticket.token}`
    : "";

  async function copyLink() {
    if (!ticketUrl) return;
    try {
      await navigator.clipboard.writeText(ticketUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-glow">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">Direct line</p>
            <h1 className="mt-1 font-display text-2xl font-semibold">Contact the team</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Send us a message — we'll get back to you. You'll get a ticket link to follow the conversation.
            </p>
          </div>

          {ticket ? (
            <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-primary/5 p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="font-display text-lg font-semibold">Ticket opened</h2>
                  <p className="text-sm text-muted-foreground">Keep this link — it's the only way to view your ticket.</p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your ticket link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">{ticketUrl}</code>
                  <Button size="sm" variant="outline" onClick={copyLink} className="gap-1">
                    <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to="/ticket/$id" params={{ id: ticket.id }} search={{ token: ticket.token }}>
                  <Button size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" /> Open ticket
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => setTicket(null)}>Send another</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Subject">
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={100} required />
              </Field>
              <Field label="Your email (optional, for reply)">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} placeholder="you@example.com" />
              </Field>

              <Field label="Message">
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={6} required />
                <p className="mt-1 text-right text-[11px] text-muted-foreground">{message.length}/2000</p>
              </Field>

              {err && <p className="text-sm text-destructive">{err}</p>}

              <Button type="submit" disabled={busy} className="w-full gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send message
              </Button>
            </form>
          )}
        </div>

        {remembered.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your recent tickets
            </h2>
            <ul className="space-y-2">
              {remembered.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/ticket/$id"
                    params={{ id: t.id }}
                    search={{ token: t.token }}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2 hover:border-primary/40"
                  >
                    <span className="truncate">
                      <span className="text-sm font-semibold">{t.subject || "Ticket"}</span>{" "}
                      <span className="ml-2 font-mono text-[10px] text-muted-foreground">#{t.id.slice(0, 8)}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">{new Date(t.savedAt).toLocaleDateString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
