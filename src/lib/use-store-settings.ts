import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StoreSettings = {
  cod_enabled: boolean;
  prepaid_discount_percent: number;
  shipping_mode: "free" | "flat" | "region" | "product" | "category";
  free_shipping_enabled: boolean;
  flat_shipping_inr: number;
  flat_shipping_usd: number;
  free_shipping_threshold_inr: number | null;
  free_shipping_threshold_usd: number | null;
};

const DEFAULTS: StoreSettings = {
  cod_enabled: false,
  prepaid_discount_percent: 0,
  shipping_mode: "product",
  free_shipping_enabled: false,
  flat_shipping_inr: 0,
  flat_shipping_usd: 0,
  free_shipping_threshold_inr: null,
  free_shipping_threshold_usd: null,
};

// Module-level cache + inflight so every consumer across the app shares a
// single request, even when many components mount simultaneously on a route
// change. Refresh in the background past the SWR TTL and on window focus.
let cache: StoreSettings | null = null;
let cacheLoadedAt = 0;
let inflight: Promise<StoreSettings> | null = null;
const subscribers = new Set<(s: StoreSettings) => void>();
const SWR_TTL = 60_000;
let realtimeBound = false;

function normalizeSettings(row: Record<string, unknown>): StoreSettings {
  const mode = row.shipping_mode;
  return {
    cod_enabled: !!row.cod_enabled,
    prepaid_discount_percent: Number(row.prepaid_discount_percent) || 0,
    shipping_mode:
      mode === "free" || mode === "flat" || mode === "region" || mode === "product" || mode === "category"
        ? mode
        : "product",
    free_shipping_enabled: !!row.free_shipping_enabled,
    flat_shipping_inr: Number(row.flat_shipping_inr) || 0,
    flat_shipping_usd: Number(row.flat_shipping_usd) || 0,
    free_shipping_threshold_inr: row.free_shipping_threshold_inr == null ? null : Number(row.free_shipping_threshold_inr),
    free_shipping_threshold_usd: row.free_shipping_threshold_usd == null ? null : Number(row.free_shipping_threshold_usd),
  };
}

function load(force = false): Promise<StoreSettings> {
  if (cache && !force) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("store_settings_public")
      .select("cod_enabled,prepaid_discount_percent,shipping_mode,free_shipping_enabled,flat_shipping_inr,flat_shipping_usd,free_shipping_threshold_inr,free_shipping_threshold_usd")
      .limit(1)
      .maybeSingle();
    const s = data ? normalizeSettings(data) : (cache ?? DEFAULTS);
    cache = s;
    cacheLoadedAt = Date.now();
    inflight = null;
    subscribers.forEach((fn) => fn(s));
    return s;
  })();
  return inflight;
}

function bindRealtime() {
  if (realtimeBound || typeof window === "undefined") return;
  realtimeBound = true;
  // Only admin sessions can read from store_settings base table. Customer
  // sessions never received these events; we now rely on focus/visibility
  // refresh for everyone and only wire realtime for signed-in sessions.
  void supabase.auth.getSession().then(({ data }) => {
    if (!data.session) return;
    supabase
      .channel("store-settings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, () => {
        cache = null;
        void load(true);
      })
      .subscribe();
  });
  const onFocus = () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    if (Date.now() - cacheLoadedAt > SWR_TTL) void load(true);
  };
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onFocus);
}

/**
 * Live store settings (COD toggle, prepaid discount).
 * Public read via RLS; updates stream in realtime so checkout reflects
 * admin changes instantly.
 */
export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(cache ?? DEFAULTS);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let active = true;
    bindRealtime();
    const sub = (s: StoreSettings) => { if (active) setSettings(s); };
    subscribers.add(sub);
    load().then((s) => { if (active) { setSettings(s); setLoading(false); } });
    return () => { active = false; subscribers.delete(sub); };
  }, []);

  return { settings, loading };
}
