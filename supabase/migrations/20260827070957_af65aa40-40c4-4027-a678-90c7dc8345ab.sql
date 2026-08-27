CREATE OR REPLACE FUNCTION public.bin_countries()
RETURNS TABLE (country_code text, country_name text, country_emoji text, bin_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.country_code, min(c.country_name) AS country_name, min(c.country_emoji) AS country_emoji, count(*) AS bin_count
  FROM public.bin_cache c
  WHERE c.country_code IS NOT NULL AND c.country_name IS NOT NULL
  GROUP BY c.country_code
  ORDER BY count(*) DESC, min(c.country_name) ASC
$$;

CREATE OR REPLACE FUNCTION public.bins_by_country(p_country_code text, p_limit int DEFAULT 500)
RETURNS TABLE (
  bin text,
  scheme text,
  brand text,
  card_type text,
  category text,
  bank_name text,
  country_code text,
  country_name text,
  country_emoji text,
  currency text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.bin, c.scheme, c.brand, c.card_type, c.category, c.bank_name,
         c.country_code, c.country_name, c.country_emoji, c.currency
  FROM public.bin_cache c
  WHERE upper(c.country_code) = upper(p_country_code)
  ORDER BY c.bin ASC
  LIMIT least(greatest(coalesce(p_limit, 500), 1), 2000)
$$;

REVOKE ALL ON FUNCTION public.bin_countries() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bins_by_country(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bin_countries() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bins_by_country(text, int) TO anon, authenticated, service_role;