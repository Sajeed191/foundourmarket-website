/**
 * Address Intelligence Engine (pure, reusable, framework-free).
 *
 * Centralises all checkout address reasoning so the form, saved-address rail,
 * delivery card and analytics share one source of truth instead of duplicating
 * heuristics. Everything here is deterministic and side-effect free so it can
 * run on the client for instant feedback and be re-used server-side if needed.
 */

import type { Address } from "./use-addresses";

export type MarketRegion = "india" | "international";

/* ------------------------------------------------------------------ */
/* Region detection from an address                                    */
/* ------------------------------------------------------------------ */

const INDIA_NAMES = new Set([
  "india",
  "in",
  "ind",
  "bharat",
  "republic of india",
]);

/** Detect the market a physical address belongs to. */
export function detectAddressRegion(a: {
  country?: string | null;
  postal?: string | null;
}): MarketRegion {
  const c = (a.country ?? "").trim().toLowerCase();
  if (c && INDIA_NAMES.has(c)) return "india";
  if (c && c.length > 0 && !INDIA_NAMES.has(c)) return "international";
  // No country yet — infer from a 6-digit Indian PIN shape.
  if (/^\d{6}$/.test((a.postal ?? "").trim())) return "india";
  return "international";
}

/** Phone dialling code + currency for a detected region. */
export function regionDefaults(region: MarketRegion): {
  phoneCode: string;
  currency: "INR" | "USD";
  flag: string;
  country: string;
} {
  return region === "india"
    ? { phoneCode: "+91", currency: "INR", flag: "🇮🇳", country: "India" }
    : { phoneCode: "+1", currency: "USD", flag: "🌍", country: "" };
}

/* ------------------------------------------------------------------ */
/* Address quality score (0–100)                                       */
/* ------------------------------------------------------------------ */

export type QualityCheck = { label: string; ok: boolean; weight: number };

export type QualityResult = {
  score: number;
  grade: "Excellent" | "Good" | "Fair" | "Incomplete";
  checks: QualityCheck[];
  regionMatch: boolean;
};

/**
 * Weighted address quality score. Region match is part of the score so an
 * Indian PIN paired with a non-India country is correctly penalised.
 */
export function scoreAddressQuality(
  a: {
    full_name?: string | null;
    phone?: string | null;
    line1?: string | null;
    city?: string | null;
    state?: string | null;
    postal?: string | null;
    country?: string | null;
  },
  opts?: { expectedRegion?: MarketRegion },
): QualityResult {
  const t = (s?: string | null) => (s ?? "").trim();
  const region = detectAddressRegion(a);
  const expected = opts?.expectedRegion ?? region;
  const regionMatch = region === expected;

  const checks: QualityCheck[] = [
    { label: "Name", ok: t(a.full_name).length >= 3 && t(a.full_name).includes(" ") === t(a.full_name).includes(" "), weight: 15 },
    { label: "Phone", ok: t(a.phone).length >= 8, weight: 18 },
    { label: "Address", ok: t(a.line1).length >= 5, weight: 20 },
    { label: "City", ok: t(a.city).length >= 2, weight: 12 },
    { label: "State", ok: t(a.state).length >= 2, weight: 10 },
    { label: "PIN", ok: region === "india" ? /^\d{6}$/.test(t(a.postal)) : t(a.postal).length >= 3, weight: 13 },
    { label: "Country", ok: t(a.country).length >= 2, weight: 7 },
    { label: "Region", ok: regionMatch && t(a.country).length >= 2, weight: 5 },
  ];

  // Name must be a real name, not a single word or noise.
  checks[0].ok = t(a.full_name).length >= 3 && !looksLikeSpam(t(a.full_name));

  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  const score = Math.round((got / total) * 100);

  const grade: QualityResult["grade"] =
    score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 50 ? "Fair" : "Incomplete";

  return { score, grade, checks, regionMatch };
}

/* ------------------------------------------------------------------ */
/* PIN ↔ City ↔ State consistency                                      */
/* ------------------------------------------------------------------ */

export type ConsistencyResult = {
  status: "match" | "mismatch" | "unknown";
  issues: string[];
};

const normLoc = (s?: string | null) =>
  (s ?? "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "")
    .trim();

/**
 * Compare what the customer typed against the city/state the postal service
 * resolved for their PIN. Catches "676507 + Mumbai" style mistakes.
 */
export function pinCityStateConsistency(
  entered: { city?: string | null; state?: string | null },
  resolved: { city?: string | null; state?: string | null; areas?: string[] | null },
): ConsistencyResult {
  if (!resolved.city && !resolved.state) return { status: "unknown", issues: [] };

  const issues: string[] = [];
  const ec = normLoc(entered.city);
  const es = normLoc(entered.state);
  const rState = normLoc(resolved.state);
  const candidateCities = [resolved.city, ...(resolved.areas ?? [])]
    .map(normLoc)
    .filter(Boolean);

  if (es && rState && es !== rState) {
    issues.push(`PIN belongs to ${resolved.state}, not "${entered.state}"`);
  }
  if (
    ec &&
    candidateCities.length &&
    !candidateCities.some((c) => c.includes(ec) || ec.includes(c))
  ) {
    issues.push(`PIN and city "${entered.city}" do not match`);
  }

  return { status: issues.length ? "mismatch" : "match", issues };
}

/* ------------------------------------------------------------------ */
/* Fraud / risk assessment                                             */
/* ------------------------------------------------------------------ */

export type RiskLevel = "low" | "medium" | "high";
export type RiskResult = { level: RiskLevel; score: number; flags: string[] };

/** Heuristic detector for keyboard-mash / random-character spam. */
export function looksLikeSpam(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  // No vowels in a 4+ char token usually means mashing (asdf, qwrtp).
  const noVowel = /^[^aeiou\s]{4,}$/i.test(v.replace(/\s/g, ""));
  // Same character repeated 4+ times.
  const repeat = /(.)\1{3,}/.test(v);
  // Long run with no vowels at all.
  const vowels = (v.match(/[aeiou]/gi) ?? []).length;
  const letters = (v.match(/[a-z]/gi) ?? []).length;
  const lowVowelRatio = letters >= 5 && vowels / letters < 0.15;
  return noVowel || repeat || lowVowelRatio;
}

/**
 * Risk score for a new/edited address. Pure: caller passes the existing saved
 * addresses so duplicate / volume abuse can be detected without DB access.
 */
export function assessAddressRisk(
  a: {
    full_name?: string | null;
    line1?: string | null;
    city?: string | null;
    postal?: string | null;
    country?: string | null;
  },
  existing: Address[] = [],
): RiskResult {
  const flags: string[] = [];
  let score = 0;

  const name = (a.full_name ?? "").trim();
  if (name && looksLikeSpam(name)) {
    score += 35;
    flags.push("Name looks invalid");
  }
  if (name && name.replace(/\s/g, "").length < 3) {
    score += 20;
    flags.push("Name too short");
  }
  if ((a.line1 ?? "").trim() && looksLikeSpam((a.line1 ?? "").trim())) {
    score += 30;
    flags.push("Street looks invalid");
  }

  const region = detectAddressRegion(a);
  if (region === "india" && (a.postal ?? "").trim() && !/^\d{6}$/.test((a.postal ?? "").trim())) {
    score += 25;
    flags.push("Impossible PIN for India");
  }

  // Excessive address creation (volume abuse).
  if (existing.length >= 10) {
    score += 20;
    flags.push("Unusually many saved addresses");
  }

  const level: RiskLevel = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return { level, score: Math.min(100, score), flags };
}

/* ------------------------------------------------------------------ */
/* GPS reverse-geocode confidence                                      */
/* ------------------------------------------------------------------ */

export type GeoComponents = {
  line1?: string | null;
  area?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  postal?: string | null;
  country?: string | null;
};

/**
 * Confidence (0–100) that a reverse-geocoded address is usable, based on how
 * many high-value components were resolved. Powers the "Location Confidence"
 * badge after "Use current location".
 */
export function gpsFillConfidence(c: GeoComponents): number {
  const weights: [keyof GeoComponents, number][] = [
    ["line1", 22],
    ["postal", 22],
    ["city", 18],
    ["state", 16],
    ["country", 12],
    ["area", 6],
    ["district", 4],
  ];
  const total = weights.reduce((s, [, w]) => s + w, 0);
  const got = weights.reduce((s, [k, w]) => s + ((c[k] ?? "").toString().trim() ? w : 0), 0);
  return Math.round((got / total) * 100);
}

/* ------------------------------------------------------------------ */
/* Returning-customer address ranking                                  */
/* ------------------------------------------------------------------ */

/**
 * Order saved addresses for fastest reuse: default shipping first, then most
 * recently used, then most frequently used, then newest.
 */
export function rankAddresses(addresses: Address[]): Address[] {
  return [...addresses].sort((a, b) => {
    if (a.is_default_shipping !== b.is_default_shipping) return a.is_default_shipping ? -1 : 1;
    const at = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
    const bt = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
    if (at !== bt) return bt - at;
    if ((a.use_count ?? 0) !== (b.use_count ?? 0)) return (b.use_count ?? 0) - (a.use_count ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/** Per-address contextual badge for the saved-address rail. */
export function addressBadge(
  a: Address,
  all: Address[],
): { label: string; tone: "emerald" | "accent" | "muted" } | null {
  if (a.is_default_shipping) return { label: "Default", tone: "emerald" };
  const mostUsed = [...all].sort((x, y) => (y.use_count ?? 0) - (x.use_count ?? 0))[0];
  if (mostUsed && mostUsed.id === a.id && (a.use_count ?? 0) > 0)
    return { label: "Most used", tone: "accent" };
  const lastUsed = [...all]
    .filter((x) => x.last_used_at)
    .sort((x, y) => new Date(y.last_used_at!).getTime() - new Date(x.last_used_at!).getTime())[0];
  if (lastUsed && lastUsed.id === a.id) return { label: "Last used", tone: "muted" };
  return null;
}
