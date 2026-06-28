import { useEffect, useState } from "react";

/**
 * Device-capability classification has been fully removed.
 *
 * The site renders ONE unified premium homepage on every device — phones,
 * tablets, laptops, desktops. There is no low-end/high-end detection, no GPU
 * renderer sniffing, no RAM/CPU-core gating, no Save-Data / reduced-motion
 * homepage switching, and no "safe mode". Responsiveness comes purely from CSS
 * breakpoints, and the UI is kept lightweight enough to stay smooth everywhere.
 *
 * The only thing that remains is genuine PLATFORM detection (Android user
 * agent), used to pick a transform-free incremental rendering strategy for very
 * large product grids — a browser-compatibility concern, not a capability tier.
 */

export function detectAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function shouldUseIncrementalRendering(): boolean {
  return detectAndroid();
}

export function useIsAndroid(): boolean {
  const [android, setAndroid] = useState(false);
  useEffect(() => {
    setAndroid(detectAndroid());
  }, []);
  return android;
}

export function useIncrementalRendering(): boolean {
  const [incremental, setIncremental] = useState(false);
  useEffect(() => {
    setIncremental(shouldUseIncrementalRendering());
  }, []);
  return incremental;
}
