import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * FoundOurMarket™ premium homepage section heading.
 *
 * Layout: [accent bar] [icon in glass circle] [title + subtitle + underline]  ·  [right slot] [View All pill]
 * Motion: single reveal on scroll — bar grows top→bottom, title fades+slides up,
 * underline draws left→right. GPU-only transforms. Respects reduced-motion.
 * No continuous animations after reveal.
 */
export function PremiumSectionHeading({
  icon: Icon,
  title,
  subtitle,
  href,
  hrefLabel = "View All",
  right,
  live = false,
  liveLabel = "Live",
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  right?: ReactNode;
  live?: boolean;
  liveLabel?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative mb-4 sm:mb-6">
      {/* Soft ambient orange glow — subtle, never fights the content */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-4 -top-6 h-24 w-[65%] rounded-full opacity-[0.05] blur-3xl"
        style={{ background: "var(--gradient-ember, radial-gradient(60% 100% at 20% 50%, oklch(0.74 0.19 49), transparent))" }}
      />

      <div className="relative flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-stretch gap-2.5 sm:gap-3">
          {/* Animated accent bar */}
          <span
            aria-hidden
            className="w-[3px] shrink-0 self-stretch rounded-full"
            style={{
              background: "linear-gradient(180deg, #FFB347 0%, #FF6A00 100%)",
              boxShadow: "0 0 14px -2px oklch(0.74 0.19 49 / 0.55)",
              transform: shown ? "scaleY(1)" : "scaleY(0)",
              transformOrigin: "top",
              transition: "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)",
              willChange: shown ? undefined : "transform",
            }}
          />

          {/* Glass icon capsule */}
          {Icon && (
            <span
              className="grid size-9 shrink-0 place-items-center self-start rounded-full border border-white/10 bg-white/[0.03] text-accent backdrop-blur-md transition-transform duration-200 sm:size-10 motion-safe:sm:hover:scale-105"
              style={{
                boxShadow:
                  "0 0 24px -8px oklch(0.74 0.19 49 / 0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <Icon className="size-4 sm:size-[18px]" strokeWidth={2} />
            </span>
          )}

          {/* Text block — fades + slides up on reveal */}
          <div
            className="min-w-0"
            style={{
              opacity: shown ? 1 : 0,
              transform: shown ? "translate3d(0,0,0)" : "translate3d(0,16px,0)",
              transition:
                "opacity 450ms cubic-bezier(0.22, 1, 0.36, 1) 60ms, transform 450ms cubic-bezier(0.22, 1, 0.36, 1) 60ms",
              willChange: shown ? undefined : "opacity, transform",
            }}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-[22px] font-display font-semibold leading-none tracking-tight sm:text-[30px]">
                {title}
              </h2>
              {live && (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em] text-accent">
                  <span className="relative grid size-1.5 place-items-center">
                    <span className="absolute inline-flex size-full rounded-full bg-accent opacity-70 motion-safe:animate-ping" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
                  </span>
                  {liveLabel}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="mt-1.5 truncate text-[11.5px] leading-snug text-muted-foreground sm:text-[12.5px]">
                {subtitle}
              </p>
            )}

            {/* Underline — draws once after reveal */}
            <span
              aria-hidden
              className="mt-2 block h-[2px] rounded-full"
              style={{
                width: shown ? 44 : 0,
                background:
                  "linear-gradient(90deg, oklch(0.74 0.19 49) 0%, oklch(0.74 0.19 49 / 0) 100%)",
                transition: "width 500ms cubic-bezier(0.22, 1, 0.36, 1) 280ms",
              }}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {right}
          {href && (
            <Link
              to={href}
              className="group inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-accent/40 bg-white/[0.03] px-3.5 py-2 text-[10.5px] font-mono font-semibold uppercase tracking-[0.18em] text-accent backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-200 hover:border-accent/60 hover:bg-accent/10 hover:shadow-[0_10px_30px_-14px_oklch(0.74_0.19_49/0.6)] sm:px-4 sm:text-[11px]"
            >
              {hrefLabel}
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Premium gradient divider — transparent → orange → transparent.
 * Static (no animation). Use between homepage sections.
 */
export function PremiumSectionDivider() {
  return (
    <div aria-hidden className="mx-auto my-6 h-px max-w-7xl sm:my-8">
      <div
        className="mx-6 h-px sm:mx-12"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, oklch(0.74 0.19 49 / 0.28) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}
