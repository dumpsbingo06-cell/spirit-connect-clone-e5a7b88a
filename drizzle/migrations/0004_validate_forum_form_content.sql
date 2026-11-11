ALTER TABLE public.forum_threads
  ADD CONSTRAINT forum_threads_title_trimmed_length CHECK (char_length(btrim(title)) BETWEEN 3 AND 160),
  ADD CONSTRAINT forum_threads_body_nonblank CHECK (char_length(btrim(body)) BETWEEN 1 AND 10000);

ALTER TABLE public.forum_posts
  ADD CONSTRAINT forum_posts_body_nonblank CHECK (char_length(btrim(body)) BETWEEN 1 AND 10000);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format CHECK (username ~ '^[A-Za-z0-9_]{3,24}$');