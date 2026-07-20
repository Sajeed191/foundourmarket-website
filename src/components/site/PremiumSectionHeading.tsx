import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * FoundOurMarket™ — Editorial Section Heading v8 (Luxury Magazine Opener).
 *
 * Composition (all centered, calm, editorial)
 *   [ghost word — 110-160px, 900, uppercase, 2-3% opacity, offset + cropped]
 *   Title       (26-28px, 900, pure white, -0.02em)
 *      ↓ 12px
 *   Subtitle    (12px, neutral gray)
 *      ↓ 18px
 *   Divider     (80×2px metallic orange, edges fade)
 *      ↓ 26px  (content gap owned by wrapper padding-bottom)
 *
 * Motion (once on enter, 700ms cubic-bezier(.22,1,.36,1))
 *   Ghost:    opacity 0→3%, translateY(-16px)
 *   Title:    opacity + translateY(18px→0)
 *   Subtitle: 80ms delay
 *   Divider:  160ms delay, width 0→80px
 *
 * Section rhythm: 80px top / 36px bottom.
 * Background: one radial orange spotlight (~3%, 120px blur) — never a blob.
 *
 * Back-compat: legacy props are accepted and intentionally unused; v8 is a
 * single centered, minimal composition per spec.
 */

const REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function PremiumSectionHeading({
  title,
  subtitle,
  ghost,
  // Back-compat — accepted but unused in v8.
  right: _right,
  align: _align,
  eyebrow: _eyebrow,
  badge: _badge,
  icon: _icon,
  live: _live,
  liveLabel: _liveLabel,
  href: _href,
  hrefLabel: _hrefLabel,
}: {
  title: string;
  subtitle?: string;
  ghost?: string;
  right?: ReactNode;
  align?: "center" | "left";
  eyebrow?: string;
  badge?: string;
  icon?: LucideIcon;
  live?: boolean;
  liveLabel?: string;
  href?: string;
  hrefLabel?: string;
}) {
  void _right;
  void _align;
  void _eyebrow;
  void _badge;
  void _icon;
  void _live;
  void _liveLabel;
  void _href;
  void _hrefLabel;

  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (prefersReduced) {
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
      { rootMargin: "0px 0px -8% 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const ghostWord = (ghost ?? title.split(/\s+/)[0] ?? title).toUpperCase();

  // Ghost is offset slightly off-center for an editorial, cropped feel.
  // Base translation: X -54% (nudged left of center), Y -50%. Reveal shifts Y by -16px.
  const ghostStyle: React.CSSProperties = {
    opacity: shown ? 0.03 : 0,
    transform: shown
      ? "translate3d(-54%, calc(-50% - 16px), 0)"
      : "translate3d(-54%, -50%, 0)",
    transition: `opacity 700ms ${REVEAL_EASE}, transform 700ms ${REVEAL_EASE}`,
    willChange: "opacity, transform",
    fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, sans-serif',
    fontWeight: 900,
    fontSize: "clamp(110px, 34vw, 160px)",
    letterSpacing: "-0.06em",
    lineHeight: 0.9,
    color: "white",
    top: "50%",
    left: "50%",
  };

  const titleStyle: React.CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translate3d(0,0,0)" : "translate3d(0,18px,0)",
    transition: `opacity 700ms ${REVEAL_EASE}, transform 700ms ${REVEAL_EASE}`,
    willChange: shown ? undefined : "opacity, transform",
    fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, sans-serif',
    fontWeight: 900,
    fontSize: "clamp(26px, 6.6vw, 28px)",
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
    color: "#ffffff",
  };

  const subStyle: React.CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translate3d(0,0,0)" : "translate3d(0,10px,0)",
    transition: `opacity 700ms ${REVEAL_EASE} 80ms, transform 700ms ${REVEAL_EASE} 80ms`,
    willChange: shown ? undefined : "opacity, transform",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.55)",
    marginTop: "12px",
  };

  const dividerStyle: React.CSSProperties = {
    width: shown ? "80px" : "0px",
    height: "2px",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(255,140,40,0.85) 50%, transparent 100%)",
    transition: `width 700ms ${REVEAL_EASE} 160ms, opacity 700ms ${REVEAL_EASE} 160ms`,
    willChange: shown ? undefined : "width, opacity",
    opacity: shown ? 1 : 0,
    marginTop: "18px",
    borderRadius: "1px",
  };

  return (
    <div
      ref={ref}
      className="relative isolate flex flex-col items-center overflow-hidden text-center"
      style={{
        marginTop: "80px",
        marginBottom: "36px",
        // 26px gap between the divider and following content.
        paddingBottom: "26px",
      }}
    >
      {/* Single soft radial spotlight — ~3%, 120px blur, never a blob */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[320px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,140,40,0.03) 0%, rgba(255,140,40,0.015) 50%, transparent 75%)",
          filter: "blur(120px)",
        }}
      />

      {/* Enormous ghost word (offset, cropped by overflow-hidden) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -z-10 select-none whitespace-nowrap uppercase"
        style={ghostStyle}
      >
        {ghostWord}
      </span>

      {/* Title */}
      <h2 className="relative" style={titleStyle}>
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p className="relative" style={subStyle}>
          {subtitle}
        </p>
      )}

      {/* Metallic divider */}
      <span aria-hidden className="relative block" style={dividerStyle} />
    </div>
  );
}

/**
 * Premium gradient divider between sections (unchanged spacer).
 */
export function PremiumSectionDivider() {
  return (
    <div aria-hidden className="mx-auto my-10 h-px max-w-7xl sm:my-14">
      <div
        className="mx-6 h-px sm:mx-12"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,140,40,0.18) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}
