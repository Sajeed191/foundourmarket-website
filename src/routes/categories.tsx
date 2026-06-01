import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Star, Flame, ArrowRight } from "lucide-react";
import { useCategories } from "@/lib/use-categories";
import { useProducts } from "@/lib/use-products";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Categories — FoundOurMarket™" },
      { name: "description", content: "Browse every category on FoundOurMarket — electronics, home, fashion, beauty and more, delivered worldwide." },
      { property: "og:title", content: "All Categories — FoundOurMarket™" },
      { property: "og:description", content: "Browse every category on FoundOurMarket — curated products delivered worldwide." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { categories } = useCategories();
  const { products } = useProducts();

  const counts = useMemo(
    () =>
      products.reduce<Record<string, number>>((acc, p) => {
        acc[p.category] = (acc[p.category] ?? 0) + 1;
        return acc;
      }, {}),
    [products],
  );

  return (
    <section className="px-4 sm:px-6 py-10 sm:py-16 max-w-7xl mx-auto">
      <div className="mb-8 sm:mb-12">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent mb-3">Browse</p>
        <h1 className="text-fluid-2xl font-display tracking-tight">All Categories</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg">
          Explore everything FoundOurMarket has to offer — curated across every category.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat, i) => (
          <Link
            key={cat.slug}
            to="/category/$slug"
            params={{ slug: cat.slug }}
            onClick={() => {
              void supabase.rpc("track_category_event", { _id: cat.id, _event: "click" });
            }}
            className="group product-card-glass relative block aspect-square overflow-hidden hover:-translate-y-1.5"
          >
            {cat.image ? (
              <img
                src={cat.image}
                alt={cat.name}
                loading="lazy"
                className="absolute inset-0 size-full object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-6xl font-display font-bold text-white/[0.04] group-hover:text-accent/20 transition-colors">
                {String(i + 1).padStart(2, "0")}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--gradient-ember)" }} />
            <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1400ms] ease-out bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-12" />
            {(cat.featured || cat.trending) && (
              <div className="absolute right-2 top-2 z-10 flex gap-1">
                {cat.featured && (
                  <span className="grid size-6 place-items-center rounded-full bg-background/70 text-accent backdrop-blur-md"><Star className="size-3" /></span>
                )}
                {cat.trending && (
                  <span className="grid size-6 place-items-center rounded-full bg-background/70 text-orange-400 backdrop-blur-md"><Flame className="size-3" /></span>
                )}
              </div>
            )}
            <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end z-10">
              <p className="font-mono text-[10px] text-accent mb-1">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="text-base sm:text-lg font-medium">{cat.name}</h3>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest inline-flex items-center gap-1">
                {counts[cat.slug] ?? 0} items <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
