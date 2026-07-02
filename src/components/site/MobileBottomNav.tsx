import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { useAdminMode } from "@/lib/admin-mode";
import { useIsAdmin } from "@/lib/use-admin";
import { useTheme } from "@/lib/theme";
import { useSupportUnread } from "@/lib/use-support-unread";
import { scrollDampeningMs, getMotionTier } from "@/lib/motion-tier";

/**
 * Three-phase scroll-adaptive bottom navigation.
 *
 *   PHASE 1 "expanded" — full dock: icons + labels, resting height.
 *   PHASE 2 "compact"  — dock mode: labels fade out, icons scale up + dock lift,
 *                        active tab shows a breathing radial energy field.
 *   PHASE 3 "hidden"   — focus mode: whole dock translates down + fades. No layout
 *                        shift (transform/opacity only). Returns on upward intent.
 *
 * Return order (spec): dock reappears in the compact icon-only state FIRST, then
 * — once scrolling settles near the top — labels stagger back in.
 *
 * Intent detection: per-frame velocity chooses aggressiveness. A fast downward
 * flick jumps straight to hidden; slow scrolling only compacts. Sub-6px micro
 * deltas are ignored (jitter filter). A settle lock freezes state briefly after
 * scrolling stops to kill Android Chrome oscillation.
 */
type Phase = "expanded" | "compact" | "hidden";

export function MobileBottomNav() {
  const { count } = useCart();
  const { user } = useAuth();
  const { slugs } = useWishlist();
  const { adminMode } = useAdminMode();
  const { isAdmin } = useIsAdmin();
  const { effectiveTheme } = useTheme();
  const { count: supportUnread } = useSupportUnread();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [phase, setPhase] = useState<Phase>("expanded");
  const phaseRef = useRef<Phase>("expanded");
  const lastY = useRef(0);
  const lastT = useRef(0);

  useEffect(() => {
    const JITTER = 6; // ignore micro scroll < 6px (spec)
    const FAST = 1.4; // px/ms → aggressive flick threshold
    const DEEP = 320; // px depth required before focus-mode hide is allowed
    let rafId = 0;
    let ticking = false;
    let locked = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let lockTimer: ReturnType<typeof setTimeout> | undefined;

    const commit = (next: Phase) => {
      if (next === phaseRef.current) return;
      phaseRef.current = next;
      setPhase(next);
    };

    const evaluate = () => {
      ticking = false;
      if (locked) return;
      const y = window.scrollY;
      const now = performance.now();
      const delta = y - lastY.current;
      if (Math.abs(delta) < JITTER) return; // jitter filter
      const dt = Math.max(now - lastT.current, 1);
      const velocity = Math.abs(delta) / dt; // px per ms

      if (y < 40) {
        commit("expanded");
      } else if (delta > 0) {
        // scrolling DOWN — collapse in layers, deeper/faster = more hidden
        if (y > DEEP && (velocity > FAST || phaseRef.current === "compact")) {
          commit("hidden");
        } else {
          commit("compact");
        }
      } else {
        // scrolling UP — reveal dock first as icon-only (compact), never jump
        // straight to expanded mid-gesture; expansion happens on settle.
        commit(y < 80 ? "expanded" : "compact");
      }
      lastY.current = y;
      lastT.current = now;
    };

    const onScroll = () => {
      // Scroll-stop settle: relax into the resting phase for the current depth,
      // then lock briefly so residual inertia can't flap the state.
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        locked = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          // On settle: near top → fully expand; otherwise relax hidden → compact
          // so the dock is always reachable when the user pauses.
          if (y < 40) commit("expanded");
          else if (phaseRef.current === "hidden") commit("compact");
        });
        if (lockTimer) clearTimeout(lockTimer);
        lockTimer = setTimeout(() => {
          locked = false;
          lastY.current = window.scrollY;
          lastT.current = performance.now();
        }, scrollDampeningMs() + 120);
      }, 110);

      if (ticking || locked) return;
      ticking = true;
      rafId = requestAnimationFrame(evaluate);
    };

    lastT.current = performance.now();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
      if (idleTimer) clearTimeout(idleTimer);
      if (lockTimer) clearTimeout(lockTimer);
    };
  }, []);

  // Hand the bottom dock over to the admin bar when a staff member is actively
  // managing the store, so the two navigations never stack.
  if (adminMode && isAdmin) return null;

  const isLight = effectiveTheme === "light";
  const isGrey = effectiveTheme === "grey";
  const frosted = isLight || isGrey;

  const compact = phase !== "expanded";
  const hidden = phase === "hidden";
  // Low tier: skip the staggered label reveal (one animation layer rule).
  const stagger = getMotionTier() !== "low";

  const items: { to: string; label: string; icon: typeof Home; match: (p: string) => boolean; badge?: number }[] = [
    { to: "/", label: "Home", icon: Home, match: (p) => p === "/" },
    { to: "/search", label: "Search", icon: Search, match: (p) => p === "/search" || p.startsWith("/category") },
    { to: "/wishlist", label: "Saved", icon: Heart, match: (p) => p === "/wishlist", badge: slugs.size },
    { to: "/cart", label: "Cart", icon: ShoppingBag, match: (p) => p === "/cart", badge: count },
    { to: user ? "/account" : "/auth", label: "Account", icon: User, match: (p) => p === "/account" || p === "/auth", badge: user ? supportUnread : 0 },
  ];

  return (
    <nav
      data-app-bottom-nav
      data-phase={phase}
      aria-label="Primary mobile navigation"
      className="md:hidden fixed inset-x-0 bottom-0 z-[var(--z-bottom-nav)] px-[max(0.875rem,var(--mobile-safe-left))] pb-[calc(var(--mobile-safe-bottom)+var(--mobile-nav-edge-gap))] pt-[var(--mobile-nav-top-gap)] pointer-events-none"
    >
      <ul
        data-compact={compact ? "" : undefined}
        style={{ willChange: "transform, opacity" }}
        className={
          (frosted
            ? "bottom-nav-light pointer-events-auto relative mx-auto grid max-w-md grid-cols-5 rounded-[30px] px-2"
            : "nav-glass pointer-events-auto relative mx-auto grid max-w-md grid-cols-5 rounded-[30px] px-2") +
          // Transform + opacity ONLY across all three phases (no height/padding
          // animation — those reflow and cause settle vibration on Chrome Android).
          // Phase 2 lifts the dock; Phase 3 slides it fully off-screen and fades.
          ` h-[var(--mobile-nav-surface-height)] py-2 transform-gpu transition-[transform,opacity] duration-[200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-[0_16px_42px_-18px_oklch(0_0_0/0.7)] ${
            hidden
              ? "translate-y-[140%] opacity-0 pointer-events-none"
              : compact
                ? "-translate-y-1.5 opacity-100 shadow-[0_22px_54px_-16px_oklch(0_0_0/0.78)]"
                : "translate-y-0 opacity-100"
          }`
        }
        aria-hidden={hidden}
      >

        {items.map(({ to, label, icon: Icon, match, badge }, i) => {
          const active = match(pathname);
          return (
            <li key={label} className="min-w-0">
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                tabIndex={hidden ? -1 : undefined}
                className="group flex h-full min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium"
              >
                <span
                  className={`relative grid place-items-center size-9 rounded-2xl transition-transform duration-[160ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-90 ${
                    compact ? "scale-[1.08]" : "scale-100"
                  }`}
                >
                  {/* Soft radial energy field behind the active icon — a breathing
                      bloom (not a ring/border). Freezes during scroll via CSS. */}
                  <span
                    aria-hidden
                    className={`absolute inset-0 rounded-full blur-[7px] transition-opacity duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] [background:radial-gradient(circle,color-mix(in_oklab,var(--color-accent)_55%,transparent)_0%,transparent_70%)] ${
                      active ? "opacity-100 animate-energy-breathe" : "opacity-0"
                    }`}
                  />

                  <span className="relative">
                    <Icon
                      className={`size-[21px] transition-colors duration-200 ${
                        active ? "text-accent" : frosted ? "text-muted-foreground" : "text-foreground/65"
                      }`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {typeof badge === "number" && badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-accent-foreground ring-2 ring-background">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </span>
                </span>

                <span
                  aria-hidden={compact}
                  style={
                    !compact && stagger
                      ? { transitionDelay: `${60 + i * 45}ms` }
                      : undefined
                  }
                  className={`h-3 max-w-full truncate leading-none transition-[opacity,transform] duration-[200ms] ease-out ${
                    compact ? "pointer-events-none translate-y-0.5 scale-90 opacity-0" : "translate-y-0 scale-100 opacity-100"
                  } ${
                    active ? "font-semibold text-accent" : frosted ? "text-muted-foreground" : "text-foreground/60"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
