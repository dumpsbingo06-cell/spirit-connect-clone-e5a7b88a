import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

export const forumTopicSchema = z.object({
  categoryId: z.string().uuid("Choose a discussion area."),
  title: z.string().trim().min(3, "Topic titles need at least 3 characters.").max(160, "Topic titles can be up to 160 characters."),
  body: z.string().trim().min(1, "Add a message before posting.").max(10000, "Messages can be up to 10,000 characters."),
  username: z.string().trim().regex(/^[A-Za-z0-9_]{3,24}$/, "Use 3–24 letters, numbers, or underscores.").optional(),
});

export const forumReplySchema = z.object({
  body: z.string().trim().min(1, "Add a reply before posting.").max(10000, "Replies can be up to 10,000 characters."),
  username: z.string().trim().regex(/^[A-Za-z0-9_]{3,24}$/, "Use 3–24 letters, numbers, or underscores.").optional(),
});

export type ForumTopicInput = z.infer<typeof forumTopicSchema>;
export type ForumReplyInput = z.infer<typeof forumReplySchema>;

export type ForumCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
};

export type ForumThread = {
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
  category_name: string;
  category_slug: string;
  author_name: string;
};

export type ForumPost = {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name: string;
};

export type ForumOverview = {
  categories: ForumCategory[];
  threads: ForumThread[];
};

export type ForumDetail = {
  category: ForumCategory;
  thread: ForumThread;
  posts: ForumPost[];
};

async function loadUsernames(userIds: string[]) {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return new Map<string, string>();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", uniqueIds);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((profile) => [profile.id, profile.username]));
}

export async function getForumProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function ensureForumProfile(username: string) {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) throw new Error("Sign in to join the discussion.");

  const existing = await getForumProfile(userResult.user.id);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userResult.user.id, username })
    .select("id, username")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getForumOverview(): Promise<ForumOverview> {
  const [categoryResult, threadResult] = await Promise.all([
    supabase
      .from("forum_categories")
      .select("id, slug, name, description, sort_order")
      .order("sort_order")
      .order("name"),
    supabase
      .from("forum_threads")
      .select("id, category_id, author_id, title, body, pinned, locked, reply_count, view_count, last_activity_at, created_at")
      .order("pinned", { ascending: false })
      .order("last_activity_at", { ascending: false }),
  ]);

  if (categoryResult.error) throw new Error(categoryResult.error.message);
  if (threadResult.error) throw new Error(threadResult.error.message);

  const categories = (categoryResult.data ?? []) as ForumCategory[];
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const threads = threadResult.data ?? [];
  const usernames = await loadUsernames(threads.map((thread) => thread.author_id));

  return {
    categories,
    threads: threads.flatMap((thread) => {
      const category = categoryById.get(thread.category_id);
      if (!category) return [];
      return [{
        ...thread,
        category_name: category.name,
        category_slug: category.slug,
        author_name: usernames.get(thread.author_id) ?? "Member",
      }];
    }),
  };
}

export async function getForumDetail(threadId: string): Promise<ForumDetail | null> {
  const { data: thread, error: threadError } = await supabase
    .from("forum_threads")
    .select("id, category_id, author_id, title, body, pinned, locked, reply_count, view_count, last_activity_at, created_at")
    .eq("id", threadId)
    .maybeSingle();

  if (threadError) throw new Error(threadError.message);
  if (!thread) return null;

  const [categoryResult, postResult] = await Promise.all([
    supabase
      .from("forum_categories")
      .select("id, slug, name, description, sort_order")
      .eq("id", thread.category_id)
      .maybeSingle(),
    supabase
      .from("forum_posts")
      .select("id, thread_id, author_id, body, created_at")
      .eq("thread_id", thread.id)
      .order("created_at"),
  ]);

  if (categoryResult.error) throw new Error(categoryResult.error.message);
  if (postResult.error) throw new Error(postResult.error.message);
  if (!categoryResult.data) return null;

  const posts = postResult.data ?? [];
  const usernames = await loadUsernames([thread.author_id, ...posts.map((post) => post.author_id)]);
  const category = categoryResult.data as ForumCategory;

  return {
    category,
    thread: {
      ...thread,
      category_name: category.name,
      category_slug: category.slug,
      author_name: usernames.get(thread.author_id) ?? "Member",
    },
    posts: posts.map((post) => ({
      ...post,
      author_name: usernames.get(post.author_id) ?? "Member",
    })),
  };
}

export async function createForumTopic(input: ForumTopicInput) {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) throw new Error("Sign in to start a topic.");
  if (!await getForumProfile(userResult.user.id)) {
    if (!input.username) throw new Error("Add a display name to post for the first time.");
    await ensureForumProfile(input.username);
  }

  const { data, error } = await supabase
    .from("forum_threads")
    .insert({
      category_id: input.categoryId,
      author_id: userResult.user.id,
      title: input.title,
      body: input.body,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function createForumReply(threadId: string, input: ForumReplyInput) {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) throw new Error("Sign in to reply to this topic.");
  if (!await getForumProfile(userResult.user.id)) {
    if (!input.username) throw new Error("Add a display name to post for the first time.");
    await ensureForumProfile(input.username);
  }

  const { error } = await supabase.from("forum_posts").insert({
    thread_id: threadId,
    author_id: userResult.user.id,
    body: input.body,
  });

  if (error) throw new Error(error.message);
}