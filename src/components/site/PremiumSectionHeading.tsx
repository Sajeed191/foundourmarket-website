import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * FoundOurMarket™ — Editorial Section Heading v10 (Luxury Marketplace).
 *
 * Minimal editorial composition — inspired by Apple, Aesop, B&O, Porsche Design, COS:
 *
 *   FEATURED COLLECTION                             View All →
 *   Main Categories
 *   Explore curated collections chosen for every lifestyle.
 *
 * No collection numbers, no ghost words, no orange bars, no glow, no capsules.
 * Just typography and whitespace.
 *
 * Motion (once on enter): opacity 0→1 + translateY(8px→0), 500ms ease-out.
 * Respects prefers-reduced-motion.
 *
 * Back-compat: all legacy props (ghost/align/badge/icon/live/liveLabel/number)
 * are accepted but ignored so existing call-sites continue to compile.
 */

const REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function PremiumSectionHeading({
  title,
  subtitle,
  eyebrow,
  href,
  hrefLabel = "View All",
  right,
  // Back-compat — accepted but unused.
  ghost: _ghost,
  align: _align,
  badge: _badge,
  icon: _icon,
  live: _live,
  liveLabel: _liveLabel,
  number: _number,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  href?: string;
  hrefLabel?: string;
  right?: ReactNode;
  ghost?: string;
  align?: "center" | "left";
  badge?: string;
  icon?: LucideIcon;
  live?: boolean;
  liveLabel?: string;
  number?: number;
}) {
  void _ghost;
  void _align;
  void _badge;
  void _icon;
  void _live;
  void _liveLabel;
  void _number;

  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce) {
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

  const revealBase: React.CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translate3d(0,0,0)" : "translate3d(0,8px,0)",
    transition: `opacity 500ms ${REVEAL_EASE}, transform 500ms ${REVEAL_EASE}`,
    willChange: shown ? undefined : "opacity, transform",
  };

  const eyebrowStyle: React.CSSProperties = {
    ...revealBase,
    transitionDelay: "0ms",
    fontSize: "10.5px",
    fontWeight: 600,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.48)",
  };

  const titleStyle: React.CSSProperties = {
    ...revealBase,
    transitionDelay: "80ms",
    fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, sans-serif',
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
    color: "#ffffff",
    fontSize: "clamp(24px, 5.6vw, 34px)",
  };

  const subtitleStyle: React.CSSProperties = {
    ...revealBase,
    transitionDelay: "160ms",
    marginTop: "10px",
    fontSize: "13.5px",
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.55)",
    maxWidth: "48ch",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  const actionStyle: React.CSSProperties = {
    ...revealBase,
    transitionDelay: "160ms",
  };

  return (
    <div
      ref={ref}
      className="relative mb-8 mt-12 sm:mb-10 sm:mt-20"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div style={eyebrowStyle} className="mb-3">
              {eyebrow}
            </div>
          )}
          <h2 style={titleStyle} className="break-words">
            {title}
          </h2>
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2" style={actionStyle}>
          {right}
          {href && (
            <Link
              to={href}
              className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium tracking-wide text-white/70 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:text-[13px]"
            >
              <span className="hidden sm:inline">{hrefLabel}</span>
              <span className="sm:hidden">View All</span>
              <ArrowRight
                className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Kept as a neutral spacer between sections. */
export function PremiumSectionDivider() {
  return <div aria-hidden className="h-6 sm:h-10" />;
}
