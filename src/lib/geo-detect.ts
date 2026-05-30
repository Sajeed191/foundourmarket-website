import type { MarketRegion, EdgeGeo } from "./region.functions";

/**
 * Multi-signal region detection engine.
 *
 * Combines the edge geo-IP result (Layer 1) with browser timezone, locale,
 * currency, and any previously-stored region choice into a single weighted
 * confidence score. Each signal contributes points to "india" or
 * "international"; the winning side's share + absolute strength produces a
 * 0–100 confidence and a human-readable `reasons` array.
 *
 * The output `tier` drives UX:
 *   - "auto"    (confidence >= 90)  → silently apply, no popup
 *   - "confirm" (70 <= conf < 90)   → lightweight one-tap confirmation
 *   - "pick"    (confidence < 70)    → full region picker before pricing
 *
 * This never grants pricing on its own — pricing comes from the locked region.
 */

export type DetectionTier = "auto" | "confirm" | "pick";

export type DetectionResult = {
  region: MarketRegion;
  /** 0–100 blended confidence across all available signal layers. */
  confidence: number;
  /** UX tier derived from confidence + fraud signals. */
  tier: DetectionTier;
  /** Human-readable signals that contributed to the verdict. */
  reasons: string[];
  /** Conflicting signals across layers (timezone vs locale vs IP). */
  conflicting: boolean;
  /** VPN / proxy / datacenter suspicion carried from the edge layer. */
  vpnSuspected: boolean;
  countryCode: string | null;
};

// Auto-apply at/above this; lightweight confirm in the band below it.
export const AUTO_THRESHOLD = 90;
// Confidence at/above this means we can confirm rather than force a full pick.
export const CONFIDENCE_THRESHOLD = 70;

/** Weighted point values per signal, mirroring the scoring spec. */
const W = {
  ip: 50,
  timezone: 20,
  locale: 10,
  currency: 8,
  previous: 30,
} as const;

type BrowserSignals = {
  tzIndia: boolean;
  tzInternational: boolean;
  localeIndia: boolean;
  localeInternational: boolean;
  currencyInr: boolean;
  currencyUsd: boolean;
  timezone: string | null;
  locale: string | null;
};

function browserSignals(): BrowserSignals {
  if (typeof window === "undefined") {
    return {
      tzIndia: false,
      tzInternational: false,
      localeIndia: false,
      localeInternational: false,
      currencyInr: false,
      currencyUsd: false,
      timezone: null,
      locale: null,
    };
  }

  let timezone: string | null = null;
  let currency: string | null = null;
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions();
    timezone = resolved.timeZone || null;
  } catch {
    /* ignore */
  }
  try {
    // Currency preference inferred from the device's number formatting locale.
    const nf = new Intl.NumberFormat();
    currency = (nf.resolvedOptions() as { currency?: string }).currency ?? null;
  } catch {
    /* ignore */
  }

  const langs = [navigator.language, ...(navigator.languages || [])]
    .filter(Boolean)
    .map((l) => l.toLowerCase());
  const locale = langs[0] ?? null;

  const localeIndia = langs.some(
    (l) =>
      l.endsWith("-in") ||
      l.startsWith("hi") ||
      l.startsWith("ta") ||
      l.startsWith("ml") ||
      l.startsWith("te") ||
      l.startsWith("kn") ||
      l.startsWith("bn") ||
      l.startsWith("mr") ||
      l.startsWith("gu"),
  );

  const tzIndia = timezone === "Asia/Kolkata" || timezone === "Asia/Calcutta";
  // Treat clearly non-India timezones as an international vote.
  const tzInternational = !!timezone && !tzIndia && !timezone.startsWith("Asia/Kolkata");

  return {
    tzIndia,
    tzInternational,
    localeIndia,
    localeInternational: !localeIndia && langs.length > 0,
    currencyInr: currency === "INR",
    currencyUsd: currency === "USD",
    timezone,
    locale,
  };
}

/**
 * Blend the edge geo result with browser signals + any previously stored
 * region choice. Returns the winning region, a 0–100 confidence, the UX tier,
 * and the reasons that drove the decision.
 */
export function blendDetection(
  edge: EdgeGeo,
  previousChoice?: MarketRegion | null,
): DetectionResult {
  const b = browserSignals();

  let indiaPts = 0;
  let intlPts = 0;
  const reasons: string[] = [];

  // Layer 1 — edge geo-IP (strongest single signal when a country exists).
  if (edge.countryCode) {
    if (edge.suggested === "india") {
      indiaPts += W.ip;
      reasons.push(`IP Country: India (${edge.countryCode})`);
    } else {
      intlPts += W.ip;
      reasons.push(`IP Country: ${edge.countryCode}`);
    }
  }

  // Layer 2 — browser timezone.
  if (b.tzIndia) {
    indiaPts += W.timezone;
    reasons.push(`Timezone: ${b.timezone}`);
  } else if (b.tzInternational) {
    intlPts += W.timezone;
    if (b.timezone) reasons.push(`Timezone: ${b.timezone}`);
  }

  // Layer 3 — device locale / language.
  if (b.localeIndia) {
    indiaPts += W.locale;
    if (b.locale) reasons.push(`Language: ${b.locale}`);
  } else if (b.localeInternational) {
    intlPts += W.locale;
    if (b.locale) reasons.push(`Language: ${b.locale}`);
  }

  // Layer 4 — currency preference.
  if (b.currencyInr) {
    indiaPts += W.currency;
    reasons.push("Currency preference: INR");
  } else if (b.currencyUsd) {
    intlPts += W.currency;
    reasons.push("Currency preference: USD");
  }

  // Layer 5 — previous explicit region choice (cookie / localStorage).
  if (previousChoice === "india") {
    indiaPts += W.previous;
    reasons.push("Previous selection: India");
  } else if (previousChoice === "international") {
    intlPts += W.previous;
    reasons.push("Previous selection: International");
  }

  const total = indiaPts + intlPts;
  const region: MarketRegion = indiaPts >= intlPts ? "india" : "international";
  const winning = Math.max(indiaPts, intlPts);

  // Confidence = how dominant the winning side is, scaled by absolute strength.
  let confidence = total > 0 ? Math.round((winning / total) * 100) : 35;
  // A lone weak signal should never read as near-certain.
  const strengthCap = Math.min(100, 50 + winning);
  confidence = Math.min(confidence, strengthCap);

  // Cross-layer conflict (e.g. IP says US but timezone + locale say India).
  const indiaVotes = [edge.suggested === "india", b.tzIndia, b.localeIndia];
  const yes = indiaVotes.filter(Boolean).length;
  const hasAnyIndia = yes > 0;
  const hasAnyIntl =
    edge.suggested === "international" || b.tzInternational || b.localeInternational;
  const conflicting = hasAnyIndia && hasAnyIntl && yes !== indiaVotes.length;

  if (conflicting) {
    confidence = Math.min(confidence, 65);
    reasons.push("Conflicting signals across IP / timezone / locale");
  }
  if (edge.vpnSuspected) {
    confidence = Math.min(confidence, 30);
    reasons.push("VPN / proxy suspected — manual confirmation required");
  }

  confidence = Math.max(0, Math.min(100, confidence));

  let tier: DetectionTier;
  if (edge.vpnSuspected || confidence < CONFIDENCE_THRESHOLD) {
    tier = "pick";
  } else if (confidence >= AUTO_THRESHOLD && !conflicting) {
    tier = "auto";
  } else {
    tier = "confirm";
  }

  return {
    region,
    confidence,
    tier,
    reasons,
    conflicting,
    vpnSuspected: edge.vpnSuspected,
    countryCode: edge.countryCode,
  };
}
