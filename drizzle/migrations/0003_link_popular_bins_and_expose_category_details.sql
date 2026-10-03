DROP FUNCTION IF EXISTS public.popular_bins(integer);

CREATE FUNCTION public.popular_bins(p_limit integer DEFAULT 12)
RETURNS TABLE(
  bin text,
  scheme text,
  brand text,
  card_type text,
  category text,
  bank_name text,
  country_code text,
  country_name text,
  country_emoji text,
  currency text,
  lookups integer,
  category_slug text,
  category_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cb.bin,
    bc.scheme,
    bc.brand,
    bc.card_type,
    bc.category,
    bc.bank_name,
    bc.country_code,
    bc.country_name,
    bc.country_emoji,
    bc.currency,
    COALESCE(bc.lookups, 0) AS lookups,
    cat.slug AS category_slug,
    cat.name AS category_name
  FROM public.category_bins cb
  JOIN public.bin_categories cat ON cat.id = cb.category_id
  LEFT JOIN public.bin_cache bc ON bc.bin = cb.bin
  ORDER BY cb.created_at DESC, cb.bin
  LIMIT least(greatest(coalesce(p_limit, 12), 1), 50);
$$;

REVOKE ALL ON FUNCTION public.popular_bins(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.popular_bins(integer) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.category_bin_details(p_category_id uuid, p_limit integer DEFAULT 2000)
RETURNS TABLE(
  id uuid,
  bin text,
  note text,
  created_at timestamptz,
  scheme text,
  brand text,
  card_type text,
  card_level text,
  bank_name text,
  country_code text,
  country_name text,
  country_emoji text,
  currency text,
  prepaid boolean,
  commercial boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cb.id,
    cb.bin,
    cb.note,
    cb.created_at,
    bc.scheme,
    bc.brand,
    bc.card_type,
    bc.category AS card_level,
    bc.bank_name,
    bc.country_code,
    bc.country_name,
    bc.country_emoji,
    bc.currency,
    bc.prepaid,
    bc.commercial
  FROM public.category_bins cb
  LEFT JOIN public.bin_cache bc ON bc.bin = cb.bin
  WHERE cb.category_id = p_category_id
    AND EXISTS (
      SELECT 1
      FROM public.bin_categories cat
      WHERE cat.id = cb.category_id
    )
  ORDER BY cb.created_at DESC, cb.bin
  LIMIT least(greatest(coalesce(p_limit, 2000), 1), 2000);
$$;

REVOKE ALL ON FUNCTION public.category_bin_details(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.category_bin_details(uuid, integer) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.category_bin_details(uuid, integer) IS 'Public read-only category BIN details exposing only approved bin_cache fields.';