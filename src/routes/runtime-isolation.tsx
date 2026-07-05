import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { fetchProducts, type Product } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { VirtualizedProductGrid } from "@/components/site/VirtualizedProductGrid";
import { LazyMount } from "@/components/site/LazyMount";
import { SectionTracker } from "@/components/site/SectionTracker";
import { useOrderRotationSeed, seededShuffle } from "@/lib/rotation";
import { useRotationNonce } from "@/lib/use-rotation-nonce";

/**
 * BINARY-ISOLATION HARNESS — Android Chrome scroll-corruption investigation.
 *
 * This is a deliberately STRIPPED clone of the Browse grid (the page that does
 * NOT reproduce the corruption). It keeps ONLY:
 *   - the route itself,
 *   - the same ProductCard component,
 *   - the same ProductImage (via ProductCard),
 *   - the same data source (fetchProducts → products_public view).
 *
 * Everything else is intentionally absent from THIS page's own render:
 *   - no VirtualizedProductGrid / TwoPhaseGrid (no observers, no rAF, no
 *     scroll-restore, no decode-gate, no window metrics),
 *   - no rails / recommendations / related products,
 *   - no page-level effects beyond the one data fetch,
 *   - no analytics, no page transitions, no dialogs/portals/overlays.
 *
 * NOTE: page-global chrome that lives in src/routes/__root.tsx (header, footer,
 * bottom nav, live chat, LayoutMetricsProvider, notifications) still wraps every
 * route and cannot be removed from a single leaf without refactoring __root.
 * Those are the FIRST features to add back in the isolation sequence (starting
 * with LayoutMetricsProvider) once this baseline is confirmed to render.
 *
 * Plain vertical CSS grid, normal document flow, no transforms — matches the
 * Browse grid layout classes exactly so the ONLY difference from Browse is the
 * removal of the surrounding runtime features.
 */
export const Route = createFileRoute("/runtime-isolation")({
  head: () => ({
    meta: [
      { title: "Runtime Isolation Harness" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RuntimeIsolationPage,
});

/**
 * ISOLATION STEP 8: Home "Trending" section, replicated EXACTLY as production
 * renders it (see ProductSection sectionKey="trending" in src/routes/index.tsx).
 * Same trending derivation (filter p.trending → seededShuffle → slice), same
 * SectionTracker + LazyMount + VirtualizedProductGrid (virtualizeThreshold={0}
 * → IncrementalGrid batched mount), same ProductCard compact forceBadge.
 * No Best Sellers / New Arrivals / Flash Deals / recommendations / Browse
 * sections. No new startup effects. The 60-card grid below is unchanged.
 */
function TrendingSection({ products }: { products: Product[] }) {
  const rotationSeed = useOrderRotationSeed();
  const rotationNonce = useRotationNonce();
  const trending = useMemo(
    () =>
      seededShuffle(
        products.filter((p) => p.trending),
        rotationSeed + rotationNonce,
      ).slice(0, 8),
    [products, rotationSeed, rotationNonce],
  );
  const preview = trending.slice(0, 4);
  if (preview.length === 0) return null;
  return (
    <SectionTracker
      sectionKey="trending"
      className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto scroll-mt-24 block"
    >
      <div className="mb-4 flex items-center gap-2">
        <Flame className="size-5 text-accent" />
        <h2 className="text-lg font-semibold text-white">Trending</h2>
      </div>
      <LazyMount minHeight={320}>
        <VirtualizedProductGrid
          items={preview}
          virtualizeThreshold={0}
          cols={{ base: 2, lg: 4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          getKey={(p) => p.id ?? p.slug}
          getImageSrc={(p) => p.image}
          renderItem={(p) => (
            <ProductCard product={p} compact forceBadge="trending" />
          )}
        />
      </LazyMount>
    </SectionTracker>
  );
}

function RuntimeIsolationPage() {
  const [products, setProducts] = useState<Product[]>([]);

  // The ONLY effect on this page: fetch the same data Browse uses, once.
  useEffect(() => {
    let active = true;
    fetchProducts(60).then((rows) => {
      if (active) setProducts(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <TrendingSection products={products} />
      <h1 className="mb-6 text-lg font-semibold text-white">Runtime Isolation ({products.length})</h1>
      <div data-product-grid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {products.map((p) => (
          <div key={p.id ?? p.slug} data-product-card-frame className="h-full min-w-0 [&>*]:h-full">
            <ProductCard product={p} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
