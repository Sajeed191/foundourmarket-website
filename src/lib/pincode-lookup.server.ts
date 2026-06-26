/**
 * Production-grade Indian PIN-code resolver (server-only).
 *
 * Why this exists
 * ---------------
 * Indian PIN validation must support EVERY valid 6-digit India Post PIN code
 * (~19,300 PINs covering ~155,000 post offices). A single third-party source is
 * never enough: each provider has gaps, returns different locality/city wording
 * for the same PIN, and occasionally times out. The previous single-source
 * implementation reported many genuinely valid PINs as "unknown".
 *
 * Strategy
 * --------
 *  1. PRIMARY  — India Post dataset via `api.postalpincode.in` (official India
 *     Post records; complete nationwide coverage incl. villages & remote POs).
 *  2. FALLBACK — `api.zippopotam.us` (Worker-reachable, good metro coverage).
 *
 * We race/sequence the sources, apply a hard per-request timeout, and — most
 * importantly — distinguish a genuinely non-existent PIN ("not_found") from a
 * transient outage ("service_down"). A `service_down` result NEVER blocks the
 * customer: callers treat a well-formed 6-digit PIN as serviceable and let the
 * order proceed.
 *
 * City/locality names are returned for INFORMATIONAL autofill only — callers
 * must never block checkout on a city/district/locality mismatch.
 */

export type PinResolution =
  | {
      ok: true;
      pincode: string;
      city: string | null;
      district: string | null;
      state: string | null;
      areas: string[];
      latitude: number | null;
      longitude: number | null;
      source: "india_post" | "zippopotam";
    }
  /** PIN is malformed (not 6 digits) — user input error. */
  | { ok: false; reason: "invalid" }
  /** PIN is well-formed but does not exist in postal records. */
  | { ok: false; reason: "not_found" }
  /** Lookup service is unreachable / timed out — DO NOT block the customer. */
  | { ok: false; reason: "service_down" };

const TIMEOUT_MS = 4500;

type FetchResult = { status: number; json: any } | null;

async function fetchJsonWithTimeout(url: string, ms: number): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (res.status === 404) return { status: 404, json: null };
    if (!res.ok) return { status: res.status, json: null };
    return { status: res.status, json: await res.json() };
  } catch {
    return null; // network error / timeout / abort
  } finally {
    clearTimeout(timer);
  }
}

const uniq = (arr: (string | null | undefined)[], limit = 15): string[] =>
  Array.from(new Set(arr.map((s) => (s ?? "").trim()).filter(Boolean))).slice(0, limit);

/* ------------------------------------------------------------------ */
/* Source 1 — India Post (api.postalpincode.in)                        */
/* ------------------------------------------------------------------ */

type IndiaPostOutcome =
  | { kind: "ok"; res: PinResolution & { ok: true } }
  | { kind: "not_found" }
  | { kind: "down" };

async function lookupIndiaPost(pincode: string): Promise<IndiaPostOutcome> {
  const r = await fetchJsonWithTimeout(`https://api.postalpincode.in/pincode/${pincode}`, TIMEOUT_MS);
  if (r === null) return { kind: "down" };

  // The API returns an array with a single result object.
  const entry = Array.isArray(r.json) ? r.json[0] : null;
  const status = entry?.Status as string | undefined;
  const offices: any[] = Array.isArray(entry?.PostOffice) ? entry.PostOffice : [];

  if (status === "Success" && offices.length > 0) {
    // Prefer a Head/Sub office as the canonical "city"; fall back to the first.
    const head =
      offices.find((o) => o?.BranchType === "Head Post Office") ??
      offices.find((o) => o?.BranchType === "Sub Post Office") ??
      offices[0];

    const district = head?.District ?? null;
    const state = head?.State ?? null;
    // City best-effort: India Post exposes Block/Division/District, not "city".
    const city = head?.Block && head.Block !== "NA" ? head.Block : district;
    const areas = uniq([
      ...offices.map((o) => o?.Name),
      ...offices.map((o) => o?.Block),
      district,
    ]);

    return {
      kind: "ok",
      res: {
        ok: true,
        pincode,
        city: city ?? null,
        district,
        state,
        areas,
        latitude: null,
        longitude: null,
        source: "india_post",
      },
    };
  }

  // "No records found" / "Error" with a real response → PIN truly not found.
  if (status === "Error" || status === "No records found") return { kind: "not_found" };
  // Empty/unknown payload — treat as transient so we never falsely block.
  return { kind: "down" };
}

/* ------------------------------------------------------------------ */
/* Source 2 — Zippopotam (api.zippopotam.us)                           */
/* ------------------------------------------------------------------ */

async function lookupZippopotam(pincode: string): Promise<IndiaPostOutcome> {
  const r = await fetchJsonWithTimeout(`https://api.zippopotam.us/in/${pincode}`, TIMEOUT_MS);
  if (r === null) return { kind: "down" };
  if (r.status === 404) return { kind: "not_found" };

  const places: any[] = Array.isArray(r.json?.places) ? r.json.places : [];
  if (!places.length) return { kind: "not_found" };

  const first = places[0];
  return {
    kind: "ok",
    res: {
      ok: true,
      pincode,
      city: first["place name"] ?? null,
      district: null,
      state: first["state"] ?? null,
      areas: uniq(places.map((p) => p["place name"])),
      latitude: first["latitude"] ? Number(first["latitude"]) : null,
      longitude: first["longitude"] ? Number(first["longitude"]) : null,
      source: "zippopotam",
    },
  };
}

/* ------------------------------------------------------------------ */
/* Public resolver                                                     */
/* ------------------------------------------------------------------ */

/**
 * Resolve an Indian PIN code to its locality, district/city, and state.
 *
 * Order: India Post (complete coverage) → Zippopotam (fallback). Each source
 * gets one retry on a transient network failure. A confirmed "not found" from
 * the primary is double-checked against the fallback before we give up, so a
 * valid PIN missing from one dataset is still resolved.
 */
export async function resolveIndianPincode(raw: string): Promise<PinResolution> {
  const pincode = (raw ?? "").trim();
  if (!/^\d{6}$/.test(pincode)) return { ok: false, reason: "invalid" };

  let sawNetworkFailure = false;
  const sources = [lookupIndiaPost, lookupZippopotam];

  for (const source of sources) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const outcome = await source(pincode);
      if (outcome.kind === "ok") return outcome.res;
      if (outcome.kind === "down") {
        sawNetworkFailure = true;
        continue; // retry this source once, then fall through to next source
      }
      // not_found from this source — stop retrying it and try the next source.
      break;
    }
  }

  // Every source either failed (network) or reported not-found.
  // If we saw any network failure we must NOT block a potentially valid PIN.
  return { ok: false, reason: sawNetworkFailure ? "service_down" : "not_found" };
}
