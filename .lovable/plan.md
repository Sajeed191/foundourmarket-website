# FoundOurMarket™ Infrastructure v2.0 — Self-Healing Platform

Zero UI redesign. Zero business-logic changes. Only new infrastructure modules
layered under the existing app, with feature flags so each phase can be frozen
independently (matching the Snapshot workflow).

## Guiding rules

- No changes to Checkout, Auth, SEO, Routing, PDP v2, Browse Adapter, Badge
  System v4, Footer, or the Silent Recovery v2 toast UI.
- New code is lazy-loaded and event-driven — no polling loops on the render
  thread, no extra React re-renders on healthy paths.
- Every module ships behind a runtime flag so we can freeze incrementally and
  capture a Snapshot between phases.
- All customer-visible surfaces continue to look and behave identically.

## Phase 1 — Foundation (Request Queue + Health Bus)

Files (new):
- `src/lib/infra/event-bus.ts` — tiny typed pub/sub (`network`, `health`,
  `queue`, `deploy`). No React.
- `src/lib/infra/network-quality.ts` — reads `navigator.connection` +
  `saveData`, publishes `slow-2g | 2g | 3g | 4g | wifi`. Event-driven via
  `change` listener, no polling.
- `src/lib/infra/request-queue.ts` — IndexedDB-backed FIFO queue.
  - `enqueue({ kind, endpoint, method, body, dedupeKey, idempotencyKey, requiresAuth })`
  - Retry policy: exponential backoff, resumes on `online` event.
  - Dedupe by `dedupeKey`; each retry sends the stable `idempotencyKey`
    header so the server can drop duplicates.
  - Auth token is re-read at flush time (never persisted with the payload).
  - **Never accepts**: payments, auth, security-sensitive endpoints
    (enforced by an allowlist of `kind` values).
- `src/lib/infra/queue-adapter.ts` — thin wrapper: `safeMutate(fn, meta)`
  runs the call; on offline / timeout / 502/503/504 it enqueues and resolves
  optimistically with a `{ queued: true }` marker.

Integrations (surgical, no UI change):
- Add-to-cart, wishlist, newsletter, contact, profile update, reviews, Q&A,
  support ticket create → route through `safeMutate`. All existing success
  toasts still fire.

Snapshot #11 checkpoint.

## Phase 2 — Service Worker Self-Healing + Deployment Recovery

Files:
- `public/sw.js` — upgrade existing SW (or introduce guarded one per PWA
  skill rules; **preview/dev never registers**).
  - Precache manifest with integrity hashes emitted at build.
  - On activate: verify each cached asset's hash; corrupted/missing entries
    trigger a targeted re-fetch (not a full wipe).
  - Navigation = NetworkFirst; hashed assets = CacheFirst.
  - New-version detection: download + validate in background, post
    `deploy:ready` message. Client waits for `idle` (requestIdleCallback +
    no active input/checkout/chat) before `skipWaiting`.
- `src/lib/infra/sw-controller.ts` — owns registration guard, listens for
  `deploy:ready`, gates activation on `isSafeToActivate()` (checkout route,
  focused form, open chat → defer).

Snapshot #12 checkpoint.

## Phase 3 — Smart Network Mode + Offline Browsing

- `src/lib/infra/network-profile.ts` — derives a profile from network
  quality: image quality tier, prefetch aggressiveness, animation level.
- Wire existing image URL builder + route prefetch hints to read the
  profile (no component API change).
- SW runtime cache for products / categories / images / account / help
  pages already visited → available offline read-only.
- Reuse existing Silent Recovery v2 pill for the offline indicator (no new
  UI component); it already handles online/offline lifecycle.
- Mutations while offline → queued via Phase 1.

Snapshot #13 checkpoint.

## Phase 4 — Background Health Monitor + Self-Healing Cache

- `src/lib/infra/health-monitor.ts` — visibility-gated checks every 5 min:
  API ping, session validity (via existing supabase client), SW state, CDN
  reachability. Uses `requestIdleCallback`; skips entirely when tab hidden
  or on 2G/save-data.
- On failure: publishes `health:degraded`, triggers targeted recovery
  (session refresh, cache-repair message to SW, module re-import).
- Cache repair: SW receives `cache:repair` with a scope; only the affected
  bucket is cleared and re-fetched. Healthy caches untouched.

Snapshot #14 checkpoint.

## Phase 5 — Recovery Analytics (admin-only)

Backend:
- Migration: `infra_recovery_events` table (event_type, severity, meta,
  duration_ms, session_id, created_at) with proper GRANTs and RLS
  (`service_role` writes via server route, `admin` role reads).
- Server route `src/routes/api/public/hooks/infra-event.ts` — HMAC-signed
  batch ingest from the client (batched every 30s, `sendBeacon` on
  pagehide). Never carries PII.

Admin UI (new route only, no customer surface):
- `src/routes/admin-infrastructure.tsx` — cards + charts for: recovery
  success rate, retry count, offline sessions, API failures, queue length
  + success rate, SW recoveries, chunk failures, cache repairs, deployment
  updates, avg recovery duration. Range toggle: 24h / 7d / 30d.

Snapshot #15 — final freeze as **Infrastructure v2.0**.

## Non-goals / hard fences

- No changes to `/checkout/*`, `/auth/*`, payment endpoints, or any
  security-sensitive server function.
- No new visible components on Home, PDP, Search, Account, Cart, or Footer.
- No polling on the render thread; no `setInterval` outside the health
  monitor (which is visibility-gated + idle-scheduled).
- No service-worker registration in Lovable preview / dev / iframe /
  `?sw=off` — follows the project's PWA guardrails.

## Deliverables per phase

Each phase ends with: build + typecheck green, Entry-eager bundle delta
report, Snapshot entry, and a short freeze note. If any phase adds > 3 KB
eager to the entry chunk, we split further before freezing.

Please approve so I start with **Phase 1 — Request Queue + Health Bus**.
