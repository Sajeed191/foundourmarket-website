/**
 * Shared, deterministic time-window helpers for the automated merchandising
 * engine. All boundaries are computed in IST (UTC+5:30) so rotations line up
 * with the business timezone regardless of the visitor's location.
 *
 * Every helper returns a stable numeric seed that only changes when its window
 * boundary is crossed — this keeps display order perfectly stable between
 * boundaries (no flicker, no per-second churn) while still rotating
 * automatically over time. The same seed is computed identically on the server
 * and the client, so there is no hydration mismatch.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Seed for the current 6-hour Flash Deal window: 12AM / 6AM / 12PM / 6PM IST. */
export function flashWindowSeed(nowMs: number): number {
  const ist = new Date(nowMs + IST_OFFSET_MS);
  const slot = Math.floor(ist.getUTCHours() / 6) * 6;
  return Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), slot, 0, 0, 0);
}

/** Seed for the current 2-hour reshuffle window (collection ordering). */
export function orderWindowSeed(nowMs: number): number {
  const ist = new Date(nowMs + IST_OFFSET_MS);
  const slot = Math.floor(ist.getUTCHours() / 2) * 2;
  return Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), slot, 0, 0, 0);
}

/** Seed for the current 24-hour window (rotating "third badge" selection). */
export function dayWindowSeed(nowMs: number): number {
  const ist = new Date(nowMs + IST_OFFSET_MS);
  return Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), 0, 0, 0, 0);
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

/** Stable 32-bit string hash (FNV-1a) for deterministic per-product offsets. */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
