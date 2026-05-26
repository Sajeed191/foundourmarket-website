import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

type Ctx = {
  slugs: Set<string>;
  has: (slug: string) => boolean;
  toggle: (slug: string) => Promise<void>;
  loading: boolean;
};

const WishlistContext = createContext<Ctx | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [slugs, setSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setSlugs(new Set());
      return;
    }
    setLoading(true);
    supabase
      .from("wishlist")
      .select("product_slug")
      .then(({ data }) => {
        setSlugs(new Set((data ?? []).map((r) => r.product_slug)));
        setLoading(false);
      });
  }, [user]);

  const toggle = async (slug: string) => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    const next = new Set(slugs);
    if (next.has(slug)) {
      next.delete(slug);
      setSlugs(next);
      await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_slug", slug);
    } else {
      next.add(slug);
      setSlugs(next);
      await supabase.from("wishlist").insert({ user_id: user.id, product_slug: slug });
    }
  };

  return (
    <WishlistContext.Provider value={{ slugs, has: (s) => slugs.has(s), toggle, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be inside WishlistProvider");
  return ctx;
}
