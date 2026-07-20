# Homepage Premium Collections v1.0

Presentation-only redesign of the homepage. No changes to APIs, data hooks, product cards, cart, wishlist, search, recommendations, or FlashDeals data logic.

## Scope

All changes live in:
- `src/routes/index.tsx` — swap layouts per section
- `src/components/site/PremiumProductCarousel.tsx` (new) — shared horizontal snap carousel
- `src/components/site/FlashDeals.tsx` — reuse existing data; render via `PremiumProductCarousel`

Untouched: `ProductCard`, data hooks (`useProducts`, `useHomepageSections`, `useCategories`), routing, badges, admin toggles.

## Section-by-section presentation

```text
01 Main Categories   →  Grid, larger cards, more whitespace, subtle lift on hover
02 Flash Deals       →  Horizontal snap carousel (partial next card), no autoscroll
03 Trending          →  2-col grid; first item spans 2 cols at lg+ (hero tile)
04 New Arrivals      →  Horizontal snap carousel (2.3 mobile / 4-5 desktop)
05 Best Sellers      →  Featured layout: 1 large left + smaller stack right (desktop)
                        Mobile: featured first, remaining 2-col below
```

Every section already uses `PremiumSectionHeading` v9 (auto-numbered 01/02/…). Nothing to change there.

## New shared primitive — `PremiumProductCarousel`

Thin wrapper around a horizontal scroll container. Purely presentational.

- CSS scroll-snap (`scroll-snap-type: x mandatory`, `snap-align: start`)
- Per-item widths: `min-w-[68%] sm:min-w-[38%] lg:min-w-[22%]` (Flash Deals slightly larger: `72%/40%/23%`)
- `overscroll-behavior-x: contain`, momentum scrolling on iOS
- Soft edge fade via mask-image on left/right
- Optional desktop chevron buttons that call `scrollBy({ left: ±cardWidth })`
- `data-product-card-frame` preserved on each slide
- Reveal per slide via existing `Reveal` (stagger)

Signature:
```ts
<PremiumProductCarousel
  items={products}
  renderItem={(p) => <ProductCard product={p} compact forceBadge={badge} />}
  size="regular" | "large"   // controls slide widths
  ariaLabel="New Arrivals"
/>
```

## Section changes in `src/routes/index.tsx`

- **Categories**: keep grid, bump gaps `gap-4 sm:gap-6`, cards `p-4 sm:p-5`, hover lift unchanged. Add `mt-2` breathing before grid.
- **Flash Deals**: `FlashDeals.tsx` renders its existing data via `PremiumProductCarousel size="large"`. Countdown strip untouched.
- **Trending**: replace `ProductSection` 4-up grid with a new inline layout — first product spans `lg:col-span-2 lg:row-span-2` (hero tile using same `ProductCard` compact prop), remaining 6 in a 2×3 grid at lg. Mobile stays 2-col uniform. `VirtualizedProductGrid` experiment is preserved for the non-hero tail.
- **New Arrivals**: use `PremiumProductCarousel size="regular"` in place of the 4-up grid. Keep `ViewAllButton` beneath.
- **Best Sellers**: featured composition at `lg`: left column featured card in a taller frame (aspect kept via `ProductCard`), right column stack of 3 smaller cards. Mobile: featured on top, 2-col grid of 3–4 below.

`ProductSection` is refactored to accept a `variant: "grid" | "carousel" | "trending-hero" | "bestsellers-featured"` prop; existing empty-state, admin toggle, badge, and `LazyMount` behavior stay intact.

## Spacing rhythm

Bump section wrapper padding: `py-10 sm:py-14` (from `py-6 sm:py-8`). Heading already owns 100/40px margins; add `mt-10` between heading and grid so first cards sit ~40px below the signature stroke.

## Motion

- Section reveal stays on existing `Reveal` primitive.
- Cards keep their own hover/scale.
- Carousel drag/scroll uses native momentum only. No JS animation loops. Respects `prefers-reduced-motion` (mask edge fade only, no motion).

## Quality gates

- Typecheck via `tsgo --noEmit`
- Visual spot check at 393×687 mobile viewport
- Confirm no changes to `ProductCard`, no new business logic, no CLS (carousel gets a min-height matching one card's aspect)

## Out of scope

Testimonials section, Trust strip, Hero, Footer, and every non-homepage surface.
