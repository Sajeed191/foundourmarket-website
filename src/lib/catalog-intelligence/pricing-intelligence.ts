/**
 * Pricing Intelligence — Catalog Intelligence 2.0, Phase 5.
 *
 * Evaluates a product's pricing across three lenses:
 *   • Variant pricing   — outliers, missing prices, inconsistent discounts
 *   • Product pricing   — broken compare-at, negative margins (if cost known),
 *                          suspiciously low/high absolute prices
 *   • Catalog pricing   — placeholder for future duplicate/SKU cross-checks
 *
 * Purely advisory — never mutates prices. Returns the canonical
 * IntelligenceModule contract.
 */
import {
  statusFromScore,
  type Evidence,
  type IntelligenceModule,
  type PotentialImpact,
} from "./intelligence-module";
import type { VariantRecord } from "./variant-intelligence";

export type PricingInput = {
  slug?: string;
  productName?: string | null;
  price?: number | null;
  comparePrice?: number | null;
  cost?: number | null;
  currency?: string | null;
  variants: VariantRecord[];
};

export type PricingIntelligence = IntelligenceModule & {
  variant: {
    median: number | null;
    outliers: { title: string; price: number; ratio: number }[];
    priceless: number;
  };
  product: {
    hasBrokenCompare: boolean;
    negativeMargin: boolean;
    marginPct: number | null;
  };
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

function variantLabel(v: VariantRecord): string {
  return (
    v.title?.trim() ||
    [v.option1, v.option2, v.option3].filter(Boolean).join(" / ") ||
    v.sku?.trim() ||
    "Variant"
  );
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function effectiveVariantPrice(v: VariantRecord, base: number | null): number | null {
  if (v.price != null && v.price > 0) return v.price;
  if (base != null && base > 0) return base;
  return null;
}

export function analyzePricingIntelligence(input: PricingInput): PricingIntelligence {
  const { variants, price: basePrice = null, comparePrice = null, cost = null } = input;

  // ── Variant pricing ────────────────────────────────────────────────
  const prices: number[] = [];
  for (const v of variants) {
    const p = effectiveVariantPrice(v, basePrice);
    if (p != null) prices.push(p);
  }
  const med = median(prices);
  const priceless = variants.filter(
    (v) => effectiveVariantPrice(v, basePrice) == null,
  ).length;

  const outliers: { title: string; price: number; ratio: number }[] = [];
  if (med != null && prices.length >= 3) {
    for (const v of variants) {
      const p = effectiveVariantPrice(v, basePrice);
      if (p == null) continue;
      const ratio = p / med;
      if (ratio < 0.4 || ratio > 2.5) {
        outliers.push({ title: variantLabel(v), price: p, ratio });
      }
    }
  }

  // ── Product pricing ────────────────────────────────────────────────
  const hasBrokenCompare =
    comparePrice != null && basePrice != null && comparePrice > 0 && comparePrice <= basePrice;
  const marginPct =
    cost != null && cost > 0 && basePrice != null && basePrice > 0
      ? ((basePrice - cost) / basePrice) * 100
      : null;
  const negativeMargin = marginPct != null && marginPct < 0;

  // ── Evidence ───────────────────────────────────────────────────────
  const evidence: Evidence[] = [];

  if (priceless > 0) {
    evidence.push({
      key: "pricing_variant_priceless",
      message: `${priceless} variant${priceless === 1 ? " has" : "s have"} no effective price.`,
      severity: "critical",
      impact: Math.min(30, priceless * 12),
    });
  }
  if (outliers.length > 0) {
    const sample = outliers[0];
    const direction = sample.ratio < 1 ? "lower" : "higher";
    evidence.push({
      key: "pricing_variant_outlier",
      message: `"${sample.title}" is priced much ${direction} than similar variants.`,
      severity: "warning",
      impact: Math.min(25, outliers.length * 10),
    });
  }
  if (hasBrokenCompare) {
    evidence.push({
      key: "pricing_broken_compare",
      message: "Compare-at price is not higher than the selling price — the discount won't show.",
      severity: "warning",
      impact: 15,
    });
  }
  if (negativeMargin) {
    evidence.push({
      key: "pricing_negative_margin",
      message: `Selling below cost — margin is ${marginPct!.toFixed(1)}%.`,
      severity: "critical",
      impact: 30,
    });
  }
  if (basePrice == null || basePrice <= 0) {
    evidence.push({
      key: "pricing_missing_base",
      message: "Product has no base price.",
      severity: "critical",
      impact: 40,
    });
  }

  evidence.sort((a, b) => b.impact - a.impact);

  const deduction = Math.min(100, evidence.reduce((a, e) => a + e.impact, 0));
  const score = clamp(Math.round(100 - deduction));

  const hasCritical = evidence.some((e) => e.severity === "critical");
  const potentialImpact: PotentialImpact =
    hasCritical ? "High" : score < 70 ? "Medium" : "Low";

  const top = evidence[0];
  const recommendation = top
    ? top.message
    : "Pricing looks consistent — no action needed.";
  const action = top ? actionForKey(top.key) : "Review pricing";
  const actionHref = input.slug
    ? top?.key === "pricing_variant_outlier" || top?.key === "pricing_variant_priceless"
      ? `/admin-product/${input.slug}/variants`
      : `/admin-product/${input.slug}/pricing`
    : undefined;

  // Confidence lowers when we lack cost data or variant coverage.
  let confidence = 100;
  if (cost == null) confidence -= 10;
  if (variants.length === 0) confidence -= 10;
  if (basePrice == null) confidence -= 15;
  confidence = clamp(confidence);

  return {
    moduleId: "pricing_intelligence",
    score,
    confidence,
    status: statusFromScore(score),
    recommendation,
    action,
    actionHref,
    potentialImpact,
    evidence,
    variant: { median: med, outliers, priceless },
    product: { hasBrokenCompare, negativeMargin, marginPct },
  };
}

function actionForKey(key: string): string {
  switch (key) {
    case "pricing_variant_priceless":
      return "Set variant prices";
    case "pricing_variant_outlier":
      return "Review variant pricing";
    case "pricing_broken_compare":
      return "Fix compare-at price";
    case "pricing_negative_margin":
      return "Review margin";
    case "pricing_missing_base":
      return "Add product price";
    default:
      return "Review pricing";
  }
}
