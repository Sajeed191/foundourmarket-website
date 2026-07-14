/**
 * Catalog Optimizer — a deterministic, marketplace-wide optimization report.
 *
 * Runs over real product rows and aggregates the per-product Catalog Health and
 * SEO advisories into one report: overall health, issue counts by type, and the
 * products most in need of attention. Pure — suitable to run on demand in the
 * dashboard or on a nightly schedule. Never mutates content.
 */
import { scoreCatalogHealth, type HealthInput } from "./catalog-health";
import { analyzeSeo, type SeoDraft } from "./seo-advisor";

export type OptimizerProduct = {
  slug: string;
  name: string;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  meta_keywords?: string[] | string | null;
  brand?: string | null;
  category?: string | null;
  image?: string | null;
  video_url?: string | null;
  price_inr?: number | null;
  price_usd?: number | null;
  compare_price_inr?: number | null;
  stock_quantity?: number | null;
  specifications?: Record<string, string> | null;
  attributes?: Record<string, string> | null;
  related_products?: unknown[] | null;
  status?: string | null;
};

export type OptimizerRow = {
  slug: string;
  name: string;
  health: number;
  seo: number;
  issues: string[];
};

export type OptimizerReport = {
  generatedAt: string;
  total: number;
  avgHealth: number;
  avgSeo: number;
  issueCounts: Record<string, number>;
  needsAttention: OptimizerRow[];
};

export function buildOptimizerReport(products: OptimizerProduct[]): OptimizerReport {
  const rows: OptimizerRow[] = [];
  const issueCounts: Record<string, number> = {};
  let healthSum = 0;
  let seoSum = 0;

  for (const p of products) {
    const healthInput: HealthInput = {
      name: p.name,
      description: p.description,
      seoTitle: p.seo_title,
      seoDescription: p.seo_description,
      keywords: p.meta_keywords ?? null,
      imageCount: p.image ? 1 : 0,
      hasVideo: !!p.video_url,
      specCount: Object.keys(p.specifications ?? {}).length,
      variantCount: Object.values(p.attributes ?? {}).filter(Boolean).length,
      priceInr: p.price_inr ?? null,
      priceUsd: p.price_usd ?? null,
      comparePriceInr: p.compare_price_inr ?? null,
      stockQuantity: p.stock_quantity ?? 0,
    };
    const health = scoreCatalogHealth(healthInput);

    const seoDraft: SeoDraft = {
      name: p.name,
      seoTitle: p.seo_title,
      seoDescription: p.seo_description,
      description: p.description,
      keywords: p.meta_keywords ?? null,
      category: p.category,
      hasImage: !!p.image,
      hasRelated: Array.isArray(p.related_products) && p.related_products.length > 0,
    };
    const seo = analyzeSeo(seoDraft);

    healthSum += health.score;
    seoSum += seo.score;

    const issues = [
      ...health.suggestions.map((s) => s.key),
      ...seo.advisories.filter((a) => a.severity !== "info").map((a) => a.key),
    ];
    for (const key of issues) issueCounts[key] = (issueCounts[key] ?? 0) + 1;

    rows.push({ slug: p.slug, name: p.name, health: health.score, seo: seo.score, issues });
  }

  const total = products.length || 1;
  rows.sort((a, b) => a.health + a.seo - (b.health + b.seo));

  return {
    generatedAt: new Date().toISOString(),
    total: products.length,
    avgHealth: Math.round(healthSum / total),
    avgSeo: Math.round(seoSum / total),
    issueCounts,
    needsAttention: rows.slice(0, 25),
  };
}
