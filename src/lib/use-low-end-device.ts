import { useEffect, useState } from "react";

/**
 * Detects constrained devices so expensive effects (per-element motion layers,
 * GPU compositing, continuous animations) can be skipped — preventing the
 * compositing artifacts (ghosted/duplicated images, stacked cards, flicker)
 * seen on 1–4GB-RAM Android phones and slow CPUs during fast scroll.
 *
 * "Low-end" = the OS reports ≤4GB RAM, ≤4 logical cores, or the user has
 * requested reduced motion. SSR-safe: assumes capable until mounted so the
 * server render and first paint stay rich.
 */
function detect(): boolean {
  if (typeof navigator === "undefined") return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return true;
  if (typeof mem === "number" && mem > 0 && mem <= 4) return true;
  if (typeof cores === "number" && cores > 0 && cores <= 4) return true;
  return false;
}

export function useLowEndDevice(): boolean {
  const [low, setLow] = useState(false);
  useEffect(() => {
    setLow(detect());
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setLow(detect());
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return low;
}
