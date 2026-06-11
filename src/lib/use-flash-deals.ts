import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/lib/use-products";
import type { Product } from "@/lib/products";

/** A row from the dedicated flash_deals table (optional flash pricing + window). */
export type DealRow = {
  id: string;
  product_id: string;
  product_slug: string | null;
  flash_price: number;
  start_at: string;
  end_at: string;
  priority: number;
  created_at: string;
};

/** A storefront flash-deal entry built from a catalog product. */
export type FlashItem = {
  product: Product;
  /** Live override price from flash_deals table, if any. */
  flashPrice: number | null;
  /** Countdown end, if a live deal window applies. */
  endAt: string | null;
  dealId: string | null;
  priority: number;
};

/** True when a product is flagged as a flash deal through any supported signal. */
export function isFlashDealProduct(p: Product): boolean {
  if (p.flashDeal) return true;
  const tokens = (p.collections ?? []).map((c) => c.toLowerCase().replace(/[\s_]+/g, "-"));
  return tokens.includes("flash-deal") || tokens.includes("flash-deals");
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Single shared source of truth for Flash Deal products. Used by the homepage
 * Flash Deals section, the Deals & Promotions / Offers page, and any "Shop
 * Deals" destination so all surfaces return the exact same products.
 */
export function useFlashDeals() {
  const { products, loading } = useProducts();
  const [deals, setDeals] = useState<DealRow[]>([]);
  const now = useNow();

  function fetchDeals() {
    supabase
      .from("flash_deals")
      .select("id,product_id,flash_price,start_at,end_at,priority,created_at,product:products(slug)")
      .then(({ data }) => {
        const rows = (data as unknown as Array<Omit<DealRow, "product_slug"> & { product: { slug: string } | null }>) ?? [];
        setDeals(rows.map((r) => ({ ...r, product_slug: r.product?.slug ?? null })));
      });
  }

  useEffect(() => {
    fetchDeals();
    const ch = supabase
      .channel("rt-flash-deals-shared")
      .on("postgres_changes", { event: "*", schema: "public", table: "flash_deals" }, fetchDeals)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // Map of live deal overrides keyed by product slug (only deals in their window).
  const liveDealBySlug = useMemo(() => {
    const map = new Map<string, DealRow>();
    for (const d of deals) {
      if (!d.product_slug) continue;
      const startOk = new Date(d.start_at).getTime() <= now;
      const endOk = new Date(d.end_at).getTime() > now;
      if (!startOk || !endOk) continue;
      const existing = map.get(d.product_slug);
      if (!existing || d.priority > existing.priority) map.set(d.product_slug, d);
    }
    return map;
  }, [deals, now]);

  const items = useMemo<FlashItem[]>(() => {
    const included: FlashItem[] = [];
    let excludedNotFlagged = 0;
    let excludedUnavailable = 0;

    for (const p of products) {
      if (!isFlashDealProduct(p)) {
        excludedNotFlagged++;
        continue;
      }
      const available = p.status === "published" && p.inStock && p.stockQuantity > 0;
      if (!available) {
        excludedUnavailable++;
        continue;
      }
      const live = liveDealBySlug.get(p.slug) ?? null;
      included.push({
        product: p,
        flashPrice: live ? live.flash_price : null,
        endAt: live ? live.end_at : null,
        dealId: live ? live.id : null,
        priority: live ? live.priority : 0,
      });
    }

    included.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const da = a.flashPrice != null && a.product.price > 0 ? (a.product.price - a.flashPrice) / a.product.price : 0;
      const db = b.flashPrice != null && b.product.price > 0 ? (b.product.price - b.flashPrice) / b.product.price : 0;
      if (db !== da) return db - da;
      return (b.product.createdAt ?? "").localeCompare(a.product.createdAt ?? "");
    });

    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.info(
        `[FlashDeals] total Flash Deal products found: ${included.length} | excluded (not flagged): ${excludedNotFlagged} | excluded (unavailable): ${excludedUnavailable}`,
      );
      // eslint-disable-next-line no-console
      console.info("[FlashDeals] product IDs/slugs returned:", included.map((i) => i.product.slug));
    }

    return included;
  }, [products, liveDealBySlug]);

  return { items, loading, now, products };
}
