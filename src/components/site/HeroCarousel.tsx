import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/site/ProductImage";
import { useImagePalette } from "@/lib/use-image-palette";
import { useLowEndDevice } from "@/lib/use-low-end-device";
import type { Product } from "@/lib/products";

type Props = {
  /** Pre-prioritized product pools. First non-empty wins. */
  featured: Product[];
  trending: Product[];
  bestSellers: Product[];
  newArrivals: Product[];
  /** Search + chips slot rendered below the showcase. */
  children?: React.ReactNode;
};

const ROTATE_MS = 3000;
// Apple/Stripe-style premium easing for the showcase crossfade.
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// Scattered depth slots for the blurred background products. Sizes/positions in px
// are chosen so they peek around — never behind/covering — the centered main card.
const BG_SLOTS = [
  { key: "tl", size: 150, x: -250, y: -150, rot: -11, blur: 16, opacity: 0.22, glow: true },
  { key: "tr", size: 130, x: 130, y: -160, rot: 9, blur: 18, opacity: 0.18, glow: false },
  { key: "bl", size: 120, x: -210, y: 50, rot: 7, blur: 18, opacity: 0.18, glow: false },
  { key: "br", size: 160, x: 110, y: 40, rot: 12, blur: 16, opacity: 0.22, glow: true },
] as const;

/**
 * Premium rotating hero showcase. Picks real products (Featured → Trending →
 * Best Sellers → New Arrivals), rotates every 4s with a cinematic fade/zoom/
 * blur transition, and derives the ambient background from each product image's
 * dominant color. UI only — no data fetching, no routing changes.
 */
export function HeroCarousel({ featured, trending, bestSellers, newArrivals, children }: Props) {
  const lowEnd = useLowEndDevice();

  const items = useMemo(() => {
    const pool =
      (featured.length && featured) ||
      (trending.length && trending) ||
      (bestSellers.length && bestSellers) ||
      newArrivals;
    return (pool || []).filter((p) => !!p?.image).slice(0, 6);
  }, [featured, trending, bestSellers, newArrivals]);

  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  // Reset when the pool changes.
  useEffect(() => {
    setIndex(0);
  }, [items.length]);

  // Auto-rotate.
  useEffect(() => {
    if (items.length <= 1) return;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [items.length]);

  const current = items[index];
  const { palette } = useImagePalette(current?.image);

  // Preload the next image for a seamless transition.
  useEffect(() => {
    if (items.length <= 1) return;
    const next = items[(index + 1) % items.length];
    if (next?.image) {
      const img = new Image();
      img.src = next.image;
    }
  }, [index, items]);

  const primary = palette.primary || "#ffffff";
  const ambient = `color-mix(in srgb, ${primary} 38%, transparent)`;
  const ambientSoft = `color-mix(in srgb, ${primary} 18%, transparent)`;

  return (
    <div className="relative mx-auto max-w-[1100px]">
      {/* ── Dynamic ambient background derived from the product image ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div
          className="absolute left-1/2 -top-[20%] -translate-x-1/2 size-[460px] sm:size-[620px] rounded-full blur-[110px]"
          style={{ background: `radial-gradient(circle, ${ambient}, transparent 70%)`, transition: "background 700ms ease", willChange: "background" }}
        />
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 h-[60%] w-[120%]"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${ambientSoft}, transparent 65%)`, transition: "background 700ms ease" }}
        />
        {/* warm orange anchor glow so the brand accent always reads */}
        <div className="absolute left-1/2 -top-[28%] -translate-x-1/2 size-[360px] sm:size-[460px] rounded-full blur-[100px] opacity-40" style={{ background: "radial-gradient(circle, oklch(0.74 0.19 49 / 0.30), transparent 70%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center pt-6 sm:pt-9">
        {/* badge */}
        <span
          className="inline-flex h-8 items-center gap-1.5 rounded-full glass-strong px-3.5 text-[10px] font-mono uppercase tracking-[0.22em] text-foreground ring-1 ring-accent/40 animate-fade-in"
          style={{ boxShadow: "0 0 18px -4px oklch(0.74 0.19 49 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.08)" }}
        >
          <Sparkles className="size-3 text-accent" /> Global Marketplace
        </span>
        <h2 className="mt-4 font-display font-semibold tracking-tight text-balance text-[clamp(1.5rem,5.5vw,2.1rem)] leading-[1.1]">
          Discover Premium Products
        </h2>
        <p className="mt-2 max-w-md text-sm sm:text-base text-muted-foreground text-balance">
          Trusted products from verified sellers worldwide.
        </p>

        {/* ── premium floating glass showcase with blurred depth layer ── */}
        <div
          className="relative mt-6 sm:mt-8 w-full max-w-[480px] sm:max-w-[600px] h-[300px] sm:h-[360px] select-none overflow-hidden [perspective:1200px]"
          role="group"
          aria-roledescription="carousel"
          aria-label="Featured products"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          {/* soft halo behind the stage */}
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[120%] rounded-full blur-3xl opacity-70"
            style={{ background: `radial-gradient(circle, ${ambient}, transparent 70%)`, transition: "background 800ms ease" }}
          />

          {/* ── BACKGROUND: blurred real product images for depth ── */}
          {!lowEnd && items.length > 1 && (
            <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]">
              {BG_SLOTS.map((slot, s) => {
                // Pick a real product that isn't the current center, cycling with index.
                const offset = ((index + s + 1) % items.length);
                const bg = items[offset];
                if (!bg?.image || bg.id === current?.id) return null;
                return (
                  <div
                    key={`${slot.key}-${bg.id}`}
                    className="absolute left-1/2 top-1/2 overflow-hidden rounded-[22px] animate-fade-in"
                    style={{
                      width: slot.size,
                      height: slot.size,
                      marginLeft: slot.x,
                      marginTop: slot.y,
                      transform: `rotate(${slot.rot}deg)`,
                      opacity: slot.opacity,
                      filter: `blur(${slot.blur}px)`,
                      transition: `transform 800ms ${EASE}, opacity 800ms ${EASE}, filter 800ms ${EASE}`,
                      willChange: "transform, opacity, filter",
                    }}
                  >
                    {slot.glow && (
                      <div className="absolute inset-0 rounded-[22px]" style={{ background: "radial-gradient(circle at 50% 40%, oklch(0.74 0.19 49 / 0.35), transparent 70%)" }} />
                    )}
                    <ProductImage
                      src={bg.image}
                      alt=""
                      width={300}
                      height={300}
                      className="block size-full object-contain object-center p-[10%]"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* ── FOREGROUND: main floating glass product card ── */}
          {items.length === 0 ? (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[250px] sm:size-[310px] rounded-[28px] glass-strong ring-1 ring-white/12 animate-pulse" />
          ) : (
            items.map((p, i) => {
              const isCenter = i === index;
              return (
                <Link
                  key={p.id}
                  to="/products/$slug"
                  params={{ slug: p.slug }}
                  aria-hidden={!isCenter}
                  tabIndex={isCenter ? 0 : -1}
                  className={`group absolute left-1/2 top-1/2 -ml-[125px] -mt-[125px] sm:-ml-[155px] sm:-mt-[155px] size-[250px] sm:size-[310px] overflow-hidden rounded-[28px] glass-strong ring-1 ring-white/15 ${isCenter ? "shadow-[var(--shadow-float),0_0_80px_-16px_oklch(0.74_0.19_49/0.55)]" : ""} ${isCenter && !lowEnd ? "animate-float-soft" : ""}`}
                  style={{
                    transform: isCenter ? "translateY(0) scale(1)" : "translateY(10px) scale(0.96)",
                    opacity: isCenter ? 1 : 0,
                    filter: isCenter || lowEnd ? "blur(0px)" : "blur(6px)",
                    zIndex: isCenter ? 5 : 0,
                    pointerEvents: isCenter ? "auto" : "none",
                    visibility: isCenter ? "visible" : "hidden",
                    background: palette.background,
                    transition: lowEnd
                      ? "opacity 300ms ease"
                      : `transform 800ms ${EASE}, opacity 800ms ${EASE}, filter 800ms ${EASE}`,
                    willChange: "transform, opacity, filter",
                  }}
                >
                  {isCenter && (
                    <>
                      {/* glossy top sheen */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                      {/* gentle reflection at the base */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-1/3 bg-gradient-to-t from-white/5 to-transparent" />
                    </>
                  )}
                  <ProductImage
                    src={p.image}
                    alt={p.name}
                    width={560}
                    height={560}
                    priority={i === 0}
                    className="relative z-[1] block size-full object-contain object-center p-[7%] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                </Link>
              );
            })
          )}
        </div>

        {/* product name + CTA */}
        {current && (
          <div className="mt-5 min-h-[2.5rem] animate-fade-in" key={current.id}>
            <p className="text-sm font-medium text-foreground line-clamp-2 max-w-[280px] mx-auto leading-snug">{current.name}</p>
            <Link
              to="/products/$slug"
              params={{ slug: current.slug }}
              className="view-product-cta group relative mt-3 inline-flex h-11 items-center justify-center gap-1.5 overflow-hidden rounded-full px-6 text-[12px] font-semibold tracking-wide text-foreground outline-none transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {/* periodic shine sweep */}
              <span aria-hidden className="view-product-cta__shine pointer-events-none absolute inset-0 rounded-full" />
              <span className="relative z-[1]">View Product</span>
              <ArrowRight className="relative z-[1] size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        )}

        {/* dots — active dot fills with a liquid-style progress */}
        {items.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="Product slides">
            {items.map((p, i) => {
              const isActive = i === index;
              return (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Show product ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`relative h-1.5 overflow-hidden rounded-full transition-[width,background-color] duration-300 ${isActive ? "w-6 bg-white/20" : "w-1.5 bg-white/25 hover:bg-white/40"}`}
                >
                  {isActive && !lowEnd && (
                    <span
                      key={index}
                      aria-hidden
                      className="absolute inset-y-0 left-0 rounded-full bg-accent"
                      style={{
                        animation: `dot-fill ${ROTATE_MS}ms linear forwards`,
                        boxShadow: "0 0 10px -2px oklch(0.74 0.19 49 / 0.8)",
                      }}
                    />
                  )}
                  {isActive && lowEnd && (
                    <span aria-hidden className="absolute inset-0 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* search + chips slot */}
      {children}
    </div>
  );
}
