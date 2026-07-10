import { useMemo } from "react";
import { useProducts } from "./use-products";
import { useRegion } from "./region";
import { useWishlist } from "./wishlist";
import type { Product, ProductStatus } from "./products";
import type { MarketRegion } from "./region.functions";

/**
 * Centralized product-availability layer.
 *
 * The `products_public` view only strips `deleted_at IS NULL`, so it still
 * returns admin-hidden products (draft / hidden / archived / scheduled). This
 * module is the SINGLE source of truth for "should a customer ever see or
 * count this product", used by Cart, Wishlist, Recently Viewed, Continue
 * Shopping, Recommendations and the navigation badges so no collection or
 * counter ever shows a stale / unavailable product.
 *
 * No schema changes: availability is derived purely from the existing
 * `status`, region-visibility and stock fields already on each product.
 */

// Statuses that represent a live, customer-facing catalog entry.
// `out_of_stock` stays visible (so wishlist restock alerts keep working) but is
// not purchasable. draft / hidden / archived / scheduled are admin-hidden and
// must never appear in any customer collection or badge.
const VISIBLE_STATUSES: ReadonlySet<ProductStatus> = new Set<ProductStatus>([
  "published",
  "preorder",
  "out_of_stock",
]);

/** Whether a product is sellable/visible in the given market region. */
export function isRegionVisible(p: Product, market?: MarketRegion | null): boolean {
  if (!market) return true;
  return market === "india" ? p.indiaVisible : p.internationalVisible;
}

/**
 * Visible in any customer-facing collection (wishlist, recently viewed,
 * continue shopping, recommendations) and counted by navigation badges.
 * Removes admin-deleted (already absent from the view), draft, hidden,
 * archived, scheduled and region-hidden products.
 */
export function isProductVisible(
  p: Product | null | undefined,
  market?: MarketRegion | null,
): p is Product {
  if (!p) return false;
  return VISIBLE_STATUSES.has(p.status) && isRegionVisible(p, market);
}

/**
 * Buyable right now: visible + in stock + not flagged out_of_stock. Used to
 * gate checkout eligibility so an inactive product can never be purchased.
 */
export function isProductPurchasable(
  p: Product | null | undefined,
  market?: MarketRegion | null,
): p is Product {
  return isProductVisible(p, market) && p.inStock && p.status !== "out_of_stock";
}

/** Build a slug → Product map containing ONLY currently-visible products. */
export function buildVisibleMap(products: Product[], market?: MarketRegion | null): Map<string, Product> {
  const map = new Map<string, Product>();
  for (const p of products) if (isProductVisible(p, market)) map.set(p.slug, p);
  return map;
}

/**
 * Region-aware availability helpers bound to the live catalog. Recomputes only
 * when the catalog or region changes, so consumers get atomic, flicker-free
 * updates the instant an admin deletes / deactivates a product (via the
 * products realtime + focus refresh already wired into `useProducts`).
 */
export function useProductAvailability() {
  const { products, loading } = useProducts();
  const { market } = useRegion();

  return useMemo(() => {
    const visibleMap = buildVisibleMap(products, market);
    return {
      loading,
      visibleMap,
      /** True if the slug maps to a currently-visible product. */
      isVisibleSlug: (slug: string) => visibleMap.has(slug),
      /** Visible product for a slug, or null. */
      getVisible: (slug: string) => visibleMap.get(slug) ?? null,
      /** Map slugs → visible products (order preserved, unavailable dropped). */
      resolveVisible: (slugs: Iterable<string>) =>
        [...slugs].map((s) => visibleMap.get(s)).filter(Boolean) as Product[],
      /** Count how many of the given slugs are currently visible. */
      countVisible: (slugs: Iterable<string>) => {
        let n = 0;
        for (const s of slugs) if (visibleMap.has(s)) n++;
        return n;
      },
    };
  }, [products, market, loading]);
}

/**
 * Live count of saved products that are still active/visible — the value the
 * Wishlist navigation badge must show. Deleted / deactivated products drop out
 * automatically without a page reload.
 */
export function useVisibleWishlistCount(): number {
  const { slugs } = useWishlist();
  const { countVisible } = useProductAvailability();
  return useMemo(() => countVisible(slugs), [slugs, countVisible]);
}
