import { supabase } from "@/integrations/supabase/client";

let cached: { value: boolean; at: number } | null = null;

/**
 * Whether seeded rows should be included in analytics dashboards.
 * Controlled by the admin "Include seed data in analytics" toggle.
 * Financial & payment reports ignore this and ALWAYS exclude seeded rows.
 */
export async function includeSeedInAnalytics(): Promise<boolean> {
  if (cached && Date.now() - cached.at < 60_000) return cached.value;
  const { data } = await supabase
    .from("store_settings")
    .select("include_seed_in_analytics")
    .limit(1)
    .maybeSingle();
  const value = data?.include_seed_in_analytics ?? false;
  cached = { value, at: Date.now() };
  return value;
}
