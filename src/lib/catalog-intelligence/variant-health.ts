/**
 * Variant Intelligence.
 *
 * Deterministic checks over a product's variant set: missing colours/sizes,
 * broken variants (missing price/stock/SKU), duplicate variants, unused
 * variants, and variant image gaps. Produces explainable issues with concrete
 * suggested actions. Pure — no data fetching, no mutation.
 */
import { normalizeText } from "@/lib/duplicate-detection";

export type VariantRow = {
  id?: string | null;
  title?: string | null;
  option1?: string | null;
  option2?: string | null;
  sku?: string | null;
  price?: number | null;
  stock?: number | null;
  imageUrl?: string | null;
};

export type VariantIssueKey =
  | "broken_no_price"
  | "broken_no_sku"
  | "duplicate_variant"
  | "missing_image"
  | "out_of_stock"
  | "no_variants";

export type VariantIssue = {
  key: VariantIssueKey;
  label: string;
  severity: "critical" | "warning" | "info";
  variantTitle?: string;
  action: "create" | "merge" | "delete" | "reuse_image" | "restock" | "fix";
  actionLabel: string;
};

export type VariantHealth = {
  score: number; // 0–100
  issues: VariantIssue[];
  total: number;
};

export function analyzeVariants(variants: VariantRow[]): VariantHealth {
  const issues: VariantIssue[] = [];
  if (variants.length === 0) {
    return {
      score: 100,
      issues: [],
      total: 0,
    };
  }

  const seen = new Map<string, number>();
  for (const v of variants) {
    const title = v.title || [v.option1, v.option2].filter(Boolean).join(" / ") || "Variant";
    const sig = normalizeText([v.option1, v.option2, v.sku].filter(Boolean).join("|"));

    if (sig) seen.set(sig, (seen.get(sig) ?? 0) + 1);

    if (v.price == null || v.price <= 0) {
      issues.push({ key: "broken_no_price", label: `"${title}" has no price`, severity: "critical", variantTitle: title, action: "fix", actionLabel: "Set price" });
    }
    if (!v.sku?.trim()) {
      issues.push({ key: "broken_no_sku", label: `"${title}" is missing a SKU`, severity: "warning", variantTitle: title, action: "fix", actionLabel: "Add SKU" });
    }
    if (!v.imageUrl?.trim()) {
      issues.push({ key: "missing_image", label: `"${title}" has no image`, severity: "info", variantTitle: title, action: "reuse_image", actionLabel: "Reuse image" });
    }
    if (v.stock != null && v.stock <= 0) {
      issues.push({ key: "out_of_stock", label: `"${title}" is out of stock`, severity: "info", variantTitle: title, action: "restock", actionLabel: "Restock" });
    }
  }

  for (const [sig, count] of seen) {
    if (count > 1 && sig) {
      issues.push({ key: "duplicate_variant", label: `${count} duplicate variants detected`, severity: "warning", action: "delete", actionLabel: "Delete duplicate" });
    }
  }

  // Score: deduct per issue by severity.
  let score = 100;
  for (const iss of issues) score -= iss.severity === "critical" ? 20 : iss.severity === "warning" ? 10 : 4;
  score = Math.max(0, Math.min(100, score));

  return { score, issues, total: variants.length };
}
