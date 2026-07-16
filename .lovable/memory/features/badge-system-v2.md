---
name: Badge System v2 (FROZEN)
description: Single-badge card rule, unified priority ladder, deterministic pickWinningBadge, Ready to Ship relocated under price
type: feature
---

# Badge System v2 — FROZEN

Every product card renders exactly ONE marketing badge. AI drives the existing badge system rather than adding new AI-specific pills.

## Determinism (permanent rule)

- For the same product state, `pickWinningBadge(product)` MUST return the same result across every surface.
- A section may override that result via `forceBadge` (Flash Deals, Trending, Best Sellers, New Arrivals).
- No component may implement its own badge selection logic. All card-badge choices flow through `pickWinningBadge` in `src/components/site/ProductCard.tsx`.

## Priority ladder (single source)

```
Flash Deal / Hot Deal → Best Seller → Trending → New Arrival →
Recommended → Best Value → Popular Choice
```

Labels outside this ladder (Premium, Featured, Editor's Choice, Staff Pick, Gift Idea, Fast Selling, Limited Stock) are computed for admin/analytics but never render on the card image.

## Placement

- Marketing badge: top-left rounded capsule, ≤42% card width.
- Ready to Ship: check-row under price — NEVER on the image.
- `-%` discount pill: stays a no-op sitewide.
- "Why?" ⓘ popover: bottom-right, one plain-language sentence, no scores/models/AI wording.

## Data flow (canonical path)

```
Marketplace Intelligence → Recommendation Broker → pickWinningBadge() → ProductCard / BrowseCard
```

BrowseCard is a thin wrapper that passes `presentation.badges` into ProductCard; it never picks a badge itself.

## Future work (not scheduled)

Badge Registry — one source of truth for label/icon/color/priority/sectionOnly per badge key. Enables localization, seasonal overrides, and marketing-as-config. Only pursue if the badge catalog materially grows.
