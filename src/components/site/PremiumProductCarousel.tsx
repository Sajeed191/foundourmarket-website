import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * FoundOurMarket™ — PremiumProductCarousel.
 *
 * Presentation-only. Horizontal snap carousel used by Flash Deals & New Arrivals
 * on the homepage. Uses native CSS scroll-snap + momentum; no JS animation
 * loops, no autoplay. Cards render exactly as the caller provides them.
 *
 *   size="regular"  →  ~2.3 mobile, ~3 tablet, ~4-5 desktop
 *   size="large"    →  ~1.5 mobile, ~2.5 tablet, ~4 desktop
 */
export function PremiumProductCarousel<T>({
  items,
  renderItem,
  getKey,
  size = "regular",
  ariaLabel,
  className = "",
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
  size?: "regular" | "large";
  ariaLabel?: string;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    updateArrows();
  }, [items, updateArrows]);

  const scrollBy = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(240, Math.round(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  const slideWidths =
    size === "large"
      ? "min-w-[72%] sm:min-w-[42%] lg:min-w-[24%]"
      : "min-w-[68%] sm:min-w-[36%] lg:min-w-[22%]";

  return (
    <div className={`relative ${className}`}>
      {/* Scroller */}
      <div
        ref={scrollerRef}
        role="region"
        aria-label={ariaLabel}
        onScroll={updateArrows}
        data-product-grid
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6 snap-x snap-mandatory scroll-smooth"
        style={{
          scrollbarWidth: "none",
          overscrollBehaviorX: "contain",
          WebkitOverflowScrolling: "touch",
          maskImage:
            "linear-gradient(90deg, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)",
        }}
      >
        {items.map((item, i) => (
          <div
            key={getKey(item, i)}
            className={`snap-start shrink-0 ${slideWidths}`}
            data-product-card-frame
          >
            {renderItem(item, i)}
          </div>
        ))}
      </div>

      {/* Desktop chevrons */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        disabled={!canPrev}
        className={`hidden lg:grid absolute left-1 top-1/2 -translate-y-1/2 z-10 place-items-center size-10 rounded-full border border-white/10 bg-black/60 text-white/80 backdrop-blur transition-opacity ${canPrev ? "opacity-100 hover:text-accent hover:border-accent/40" : "opacity-0 pointer-events-none"}`}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        disabled={!canNext}
        className={`hidden lg:grid absolute right-1 top-1/2 -translate-y-1/2 z-10 place-items-center size-10 rounded-full border border-white/10 bg-black/60 text-white/80 backdrop-blur transition-opacity ${canNext ? "opacity-100 hover:text-accent hover:border-accent/40" : "opacity-0 pointer-events-none"}`}
      >
        <ChevronRight className="size-5" />
      </button>

      <style>{`[data-product-grid]::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
