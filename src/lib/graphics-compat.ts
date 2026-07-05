/**
 * Graphics Compatibility Mode
 * ---------------------------
 * A user-controllable rendering path that reduces compositor complexity for
 * devices where Chromium/WebView's GPU compositor produces scroll-time tile
 * corruption (horizontal bands, duplicated textures). It reuses the EXISTING
 * `data-render-safe` safe-mode CSS (the same path as the `?render=safe` URL
 * flag) rather than maintaining a fragile GPU-renderer blocklist.
 *
 * Design goals:
 *   - Default (`auto`) keeps the full premium rendering for everyone.
 *   - Desktop / iOS / Firefox / healthy Android are never forced into it.
 *   - The user can manually enable/disable it from Settings; the choice
 *     persists in localStorage.
 *   - On Android Chromium we may SUGGEST it (never force it) via a dismissible
 *     prompt when a rendering-compatibility issue is plausible.
 *
 * Attributes set on <html>:
 *   data-graphics-compat="true"  → set only by an explicit user "on" choice.
 *   data-render-safe="true"      → the existing CSS hook that swaps expensive
 *                                  GPU effects for CPU-friendly fallbacks.
 */

export type GraphicsCompatPref = "auto" | "on" | "off";

const PREF_KEY = "fom-graphics-compat";
const DISMISS_KEY = "fom-graphics-compat-suggested";

/** Read the persisted user preference. Absent / invalid → "auto". */
export function readGraphicsCompatPref(): GraphicsCompatPref {
  if (typeof localStorage === "undefined") return "auto";
  try {
    const v = localStorage.getItem(PREF_KEY);
    return v === "on" || v === "off" ? v : "auto";
  } catch {
    return "auto";
  }
}

/** True when the compatibility rendering path is currently active. */
export function isGraphicsCompatActive(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-graphics-compat") === "true";
}

/** True when render-safe was forced via the ?render=safe URL flag (not the pref). */
function isUrlForcedRenderSafe(): boolean {
  if (typeof location === "undefined") return false;
  try {
    const q = new URLSearchParams(location.search);
    return q.get("render") === "safe" || q.has("render-safe");
  } catch {
    return false;
  }
}

/** Apply / remove the compat attributes on <html> at runtime. */
function applyAttributes(active: boolean) {
  if (typeof document === "undefined") return;
  const d = document.documentElement;
  if (active) {
    d.setAttribute("data-graphics-compat", "true");
    d.setAttribute("data-render-safe", "true");
  } else {
    d.removeAttribute("data-graphics-compat");
    // Never clobber a URL-forced safe mode (?render=safe diagnostics).
    if (!isUrlForcedRenderSafe()) d.removeAttribute("data-render-safe");
  }
}

/** Persist the preference and apply it live (no reload needed). */
export function setGraphicsCompatPref(pref: GraphicsCompatPref) {
  if (typeof localStorage !== "undefined") {
    try {
      if (pref === "auto") localStorage.removeItem(PREF_KEY);
      else localStorage.setItem(PREF_KEY, pref);
    } catch {
      /* storage disabled — attribute still applies for this session */
    }
  }
  applyAttributes(pref === "on");
}

/** Chromium-family engine on Android (Chrome, Brave, Edge, etc.) — excludes Firefox. */
export function isAndroidChromium(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/.test(ua);
  const isChromium = /Chrome\/|Chromium\//.test(ua);
  const isFirefox = /Firefox\/|FxiOS/.test(ua);
  return isAndroid && isChromium && !isFirefox;
}

/**
 * Suggest (never force) compatibility mode. True only when:
 *   - the user has made no explicit choice (pref is "auto"),
 *   - the suggestion was not previously dismissed,
 *   - the environment is Android Chromium (where the driver bug occurs).
 */
export function shouldSuggestGraphicsCompat(): boolean {
  if (typeof localStorage === "undefined") return false;
  if (readGraphicsCompatPref() !== "auto") return false;
  try {
    if (localStorage.getItem(DISMISS_KEY) === "true") return false;
  } catch {
    return false;
  }
  return isAndroidChromium();
}

/** Remember that the suggestion was shown/dismissed so it never nags again. */
export function dismissGraphicsCompatSuggestion() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(DISMISS_KEY, "true");
  } catch {
    /* ignore */
  }
}
