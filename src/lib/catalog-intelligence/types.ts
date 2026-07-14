/**
 * Catalog Intelligence — shared types.
 *
 * The unified, explainable intelligence layer that sits on top of the existing
 * Marketplace Intelligence engines (duplicate-detection, recommendations,
 * seo-intelligence, marketplace-quality). Every score here is deterministic,
 * grounded in real catalog data, and carries a human-readable reason list.
 *
 * Nothing in this module mutates content or blocks the admin — it only informs.
 */
import type { DetectionProduct, DraftProduct, DupMatch } from "@/lib/duplicate-detection";

/**
 * How one product relates to another. We classify the *relationship* rather
 * than only flagging "duplicate", so the admin sees "new colour variant" or
 * "accessory for X" instead of a blunt duplicate warning.
 */
export type RelationshipKind =
  | "exact_duplicate"
  | "variant_color"
  | "variant_size"
  | "variant_storage"
  | "variant_other"
  | "bundle"
  | "accessory"
  | "replacement"
  | "successor"
  | "compatible"
  | "upsell"
  | "cross_sell"
  | "related";

export type Relationship = {
  kind: RelationshipKind;
  /** Confidence 0–100 that this relationship holds. */
  confidence: number;
  /** Admin-facing headline, e.g. "This appears to be a new colour variant." */
  message: string;
  /** Supporting reasons (from the underlying duplicate signals + axis detection). */
  reasons: string[];
  /** The differing axis value we detected, if any (e.g. "256GB", "Red", "XL"). */
  axisValue?: string;
};

/** A duplicate/relationship match enriched with a relationship classification. */
export type CatalogMatch = DupMatch & {
  relationship: Relationship;
};

/**
 * A permanent, deterministic identity for a product — the "marketplace
 * fingerprint". Embeddings are optional (computed async, cached) so the UI is
 * never blocked; the deterministic core (codes + hash + structure) always works.
 */
export type ProductFingerprint = {
  /** Stable hash of the deterministic identity fields. */
  id: string;
  /** Normalized title fingerprint (token-sorted). */
  titleKey: string;
  /** Normalized brand. */
  brand: string;
  /** Normalized primary category. */
  category: string;
  /** Perceptual image hash (aHash/dHash), if an image was hashed. */
  imagePhash: string | null;
  /** Normalized commerce identifiers. */
  codes: {
    barcode: string;
    sku: string;
    mpn: string;
    gtin: string;
    isbn: string;
    model: string;
  };
  /** Sorted variant axis values (colours/sizes/etc.). */
  variantKeys: string[];
  /** Canonical spec keys present. */
  specKeys: string[];
  /** Top keyword tokens from title + description. */
  keywords: string[];
  /** Optional embedding vectors (filled lazily, cached). */
  embeddings?: {
    title?: number[];
    description?: number[];
  };
};

export type { DetectionProduct, DraftProduct, DupMatch };
