-- ============ VISITOR ANALYTICS ============
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL DEFAULT '/',
  visitor_id text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record a page view" ON public.page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(coalesce(path,'')) <= 300 AND length(coalesce(visitor_id,'')) <= 64 AND length(coalesce(referrer,'')) <= 500);
CREATE POLICY "Admins can read page views" ON public.page_views
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX page_views_created_at_idx ON public.page_views (created_at DESC);
CREATE INDEX page_views_visitor_idx ON public.page_views (visitor_id);

CREATE OR REPLACE FUNCTION public.visitor_stats(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  since timestamptz;
  result json;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  since := now() - (greatest(least(coalesce(p_days, 30), 365), 1) || ' days')::interval;

  SELECT json_build_object(
    'total_views', (SELECT count(*) FROM public.page_views),
    'total_visitors', (SELECT count(DISTINCT visitor_id) FROM public.page_views WHERE visitor_id IS NOT NULL),
    'views_period', (SELECT count(*) FROM public.page_views WHERE created_at >= since),
    'visitors_period', (SELECT count(DISTINCT visitor_id) FROM public.page_views WHERE created_at >= since AND visitor_id IS NOT NULL),
    'views_today', (SELECT count(*) FROM public.page_views WHERE created_at >= date_trunc('day', now())),
    'visitors_today', (SELECT count(DISTINCT visitor_id) FROM public.page_views WHERE created_at >= date_trunc('day', now()) AND visitor_id IS NOT NULL),
    'daily', (
      SELECT coalesce(json_agg(row_to_json(d) ORDER BY d.day), '[]'::json) FROM (
        SELECT date_trunc('day', created_at)::date AS day,
               count(*) AS views,
               count(DISTINCT visitor_id) AS visitors
        FROM public.page_views WHERE created_at >= since
        GROUP BY 1
      ) d
    ),
    'top_paths', (
      SELECT coalesce(json_agg(row_to_json(p)), '[]'::json) FROM (
        SELECT path, count(*) AS views
        FROM public.page_views WHERE created_at >= since
        GROUP BY path ORDER BY count(*) DESC LIMIT 10
      ) p
    ),
    'top_referrers', (
      SELECT coalesce(json_agg(row_to_json(r)), '[]'::json) FROM (
        SELECT referrer, count(*) AS views
        FROM public.page_views
        WHERE created_at >= since AND referrer IS NOT NULL AND referrer <> ''
        GROUP BY referrer ORDER BY count(*) DESC LIMIT 10
      ) r
    )
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.visitor_stats(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.visitor_stats(integer) TO authenticated;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_len CHECK (length(username) BETWEEN 3 AND 24)
);
CREATE UNIQUE INDEX profiles_username_key ON public.profiles (lower(username));
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FORUM ============
CREATE TABLE public.forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_categories TO authenticated;
GRANT ALL ON public.forum_categories TO service_role;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.forum_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.forum_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER forum_categories_updated_at BEFORE UPDATE ON public.forum_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  locked boolean NOT NULL DEFAULT false,
  reply_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT forum_threads_title_len CHECK (length(title) BETWEEN 3 AND 160),
  CONSTRAINT forum_threads_body_len CHECK (length(body) BETWEEN 1 AND 10000)
);
GRANT SELECT ON public.forum_threads TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_threads TO authenticated;
GRANT ALL ON public.forum_threads TO service_role;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Threads are public" ON public.forum_threads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Members create threads" ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update own threads" ON public.forum_threads FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Admins update any thread" ON public.forum_threads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authors delete own threads" ON public.forum_threads FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Admins delete any thread" ON public.forum_threads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX forum_threads_activity_idx ON public.forum_threads (pinned DESC, last_activity_at DESC);
CREATE INDEX forum_threads_category_idx ON public.forum_threads (category_id);
CREATE TRIGGER forum_threads_updated_at BEFORE UPDATE ON public.forum_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT forum_posts_body_len CHECK (length(body) BETWEEN 1 AND 10000)
);
GRANT SELECT ON public.forum_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are public" ON public.forum_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Members reply to open threads" ON public.forum_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (
    SELECT 1 FROM public.forum_threads t WHERE t.id = thread_id AND t.locked = false
  ));
CREATE POLICY "Authors update own posts" ON public.forum_posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors delete own posts" ON public.forum_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Admins delete any post" ON public.forum_posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX forum_posts_thread_idx ON public.forum_posts (thread_id, created_at);
CREATE TRIGGER forum_posts_updated_at BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.forum_sync_thread_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_threads
      SET reply_count = reply_count + 1, last_activity_at = now()
      WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSE
    UPDATE public.forum_threads
      SET reply_count = greatest(reply_count - 1, 0)
      WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
END;
$$;
CREATE TRIGGER forum_posts_activity AFTER INSERT OR DELETE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.forum_sync_thread_activity();

CREATE OR REPLACE FUNCTION public.increment_thread_views(p_thread_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.forum_threads SET view_count = view_count + 1 WHERE id = p_thread_id;
$$;
GRANT EXECUTE ON FUNCTION public.increment_thread_views(uuid) TO anon, authenticated;

INSERT INTO public.forum_categories (slug, name, description, sort_order) VALUES
  ('announcements', 'Announcements', 'Product updates and news from the Binly team.', 1),
  ('bin-database', 'BIN Database', 'Share findings, report wrong data and discuss BIN ranges.', 2),
  ('payments-fraud', 'Payments & Fraud', 'Card schemes, issuer behaviour and fraud prevention talk.', 3),
  ('general', 'General Discussion', 'Anything else related to cards and payments.', 4);