/**
 * Marketplace Quality Audit engine.
 *
 * A pure, client-safe analysis layer that MONITORS the output of the existing
 * auto-SEO / structured-data / product systems. It never mutates data and never
 * generates SEO — it audits completeness and quality at scale across three
 * dimensions: SEO Quality, Structured Data, and Product Quality.
 *
 * All checks are deterministic and derived from real product + image rows.
 */

export type QualityProduct = {
  slug: string;
  name: string | null;
  description: string | null;
  image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  meta_keywords: string[] | null;
  brand: string | null;
  category: string | null;
  product_type: string | null;
  price: number | string | null;
  price_usd: number | string | null;
  price_inr: number | string | null;
  video_url: string | null;
  status: string | null;
  sku: string | null;
  related_products: string[] | null;
  cross_sell_products: string[] | null;
  upsell_products: string[] | null;
};

export type QualityImage = { product_slug: string; url: string | null; alt: string | null };

export type IssueCategory = "seo" | "schema" | "product";
export type Severity = "critical" | "warning" | "info";

export type IssueKey =
  // SEO Quality
  | "dup_title"
  | "dup_desc"
  | "weak_desc"
  | "short_desc"
  | "long_title"
  | "low_keyword_diversity"
  | "thin_description"
  | "weak_alt"
  | "no_internal_links"
  // Structured Data
  | "missing_product_schema"
  | "missing_offer"
  | "currency_inconsistency"
  | "invalid_canonical"
  | "broken_schema_image"
  // Product Quality
  | "missing_images"
  | "missing_hero"
  | "missing_price_usd"
  | "missing_video"
  | "duplicate_product"
  | "weak_title"
  | "weak_product_desc"
  | "oversized_media";

export const ISSUE_META: Record<
  IssueKey,
  { label: string; category: IssueCategory; severity: Severity; hint: string }
> = {
  // SEO Quality
  dup_title: { label: "Duplicate SEO title", category: "seo", severity: "critical", hint: "Two or more products share an identical SEO title — search engines may treat them as duplicates." },
  dup_desc: { label: "Duplicate meta description", category: "seo", severity: "warning", hint: "Identical meta descriptions weaken differentiation in search results." },
  weak_desc: { label: "Weak meta description", category: "seo", severity: "warning", hint: "Generic or boilerplate meta description with little unique value." },
  short_desc: { label: "Short meta description", category: "seo", severity: "warning", hint: "Meta description under ~70 characters — too thin for a strong snippet." },
  long_title: { label: "Overly long SEO title", category: "seo", severity: "warning", hint: "SEO title exceeds ~60 characters and may be truncated in search." },
  low_keyword_diversity: { label: "Low keyword diversity", category: "seo", severity: "info", hint: "Fewer than 3 meta keywords — limited topical coverage." },
  thin_description: { label: "Thin SEO content", category: "seo", severity: "warning", hint: "Combined SEO content is thin — search engines favor richer pages." },
  weak_alt: { label: "Weak image alt text", category: "seo", severity: "warning", hint: "Alt text is missing, generic, or just repeats the product name." },
  no_internal_links: { label: "No internal linking", category: "seo", severity: "info", hint: "No related / cross-sell / upsell products — missed internal link equity." },
  // Structured Data
  missing_product_schema: { label: "Missing Product schema", category: "schema", severity: "critical", hint: "Missing name — Product structured data cannot be emitted." },
  missing_offer: { label: "Missing Offer data", category: "schema", severity: "critical", hint: "No usable price — the Offer node in Product JSON-LD is invalid." },
  currency_inconsistency: { label: "Currency inconsistency", category: "schema", severity: "warning", hint: "Only one regional price set — INR and USD pricing should both exist for clean multi-currency Offers." },
  invalid_canonical: { label: "Invalid canonical", category: "schema", severity: "warning", hint: "Slug is missing or contains invalid characters — canonical URL may be malformed." },
  broken_schema_image: { label: "Broken schema image", category: "schema", severity: "warning", hint: "No image available for the Product schema image field." },
  // Product Quality
  missing_images: { label: "Missing images", category: "product", severity: "critical", hint: "No hero image and no gallery images at all." },
  missing_hero: { label: "Missing hero image", category: "product", severity: "warning", hint: "No primary hero image set (gallery may still exist)." },
  missing_price_usd: { label: "Missing price_usd", category: "product", severity: "warning", hint: "No international (USD) price — international Offers and feed entries fall back." },
  missing_video: { label: "Missing video", category: "product", severity: "info", hint: "No product video — video media lifts conversion and engagement." },
  duplicate_product: { label: "Duplicate product", category: "product", severity: "warning", hint: "Another product shares a near-identical title." },
  weak_title: { label: "Weak product title", category: "product", severity: "warning", hint: "Title is very short or has too few words." },
  weak_product_desc: { label: "Weak description", category: "product", severity: "warning", hint: "Product description is too short to inform buyers." },
  oversized_media: { label: "Oversized media", category: "product", severity: "warning", hint: "An inline/base64 image is embedded — these bloat payloads and hurt performance." },
};

export const CATEGORY_META: Record<IssueCategory, { label: string }> = {
  seo: { label: "SEO Quality" },
  schema: { label: "Structured Data" },
  product: { label: "Product Quality" },
};

export type ProductAudit = {
  product: QualityProduct;
  issues: IssueKey[];
  score: number; // 0-100 quality score for this product
};

export type QualityReport = {
  total: number;
  audited: ProductAudit[];
  counts: Record<IssueKey, number>;
  byCategory: Record<IssueCategory, number>;
  scores: {
    seoCompleteness: number;
    productCompleteness: number;
    schemaQuality: number;
    contentQuality: number;
    catalogHealth: number;
  };
  flagged: number;
};

const GENERIC_DESC = [
  "high quality product",
  "best product",
  "buy now",
  "great product",
  "shop the best",
  "premium quality",
  "available now",
];

const n = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};

const wc = (s: string | null | undefined) => (s ?? "").trim().split(/\s+/).filter(Boolean).length;

function isGeneric(desc: string): boolean {
  const d = desc.trim().toLowerCase();
  if (!d) return true;
  return GENERIC_DESC.some((g) => d === g || (d.length < 60 && d.includes(g)));
}

/** Audit the whole catalog. Drafts/archived are excluded (not live). */
export function auditMarketplace(products: QualityProduct[], images: QualityImage[]): QualityReport {
  const live = products.filter((p) => {
    const s = (p.status ?? "published").toLowerCase();
    return s !== "draft" && s !== "archived";
  });

  // Gallery images grouped by slug.
  const galleryBySlug = new Map<string, QualityImage[]>();
  for (const im of images) {
    if (!im.product_slug) continue;
    const a = galleryBySlug.get(im.product_slug) ?? [];
    a.push(im);
    galleryBySlug.set(im.product_slug, a);
  }

  // Duplicate detection sets.
  const titleSeen = new Map<string, number>();
  const descSeen = new Map<string, number>();
  const nameSeen = new Map<string, number>();
  for (const p of live) {
    const t = (p.seo_title ?? "").trim().toLowerCase();
    if (t) titleSeen.set(t, (titleSeen.get(t) ?? 0) + 1);
    const d = (p.seo_description ?? "").trim().toLowerCase();
    if (d) descSeen.set(d, (descSeen.get(d) ?? 0) + 1);
    const nm = (p.name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
    if (nm) nameSeen.set(nm, (nameSeen.get(nm) ?? 0) + 1);
  }

  const counts = Object.fromEntries(
    (Object.keys(ISSUE_META) as IssueKey[]).map((k) => [k, 0]),
  ) as Record<IssueKey, number>;

  const audited: ProductAudit[] = live.map((p) => {
    const issues: IssueKey[] = [];
    const gallery = galleryBySlug.get(p.slug) ?? [];
    const hasHero = !!(p.image && p.image.trim());
    const hasAnyImage = hasHero || gallery.some((g) => g.url && g.url.trim());

    // ---- SEO Quality ----
    const title = (p.seo_title ?? "").trim();
    const desc = (p.seo_description ?? "").trim();
    if (title && (titleSeen.get(title.toLowerCase()) ?? 0) > 1) issues.push("dup_title");
    if (desc && (descSeen.get(desc.toLowerCase()) ?? 0) > 1) issues.push("dup_desc");
    if (desc && isGeneric(desc)) issues.push("weak_desc");
    if (desc && desc.length > 0 && desc.length < 70) issues.push("short_desc");
    if (title.length > 60) issues.push("long_title");
    if ((p.meta_keywords?.filter(Boolean).length ?? 0) < 3) issues.push("low_keyword_diversity");
    const seoContentLen = (desc.length) + (p.description ?? "").trim().length;
    if (seoContentLen < 200) issues.push("thin_description");
    // Alt text quality across the product's images.
    const altPool = [
      ...(hasHero ? [{ alt: null as string | null }] : []),
      ...gallery,
    ];
    const productName = (p.name ?? "").trim().toLowerCase();
    const weakAlt = altPool.some((im) => {
      const alt = (im.alt ?? "").trim();
      if (!alt) return true;
      if (alt.length < 5) return true;
      if (alt.toLowerCase() === productName) return true;
      if (/^(image|photo|picture|img)\b/i.test(alt)) return true;
      return false;
    });
    if (hasAnyImage && weakAlt) issues.push("weak_alt");
    const links =
      (p.related_products?.length ?? 0) +
      (p.cross_sell_products?.length ?? 0) +
      (p.upsell_products?.length ?? 0);
    if (links === 0) issues.push("no_internal_links");

    // ---- Structured Data ----
    const priceAny = n(p.price) ?? n(p.price_usd) ?? n(p.price_inr);
    if (!p.name || !p.name.trim()) issues.push("missing_product_schema");
    if (!(priceAny && priceAny > 0)) issues.push("missing_offer");
    const usd = n(p.price_usd);
    const inr = n(p.price_inr);
    if ((usd && usd > 0) !== (inr && inr > 0)) issues.push("currency_inconsistency");
    if (!p.slug || !/^[a-z0-9-]+$/.test(p.slug)) issues.push("invalid_canonical");
    if (!hasAnyImage) issues.push("broken_schema_image");

    // ---- Product Quality ----
    if (!hasAnyImage) issues.push("missing_images");
    else if (!hasHero) issues.push("missing_hero");
    if (!(usd && usd > 0)) issues.push("missing_price_usd");
    if (!p.video_url || !p.video_url.trim()) issues.push("missing_video");
    if (productName && (nameSeen.get(productName) ?? 0) > 1) issues.push("duplicate_product");
    if (wc(p.name) < 3 || (p.name ?? "").trim().length < 12) issues.push("weak_title");
    if ((p.description ?? "").trim().length < 150) issues.push("weak_product_desc");
    const oversized =
      (hasHero && p.image!.startsWith("data:")) ||
      gallery.some((g) => (g.url ?? "").startsWith("data:"));
    if (oversized) issues.push("oversized_media");

    for (const i of issues) counts[i] += 1;

    // Per-product score: 100 minus weighted penalties.
    let penalty = 0;
    for (const i of issues) {
      const sev = ISSUE_META[i].severity;
      penalty += sev === "critical" ? 12 : sev === "warning" ? 6 : 2;
    }
    const score = Math.max(0, 100 - penalty);

    return { product: p, issues, score };
  });

  const total = live.length;
  const byCategory: Record<IssueCategory, number> = { seo: 0, schema: 0, product: 0 };
  for (const k of Object.keys(counts) as IssueKey[]) {
    byCategory[ISSUE_META[k].category] += counts[k];
  }

  const pctClean = (cat: IssueCategory) => {
    if (!total) return 100;
    const dirty = audited.filter((a) =>
      a.issues.some((i) => ISSUE_META[i].category === cat),
    ).length;
    return Math.round(((total - dirty) / total) * 100);
  };

  const seoCompleteness = pctClean("seo");
  const schemaQuality = pctClean("schema");
  const productCompleteness = pctClean("product");
  // Content quality blends average per-product score.
  const contentQuality = total
    ? Math.round(audited.reduce((s, a) => s + a.score, 0) / total)
    : 100;
  const catalogHealth = Math.round(
    (seoCompleteness + schemaQuality + productCompleteness + contentQuality) / 4,
  );

  const flagged = audited.filter((a) => a.issues.length > 0).length;

  return {
    total,
    audited: audited.sort((a, b) => a.score - b.score),
    counts,
    byCategory,
    scores: { seoCompleteness, productCompleteness, schemaQuality, contentQuality, catalogHealth },
    flagged,
  };
}
