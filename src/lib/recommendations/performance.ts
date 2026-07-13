import type { RecommendationSource } from "./types";

/**
 * Self-improving strategy performance tracker.
 *
 * Records impressions and clicks per recommendation source in localStorage and
 * derives a priority multiplier from the observed click-through rate. Sections
 * whose strategies perform poorly over time are automatically de-prioritised,
 * so the PDP keeps promoting the blocks that actually convert — no external AI,
 * no schema changes, fully deterministic given the same history.
 *
 * All metrics are internal (never shown to customers).
 */

const KEY = "fom_rec_perf_v1";

type Stat = { impressions: number; clicks: number };
type Store = Partial<Record<RecommendationSource, Stat>>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

function write(store: Store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode — ignore */
  }
}

function bump(source: RecommendationSource, field: keyof Stat, by = 1) {
  const store = read();
  const stat = store[source] ?? { impressions: 0, clicks: 0 };
  stat[field] += by;
  store[source] = stat;
  write(store);
}

export function recordImpression(source: RecommendationSource) {
  bump(source, "impressions");
}

export function recordClick(source: RecommendationSource) {
  bump(source, "clicks");
  // Best-effort analytics; never blocks the UI.
  import("@/lib/personalization")
    .then(() => {})
    .catch(() => {});
}

/**
 * Priority multiplier in [0.6, 1.4]. Strategies with no data return 1 (neutral)
 * so new blocks get a fair chance before the system judges them. Once enough
 * impressions accumulate, low-CTR strategies decay toward 0.6 and high-CTR
 * strategies rise toward 1.4.
 */
export function priorityMultiplier(source: RecommendationSource): number {
  const stat = read()[source];
  if (!stat || stat.impressions < 12) return 1;
  const ctr = stat.clicks / stat.impressions;
  // Baseline CTR ~5%. Map deviation from baseline into the bounded range.
  const rel = (ctr - 0.05) / 0.05; // -1 .. +∞
  return Math.max(0.6, Math.min(1.4, 1 + rel * 0.2));
}

export function getPerformanceSnapshot(): Store {
  return read();
}
