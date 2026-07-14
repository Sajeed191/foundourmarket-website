/**
 * Catalog Health — a single explainable 0–100 readiness score per product.
 *
 * Deterministic weighted blend across SEO, images, variants, specifications,
 * description, duplicate risk, price consistency, inventory, reviews and media.
 * Every deduction produces an actionable suggestion. Pure — no data fetching,
 * no mutation. Grounded entirely in the draft/product fields passed in.
 */

export type HealthInput = {
  name: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  keywords?: string | string[] | null;
  imageCount: number;
  hasVideo: boolean;
  specCount: number;
  variantCount: number;
  priceInr?: number | null;
  priceUsd?: number | null;
  comparePriceInr?: number | null;
  stockQuantity?: number | null;
  reviewCount?: number | null;
  rating?: number | null;
  /** Real duplicate risk 0–100 (only exact-duplicate relationships). */
  duplicateRisk?: number;
  /** Optional image quality 0–100 from Image Intelligence. */
  imageQuality?: number | null;
};

export type HealthSuggestion = {
  key: string;
  label: string;
  severity: "critical" | "warning" | "info";
  /** Points recoverable by fixing this. */
  impact: number;
};

export type HealthDimension = {
  key: string;
  label: string;
  score: number; // 0–100
  weight: number; // relative
};

export type CatalogHealth = {
  score: number; // 0–100 overall
  grade: "Excellent" | "Good" | "Needs Work" | "Poor";
  dimensions: HealthDimension[];
  suggestions: HealthSuggestion[];
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function gradeFor(score: number): CatalogHealth["grade"] {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 45) return "Needs Work";
  return "Poor";
}

export function scoreCatalogHealth(input: HealthInput): CatalogHealth {
  const suggestions: HealthSuggestion[] = [];
  const add = (s: HealthSuggestion) => suggestions.push(s);

  // --- SEO ---
  let seo = 100;
  const kw = Array.isArray(input.keywords)
    ? input.keywords
    : (input.keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean);
  if (!input.seoTitle?.trim()) { seo -= 40; add({ key: "seo_title", label: "Add an SEO title", severity: "warning", impact: 6 }); }
  else if (input.seoTitle.length > 60) { seo -= 15; add({ key: "seo_title_len", label: "Shorten SEO title (<60 chars)", severity: "info", impact: 2 }); }
  if (!input.seoDescription?.trim()) { seo -= 35; add({ key: "seo_desc", label: "Add a meta description", severity: "warning", impact: 5 }); }
  else if (input.seoDescription.length > 160) { seo -= 10; add({ key: "seo_desc_len", label: "Shorten meta description (<160 chars)", severity: "info", impact: 1 }); }
  if (kw.length === 0) { seo -= 15; add({ key: "seo_kw", label: "Add target keywords", severity: "info", impact: 2 }); }
  seo = clamp(seo);

  // --- Images ---
  let images = 100;
  if (input.imageCount === 0) { images = 0; add({ key: "img_none", label: "Add product images", severity: "critical", impact: 15 }); }
  else if (input.imageCount < 3) { images -= 40; add({ key: "img_few", label: "Add more images (aim for 3+ angles)", severity: "warning", impact: 6 }); }
  if (input.imageQuality != null) images = clamp(images * 0.6 + input.imageQuality * 0.4);
  images = clamp(images);

  // --- Media (video) ---
  let media = input.hasVideo ? 100 : 60;
  if (!input.hasVideo) add({ key: "video", label: "Add a product video", severity: "info", impact: 2 });

  // --- Variants ---
  let variants = input.variantCount > 0 ? 100 : 70;

  // --- Specifications ---
  let specs = 100;
  if (input.specCount === 0) { specs = 20; add({ key: "specs_none", label: "Add product specifications", severity: "warning", impact: 8 }); }
  else if (input.specCount < 4) { specs = 60; add({ key: "specs_few", label: "Complete more specifications", severity: "info", impact: 4 }); }

  // --- Description ---
  let description = 100;
  const descLen = (input.description ?? "").trim().length;
  if (descLen === 0) { description = 0; add({ key: "desc_none", label: "Add a product description", severity: "critical", impact: 12 }); }
  else if (descLen < 120) { description = 50; add({ key: "desc_thin", label: "Expand the description (thin content)", severity: "warning", impact: 6 }); }

  // --- Duplicate risk (inverse) ---
  const dupRisk = input.duplicateRisk ?? 0;
  const duplicate = clamp(100 - dupRisk);
  if (dupRisk >= 60) add({ key: "dup", label: "Resolve possible duplicate before publishing", severity: "critical", impact: 10 });
  else if (dupRisk >= 30) add({ key: "dup_review", label: "Review possible related product", severity: "info", impact: 3 });

  // --- Price consistency ---
  let price = 100;
  const p = input.priceInr ?? input.priceUsd ?? 0;
  if (p <= 0) { price = 0; add({ key: "price", label: "Set a valid price", severity: "critical", impact: 8 }); }
  if (input.comparePriceInr != null && input.priceInr != null && input.comparePriceInr > 0 && input.comparePriceInr <= input.priceInr) {
    price -= 30; add({ key: "compare_price", label: "Compare-at price should exceed the price", severity: "warning", impact: 3 });
  }
  price = clamp(price);

  // --- Inventory ---
  let inventory = 100;
  const stock = input.stockQuantity ?? 0;
  if (stock <= 0) { inventory = 40; add({ key: "stock", label: "Restock or mark availability", severity: "info", impact: 3 }); }

  // --- Reviews ---
  const reviews = clamp(Math.min(100, (input.reviewCount ?? 0) * 10));

  const dimensions: HealthDimension[] = [
    { key: "seo", label: "SEO", score: seo, weight: 16 },
    { key: "images", label: "Images", score: images, weight: 16 },
    { key: "description", label: "Description", score: description, weight: 12 },
    { key: "specs", label: "Specifications", score: specs, weight: 12 },
    { key: "duplicate", label: "Duplicate Risk", score: duplicate, weight: 12 },
    { key: "variants", label: "Variants", score: variants, weight: 8 },
    { key: "price", label: "Price", score: price, weight: 8 },
    { key: "media", label: "Media", score: media, weight: 6 },
    { key: "inventory", label: "Inventory", score: inventory, weight: 5 },
    { key: "reviews", label: "Reviews", score: reviews, weight: 5 },
  ];

  const totalW = dimensions.reduce((a, d) => a + d.weight, 0);
  const score = Math.round(dimensions.reduce((a, d) => a + d.score * d.weight, 0) / totalW);

  suggestions.sort((a, b) => b.impact - a.impact);

  return { score, grade: gradeFor(score), dimensions, suggestions };
}
