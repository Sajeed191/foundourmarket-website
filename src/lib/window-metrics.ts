/**
 * Lightweight shared store for the windowed-virtualization A/B experiment.
 *
 * WindowedGrid publishes its internal layout state here; the default
 * IncrementalGrid publishes nothing (mode = "default"). WindowMetricsPanel
 * subscribes and also samples the live DOM (mounted cards / <img> / node count)
 * on its own rAF loop, so it works in BOTH modes for a like-for-like A/B read.
 *
 * No production behavior depends on this module — it is pure instrumentation.
 */

export type WindowGridMetrics = {
  mode: "default" | "windowed";
  windowSize: number; // mounted cards in the window slice
  overscanRows: number;
  visibleRows: number; // firstVisibleRow..lastVisibleRow (viewport only)
  startRow: number;
  endRow: number;
  totalRows: number;
  colCount: number;
  rowStride: number;
  topSpacer: number;
  bottomSpacer: number;
};

const EMPTY: WindowGridMetrics = {
  mode: "default",
  windowSize: 0,
  overscanRows: 0,
  visibleRows: 0,
  startRow: 0,
  endRow: 0,
  totalRows: 0,
  colCount: 0,
  rowStride: 0,
  topSpacer: 0,
  bottomSpacer: 0,
};

let current: WindowGridMetrics = EMPTY;
const listeners = new Set<() => void>();

export function publishWindowMetrics(next: WindowGridMetrics) {
  current = next;
  listeners.forEach((l) => l());
}

export function resetWindowMetrics() {
  publishWindowMetrics(EMPTY);
}

export function getWindowMetrics(): WindowGridMetrics {
  return current;
}

export function subscribeWindowMetrics(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True when the A/B experiment param is present (on OR off) so the panel shows in both arms. */
export function isWindowExperimentActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).has("ff-window");
  } catch {
    return false;
  }
}
