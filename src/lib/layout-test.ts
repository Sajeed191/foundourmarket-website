/**
 * Temporary A/B diagnostic: `?layouttest=simple`.
 *
 * When present, product cards render as plain rectangular containers with no
 * overflow clipping, border-radius, clip-path, masks, isolation, stacking
 * contexts, absolutely-positioned overlays, or shadows. This isolates whether
 * the homepage corruption is caused by the compositor handling clipped/rounded
 * card layers rather than image loading. Pure diagnostic — remove later.
 */
let layoutTestSimpleCached: boolean | null = null;

export function detectLayoutTestSimple(): boolean {
  if (layoutTestSimpleCached !== null) return layoutTestSimpleCached;
  if (typeof window === "undefined") return false;
  let value = false;
  try {
    value = new URLSearchParams(window.location.search).get("layouttest") === "simple";
  } catch {
    value = false;
  }
  layoutTestSimpleCached = value;
  if (value && typeof console !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[layouttest] layouttest=simple enabled");
  }
  return value;
}
