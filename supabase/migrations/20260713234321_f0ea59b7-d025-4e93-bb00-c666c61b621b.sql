ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_badge TEXT NOT NULL DEFAULT 'Trusted BIN intelligence',
  ADD COLUMN IF NOT EXISTS hero_title TEXT NOT NULL DEFAULT 'Identify any card in',
  ADD COLUMN IF NOT EXISTS hero_highlight TEXT NOT NULL DEFAULT 'seconds',
  ADD COLUMN IF NOT EXISTS hero_subtitle TEXT NOT NULL DEFAULT 'Look up the issuing bank, scheme, brand, country and contact details behind the first digits of any card.',
  ADD COLUMN IF NOT EXISTS hero_font TEXT NOT NULL DEFAULT 'Space Grotesk';

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;