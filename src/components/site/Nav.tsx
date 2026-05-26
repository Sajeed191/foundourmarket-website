import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, User, Globe, Heart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useRegion } from "@/lib/region";
import { useAuth } from "@/lib/auth";

export function Nav() {
  const { count } = useCart();
  const { region, setRegion } = useRegion();
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-display tracking-tighter uppercase font-semibold">
          FoundOurMarket<span className="text-accent">™</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Shop</Link>
          <Link to="/category/$slug" params={{ slug: "electronics" }} className="hover:text-foreground transition-colors">Electronics</Link>
          <Link to="/category/$slug" params={{ slug: "fashion" }} className="hover:text-foreground transition-colors">Fashion</Link>
          <Link to="/category/$slug" params={{ slug: "home" }} className="hover:text-foreground transition-colors">Home</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/search" aria-label="Search" className="size-9 rounded-full grid place-items-center hover:bg-white/5 transition-colors">
            <Search className="size-4" />
          </Link>
          <button
            onClick={() => setRegion(region === "IN" ? "INTL" : "IN")}
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-full border border-border"
            aria-label="Switch region"
          >
            <Globe className="size-3" />
            {region === "IN" ? "IN · ₹" : "INTL · $"}
          </button>
          <Link to="/wishlist" aria-label="Wishlist" className="size-9 rounded-full grid place-items-center hover:bg-white/5 transition-colors">
            <Heart className="size-4" />
          </Link>
          <Link to={user ? "/account" : "/auth"} aria-label="Account" className="size-9 rounded-full grid place-items-center hover:bg-white/5 transition-colors">
            <User className="size-4" />
          </Link>
          <Link to="/cart" className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-accent/40 transition-colors">
            <ShoppingBag className="size-4" />
            <span className="text-xs font-mono">{count}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
