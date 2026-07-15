
-- 1. Extend contact_messages
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS ticket_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  ALTER TABLE public.contact_messages
    ADD CONSTRAINT contact_messages_status_check CHECK (status IN ('open','closed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS contact_messages_ticket_token_key
  ON public.contact_messages(ticket_token);

-- 2. Replies table
CREATE TABLE IF NOT EXISTS public.contact_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  from_admin boolean NOT NULL DEFAULT false,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_replies TO authenticated;
GRANT ALL ON public.contact_replies TO service_role;

ALTER TABLE public.contact_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view replies" ON public.contact_replies;
CREATE POLICY "Admins can view replies" ON public.contact_replies
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert replies" ON public.contact_replies;
CREATE POLICY "Admins can insert replies" ON public.contact_replies
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND from_admin = true);

DROP POLICY IF EXISTS "Admins can delete replies" ON public.contact_replies;
CREATE POLICY "Admins can delete replies" ON public.contact_replies
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS contact_replies_message_id_idx
  ON public.contact_replies(message_id, created_at);

-- 3. Secure RPCs for anonymous ticket access via token

-- Get a ticket (message + all replies) using id + token
CREATE OR REPLACE FUNCTION public.get_ticket(p_id uuid, p_token uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m public.contact_messages%ROWTYPE;
  replies_json json;
BEGIN
  SELECT * INTO m FROM public.contact_messages
    WHERE id = p_id AND ticket_token = p_token;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(json_agg(json_build_object(
    'id', r.id,
    'body', r.body,
    'from_admin', r.from_admin,
    'created_at', r.created_at
  ) ORDER BY r.created_at), '[]'::json)
  INTO replies_json
  FROM public.contact_replies r
  WHERE r.message_id = m.id;

  RETURN json_build_object(
    'id', m.id,
    'name', m.name,
    'email', m.email,
    'message', m.message,
    'status', m.status,
    'created_at', m.created_at,
    'updated_at', m.updated_at,
    'replies', replies_json
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ticket(uuid, uuid) TO anon, authenticated;

-- Post a reply as the ticket owner (anonymous) using id + token
CREATE OR REPLACE FUNCTION public.post_ticket_reply(p_id uuid, p_token uuid, p_body text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m public.contact_messages%ROWTYPE;
  new_id uuid;
BEGIN
  IF p_body IS NULL OR length(trim(p_body)) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  IF length(p_body) > 4000 THEN
    RAISE EXCEPTION 'Message too long';
  END IF;

  SELECT * INTO m FROM public.contact_messages
    WHERE id = p_id AND ticket_token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  IF m.status = 'closed' THEN
    RAISE EXCEPTION 'Ticket is closed';
  END IF;

  INSERT INTO public.contact_replies (message_id, body, from_admin)
  VALUES (m.id, p_body, false)
  RETURNING id INTO new_id;

  UPDATE public.contact_messages SET updated_at = now(), read = false WHERE id = m.id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_ticket_reply(uuid, uuid, text) TO anon, authenticated;
