/**
 * Product completion model — shared by the Product Editor progress navigation.
 *
 * Read-only: computes per-section completeness from a single product row so the
 * editor can show progress without ever mutating product data.
 */

/** Columns needed to evaluate completeness across every editable section. */
export const COMPLETION_COLS = [
  "name", "description", "image", "tags",
  "price_inr", "price_usd", "price",
  "stock_quantity",
  "weight",
  "return_window_days", "return_eligible",
  "seo_title", "seo_description",
  "featured", "trending", "bestseller", "new_arrival", "flash_deal",
  "staff_pick", "recommended", "homepage_hero",
] as const;

/** Sections that carry editable data and therefore contribute to completion. */
export const COMPLETION_SECTIONS = [
  "details", "pricing", "inventory", "shipping", "returns", "seo", "merchandising",
] as const;

export type SectionKey = (typeof COMPLETION_SECTIONS)[number];
export type SectionCompletion = Record<SectionKey, boolean>;

const positive = (v: unknown) => v != null && Number(v) > 0;

export function computeCompletion(r: Record<string, any> | null | undefined): {
  sections: SectionCompletion;
  percent: number;
} {
  const row = r ?? {};
  const sections: SectionCompletion = {
    details: Boolean(row.name && row.description && row.image && row.tags?.length),
    pricing: positive(row.price_inr) || positive(row.price_usd) || positive(row.price),
    inventory: row.stock_quantity != null,
    shipping: positive(row.weight),
    returns: row.return_window_days != null || row.return_eligible === true,
    seo: Boolean(row.seo_title && row.seo_description),
    merchandising: Boolean(
      row.featured || row.trending || row.bestseller || row.new_arrival ||
      row.flash_deal || row.staff_pick || row.recommended || row.homepage_hero,
    ),
  };
  const keys = Object.keys(sections) as SectionKey[];
  const done = keys.filter((k) => sections[k]).length;
  return { sections, percent: Math.round((done / keys.length) * 100) };
}
