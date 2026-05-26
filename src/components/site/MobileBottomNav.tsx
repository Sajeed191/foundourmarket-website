import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";

export function MobileBottomNav() {
  const { count } = useCart();
  const { user } = useAuth();
  const { slugs } = useWishlist();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items: { to: string; label: string; icon: typeof Home; match: (p: string) => boolean; badge?: number }[] = [
    { to: "/", label: "Home", icon: Home, match: (p) => p === "/" },
    { to: "/search", label: "Search", icon: Search, match: (p) => p === "/search" || p.startsWith("/category") },
    { to: "/wishlist", label: "Saved", icon: Heart, match: (p) => p === "/wishlist", badge: slugs.size },
    { to: "/cart", label: "Cart", icon: ShoppingBag, match: (p) => p === "/cart", badge: count },
    { to: user ? "/account" : "/auth", label: user ? "Me" : "Sign in", icon: User, match: (p) => p === "/account" || p === "/auth" },
  ];

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
    >
      {/* Ambient ember glow behind the bar */}
      <div
        aria-hidden
        className="absolute inset-x-10 bottom-2 h-16 -z-10 blur-2xl opacity-60"
        style={{ background: "var(--gradient-ember-soft)" }}
      />
      <ul className="pointer-events-auto relative grid grid-cols-5 glass-strong rounded-2xl px-1.5 py-1.5 shadow-[var(--shadow-float)]">
        {items.map(({ to, label, icon: Icon, match, badge }) => {
          const active = match(pathname);
          return (
            <li key={label} className="relative">
              <Link
                to={to}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all ${
                  active
                    ? "text-accent-foreground bg-accent shadow-[var(--shadow-ember)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                  {typeof badge === "number" && badge > 0 && (
                    <span className={`absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold grid place-items-center ring-2 ring-background ${
                      active ? "bg-background text-accent" : "bg-accent text-accent-foreground"
                    }`}>
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span className="truncate max-w-full text-[9px]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
