// Forum data access — runs against the Lovable Cloud backend.
import { supabase } from "@/integrations/supabase/client";

export interface ForumCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface ForumThread {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  body: string;
  pinned: boolean;
  locked: boolean;
  reply_count: number;
  view_count: number;
  last_activity_at: string;
  created_at: string;
  author_name?: string;
}

export interface ForumPost {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name?: string;
}

export async function listCategories(): Promise<ForumCategory[]> {
  const { data } = await supabase
    .from("forum_categories")
    .select("id, slug, name, description, sort_order")
    .order("sort_order", { ascending: true });
  return (data ?? []) as ForumCategory[];
}

async function attachNames<T extends { author_id: string; author_name?: string }>(rows: T[]): Promise<T[]> {
  const ids = Array.from(new Set(rows.map((r) => r.author_id)));
  if (ids.length === 0) return rows;
  const { data } = await supabase.from("profiles").select("id, username").in("id", ids);
  const map = new Map((data ?? []).map((p) => [p.id as string, p.username as string]));
  return rows.map((r) => ({ ...r, author_name: map.get(r.author_id) ?? "member" }));
}

export async function listThreads(categoryId?: string): Promise<ForumThread[]> {
  let q = supabase
    .from("forum_threads")
    .select(
      "id, category_id, author_id, title, body, pinned, locked, reply_count, view_count, last_activity_at, created_at",
    )
    .order("pinned", { ascending: false })
    .order("last_activity_at", { ascending: false })
    .limit(100);
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data } = await q;
  return attachNames((data ?? []) as ForumThread[]);
}

export async function getThread(id: string): Promise<{ thread: ForumThread; posts: ForumPost[] } | null> {
  const { data } = await supabase
    .from("forum_threads")
    .select(
      "id, category_id, author_id, title, body, pinned, locked, reply_count, view_count, last_activity_at, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const { data: postRows } = await supabase
    .from("forum_posts")
    .select("id, thread_id, author_id, body, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });
  const [[thread], posts] = await Promise.all([
    attachNames([data as ForumThread]),
    attachNames((postRows ?? []) as ForumPost[]),
  ]);
  return { thread, posts };
}

export async function bumpThreadViews(id: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("increment_thread_views", { p_thread_id: id });
  } catch {}
}

export async function createThread(input: {
  categoryId: string;
  title: string;
  body: string;
}): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Please sign in to post.");
  const title = input.title.trim().slice(0, 160);
  const body = input.body.trim().slice(0, 10000);
  if (title.length < 3) throw new Error("Title must be at least 3 characters.");
  if (!body) throw new Error("Write something in your post.");
  const { data, error } = await supabase
    .from("forum_threads")
    .insert({ category_id: input.categoryId, author_id: user.id, title, body })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create the thread.");
  return data.id as string;
}

export async function createReply(threadId: string, body: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Please sign in to reply.");
  const trimmed = body.trim().slice(0, 10000);
  if (!trimmed) throw new Error("Reply cannot be empty.");
  const { error } = await supabase
    .from("forum_posts")
    .insert({ thread_id: threadId, author_id: user.id, body: trimmed });
  if (error) throw new Error(error.message);
}

export async function deleteThread(id: string): Promise<void> {
  const { error } = await supabase.from("forum_threads").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setThreadFlags(
  id: string,
  patch: { pinned?: boolean; locked?: boolean },
): Promise<void> {
  const { error } = await supabase.from("forum_threads").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getMyProfile(): Promise<{ id: string; username: string } | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", auth.user.id)
    .maybeSingle();
  return (data as { id: string; username: string } | null) ?? null;
}

export async function saveMyProfile(username: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Please sign in first.");
  const clean = username.trim().replace(/\s+/g, "_").slice(0, 24);
  if (clean.length < 3) throw new Error("Username must be at least 3 characters.");
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, username: clean }, { onConflict: "id" });
  if (error) {
    throw new Error(
      error.message.includes("profiles_username_key") ? "That username is taken." : error.message,
    );
  }
}
