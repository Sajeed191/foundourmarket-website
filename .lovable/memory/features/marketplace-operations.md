---
name: Marketplace Operations 1.0 (FROZEN Core + Phase 2)
description: Operations layer — Smart Work Queue, Daily Digest, Bulk Operations. Consumes only Intelligence Platform contracts. Never introduces new detection/scoring/AI.
type: feature
---
**Marketplace Operations 1.0 Core is FROZEN.** Treat like the intelligence layers: bug fixes, perf, UX polish, additional filters/sorting only. No breaking changes to public contracts.

### Frozen Core surface
- Smart Work Queue at `/admin-work-queue` — 6 queues: `high_impact`, `seo`, `variants`, `images`, `pricing`, `ready_to_publish`
- Daily Digest card on Admin Home
- Queue contract (`SmartQueues`, `WorkQueue`, `QueueItem`, `QueueId`, `EstimatedEffort`)
- `estimatedEffort` (small/medium/large) derived from readiness + blockers
- Deep-link routing per recommendation module
- "One recommendation → one action" UX

### Phase 2 — Bulk Operations
Route: `/admin-bulk-operations`. Files:
- `src/lib/marketplace-operations/bulk-operations.ts` — operation registry
- `src/lib/use-bulk-operations.ts` — runner hook with cancel + localStorage history (last 25)
- `src/routes/admin-bulk-operations.tsx` — Available / Running / Recent UI

Registered operations (all read-only, all delegate to existing analyzers):
- `marketplace-readiness` → `assessMarketplaceReadiness`
- `seo-refresh` → `analyzeSeoIntelligence`
- `pricing-refresh` → `analyzePricingIntelligence`
- `catalog-refresh` → `analyzeAttributes` + `scoreProductCompleteness` + `analyzeVariantIntelligence`
- `image-analysis` → reports Image Intelligence v3 signals via readiness
- `image-normalization` → dry-run preview only

### Rules (must not violate)
- Every bulk action MUST invoke an existing analyzer. Never implements new detection/scoring/AI.
- Never overwrites originals. Never auto-publishes. Never auto-changes prices. Never deletes data.
- Every run must be reversible where practical and produce an audit trail.
- Generic `BulkOperation` lifecycle (queued/running/completed/failed/cancelled) — do not fork per-type job models.

### Roadmap (post-freeze, future phases)
- Phase 3: Saved Views & Smart Filters
- Phase 4: Workflow Automation (scheduled queues, recurring jobs, notifications)
