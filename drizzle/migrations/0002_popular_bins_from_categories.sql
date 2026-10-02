CREATE OR REPLACE FUNCTION public.popular_bins(p_limit integer DEFAULT 12)
RETURNS TABLE(bin text, scheme text, brand text, card_type text, category text, bank_name text, country_code text, country_name text, country_emoji text, currency text, lookups integer)
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
    COALESCE(bc.lookups, 0) AS lookups
  FROM public.category_bins cb
  LEFT JOIN public.bin_cache bc ON bc.bin = cb.bin
  ORDER BY cb.created_at DESC
  LIMIT least(greatest(coalesce(p_limit, 12), 1), 50);
$$;

GRANT EXECUTE ON FUNCTION public.popular_bins(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.popular_bins(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.popular_bins(integer) TO service_role;