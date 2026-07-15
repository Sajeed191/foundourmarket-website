/**
 * PDP · Frequently Bought Together — Track A · Phase 3.2
 *
 * Presentation-only section for the Product Detail Experience. It reads
 * companion product ids from the caller (already resolved from the frozen
 * co-purchase source) and pipes them through the Relationship Presentation
 * Adapter → BrowseCard. No new scoring, no direct RelationshipIntelligence
 * imports, no multi-add-to-cart. Renders nothing when there are no companions.
 */
import { useMemo } from "react";
import { BrowseCard } from "@/components/site/BrowseCard";
import { buildRelationshipPresentation } from "@/lib/pdp";
import type { Product } from "@/lib/products";

type Props = {
  /** Ids or slugs of companion products, in display order. */
  companionIds: readonly string[];
  /** Full companion products (already hydrated by the PDP). */
  companions: readonly Product[];
};

export function PDPFrequentlyBoughtTogether({ companionIds, companions }: Props) {
  const bySlug = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of companions) m.set(p.slug, p);
    return m;
  }, [companions]);

  const sections = useMemo(
    () =>
      buildRelationshipPresentation({
        intelligence: null,
        resolveProduct: (id) => bySlug.get(id) ?? null,
        frequentlyBoughtTogetherIds: companionIds,
        perSectionLimit: 6,
      }),
    [bySlug, companionIds],
  );

  const fbt = sections.find((s) => s.section === "frequently_bought_together");
  if (!fbt || fbt.products.length === 0) return null;

  return (
    <section
      aria-labelledby="pdp-fbt-heading"
      className="mt-10 sm:mt-12"
      data-pdp-fbt
    >
      <div className="mb-4 sm:mb-5">
        <h2
          id="pdp-fbt-heading"
          className="text-lg sm:text-xl font-semibold tracking-tight"
        >
          {fbt.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{fbt.reason}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {fbt.products.map((p, i) => (
          <BrowseCard key={p.slug} product={p} priority={i < 2} />
        ))}
      </div>
    </section>
  );
}

export default PDPFrequentlyBoughtTogether;
