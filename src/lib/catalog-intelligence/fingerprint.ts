/**
 * Product Fingerprint — a permanent, deterministic marketplace identity.
 *
 * Combines commerce identifiers, perceptual image hash, variant structure,
 * brand, category, spec keys and keywords into one stable fingerprint. Title
 * and description embeddings are optional and computed asynchronously (cached),
 * so the deterministic core is always available with zero network cost.
 *
 * Never relies on title matching alone.
 */
import {
  normalizeText,
  normalizeCode,
  normalizeSku,
  titleFingerprint,
  tokenize,
} from "@/lib/duplicate-detection";
import type { DetectionProduct, DraftProduct, ProductFingerprint } from "./types";

/** Stable, order-independent hash of the deterministic identity fields. */
function stableHash(input: string): string {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0");
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "with", "of", "to", "in", "on",
  "new", "best", "premium", "original", "genuine", "pack", "set",
]);

/** Read a code-like field from a draft or product via a list of candidate keys. */
function readField(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

/**
 * Build a deterministic fingerprint from a draft or a catalog product. Extra
 * commerce identifiers (mpn/gtin/isbn/model) are read opportunistically from
 * whatever fields are present, staying resilient to schema differences.
 */
export function buildFingerprint(
  source: DraftProduct | DetectionProduct,
  extras?: { mpn?: string; gtin?: string; isbn?: string; model?: string },
): ProductFingerprint {
  const s = source as Record<string, unknown>;
  const name = (source.name ?? "") as string;
  const description = (source.description ?? "") as string;

  const specifications = (source.specifications ?? {}) as Record<string, string>;
  const attributes = (source.attributes ?? {}) as Record<string, string>;

  const codes = {
    barcode: normalizeCode((source as DraftProduct).barcode ?? readField(s, ["barcode", "ean", "upc"])),
    sku: normalizeSku(readField(s, ["sku"])),
    mpn: normalizeCode(extras?.mpn ?? readField(s, ["mpn", "manufacturer_part_number", "part_number"])),
    gtin: normalizeCode(extras?.gtin ?? readField(s, ["gtin", "gtin13", "gtin14"])),
    isbn: normalizeCode(extras?.isbn ?? readField(s, ["isbn", "isbn13"])),
    model: normalizeCode(extras?.model ?? readField(s, ["model", "model_number", "model_no"])),
  };

  const variantKeys = Array.from(
    new Set(
      ((source as DraftProduct).variantKeys ?? Object.values(attributes))
        .map((v) => normalizeText(v as string))
        .filter(Boolean),
    ),
  ).sort();

  const specKeys = Object.keys(specifications)
    .map((k) => normalizeText(k))
    .filter(Boolean)
    .sort();

  const keywords = Array.from(
    new Set([...tokenize(name), ...tokenize(description)].filter((t) => t.length > 2 && !STOPWORDS.has(t))),
  ).slice(0, 24);

  const brand = normalizeText((source.brand ?? "") as string);
  const category = normalizeText((source.category ?? "") as string);
  const titleKey = titleFingerprint(name);
  const imagePhash = ((source as DraftProduct).imagePhash ?? (source as DetectionProduct).imagePhash ?? null) as
    | string
    | null;

  const identity = [
    codes.barcode, codes.gtin, codes.mpn, codes.isbn, codes.model, codes.sku,
    titleKey, brand, category, imagePhash ?? "", variantKeys.join(","),
  ].join("|");

  return {
    id: stableHash(identity),
    titleKey,
    brand,
    category,
    imagePhash,
    codes,
    variantKeys,
    specKeys,
    keywords,
  };
}

/** True when two fingerprints share any strong commerce identifier. */
export function sharesStrongCode(a: ProductFingerprint, b: ProductFingerprint): boolean {
  const pairs: [string, string][] = [
    [a.codes.barcode, b.codes.barcode],
    [a.codes.gtin, b.codes.gtin],
    [a.codes.mpn, b.codes.mpn],
    [a.codes.isbn, b.codes.isbn],
  ];
  return pairs.some(([x, y]) => x.length >= 6 && x === y);
}
