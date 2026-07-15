---
name: Browse Presentation Adapter v1 (FROZEN)
description: Track A Phase 2.1 — single composition layer for all customer browse surfaces
type: feature
---
FROZEN v1 after Snapshot #4 (route-only +≤101 B gz per category route, Build Health 100/100).

Public contract: `src/lib/browse/` exports `buildBrowsePresentation`, `sortProductsForBrowse`, `defaultFiltersFor`, and types `BrowsePresentation`, `BrowseBadge`, `BrowseSection`, `BrowseSortOption`, `BrowseAdapterInput`, `BrowseFilterDefaults`. Only add fields; never break shape.

Rules (permanent):
- Intelligent Browse never creates marketplace intelligence — only composes public contracts (Marketplace Readiness, Recommendation Broker, Relationship Intelligence, catalog metadata, existing deal/merchandising flags).
- Customer routes import ONLY from `@/lib/browse`. Never from `catalog-intelligence` or `marketplace-intelligence`.
- One adapter, many surfaces — differentiate via `surface: "category" | "deals" | "search"`. No per-surface forks. Divergent implementations = architectural smell.
- Badges: max 2 per card, from approved 6 only (Recommended, Best Value, Popular Choice, Ready to Ship, Limited Stock, New). Never expose internal AI scores or module names.
- Badge stacking priority when combined with existing marketing badges: 1) Sale/Discount, 2) Out of Stock/Limited Stock, 3) Recommended, 4) Best Value, 5) Popular Choice, 6) New.
- Reason copy: one sentence, ≤20 words, no numbers, no internal terminology. Progressive disclosure only (never permanently visible).
- UI wrapper is `BrowseCard` (thin wrapper over `ProductCard`) — never modify `ProductCard` to add browse features.

Integrations: `/category/$slug` (fallback grid), `/category/$main/$sub`. Next: `/deals`, search results.
