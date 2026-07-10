import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type Ripple = { id: number; x: number; y: number };

/**
 * Reusable premium "View All" card designed to sit as the final card in any
 * horizontal product rail (Continue Shopping, Recently Viewed, Recommended,
 * Wishlist, …). It reuses the exact ProductCard size + shell tokens
 * (`product-card-shell` / `card-premium`) so its width, height, radius, border,
 * shadow and internal padding stay pixel-identical to neighbouring product
 * cards on every screen size.
 */
export function RailViewAllCard({
  to,
  remaining,
  label = "View All",
  subtitle = "Continue shopping",
}: {
  /** Destination route path, e.g. "/continue-shopping". */
  to: string;
  /** Number of items not currently visible in the rail. */
  remaining?: number;
  label?: string;
  subtitle?: string;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const seq = useRef(0);

  const spawnRipple = useCallback((e: React.PointerEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = seq.current++;
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    window.setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.(8); } catch { /* no-op */ }
    }
  }, []);

  const countLabel =
    remaining && remaining > 0
      ? `${remaining.toLocaleString()} more product${remaining > 1 ? "s" : ""}`
      : "See your complete history";

  return (
    <Link
      to={to}
      onPointerDown={spawnRipple}
      aria-label={`${label} — ${countLabel}`}
      className="group card-premium product-card-shell relative flex flex-col items-center justify-center gap-4 overflow-hidden p-6 text-center transition-[transform,box-shadow] duration-200 ease-out will-change-transform hover:shadow-[var(--shadow-ember)] active:scale-[0.97]"
    >
      {/* Subtle orange border glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-accent/20 transition-colors duration-200 group-hover:ring-accent/40"
      />

      {/* Soft radial highlight behind the icon */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-xl transition-opacity duration-200 group-hover:opacity-70"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 45%, transparent) 0%, transparent 70%)" }}
      />

      {/* Touch ripple feedback */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden
          className="pointer-events-none absolute size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 animate-[ripple_0.6s_ease-out]"
          style={{ left: r.x, top: r.y }}
        />
      ))}

      {/* Premium circular icon */}
      <span className="relative grid size-14 place-items-center rounded-full border border-accent/30 bg-accent/15 text-accent shadow-[var(--shadow-ember)] transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
        <ArrowRight className="size-6 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>

      <div className="relative">
        <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">{label}</h3>
        <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>
        <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-accent/90">{countLabel}</p>
      </div>
    </Link>
  );
}
