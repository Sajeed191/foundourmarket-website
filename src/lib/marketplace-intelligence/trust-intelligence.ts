/**
 * Trust Intelligence — Marketplace Intelligence 3.0, Module 4 (final module
 * before the Marketplace Health orchestrator).
 *
 * Aggregates operational-risk signals from already-published module outputs.
 * Advisory only — no new checks, no new detectors, no product mutation, no
 * enforcement. Consumes ONLY public contracts from Catalog Intelligence 2.0
 * and peer Marketplace Intelligence modules:
 *
 *   - IntelligenceModule (with evidence)
 *   - MarketplaceReadiness (blockers + status)
 *   - Recommendation (via brokerRecommendations)
 *   - VendorIntelligence (tier + score)
 *   - RelationshipIntelligence (isolation signal)
 *
 * Intelligence flows upward only. Deterministic, explainable, one-recommendation.
 */
import {
  brokerRecommendations,
  statusFromScore,
  type Evidence,
  type EvidenceSeverity,
  type IntelligenceModule,
  type MarketplaceReadiness,
  type Recommendation,
} from "@/lib/catalog-intelligence";
import type { RelationshipIntelligence } from "./relationship-intelligence";
import type { VendorIntelligence } from "./vendor-intelligence";

export type TrustStatus = "healthy" | "warning" | "critical";

export type RiskArea =
  | "images"
  | "duplicates"
  | "readiness"
  | "attributes"
  | "variants"
  | "seo"
  | "pricing"
  | "relationships"
  | "vendors";

export type Risk = {
  area: RiskArea;
  severity: EvidenceSeverity;
  /** Human-readable one-line description of the operational risk. */
  message: string;
  /** How many listings/vendors this affects. */
  affected: number;
  /** Approximate cost in trust points (0–100). */
  impact: number;
};

export type TrustIntelligence = {
  moduleId: "trust_intelligence";
  score: number;
  confidence: number;
  status: TrustStatus;
  topRecommendation: Recommendation | null;
  risks: Risk[];
  strengths: string[];
  evidence: Evidence[];
  explainable: true;
};

type TrustInput = {
  /** All listings, each with its published modules + readiness. */
  listings: Array<{
    productId: string;
    readiness: MarketplaceReadiness;
    modules: IntelligenceModule[];
    relationships?: RelationshipIntelligence;
  }>;
  vendors?: VendorIntelligence[];
};

// Map moduleId → risk area for evidence roll-up.
const MODULE_AREA: Record<string, RiskArea> = {
  image_intelligence: "images",
  gallery_health: "images",
  duplicate_detection: "duplicates",
  duplicate_intelligence: "duplicates",
  product_completeness: "readiness",
  attribute_intelligence: "attributes",
  variant_intelligence: "variants",
  seo_intelligence: "seo",
  pricing_intelligence: "pricing",
  relationship_intelligence: "relationships",
};

function statusFor(score: number): TrustStatus {
  if (score >= 80) return "healthy";
  if (score >= 60) return "warning";
  return "critical";
}

export function analyzeTrustIntelligence(input: TrustInput): TrustIntelligence {
  const listings = input.listings ?? [];
  const vendors = input.vendors ?? [];
  const total = listings.length;

  // ---- Aggregate module evidence into risk areas ------------------------
  type Bucket = {
    area: RiskArea;
    severity: EvidenceSeverity;
    message: string;
    occurrences: number;
    affected: Set<string>;
    impact: number;
  };
  const buckets = new Map<string, Bucket>();

  for (const l of listings) {
    for (const m of l.modules) {
      const area = MODULE_AREA[m.moduleId];
      if (!area) continue;
      for (const e of m.evidence) {
        if (e.severity === "info") continue;
        const key = `${area}::${e.key}`;
        const b =
          buckets.get(key) ??
          buckets
            .set(key, {
              area,
              severity: e.severity,
              message: e.message,
              occurrences: 0,
              affected: new Set(),
              impact: 0,
            })
            .get(key)!;
        b.occurrences += 1;
        b.affected.add(l.productId);
        b.impact += e.impact;
        // Escalate severity if any occurrence is critical.
        if (e.severity === "critical") b.severity = "critical";
      }
    }
  }

  // ---- Vendor risk ------------------------------------------------------
  const atRiskVendors = vendors.filter((v) => v.tier === "at_risk");
  const watchVendors = vendors.filter((v) => v.tier === "watch");
  if (atRiskVendors.length > 0) {
    buckets.set("vendors::at_risk", {
      area: "vendors",
      severity: "critical",
      message: `${atRiskVendors.length} vendor${atRiskVendors.length === 1 ? " is" : "s are"} flagged at risk.`,
      occurrences: atRiskVendors.length,
      affected: new Set(atRiskVendors.map((v) => v.vendorId)),
      impact: atRiskVendors.length * 12,
    });
  }
  if (watchVendors.length > 0) {
    buckets.set("vendors::watch", {
      area: "vendors",
      severity: "warning",
      message: `${watchVendors.length} vendor${watchVendors.length === 1 ? " needs" : "s need"} monitoring.`,
      occurrences: watchVendors.length,
      affected: new Set(watchVendors.map((v) => v.vendorId)),
      impact: watchVendors.length * 5,
    });
  }

  // ---- Relationship-isolation risk (public relationship contract only) --
  const isolatedListings = listings.filter((l) => l.relationships?.isolated).length;
  if (isolatedListings > 0 && isolatedListings >= Math.max(3, Math.round(total * 0.25))) {
    buckets.set("relationships::isolation_hotspot", {
      area: "relationships",
      severity: "warning",
      message: `${isolatedListings} listings have no detected relationships — potential fragmentation.`,
      occurrences: isolatedListings,
      affected: new Set(
        listings.filter((l) => l.relationships?.isolated).map((l) => l.productId),
      ),
      impact: Math.min(20, Math.round((isolatedListings / Math.max(1, total)) * 40)),
    });
  }

  // ---- Readiness blockers roll-up --------------------------------------
  const notReady = listings.filter(
    (l) => l.readiness.status === "not_ready" || l.readiness.status === "needs_attention",
  ).length;
  if (notReady > 0) {
    buckets.set("readiness::below_bar", {
      area: "readiness",
      severity: notReady / Math.max(1, total) > 0.3 ? "critical" : "warning",
      message: `${notReady} listings are below the marketplace-ready bar.`,
      occurrences: notReady,
      affected: new Set(
        listings
          .filter(
            (l) =>
              l.readiness.status === "not_ready" ||
              l.readiness.status === "needs_attention",
          )
          .map((l) => l.productId),
      ),
      impact: Math.min(30, Math.round((notReady / Math.max(1, total)) * 60)),
    });
  }

  // ---- Compose risks list ----------------------------------------------
  const risks: Risk[] = [...buckets.values()]
    .map((b) => ({
      area: b.area,
      severity: b.severity,
      message: b.message,
      affected: b.affected.size,
      impact: Math.min(100, Math.round(b.impact)),
    }))
    .sort((a, b) => {
      const rank: Record<EvidenceSeverity, number> = { critical: 0, warning: 1, info: 2 };
      if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
      return b.affected - a.affected;
    });

  // ---- Score: 100 minus weighted risk pressure -------------------------
  let penalty = 0;
  for (const r of risks) {
    const share = r.affected / Math.max(1, total);
    const weight = r.severity === "critical" ? 40 : r.severity === "warning" ? 18 : 5;
    penalty += weight * Math.min(1, share);
  }
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const status = statusFor(score);

  // ---- Strengths: modules that are consistently strong ----------------
  const moduleAverages = new Map<string, number[]>();
  for (const l of listings) {
    for (const m of l.modules) {
      (moduleAverages.get(m.moduleId) ?? moduleAverages.set(m.moduleId, []).get(m.moduleId)!).push(
        m.score,
      );
    }
  }
  const strengths: string[] = [];
  for (const [moduleId, scores] of moduleAverages) {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    if (avg >= 85) {
      const label = moduleId
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      strengths.push(`${label} averages ${avg}/100 across the marketplace.`);
    }
  }
  if (vendors.length && vendors.every((v) => v.tier === "trusted" || v.tier === "reliable")) {
    strengths.push("All vendors are in the trusted or reliable tier.");
  }

  // ---- Confidence: coverage-driven -------------------------------------
  const withModules = listings.filter((l) => l.modules.length > 0).length;
  const coverage = total ? withModules / total : 0;
  const vendorCoverage = vendors.length > 0 ? 1 : 0.7;
  const confidence = Math.round((0.7 * coverage + 0.3 * vendorCoverage) * 100);

  // ---- Evidence for View Details (deterministic list) -----------------
  const evidence: Evidence[] = risks.slice(0, 10).map((r) => ({
    key: `${r.area}_risk`,
    message: r.message,
    severity: r.severity,
    impact: r.impact,
  }));

  // ---- ONE top recommendation via public broker over all modules ------
  const allModules = listings.flatMap((l) => l.modules);
  const topRecommendation = brokerRecommendations(allModules)[0] ?? null;

  // Ensure the resulting object still satisfies the ambient status helper.
  void statusFromScore(score);

  return {
    moduleId: "trust_intelligence",
    score,
    confidence,
    status,
    topRecommendation,
    risks,
    strengths,
    evidence,
    explainable: true,
  };
}
