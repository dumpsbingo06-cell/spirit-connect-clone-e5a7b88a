CREATE TABLE public.bin_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.category_bins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.bin_categories(id) ON DELETE CASCADE,
  bin text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, bin)
);
CREATE INDEX category_bins_category_idx ON public.category_bins(category_id);
GRANT SELECT ON public.bin_categories, public.category_bins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bin_categories, public.category_bins TO authenticated;
GRANT ALL ON public.bin_categories, public.category_bins TO service_role;
ALTER TABLE public.bin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_bins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public" ON public.bin_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.bin_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Category bins public" ON public.category_bins FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage category bins" ON public.category_bins FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER bin_categories_updated_at BEFORE UPDATE ON public.bin_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();