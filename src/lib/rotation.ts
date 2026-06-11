import { useEffect, useState } from "react";

/**
 * Returns the timestamp (ms) of the most recent rotation boundary. Collections
 * (Best Sellers, Trending, Flash Deals) reshuffle every day at 12:00 AM and
 * 12:00 PM. The value stays fixed between boundaries so the display order is
 * stable until the next rotation — no per-second churn, no layout jank.
 */
export function currentRotationSeed(nowMs: number): number {
  const d = new Date(nowMs);
  const boundary = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours() < 12 ? 0 : 12,
    0,
    0,
    0,
  );
  return boundary.getTime();
}

/** Deterministic PRNG (mulberry32) so every surface computes the same order. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded Fisher–Yates shuffle — same seed always yields the same order. */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Returns the current rotation seed and updates it ONLY when the next 12:00
 * boundary is crossed (a single scheduled timeout, not an interval). This keeps
 * the collection order perfectly stable between rotations so customers never
 * see flicker, re-sorting, or lag while browsing.
 *
 * SSR-safe: the seed is derived from a fixed boundary, so server and client
 * compute the same value on first render — no hydration mismatch.
 */
export function useRotationSeed(): number {
  const [seed, setSeed] = useState(() => currentRotationSeed(Date.now()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const now = Date.now();
      const current = currentRotationSeed(now);
      // Next boundary is exactly 12 hours after the current one.
      const next = current + 12 * 60 * 60 * 1000;
      const delay = Math.max(1000, next - now);
      timer = setTimeout(() => {
        setSeed(currentRotationSeed(Date.now()));
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return seed;
}
