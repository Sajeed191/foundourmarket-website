import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { memo, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { ProductCard } from "@/components/site/ProductCard";
import { useProducts } from "@/lib/use-products";
import { type Product } from "@/lib/products";
import { useRegion } from "@/lib/region";
import { useCompare } from "@/hooks/use-compare";

/**
 * PDP — You may also like (v6.1)
 *
 * Native marketplace recommendation carousel. Reuses the standard ProductCard
 * used everywhere else on the site, and layers a single "Compare" checkbox
 * beneath each card. No bordered container, no special compare cards, no
 * insights or banners — the carousel is a shopping surface first, comparison
 * second. Compare store, ranking, and /compare page are all untouched.
 */

const VISIBLE_LIMIT = 12;
const VIEW_MORE_THRESHOLD = 8;

export function PDPCompareSection({ currentProduct }: { currentProduct: Product }) {
  const { products } = useProducts();
  const { priceOf } = useRegion();
  const { slugs, toggle, has, isFull, max } = useCompare();
  const navigate = useNavigate();

  const currentSlug = currentProduct.slug;
  const currentPrice = priceOf(currentProduct) || 0;

  const suggestions = useMemo(() => {
    if (!products.length) return [] as Product[];
    const cur = currentProduct;
    const curCats = new Set(
      [cur.category, ...(cur.categories ?? [])].filter(Boolean),
    );

    return products
      .filter(
        (p) =>
          p.slug !== cur.slug &&
          p.status !== "archived" &&
          p.inStock !== false,
      )
      .map((p) => {
        let score = 0;
        if (cur.brand && p.brand && p.brand === cur.brand) score += 4;
        if (cur.productType && p.productType && p.productType === cur.productType) score += 3;
        const pCats = [p.category, ...(p.categories ?? [])].filter(Boolean);
        if (pCats.some((c) => curCats.has(c))) score += 2;
        if (currentPrice > 0) {
          const diff = Math.abs((priceOf(p) || 0) - currentPrice) / currentPrice;
          if (diff <= 0.25) score += 1;
        }
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, VISIBLE_LIMIT)
      .map((x) => x.p);
  }, [products, currentProduct, currentPrice, priceOf]);

  // Ensure current product is always part of the compare set.
  useEffect(() => {
    if (!has(currentSlug)) toggle(currentSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug]);

  const selectedNonCurrent = slugs.filter((s) => s !== currentSlug).length;
  const selectedCount = selectedNonCurrent + 1; // + current
  const canCompare = selectedCount >= 2;

  const handleToggle = (slug: string) => {
    if (slug === currentSlug) return;
    if (!has(slug) && isFull) {
      toast.message(`Maximum ${max} products`);
      return;
    }
    toggle(slug);
  };

  if (products.length === 0 || suggestions.length === 0) return null;

  return (
    <section
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24"
      data-pdp-compare
      aria-labelledby="pdp-ymal-heading"
    >
      <div className="mb-6">
        <h2
          id="pdp-ymal-heading"
          className="text-[20px] sm:text-[22px] font-semibold tracking-tight text-foreground leading-tight"
        >
          You may also like
        </h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground/75 leading-relaxed">
          Similar products chosen for you.
        </p>
      </div>

      <div className="relative -mx-4 sm:mx-0">
        {/* subtle edge fades */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent z-10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10"
        />

        <ul
          className="flex overflow-x-auto gap-4 sm:gap-5 px-4 sm:px-1 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{
            overscrollBehaviorX: "contain",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <li className="shrink-0 w-[43%] min-[420px]:w-[38%] sm:w-[210px]">
            <RailItem product={currentProduct} pinned />
          </li>
          {suggestions.map((p) => {
            const active = has(p.slug);
            const disabled = !active && isFull;
            return (
              <li
                key={p.slug}
                className="shrink-0 w-[43%] min-[420px]:w-[38%] sm:w-[210px]"
              >
                <RailItem
                  product={p}
                  active={active}
                  disabled={disabled}
                  onToggle={() => handleToggle(p.slug)}
                />
              </li>
            );
          })}
          <div aria-hidden className="shrink-0 w-1" />
        </ul>
      </div>

      {suggestions.length >= VIEW_MORE_THRESHOLD && (
        <div className="mt-5 px-1">
          <Link
            to="/category/$slug"
            params={{ slug: currentProduct.category || "all" }}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-white/75 hover:text-accent transition-colors duration-150"
          >
            View all similar products
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      )}

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {selectedNonCurrent === 0
          ? "No alternatives selected for comparison."
          : `${selectedCount} products selected for comparison.`}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 px-1">
        <span className="text-[12.5px] text-white/55 tabular-nums">
          Selected: {selectedCount}
        </span>
        <button
          type="button"
          disabled={!canCompare}
          onClick={() => canCompare && navigate({ to: "/compare" })}
          aria-label={
            canCompare
              ? `Compare ${selectedCount} selected products`
              : "Select at least one more product to compare"
          }
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12.5px] font-medium tracking-wide transition-[color,border-color,background-color] duration-150 ease-out min-h-[44px] sm:min-h-0 ${
            canCompare
              ? "border-accent text-accent hover:bg-accent/[0.08]"
              : "border-white/10 text-white/35 cursor-not-allowed"
          }`}
        >
          Compare Selected Products
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      </div>
    </section>
  );
}

type RailItemProps = {
  product: Product;
  active?: boolean;
  disabled?: boolean;
  pinned?: boolean;
  onToggle?: () => void;
};

function RailItemImpl({ product, active, disabled, pinned, onToggle }: RailItemProps) {
  const isSelected = !!(pinned || active);
  return (
    <div className="flex h-full flex-col">
      {/* Reserved caption slot so cards align regardless of "Current" tag */}
      <div className="mb-1.5 h-[14px] px-0.5 flex items-center">
        {pinned && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-white/40">
            Current Product
          </span>
        )}
      </div>

      <div
        className={`rounded-2xl transition-[box-shadow] duration-150 ${
          isSelected && !pinned ? "ring-1 ring-accent/70" : ""
        }`}
      >
        <ProductCard product={product} compact hideBadges={pinned} />
      </div>

      <div className="mt-2 px-0.5">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isSelected}
          aria-label={
            pinned
              ? `${product.name} is the current product`
              : isSelected
                ? `Remove ${product.name} from comparison`
                : `Add ${product.name} to comparison`
          }
          disabled={pinned || disabled}
          className="inline-flex items-center gap-1.5 py-1.5 pr-2 pl-0.5 text-[11px] font-medium text-white/70 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-md"
        >
          <span
            aria-hidden
            className={`grid place-items-center size-3.5 rounded-[3.5px] border transition-colors duration-150 ${
              isSelected
                ? "border-accent bg-accent text-accent-foreground"
                : "border-white/25 bg-transparent"
            }`}
          >
            {isSelected && <Check className="size-2.5" strokeWidth={3} />}
          </span>
          {isSelected && !pinned ? "Compared" : "Compare"}
        </button>
      </div>
    </div>
  );
}

const RailItem = memo(RailItemImpl);
