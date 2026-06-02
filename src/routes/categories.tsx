import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useAllCategories, type Category } from "@/lib/use-categories";
import { useProducts } from "@/lib/use-products";
import { iconForCategory } from "@/components/site/CategoryCard";

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

/* Placeholder/test category names that should never be shown to customers
   unless they actually contain real products. */
const PLACEHOLDER_NAMES = ["main", "default", "uncategorized", "test"];

function isPlaceholder(cat: Category) {
  const name = cat.name.trim().toLowerCase();
  const slug = cat.slug.trim().toLowerCase();
  return PLACEHOLDER_NAMES.includes(name) || PLACEHOLDER_NAMES.includes(slug);
}

/* Larger, readable subcategory card used inside the horizontal scroll row. */
function SubCard({
  sub,
  mainSlug,
  count,
}: {
  sub: Category;
  mainSlug: string;
  count: number;
}) {
  const Icon = iconForCategory(sub.slug, sub.name);
  const img = sub.mobile_image || sub.image || "";
  return (
    <Link
      to="/category/$main/$sub"
      params={{ main: mainSlug, sub: sub.slug }}
      className="group flex w-[140px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-accent/40 sm:w-[170px]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white/[0.04]">
        {img ? (
          <img
            src={img}
            alt={sub.name}
            loading="lazy"
            className="size-full object-cover [transition:transform_700ms_cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <span className="grid size-14 place-items-center rounded-full bg-accent/12 text-accent ring-1 ring-accent/25">
              <Icon className="size-7" />
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-2.5 py-2.5">
        <h3 className="line-clamp-1 text-[13px] font-semibold leading-tight tracking-tight text-white transition-colors group-hover:text-accent sm:text-sm">
          {sub.name}
        </h3>
        <span className="mt-0.5 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
          {count > 0 ? `${count} Products` : "Coming Soon"}
        </span>
      </div>
    </Link>
  );
}

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

  // Compute total (own + subcategory) product counts for each main category.
  const totalFor = (cat: Category) => {
    const subs = subsByParent(cat.id);
    const subTotal = subs.reduce((n, s) => n + (counts[s.slug] ?? 0), 0);
    return (counts[cat.slug] ?? 0) + subTotal;
  };

  // Visible mains: drop placeholder/test categories that have no real products.
  const visibleMains = useMemo(
    () => mains.filter((cat) => !isPlaceholder(cat) || totalFor(cat) > 0),
    [mains, counts], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Popular categories — top 6 by total product count.
  const popular = useMemo(
    () =>
      [...visibleMains]
        .map((c) => ({ cat: c, total: totalFor(c) }))
        .filter((x) => x.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 6),
    [visibleMains], // eslint-disable-line react-hooks/exhaustive-deps
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

      {/* ── Popular categories ───────────────────────────────── */}
      {popular.length > 0 && (
        <div className="mb-10 sm:mb-16">
          <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.3em] text-accent">Popular Categories</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
            {popular.map(({ cat, total }) => {
              const Icon = iconForCategory(cat.slug, cat.name);
              const img = cat.mobile_image || cat.image || "";
              return (
                <Link
                  key={cat.slug}
                  to="/category/$slug"
                  params={{ slug: cat.slug }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-accent/40"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.04]">
                    {img ? (
                      <img
                        src={img}
                        alt={cat.name}
                        loading="lazy"
                        className="size-full object-cover [transition:transform_700ms_cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid size-full place-items-center">
                        <span className="grid size-12 place-items-center rounded-full bg-accent/12 text-accent ring-1 ring-accent/25">
                          <Icon className="size-6" />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <h3 className="line-clamp-1 text-[13px] font-semibold tracking-tight text-white transition-colors group-hover:text-accent">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] font-mono text-muted-foreground">📦 {total}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── All categories ───────────────────────────────────── */}
      <div className="space-y-12 sm:space-y-20">
        {visibleMains.map((cat) => {
          const subs = subsByParent(cat.id);
          const total = totalFor(cat);
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
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono uppercase tracking-widest text-white/85 sm:text-xs">
                        <span className="inline-flex items-center gap-1">
                          📦 {total > 0 ? `${total} Products` : "Coming Soon"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          📂 {subs.length} Subcategories
                        </span>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform group-hover:translate-x-0.5">
                      Browse {cat.name} <ArrowRight className="size-4" />
                    </span>
                  </div>
                </div>
                {/* Mobile browse row */}
                <div className="flex items-center justify-end gap-1.5 px-4 py-3 text-sm font-semibold text-accent sm:hidden">
                  Browse {cat.name} <ArrowRight className="size-4" />
                </div>
              </Link>

              {/* ── Subcategories — horizontal scroll row ────────── */}
              {subs.length > 0 && (
                <div className="pl-1 sm:pl-3 border-l-2 border-accent/20">
                  <div className="mb-3 ml-2 flex items-center justify-between sm:ml-3">
                    <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
                      Subcategories
                    </p>
                    {subs.length > 4 && (
                      <Link
                        to="/category/$slug"
                        params={{ slug: cat.slug }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                      >
                        View all <ArrowRight className="size-3.5" />
                      </Link>
                    )}
                  </div>
                  <div className="flex snap-x gap-2.5 overflow-x-auto pb-2 pl-2 sm:gap-4 sm:pl-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {subs.map((s) => (
                      <SubCard key={s.slug} sub={s} mainSlug={cat.slug} count={counts[s.slug] ?? 0} />
                    ))}
                    {/* View-all trailing card */}
                    <Link
                      to="/category/$slug"
                      params={{ slug: cat.slug }}
                      className="group flex w-[140px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/30 bg-white/[0.02] text-accent transition-colors hover:border-accent/60 sm:w-[170px]"
                    >
                      <span className="grid size-12 place-items-center rounded-full bg-accent/12 ring-1 ring-accent/25">
                        <ArrowRight className="size-6" />
                      </span>
                      <span className="text-[13px] font-semibold">View All</span>
                    </Link>
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
