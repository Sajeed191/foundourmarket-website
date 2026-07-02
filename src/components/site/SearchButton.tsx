import { ArrowRight, Loader2 } from "lucide-react";
import { useRef } from "react";

type Props = {
  loading?: boolean;
  focused?: boolean;
};

/**
 * Premium pill-shaped search submit button.
 * - Glossy orange gradient, soft layered shadows, subtle idle pulse + periodic shimmer.
 * - GPU-only animations (transform/opacity), respects prefers-reduced-motion.
 * - Loading state morphs into a circular spinner without changing size.
 * - Press triggers a lightweight ripple.
 */
export function SearchButton({ loading = false, focused = false }: Props) {
  const rippleRef = useRef<HTMLSpanElement>(null);

  function spawnRipple(e: React.PointerEvent<HTMLButtonElement>) {
    const el = rippleRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.style.left = `${e.clientX - rect.left}px`;
    el.style.top = `${e.clientY - rect.top}px`;
    el.classList.remove("search-cta__ripple--run");
    // force reflow to restart the animation
    void el.offsetWidth;
    el.classList.add("search-cta__ripple--run");
  }

  return (
    <button
      type="submit"
      aria-label="Search"
      aria-busy={loading}
      disabled={loading}
      onPointerDown={spawnRipple}
      className={`search-cta group absolute right-2 sm:right-2.5 top-1/2 inline-flex h-10 sm:h-12 items-center justify-center gap-1.5 rounded-full text-[13px] sm:text-sm font-semibold tracking-wide text-white outline-none transition-transform duration-[250ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.05] active:scale-[0.97] disabled:cursor-default ${focused ? "-translate-y-1/2 scale-[1.04]" : "-translate-y-1/2"} ${loading ? "search-cta--loading w-10 sm:w-12 px-0" : "min-w-[108px] sm:min-w-[124px] px-5 sm:px-6"}`}

    >
      {/* glossy top highlight */}
      <span aria-hidden className="search-cta__gloss pointer-events-none absolute inset-x-1 top-[2px] h-1/2 rounded-full" />
      {/* periodic shimmer sweep */}
      <span aria-hidden className="search-cta__shimmer pointer-events-none absolute inset-0 rounded-full" />
      {/* click ripple */}
      <span ref={rippleRef} aria-hidden className="search-cta__ripple pointer-events-none" />

      {loading ? (
        <Loader2 className="relative z-[1] size-4 animate-spin" />
      ) : (
        <>
          <span className="relative z-[1]">Search</span>
          <ArrowRight className="relative z-[1] size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}
