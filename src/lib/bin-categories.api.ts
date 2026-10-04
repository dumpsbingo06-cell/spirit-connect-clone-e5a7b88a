import { supabase } from "@/integrations/supabase/client";
import { lookupBin } from "@/lib/bin-lookup.api";

export interface BinCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  bin_count?: number;
}

export interface CategoryBin {
  id: string;
  bin: string;
  note: string;
  created_at: string;
  scheme: string | null;
  brand: string | null;
  card_type: string | null;
  card_level: string | null;
  bank_name: string | null;
  country_code: string | null;
  country_name: string | null;
  country_emoji: string | null;
  currency: string | null;
  prepaid: boolean | null;
  commercial: boolean | null;
}

export function slugify(name: string): string {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function listCategories(): Promise<BinCategory[]> {
  const { data, error } = await supabase
    .from("bin_categories")
    .select("id, slug, name, description, category_bins(count)")
    .order("name");
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((c: any) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    bin_count: c.category_bins?.[0]?.count ?? 0,
  }));
}

export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from("bin_categories")
    .select("id, slug, name, description")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as BinCategory | null;
}

export async function listCategoryBins(categoryId: string): Promise<CategoryBin[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("category_bin_details", {
    p_category_id: categoryId,
    p_limit: 2000,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryBin[];
}

export async function createCategory(name: string, description: string) {
  const slug = slugify(name);
  if (!slug) throw new Error("Enter a category name");
  const { error } = await supabase.from("bin_categories").insert({ name: name.trim(), slug, description });
  if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("bin_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCategoryBin(id: string) {
  const { error } = await supabase.from("category_bins").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Parse pasted text: one BIN per line, optional note after the digits (e.g. "414720 works on walmart.com"). */
export function parseBinList(text: string) {
  const seen = new Set<string>();
  const rows: { bin: string; note: string }[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(/^(\d{6,8})\s*[|,;:\-–]?\s*(.*)$/);
    if (!m || seen.has(m[1])) continue;
    seen.add(m[1]);
    rows.push({ bin: m[1], note: m[2].slice(0, 300) });
  }
  return rows;
}

export async function addBinsToCategory(
  categoryId: string,
  text: string,
  onProgress?: (done: number, total: number) => void,
) {
  const rows = parseBinList(text);
  if (rows.length === 0) throw new Error("No valid BINs found (need 6–8 digits per line)");
  const { error } = await supabase
    .from("category_bins")
    .upsert(rows.map((r) => ({ ...r, category_id: categoryId })), { onConflict: "category_id,bin" });
  if (error) throw new Error(error.message);

  // Look up each BIN right away so the public page shows full details instead of "Details pending".
  let done = 0;
  const CONCURRENCY = 4;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.all(
      rows.slice(i, i + CONCURRENCY).map(async (r) => {
        await lookupBin({ bin: r.bin }).catch(() => null);
        done += 1;
        onProgress?.(done, rows.length);
      }),
    );
  }
  return rows.length;
}
