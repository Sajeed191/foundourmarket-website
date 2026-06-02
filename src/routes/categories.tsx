import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight, Layers, Package } from "lucide-react";
import { useAllCategories } from "@/lib/use-categories";
import { useProducts } from "@/lib/use-products";
import { CategoryCard, iconForCategory } from "@/components/site/CategoryCard";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Categories — FoundOurMarket™" },
      { name: "description", content: "Browse every category on FoundOurMarket — home, kitchen, gaming, electronics, beauty, toys, pet & vehicle accessories, delivered worldwide." },
      { property: "og:title", content: "All Categories — FoundOurMarket™" },
      { property: "og:description", content: "Browse every category on FoundOurMarket — curated products delivered worldwide." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { mains, subsByParent } = useAllCategories();
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
    <section className="px-4 sm:px-6 py-8 sm:py-14 max-w-7xl mx-auto mobile-page-clearance">
      <div className="mb-8 sm:mb-12">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent mb-2">Browse</p>
        <h1 className="text-fluid-2xl font-display tracking-tight">Explore All Categories</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg">
          Everything FoundOurMarket has to offer — organised by main category and subcategory.
        </p>
      </div>

      <div className="space-y-12 sm:space-y-20">
        {mains.map((cat) => {
          const subs = subsByParent(cat.id);
          const subCount = subs.reduce((n, s) => n + (counts[s.slug] ?? 0), 0);
          const total = (counts[cat.slug] ?? 0) + subCount;
          const MainIcon = iconForCategory(cat.slug, cat.name);
          const img = cat.image || cat.mobile_image || "";

          return (
            <div
              key={cat.slug}
              className="space-y-5 sm:space-y-7"
              style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }}
            >
              {/* ── Main category header ─────────────────────────── */}
              <Link
                to="/category/$slug"
                params={{ slug: cat.slug }}
                className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors hover:border-accent/40"
              >
                <div className="relative aspect-[16/7] sm:aspect-[21/6] w-full overflow-hidden bg-white/[0.04]">
                  {img ? (
                    <img
                      src={img}
                      alt={cat.name}
                      loading="lazy"
                      className="size-full object-cover [transition:transform_700ms_cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid size-full place-items-center">
                      <span className="grid size-16 place-items-center rounded-full bg-accent/12 text-accent ring-1 ring-accent/25">
                        <MainIcon className="size-8" />
                      </span>
                    </div>
                  )}
                  {/* Readability gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                  {/* Header content */}
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-6">
                    <div>
                      <h2 className="text-fluid-xl font-display font-semibold tracking-tight text-white drop-shadow">
                        {cat.name}
                      </h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono uppercase tracking-widest text-white/80 sm:text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Package className="size-3.5" /> {total} Products
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers className="size-3.5" /> {subs.length} Subcategories
                        </span>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform group-hover:translate-x-0.5">
                      Browse <ArrowRight className="size-4" />
                    </span>
                  </div>
                </div>
                {/* Mobile browse row */}
                <div className="flex items-center justify-end gap-1.5 px-4 py-3 text-sm font-semibold text-accent sm:hidden">
                  Browse all <ArrowRight className="size-4" />
                </div>
              </Link>

              {/* ── Subcategories grid ───────────────────────────── */}
              {subs.length > 0 && (
                <div className="pl-1 sm:pl-3 border-l-2 border-accent/20">
                  <p className="mb-3 ml-2 sm:ml-3 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
                    Subcategories
                  </p>
                  <div className="grid grid-cols-3 gap-2.5 pl-2 sm:grid-cols-5 sm:gap-4 sm:pl-3">
                    {subs.map((s) => (
                      <CategoryCard
                        key={s.slug}
                        category={s}
                        count={counts[s.slug] ?? 0}
                        to="/category/$main/$sub"
                        params={{ main: cat.slug, sub: s.slug }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
