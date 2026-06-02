import { fetchProducts, fetchOrders, type ProductRow, type OrderRow } from "@/lib/admin-queries";

export type PerfTier = "top" | "high" | "average" | "low";

export type ProductPerf = {
  product: ProductRow;
  views: number;
  orders: number;
  units: number;
  revenue: number;
  conversion: number; // orders / views
  score: number; // 0-100
  tier: PerfTier;
};

const TIER_META: Record<PerfTier, { label: string; color: string; ring: string; bg: string }> = {
  top: { label: "Top Performer", color: "text-emerald-400", ring: "border-emerald-400/30", bg: "bg-emerald-400/10" },
  high: { label: "High Potential", color: "text-accent", ring: "border-accent/30", bg: "bg-accent/10" },
  average: { label: "Average Performer", color: "text-amber-400", ring: "border-amber-400/30", bg: "bg-amber-400/10" },
  low: { label: "Low Performer", color: "text-destructive", ring: "border-destructive/30", bg: "bg-destructive/10" },
};

export function tierMeta(tier: PerfTier) {
  return TIER_META[tier];
}

function norm(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(1, value / max);
}

/** Compute per-product performance metrics from products + recent orders. */
export async function fetchProductPerformance(days = 90): Promise<ProductPerf[]> {
  const [products, orders] = await Promise.all([fetchProducts(), fetchOrders(days)]);
  return computePerformance(products, orders);
}

export function computePerformance(products: ProductRow[], orders: OrderRow[]): ProductPerf[] {
  const orderAgg = new Map<string, { orders: number; units: number; revenue: number }>();
  for (const o of orders) {
    const seen = new Set<string>();
    for (const it of o.order_items ?? []) {
      const slug = it.product_slug;
      if (!slug) continue;
      const agg = orderAgg.get(slug) ?? { orders: 0, units: 0, revenue: 0 };
      if (!seen.has(slug)) { agg.orders += 1; seen.add(slug); }
      agg.units += Number(it.quantity) || 0;
      agg.revenue += Number(it.line_total) || (Number(it.unit_price) || 0) * (Number(it.quantity) || 0);
      orderAgg.set(slug, agg);
    }
  }

  const raw = products.map((p) => {
    const agg = orderAgg.get(p.slug) ?? { orders: 0, units: 0, revenue: 0 };
    const views = p.views_count ?? 0;
    const conversion = views > 0 ? agg.orders / views : 0;
    return { product: p, views, orders: agg.orders, units: agg.units, revenue: agg.revenue, conversion };
  });

  const maxViews = Math.max(1, ...raw.map((r) => r.views));
  const maxOrders = Math.max(1, ...raw.map((r) => r.orders));
  const maxRevenue = Math.max(1, ...raw.map((r) => r.revenue));
  const maxConv = Math.max(0.0001, ...raw.map((r) => r.conversion));

  return raw
    .map((r) => {
      const score = Math.round(
        (norm(r.revenue, maxRevenue) * 0.4 +
          norm(r.orders, maxOrders) * 0.3 +
          norm(r.conversion, maxConv) * 0.2 +
          norm(r.views, maxViews) * 0.1) * 100,
      );
      const tier: PerfTier = score >= 70 ? "top" : score >= 45 ? "high" : score >= 20 ? "average" : "low";
      return { ...r, score, tier };
    })
    .sort((a, b) => b.score - a.score);
}

export type QualityIssue =
  | "no_image"
  | "no_seo"
  | "no_category"
  | "no_price"
  | "no_inventory"
  | "hidden"
  | "broken";

export const QUALITY_META: Record<QualityIssue, { label: string; severity: "critical" | "warning" }> = {
  broken: { label: "Broken Products", severity: "critical" },
  no_image: { label: "Missing Images", severity: "critical" },
  no_price: { label: "Missing Price", severity: "critical" },
  no_category: { label: "Missing Categories", severity: "warning" },
  no_inventory: { label: "Missing Inventory", severity: "warning" },
  no_seo: { label: "Missing SEO", severity: "warning" },
  hidden: { label: "Hidden Products", severity: "warning" },
};

export type ProductQuality = { product: ProductRow & Record<string, unknown>; issues: QualityIssue[] };

/** Detect catalog quality issues. Accepts raw product rows (full select). */
export function detectQualityIssues(products: (ProductRow & Record<string, unknown>)[]): ProductQuality[] {
  return products
    .map((p) => {
      const issues: QualityIssue[] = [];
      const hasImage = !!p.image;
      if (!hasImage) issues.push("no_image");
      const seo = (p as { seo_title?: string; seo_description?: string }).seo_title || (p as { seo_description?: string }).seo_description;
      if (!seo) issues.push("no_seo");
      if (!p.category) issues.push("no_category");
      if (!p.price || Number(p.price) <= 0) issues.push("no_price");
      if (p.stock_quantity == null) issues.push("no_inventory");
      const status = (p as { status?: string }).status;
      const visible = (p as { india_visible?: boolean; international_visible?: boolean }).india_visible || (p as { international_visible?: boolean }).international_visible;
      if ((status && status !== "active" && status !== "published") || visible === false) issues.push("hidden");
      if (!p.name || (!hasImage && (!p.price || Number(p.price) <= 0))) issues.push("broken");
      return { product: p, issues };
    })
    .filter((r) => r.issues.length > 0)
    .sort((a, b) => b.issues.length - a.issues.length);
}
