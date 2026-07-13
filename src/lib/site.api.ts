// Client-side site + contact API — talks directly to the Lovable backend (Supabase).
import { supabase } from "@/integrations/supabase/client";

export const HERO_FONT_OPTIONS = [
  "Space Grotesk",
  "Inter",
  "Playfair Display",
  "DM Serif Display",
  "Poppins",
  "Manrope",
  "JetBrains Mono",
  "Bebas Neue",
] as const;
export type HeroFont = (typeof HERO_FONT_OPTIONS)[number];

export interface SiteSettings {
  telegram_url: string;
  jabber_url: string;
  hero_badge: string;
  hero_title: string;
  hero_highlight: string;
  hero_subtitle: string;
  hero_font: HeroFont;
}

const DEFAULTS: SiteSettings = {
  telegram_url: "",
  jabber_url: "",
  hero_badge: "Trusted BIN intelligence",
  hero_title: "Identify any card in",
  hero_highlight: "seconds",
  hero_subtitle:
    "Look up the issuing bank, scheme, brand, country and contact details behind the first digits of any card.",
  hero_font: "Space Grotesk",
};

export interface ContactMessage {
  id: string;
  category: "general" | "advertisement";
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  const row = (data ?? {}) as Record<string, unknown>;
  const font = String(row.hero_font ?? DEFAULTS.hero_font);
  return {
    telegram_url: String(row.telegram_url ?? DEFAULTS.telegram_url),
    jabber_url: String(row.jabber_url ?? DEFAULTS.jabber_url),
    hero_badge: String(row.hero_badge ?? DEFAULTS.hero_badge),
    hero_title: String(row.hero_title ?? DEFAULTS.hero_title),
    hero_highlight: String(row.hero_highlight ?? DEFAULTS.hero_highlight),
    hero_subtitle: String(row.hero_subtitle ?? DEFAULTS.hero_subtitle),
    hero_font: (HERO_FONT_OPTIONS as readonly string[]).includes(font)
      ? (font as HeroFont)
      : DEFAULTS.hero_font,
  };
}

export async function updateSiteSettings(input: SiteSettings): Promise<void> {
  const payload = {
    telegram_url: String(input.telegram_url ?? "").slice(0, 500),
    jabber_url: String(input.jabber_url ?? "").slice(0, 500),
    hero_badge: String(input.hero_badge ?? "").slice(0, 120),
    hero_title: String(input.hero_title ?? "").slice(0, 160),
    hero_highlight: String(input.hero_highlight ?? "").slice(0, 60),
    hero_subtitle: String(input.hero_subtitle ?? "").slice(0, 400),
    hero_font: (HERO_FONT_OPTIONS as readonly string[]).includes(input.hero_font)
      ? input.hero_font
      : DEFAULTS.hero_font,
  };
  const { error } = await supabase
    .from("site_settings")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ id: 1, ...payload } as any, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function submitContactMessage(input: {
  subject: string;
  message: string;
  email?: string;
}): Promise<void> {
  const subject = String(input.subject ?? "").trim().slice(0, 100);
  const message = String(input.message ?? "").trim().slice(0, 2000);
  const email = String(input.email ?? "").trim().slice(0, 200);
  if (!subject) throw new Error("Subject is required");
  if (!message) throw new Error("Message is required");
  const { error } = await supabase
    .from("contact_messages")
    .insert({
      category: "general",
      name: subject,
      email: email || "anonymous@binly.local",
      message,
    });
  if (error) throw new Error(error.message);
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const { data } = await supabase
    .from("contact_messages")
    .select("id, category, name, email, message, read, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []) as ContactMessage[];
}

export async function deleteContactMessage(id: string): Promise<void> {
  await supabase.from("contact_messages").delete().eq("id", id);
}
