// Public, read-only BIN directory used by the indexable country pages.
import { supabase } from "@/integrations/supabase/client";

export interface BinCountry {
  country_code: string;
  country_name: string;
  country_emoji: string | null;
  bin_count: number;
}

export interface DirectoryBin {
  bin: string;
  scheme: string | null;
  brand: string | null;
  card_type: string | null;
  category: string | null;
  bank_name: string | null;
  country_code: string | null;
  country_name: string | null;
  country_emoji: string | null;
  currency: string | null;
}

export function countrySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function listBinCountries(): Promise<BinCountry[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("bin_countries");
  if (error) throw new Error(error.message);
  return (data ?? []) as BinCountry[];
}

export async function findCountryBySlug(slug: string): Promise<BinCountry | null> {
  const countries = await listBinCountries();
  return (
    countries.find((c) => countrySlug(c.country_name) === slug) ??
    countries.find((c) => c.country_code.toLowerCase() === slug.toLowerCase()) ??
    null
  );
}

export async function listBinsByCountry(countryCode: string, limit = 500): Promise<DirectoryBin[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("bins_by_country", {
    p_country_code: countryCode,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as DirectoryBin[];
}
