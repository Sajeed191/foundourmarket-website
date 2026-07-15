---
name: Intelligence vs Operations separation
description: Permanent architectural rule — intelligence layers produce decisions, operations layers execute them. Never blur the two.
type: constraint
---
**Rule: Intelligence produces decisions. Operations execute decisions.**

Layer responsibilities (never overlap):
- Image Intelligence v3 — analyzes images
- Catalog Intelligence 2.0 — analyzes listings
- Marketplace Intelligence 3.0 — analyzes marketplace quality
- Marketplace Health v1.0 — prioritizes
- Marketplace Operations 1.0+ — turns priorities into workflows (queues, bulk ops, saved views, digests)

**Why:** keeps the platform modular. Intelligence layers stay frozen and reusable; operations can evolve freely on top.

**How to apply:**
- Operations code MUST consume only public contracts (Recommendation, IntelligenceModule, MarketplaceReadiness, MarketplaceHealth, RecommendationAnalytics). Never re-implement scoring, detection, or AI calls.
- Never add new intelligence engines inside an operations feature. If a workflow needs a new signal, extend the correct intelligence layer via its versioned contract.
- Bulk actions run existing analyzers over N products — they never introduce new logic.
