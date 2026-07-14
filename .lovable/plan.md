# Enterprise AI Catalog Intelligence Platform

Build one unified, explainable AI intelligence layer on top of the engines that already exist — **without** duplicating them or touching checkout, payments, orders, inventory, auth, search, recommendations, storefront, URLs, or SEO generation.

## Reuse map (what already exists → what we extend)

```text
src/lib/duplicate-detection/*   → add relationship classification + fingerprint
src/lib/recommendations/*       → reuse scorer/graph signals (read-only)
src/lib/seo-intelligence.*      → extend audit into "SEO Intelligence 2.0" advisories
src/lib/marketplace-quality.ts  → base for Catalog Health scoring
src/lib/product-images.ts       → base for Image Intelligence
src/lib/product-variants.ts     → base for Variant Intelligence
admin-*-intelligence routes     → link into one dashboard hub
```

Nothing above is replaced; new logic imports from them.

## Architecture

New pure, deterministic modules (no schema changes — all derive from existing `products`, `product_variants`, `product_images`, `duplicate_detection_events`, `product_reviews`):

```text
src/lib/catalog-intelligence/
  fingerprint.ts     product fingerprint (embeddings optional, hashes/codes deterministic)
  relationships.ts   classify: exact dup / colour / size / storage / accessory / successor / cross-sell
  image-quality.ts   blur/resolution/aspect/white-bg/watermark heuristics + score
  catalog-health.ts  weighted health score across SEO/images/variants/specs/dup/price/inventory/reviews
  spec-suggest.ts    spec recommendations grounded in title + similar catalog products (marked "suggested")
  variant-health.ts  missing/broken/duplicate variant detection
  vendor-quality.ts  vendor quality score from existing vendor/product signals
  index.ts           public surface + shared types
```

Heavy work (embeddings, image decode) runs **async with caching**: fingerprints/embeddings computed lazily and cached; a nightly optimizer server function batches reports. Everything else is pure and synchronous for instant UI.

## Confidence & explainability

Every module follows the existing `duplicate-detection` pattern: each signal returns `{ key, weight, similarity, matched, reason }`; scores are weighted blends 0–100 with a human-readable reason list. No randomness, no placeholder logic — all inputs are real catalog rows.

## Phases (delivered in order, each self-contained & buildable)

**Phase 1 — Fingerprint + Relationship Engine.** Extend `duplicate-detection` with `fingerprint.ts` (title/desc/image embeddings via existing Lovable AI gateway server fn, cached; perceptual hash + barcode/SKU/MPN/GTIN/model already partly present) and `relationships.ts` that reclassifies matches into variant/accessory/successor/cross-sell instead of only "duplicate". Update `DuplicateIntelligencePanel` copy to relationship-aware messages.

**Phase 2 — Catalog Health + Image Intelligence.** `catalog-health.ts` and `image-quality.ts` (canvas-based blur/resolution/brightness/aspect/white-bg heuristics, in-browser, cached by URL). Surface both as clickable score cards in `ProductEditorModal`.

**Phase 3 — SEO 2.0 + Spec + Variant Intelligence.** Extend `seo-intelligence` advisories (schema gaps, keyword stuffing, thin content, internal-linking suggestions — advisory only, never auto-rewrites). Add `spec-suggest.ts` and `variant-health.ts` with clearly-marked suggestions.

**Phase 4 — Vendor Intelligence + Merge Assistant.** `vendor-quality.ts` score; merge recommendation UI in the duplicate panel (admin-approve only, never auto-merge).

**Phase 5 — Unified Dashboard + Learning + Nightly Optimizer.** `/admin-catalog-intelligence` hub linking all intelligence surfaces with live KPIs. Learning reuses existing `duplicate_detection_events` feedback to adjust confidence only (never edits content). Nightly optimizer = a `createServerFn` batch report triggered by pg_cron writing a daily summary (uses existing tables/caching).

## Guardrails

- No DB schema changes unless a phase proves one is unavoidable (I'll ask first).
- All AI calls go through the existing Lovable AI gateway server-side; embeddings cached, never blocking.
- Every score is explainable and deterministic; nothing auto-modifies content — admin approves all changes.
- Zero changes to checkout, payments, orders, inventory, auth, analytics, recommendation public surface, storefront, URLs, search, or existing SEO generation.
- Mobile-responsive panels; candidate prefilter keeps scoring O(candidates) for large catalogs.

## Technical notes

- Embeddings: `google/gemini-embedding-001` via a server fn, results cached (in-memory + optional column reuse of existing `products` text fields; no new columns in phase 1).
- Image analysis stays in-browser (canvas) to avoid Worker native-dep limits, matching the existing `image-hash.ts` approach.
- Nightly optimizer follows the documented pg_cron + `/api/public/hooks/*` pattern.

I'll start with **Phase 1** on approval and check in after each phase so scope stays controlled.
