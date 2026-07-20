import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * FoundOurMarket™ — Luxury editorial section heading.
 *
 * Structure (top to bottom):
 *   [eyebrow label]           ·  [right slot]
 *   [accent bar] [Title]      ·  [View all →]
 *   [subtitle]
 *   [gradient divider]
 *
 * Typography-first. No icons, no pills, no heavy borders, no glow containers.
 * Fades + slides up once on scroll. GPU transforms only.
 */
export function PremiumSectionHeading({
  eyebrow,
  title,
  subtitle,
  href,
  hrefLabel = "View all",
  right,
  // Legacy props — accepted for API back-compat, intentionally unused.
  icon: _icon,
  live: _live,
  liveLabel: _liveLabel,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  right?: ReactNode;
  icon?: LucideIcon;
  live?: boolean;
  liveLabel?: string;
}) {
  void _icon;
  void _live;
  void _liveLabel;

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
      { rootMargin: "0px 0px -6% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const revealStyle: React.CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translate3d(0,0,0)" : "translate3d(0,14px,0)",
    transition:
      "opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
    willChange: shown ? undefined : "opacity, transform",
  };

  return (
    <div ref={ref} className="relative mt-10 mb-5 sm:mt-12 sm:mb-6" style={revealStyle}>
      {/* Top row — eyebrow label + optional right controls */}
      <div className="flex items-center justify-between gap-3">
        {eyebrow ? (
          <span className="text-[10px] font-medium uppercase leading-none text-white/45 sm:text-[11px]" style={{ letterSpacing: "0.32em" }}>
            {eyebrow}
          </span>
        ) : <span />}
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>

      {/* Title row */}
      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="h-[26px] w-[2px] shrink-0 rounded-full"
            style={{
              background: "linear-gradient(180deg, #FFB347 0%, #FF6A00 100%)",
              boxShadow: "0 0 10px -1px oklch(0.74 0.19 49 / 0.55)",
            }}
          />
          <h2 className="min-w-0 truncate text-[26px] font-display font-bold leading-[1.05] tracking-tight text-white sm:text-[34px] lg:text-[38px]">
            {title}
          </h2>
        </div>

        {href && (
          <Link
            to={href}
            className="group hidden shrink-0 items-center gap-1.5 text-[12px] font-medium text-white/60 transition-colors hover:text-accent sm:inline-flex"
          >
            <span className="relative">
              {hrefLabel}
              <span
                aria-hidden
                className="absolute left-0 -bottom-0.5 h-px w-full origin-right scale-x-0 bg-accent transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100"
              />
            </span>
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-2 pl-5 text-[12.5px] leading-snug text-white/55 sm:text-[13.5px]">
          {subtitle}
        </p>
      )}

      {/* Mobile "View all" — text-only, below subtitle */}
      {href && (
        <Link
          to={href}
          className="mt-3 ml-5 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-white/60 hover:text-accent sm:hidden"
        >
          {hrefLabel} <ArrowRight className="size-3" />
        </Link>
      )}

      {/* Luxury divider */}
      <div
        aria-hidden
        className="mt-5 h-px w-full sm:mt-6"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, oklch(0.74 0.19 49 / 0.22) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}

/**
 * Premium gradient divider — transparent → orange → transparent.
 * Static (no animation). Use between homepage sections.
 */
export function PremiumSectionDivider() {
  return (
    <div aria-hidden className="mx-auto my-8 h-px max-w-7xl sm:my-10">
      <div
        className="mx-6 h-px sm:mx-12"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, oklch(0.74 0.19 49 / 0.22) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}
