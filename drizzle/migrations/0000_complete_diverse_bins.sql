CREATE OR REPLACE FUNCTION public.popular_bins(p_limit integer DEFAULT 12)
RETURNS TABLE(bin text, scheme text, brand text, card_type text, category text, bank_name text, country_code text, country_name text, country_emoji text, currency text, lookups integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH complete AS (
    SELECT c.* FROM bin_cache c
    WHERE coalesce(trim(c.scheme),'') NOT IN ('','unknown','Unknown')
      AND coalesce(trim(c.brand),'') NOT IN ('','unknown','Unknown')
      AND coalesce(trim(c.card_type),'') NOT IN ('','unknown','Unknown')
      AND coalesce(trim(c.category),'') NOT IN ('','unknown','Unknown')
      AND coalesce(trim(c.bank_name),'') NOT IN ('','unknown','Unknown')
      AND coalesce(trim(c.country_name),'') NOT IN ('','unknown','Unknown')
      AND coalesce(trim(c.country_code),'') <> ''
  ), one_per_country AS (
    SELECT DISTINCT ON (country_code) * FROM complete
    ORDER BY country_code, lookups DESC, updated_at DESC
  ), ranked AS (
    SELECT o.*, row_number() OVER (PARTITION BY lower(o.scheme) ORDER BY o.lookups DESC, o.updated_at DESC) AS rn
    FROM one_per_country o
  )
  SELECT r.bin, r.scheme, r.brand, r.card_type, r.category, r.bank_name, r.country_code, r.country_name, r.country_emoji, r.currency, r.lookups
  FROM ranked r
  ORDER BY r.rn, r.lookups DESC, r.updated_at DESC
  LIMIT least(greatest(coalesce(p_limit,12),1),50);
$$;

CREATE OR REPLACE FUNCTION public.bins_by_country(p_country_code text, p_limit integer DEFAULT 500)
RETURNS TABLE(bin text, scheme text, brand text, card_type text, category text, bank_name text, country_code text, country_name text, country_emoji text, currency text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.bin, c.scheme, c.brand, c.card_type, c.category, c.bank_name, c.country_code, c.country_name, c.country_emoji, c.currency
  FROM bin_cache c
  WHERE upper(c.country_code) = upper(p_country_code)
    AND coalesce(trim(c.scheme),'') NOT IN ('','unknown','Unknown')
    AND coalesce(trim(c.brand),'') NOT IN ('','unknown','Unknown')
    AND coalesce(trim(c.card_type),'') NOT IN ('','unknown','Unknown')
    AND coalesce(trim(c.category),'') NOT IN ('','unknown','Unknown')
    AND coalesce(trim(c.bank_name),'') NOT IN ('','unknown','Unknown')
  ORDER BY row_number() OVER (PARTITION BY lower(c.bank_name) ORDER BY c.lookups DESC), c.lookups DESC, c.bin
  LIMIT least(greatest(coalesce(p_limit,500),1),500);
$$;

GRANT EXECUTE ON FUNCTION public.popular_bins(integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bins_by_country(text, integer) TO anon, authenticated, service_role;