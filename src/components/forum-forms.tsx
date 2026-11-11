import { useEffect, useState, type FormEvent } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { MessageSquarePlus, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createForumReply,
  createForumTopic,
  ensureForumProfile,
  forumReplySchema,
  forumTopicSchema,
  getForumProfile,
  type ForumCategory,
} from "@/lib/forum.api";
import { supabase } from "@/integrations/supabase/client";

type MemberState = "loading" | "signed-out" | "signed-in";

function useForumMember() {
  const [status, setStatus] = useState<MemberState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [needsUsername, setNeedsUsername] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function syncMember(userIdValue: string | null) {
      if (!userIdValue) {
        if (!cancelled) {
          setStatus("signed-out");
          setUserId(null);
          setUsername("");
          setNeedsUsername(false);
        }
        return;
      }

      try {
        const profile = await getForumProfile(userIdValue);
        if (cancelled) return;
        setStatus("signed-in");
        setUserId(userIdValue);
        setUsername(profile?.username ?? "");
        setNeedsUsername(!profile);
        setProfileError(null);
      } catch (error) {
        if (cancelled) return;
        setStatus("signed-in");
        setUserId(userIdValue);
        setProfileError(error instanceof Error ? error.message : "Could not load your member profile.");
      }
    }

    supabase.auth.getUser().then(({ data }) => syncMember(data.user?.id ?? null));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncMember(session?.user.id ?? null);
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { status, userId, username, setUsername, needsUsername, setNeedsUsername, profileError };
}

export function ForumTopicForm({ categories }: { categories: ForumCategory[] }) {
  const router = useRouter();
  const member = useForumMember();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!categoryId && categories[0]) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = forumTopicSchema.safeParse({ categoryId, title, body, username: member.username });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the topic details and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const topicId = await createForumTopic(parsed.data);
      setTitle("");
      setBody("");
      await router.navigate({ to: "/forum/$threadId", params: { threadId: topicId } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your topic could not be posted.");
    } finally {
      setSubmitting(false);
    }
  }

  if (member.status === "loading") {
    return <p className="border border-forum-line bg-forum-panel px-4 py-4 text-sm text-forum-muted">Checking member access…</p>;
  }

  if (member.status === "signed-out") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border border-forum-line bg-forum-panel px-4 py-4">
        <p className="text-sm text-forum-muted">Sign in or create an account to start a discussion.</p>
        <Button asChild size="sm" className="bg-forum-accent text-forum-accent-foreground hover:bg-forum-accent/90">
          <Link to="/auth" search={{ redirect: "/forum" }}>Sign in to post</Link>
        </Button>
      </div>
    );
  }

  if (categories.length === 0) {
    return <p className="border border-forum-line bg-forum-panel px-4 py-4 text-sm text-forum-muted">A discussion area must be available before a topic can be posted.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4 border border-forum-line bg-forum-panel p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium text-forum-ink">
          Discussion area
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="flex h-10 w-full rounded-md border border-forum-line bg-forum-raised px-3 py-2 text-sm text-forum-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forum-accent"
            required
          >
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        {member.needsUsername && (
          <label className="block space-y-2 text-sm font-medium text-forum-ink">
            Display name
            <Input
              value={member.username}
              onChange={(event) => member.setUsername(event.target.value)}
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]{3,24}"
              autoComplete="nickname"
              placeholder="3–24 letters, numbers, or underscores"
              className="border-forum-line bg-forum-raised text-forum-ink placeholder:text-forum-muted"
              required
            />
          </label>
        )}
      </div>
      <label className="block space-y-2 text-sm font-medium text-forum-ink">
        Topic title
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={3}
          maxLength={160}
          placeholder=""
          className="border-forum-line bg-forum-raised text-forum-ink placeholder:text-forum-muted"
          required
        />
      </label>
      <label className="block space-y-2 text-sm font-medium text-forum-ink">
        Message
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={10000}
          rows={5}
          placeholder=""
          className="min-h-32 border-forum-line bg-forum-raised text-forum-ink placeholder:text-forum-muted"
          required
        />
      </label>
      {(error || member.profileError) && <p role="alert" className="text-sm text-destructive">{error ?? member.profileError}</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-forum-muted">{body.length.toLocaleString()} / 10,000</span>
        <Button type="submit" disabled={submitting || !member.userId} className="bg-forum-accent text-forum-accent-foreground hover:bg-forum-accent/90">
          <MessageSquarePlus aria-hidden /> {submitting ? "Posting…" : "Create topic"}
        </Button>
      </div>
    </form>
  );
}

export function ForumReplyForm({ threadId, locked }: { threadId: string; locked: boolean }) {
  const router = useRouter();
  const member = useForumMember();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = forumReplySchema.safeParse({ body, username: member.username });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your reply and try again.");
      return;
    }

    setSubmitting(true);
    try {
      await createForumReply(threadId, parsed.data);
      setBody("");
      await router.invalidate();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your reply could not be posted.");
    } finally {
      setSubmitting(false);
    }
  }

  if (locked) return <p className="border border-forum-line bg-forum-panel px-4 py-4 text-sm text-forum-muted">This topic is closed to new replies.</p>;
  if (member.status === "loading") return <p className="border border-forum-line bg-forum-panel px-4 py-4 text-sm text-forum-muted">Checking member access…</p>;
  if (member.status === "signed-out") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border border-forum-line bg-forum-panel px-4 py-4">
        <p className="text-sm text-forum-muted">Sign in or create an account to reply.</p>
        <Button asChild size="sm" className="bg-forum-accent text-forum-accent-foreground hover:bg-forum-accent/90">
          <Link to="/auth" search={{ redirect: `/forum/${threadId}` }}>Sign in to reply</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 border border-forum-line bg-forum-panel p-4 sm:p-5">
      {member.needsUsername && (
        <label className="block max-w-sm space-y-2 text-sm font-medium text-forum-ink">
          Display name
          <Input
            value={member.username}
            onChange={(event) => member.setUsername(event.target.value)}
            minLength={3}
            maxLength={24}
            pattern="[A-Za-z0-9_]{3,24}"
            autoComplete="nickname"
            placeholder="3–24 letters, numbers, or underscores"
            className="border-forum-line bg-forum-raised text-forum-ink placeholder:text-forum-muted"
            required
          />
        </label>
      )}
      <label className="block space-y-2 text-sm font-medium text-forum-ink">
        Your reply
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={10000}
          rows={4}
          placeholder=""
          className="min-h-28 border-forum-line bg-forum-raised text-forum-ink placeholder:text-forum-muted"
          required
        />
      </label>
      {(error || member.profileError) && <p role="alert" className="text-sm text-destructive">{error ?? member.profileError}</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-forum-muted">{body.length.toLocaleString()} / 10,000</span>
        <Button type="submit" disabled={submitting || !member.userId} className="bg-forum-accent text-forum-accent-foreground hover:bg-forum-accent/90">
          <Send aria-hidden /> {submitting ? "Sending…" : "Post reply"}
        </Button>
      </div>
    </form>
  );
}