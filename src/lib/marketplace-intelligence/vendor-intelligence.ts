/**
 * Vendor Intelligence — Marketplace Intelligence 3.0, Module 1.
 *
 * Evaluates a vendor's overall marketplace health by aggregating the
 * *published contracts* of Catalog Intelligence 2.0 for each of that vendor's
 * listings. Per the architectural rule, this module reads only:
 *
 *   - `MarketplaceReadiness` (from marketplace-readiness.ts)
 *   - `IntelligenceModule` (canonical contract)
 *   - `Recommendation` (from the Recommendation Broker)
 *
 * It never imports internal analysis code from Attribute / Variant / SEO /
 * Pricing / Completeness modules. If any of those change, Vendor Intelligence
 * keeps working as long as the contracts remain stable.
 *
 * Deterministic. Advisory only. Never mutates vendor data. Follows the
 * project AI UX rule: one recommendation, one action, plain language,
 * traffic-light status.
 */
import {
  statusFromScore,
  type Evidence,
  type IntelligenceModule,
  type PotentialImpact,
} from "@/lib/catalog-intelligence";
import type {
  MarketplaceReadiness,
  ReadinessStatus,
  Recommendation,
} from "@/lib/catalog-intelligence";
import { brokerRecommendations } from "@/lib/catalog-intelligence";

/** A single vendor listing's published health, as seen through public contracts. */
export type VendorListingSnapshot = {
  productId: string;
  productSlug?: string;
  /** Marketplace Readiness output for this listing. */
  readiness: MarketplaceReadiness;
  /** The listing's IntelligenceModule outputs (contract-only). */
  modules: IntelligenceModule[];
  /** True if the listing has ever been published successfully. */
  published?: boolean;
  /** True if a duplicate was ever flagged for this listing. */
  duplicateFlagged?: boolean;
};

/** Optional behavioural signals reported by the vendor lifecycle system. */
export type VendorSignals = {
  approvedUploads?: number;
  rejectedUploads?: number;
  duplicateAttempts?: number;
};

export type VendorHealthTier = "trusted" | "reliable" | "watch" | "at_risk";

export type VendorIntelligence = IntelligenceModule & {
  vendorId: string;
  vendorName: string;
  tier: VendorHealthTier;
  listingCount: number;
  averages: {
    readiness: number;
    completeness: number | null;
    attributes: number | null;
    variants: number | null;
    seo: number | null;
    pricing: number | null;
    images: number | null;
  };
  distribution: Record<ReadinessStatus, number>;
  publishSuccessRate: number | null;
  duplicateRate: number | null;
  topBlockers: Recommendation[];
};

export const VENDOR_HEALTH_LABEL: Record<VendorHealthTier, string> = {
  trusted: "Trusted",
  reliable: "Reliable",
  watch: "Watch",
  at_risk: "At Risk",
};

function tierFromScore(score: number): VendorHealthTier {
  if (score >= 85) return "trusted";
  if (score >= 70) return "reliable";
  if (score >= 50) return "watch";
  return "at_risk";
}

function meanOrNull(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function collectModuleScore(
  listings: VendorListingSnapshot[],
  moduleId: string,
): number | null {
  const scores: number[] = [];
  for (const l of listings) {
    const m = l.modules.find((mod) => mod.moduleId === moduleId);
    if (m) scores.push(m.score);
  }
  return meanOrNull(scores);
}

function derivePotentialImpact(score: number, criticalCount: number): PotentialImpact {
  if (criticalCount > 0 || score < 55) return "High";
  if (score < 75) return "Medium";
  return "Low";
}

export function analyzeVendorIntelligence(input: {
  vendorId: string;
  vendorName: string;
  listings: VendorListingSnapshot[];
  signals?: VendorSignals;
}): VendorIntelligence {
  const { vendorId, vendorName, listings, signals } = input;
  const listingCount = listings.length;

  const readinessScores = listings.map((l) => l.readiness.score);
  const meanReadiness = meanOrNull(readinessScores) ?? 0;

  const distribution: Record<ReadinessStatus, number> = {
    ready: 0,
    almost_ready: 0,
    needs_attention: 0,
    not_ready: 0,
  };
  for (const l of listings) distribution[l.readiness.status] += 1;

  const averages = {
    readiness: meanReadiness,
    completeness: collectModuleScore(listings, "product_completeness"),
    attributes: collectModuleScore(listings, "attribute_intelligence"),
    variants: collectModuleScore(listings, "variant_intelligence"),
    seo: collectModuleScore(listings, "seo_intelligence"),
    pricing: collectModuleScore(listings, "pricing_intelligence"),
    images: collectModuleScore(listings, "image_intelligence"),
  };

  // Behavioural signals (optional).
  const uploads =
    (signals?.approvedUploads ?? 0) + (signals?.rejectedUploads ?? 0);
  const publishSuccessRate = uploads > 0
    ? Math.round(((signals?.approvedUploads ?? 0) / uploads) * 100)
    : listingCount > 0
      ? Math.round(
          (listings.filter((l) => l.published).length / listingCount) * 100,
        )
      : null;

  const dupCountFromListings = listings.filter((l) => l.duplicateFlagged).length;
  const dupAttempts = signals?.duplicateAttempts ?? dupCountFromListings;
  const duplicateRate = listingCount > 0
    ? Math.round((dupAttempts / listingCount) * 100)
    : null;

  // Weighted blend: 70% catalog quality (readiness) + 30% behavioural.
  const behavioural =
    (publishSuccessRate ?? 100) * 0.7 +
    (100 - Math.min(100, duplicateRate ?? 0)) * 0.3;
  const score = Math.max(
    0,
    Math.min(100, Math.round(meanReadiness * 0.7 + behavioural * 0.3)),
  );

  // Confidence: scales with listing volume (small samples = lower confidence).
  const volumeConf = listingCount === 0 ? 0 : Math.min(100, 40 + listingCount * 5);
  const meanContractConf = meanOrNull(
    listings.flatMap((l) => l.modules.map((m) => m.confidence)),
  ) ?? 0;
  const confidence = Math.round(volumeConf * 0.5 + meanContractConf * 0.5);

  // Cross-listing top blockers, via the public Recommendation Broker.
  const allModules = listings.flatMap((l) => l.modules);
  const topBlockers = brokerRecommendations(allModules).slice(0, 5);

  const criticalCount = listings.reduce(
    (n, l) =>
      n +
      l.modules.reduce(
        (mm, m) => mm + m.evidence.filter((e) => e.severity === "critical").length,
        0,
      ),
    0,
  );

  // Evidence: peer-level roll-ups, not per-listing noise.
  const evidence: Evidence[] = [];
  if (distribution.not_ready > 0) {
    evidence.push({
      key: "listings_not_ready",
      message: `${distribution.not_ready} listing${distribution.not_ready === 1 ? "" : "s"} not ready to publish.`,
      severity: "critical",
      impact: Math.min(60, distribution.not_ready * 10),
    });
  }
  if (distribution.needs_attention > 0) {
    evidence.push({
      key: "listings_need_attention",
      message: `${distribution.needs_attention} listing${distribution.needs_attention === 1 ? "" : "s"} need attention before they perform well.`,
      severity: "warning",
      impact: Math.min(30, distribution.needs_attention * 5),
    });
  }
  if (duplicateRate !== null && duplicateRate >= 10) {
    evidence.push({
      key: "duplicate_rate_high",
      message: `Duplicate rate is ${duplicateRate}% — above the healthy 10% ceiling.`,
      severity: duplicateRate >= 25 ? "critical" : "warning",
      impact: Math.min(30, duplicateRate),
    });
  }
  if (publishSuccessRate !== null && publishSuccessRate < 80) {
    evidence.push({
      key: "publish_success_low",
      message: `Only ${publishSuccessRate}% of uploads reach publish — vendor may need onboarding help.`,
      severity: publishSuccessRate < 60 ? "critical" : "warning",
      impact: 20,
    });
  }
  for (const [key, avg] of Object.entries(averages)) {
    if (key === "readiness" || avg === null) continue;
    if (avg < 60) {
      evidence.push({
        key: `avg_${key}_low`,
        message: `Average ${key} score is ${avg} — below the ${60} healthy floor.`,
        severity: avg < 45 ? "critical" : "warning",
        impact: Math.min(25, 70 - avg),
      });
    }
  }
  if (!evidence.length && listingCount === 0) {
    evidence.push({
      key: "no_listings",
      message: "Vendor has no listings yet — nothing to evaluate.",
      severity: "info",
      impact: 0,
    });
  }

  // ONE recommendation — reuse the broker's top rec when present, otherwise
  // fall back to a vendor-level summary.
  const top = topBlockers[0];
  const recommendation = top
    ? `Fix "${top.recommendation}" across this vendor's catalogue.`
    : listingCount === 0
      ? "Onboard the vendor and add at least one listing to evaluate quality."
      : "Vendor catalogue is healthy — no action needed.";
  const action = top?.action ?? (listingCount === 0 ? "Add listing" : "Review vendor");
  const actionHref = top?.actionHref;

  const potentialImpact = derivePotentialImpact(score, criticalCount);

  return {
    moduleId: "vendor_intelligence",
    score,
    confidence,
    status: statusFromScore(score),
    recommendation,
    action,
    actionHref,
    potentialImpact,
    evidence,
    vendorId,
    vendorName,
    tier: tierFromScore(score),
    listingCount,
    averages,
    distribution,
    publishSuccessRate,
    duplicateRate,
    topBlockers,
  };
}
