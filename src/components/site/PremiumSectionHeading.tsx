import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * FoundOurMarket™ — Editorial Section Heading (Apple × B&O × Aesop × Nothing).
 *
 * Cinematic, minimal, luxurious. Every heading feels like the opening of
 * a new chapter — not an ecommerce section.
 *
 * Composition
 *   [huge ghost word, 900, uppercase, 2–4% opacity, slight blur, cropped by edges]
 *   [tiny label — 11px, 0.35em tracking, muted]
 *   Title (28–32px, 800, pure white, tight lh)
 *   Subtitle (13px, soft gray, max ~240px)
 *   ── signature capsule (40–60px, 2px, orange, soft glow, breathes) ──
 *   [right slot — tiny glass text badge]
 *
 * Motion
 *   Reveal once on enter (550ms, cubic-bezier(.22,1,.36,1)), transform-only.
 *   Ghost word parallax (8–12px, slower than content).
 *   Capsule breathes every 4s. No pulsing titles. No infinite loops on text.
 *
 * Background
 *   Very soft radial orange glow (~2%) + faint noise + barely-visible grid.
 *
 * Alignment: `align="center" | "left"` — alternating rhythm across the page.
 */

const REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function PremiumSectionHeading({
  title,
  subtitle,
  right,
  ghost,
  align = "center",
  eyebrow,
  badge,
  // Legacy props — accepted for API back-compat, intentionally unused.
  icon: _icon,
  live: _live,
  liveLabel: _liveLabel,
  href: _href,
  hrefLabel: _hrefLabel,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** Faded background word behind the title. Defaults to first word of title uppercased. */
  ghost?: string;
  align?: "center" | "left";
  /** Tiny uppercase editorial label placed above the title. */
  eyebrow?: string;
  /** Tiny right-side text badge (e.g. "Live", "Daily", "Handpicked"). */
  badge?: string;
  icon?: LucideIcon;
  live?: boolean;
  liveLabel?: string;
  href?: string;
  hrefLabel?: string;
}) {
  void _icon;
  void _live;
  void _liveLabel;
  void _href;
  void _hrefLabel;

  const ref = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Reveal-on-enter (once)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setReduced(prefersReduced);
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

  // Ghost word parallax — slower than content, ~10px range, rAF-driven.
  useEffect(() => {
    if (reduced) return;
    if (typeof window === "undefined") return;
    const ghostEl = ghostRef.current;
    const el = ref.current;
    if (!ghostEl || !el) return;

    let raf = 0;
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 (below viewport) → 0 (centered) → 1 (above viewport)
      const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - vh / 2) / vh));
      const offset = -progress * 10; // ~10px parallax range
      ghostEl.style.setProperty("--pxy", `${offset.toFixed(2)}px`);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const ghostWord = (ghost ?? title.split(/\s+/)[0] ?? title).toUpperCase();
  const isCenter = align === "center";

  const titleStyle: React.CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translate3d(0,0,0)" : "translate3d(0,14px,0)",
    transition: `opacity 550ms ${REVEAL_EASE} 60ms, transform 550ms ${REVEAL_EASE} 60ms`,
    willChange: shown ? undefined : "opacity, transform",
    fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, sans-serif',
    fontWeight: 800,
    fontSize: "clamp(26px, 5.2vw, 32px)",
    lineHeight: 1.1,
    letterSpacing: "-0.018em",
  };
  const eyebrowStyle: React.CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translate3d(0,0,0)" : "translate3d(0,6px,0)",
    transition: `opacity 500ms ${REVEAL_EASE}, transform 500ms ${REVEAL_EASE}`,
    willChange: shown ? undefined : "opacity, transform",
  };
  const subStyle: React.CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translate3d(0,0,0)" : "translate3d(0,8px,0)",
    transition: `opacity 550ms ${REVEAL_EASE} 140ms, transform 550ms ${REVEAL_EASE} 140ms`,
    willChange: shown ? undefined : "opacity, transform",
  };
  const capsuleStyle: React.CSSProperties = {
    transform: shown ? "scaleX(1)" : "scaleX(0)",
    opacity: shown ? 1 : 0,
    transformOrigin: "center",
    transition: `transform 550ms ${REVEAL_EASE} 220ms, opacity 400ms ${REVEAL_EASE} 220ms`,
    willChange: shown ? undefined : "opacity, transform",
  };
  const badgeStyle: React.CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translate3d(0,0,0)" : "translate3d(0,6px,0)",
    transition: `opacity 500ms ${REVEAL_EASE} 300ms, transform 500ms ${REVEAL_EASE} 300ms`,
    willChange: shown ? undefined : "opacity, transform",
  };
  const ghostStyle: React.CSSProperties = {
    opacity: shown ? 0.035 : 0,
    transform: shown
      ? `translate3d(${isCenter ? "-50%" : "0"}, calc(-50% + var(--pxy, 0px)), 0)`
      : `translate3d(${isCenter ? "-50%" : "0"}, calc(-46% + var(--pxy, 0px)), 0)`,
    transition: `opacity 800ms ${REVEAL_EASE}, transform 800ms ${REVEAL_EASE}`,
    willChange: "opacity, transform",
    fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, sans-serif',
    fontWeight: 900,
    fontSize: "clamp(88px, 22vw, 168px)",
    letterSpacing: "-0.06em",
    lineHeight: 0.9,
    filter: "blur(1.5px)",
    color: "white",
  };

  const alignClasses = isCenter ? "text-center items-center" : "text-left items-start";
  const subtitleAlign = isCenter ? "mx-auto" : "mx-0";
  const rowAlign = isCenter ? "justify-center" : "justify-start";
  const glowPos = isCenter
    ? { left: "50%", transform: "translateX(-50%)" }
    : { left: "-6%" };

  return (
    <div
      ref={ref}
      className={`relative isolate flex flex-col ${alignClasses}`}
      style={{
        // Generous breathing space (56–72px above, ample below).
        paddingTop: "clamp(56px, 8vw, 72px)",
        paddingBottom: "clamp(28px, 4vw, 40px)",
      }}
    >
      {/* Radial ambient orange glow (~2%) */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 -z-10 h-[240px] w-[520px] -translate-y-1/2 rounded-full"
        style={{
          ...glowPos,
          background:
            "radial-gradient(ellipse at center, oklch(0.74 0.19 49 / 0.045) 0%, oklch(0.74 0.19 49 / 0.02) 45%, transparent 72%)",
          filter: "blur(8px)",
        }}
      />

      {/* Barely-visible grid */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[220px] -translate-y-1/2 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 0%, black 40%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, black 40%, transparent 75%)",
        }}
      />

      {/* Soft noise texture */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Huge ghost editorial word — part of the background */}
      <span
        ref={ghostRef}
        aria-hidden
        className="pointer-events-none absolute top-1/2 -z-10 select-none whitespace-nowrap uppercase"
        style={{
          ...ghostStyle,
          ...(isCenter ? { left: "50%" } : { left: "-0.04em" }),
        }}
      >
        {ghostWord}
      </span>

      {/* Tiny editorial label */}
      {eyebrow && (
        <p
          className="relative text-[11px] font-semibold uppercase text-white/45"
          style={{ ...eyebrowStyle, letterSpacing: "0.35em" }}
        >
          {eyebrow}
        </p>
      )}

      {/* Title */}
      <h2
        className={`relative text-white ${eyebrow ? "mt-3" : ""}`}
        style={titleStyle}
      >
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p
          className={`relative mt-3 max-w-[240px] text-[13px] font-normal leading-snug text-white/55 ${subtitleAlign}`}
          style={subStyle}
        >
          {subtitle}
        </p>
      )}

      {/* Signature glowing capsule (breathes every 4s) */}
      <div className={`relative mt-5 flex ${rowAlign}`}>
        <span
          aria-hidden
          className="block h-[2px] w-[52px] rounded-full motion-safe:animate-[fom-capsule-breathe_4s_ease-in-out_infinite]"
          style={{
            ...capsuleStyle,
            background:
              "linear-gradient(90deg, oklch(0.78 0.19 55 / 0.85) 0%, oklch(0.74 0.19 49) 50%, oklch(0.78 0.19 55 / 0.85) 100%)",
            boxShadow:
              "0 0 8px oklch(0.74 0.19 49 / 0.55), 0 0 18px oklch(0.74 0.19 49 / 0.28)",
          }}
        />
      </div>

      {/* Right-side text badge (glass capsule) */}
      {badge && (
        <div className={`relative mt-4 flex ${rowAlign}`} style={badgeStyle}>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium uppercase text-white/60 backdrop-blur"
            style={{ letterSpacing: "0.14em" }}
          >
            <span
              aria-hidden
              className="block size-1 rounded-full bg-accent"
              style={{ boxShadow: "0 0 6px oklch(0.74 0.19 49 / 0.9)" }}
            />
            {badge}
          </span>
        </div>
      )}

      {/* Optional right slot (admin controls, countdowns, etc.) */}
      {right && (
        <div className={`relative mt-4 flex ${rowAlign}`}>
          <div className="flex items-center gap-2">{right}</div>
        </div>
      )}

      {/* Local keyframes */}
      <style>{`
        @keyframes fom-capsule-breathe {
          0%, 100% {
            filter: brightness(1);
            box-shadow: 0 0 8px oklch(0.74 0.19 49 / 0.5), 0 0 18px oklch(0.74 0.19 49 / 0.25);
          }
          50% {
            filter: brightness(1.15);
            box-shadow: 0 0 12px oklch(0.74 0.19 49 / 0.7), 0 0 26px oklch(0.74 0.19 49 / 0.38);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Premium gradient divider — transparent → orange → transparent.
 * Static. Use between homepage sections to establish rhythm.
 */
export function PremiumSectionDivider() {
  return (
    <div aria-hidden className="mx-auto my-10 h-px max-w-7xl sm:my-14">
      <div
        className="mx-6 h-px sm:mx-12"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, oklch(0.74 0.19 49 / 0.18) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}
