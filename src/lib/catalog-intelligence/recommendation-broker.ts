/**
 * Recommendation Broker — Catalog Intelligence 2.0.
 *
 * Normalises every IntelligenceModule output into a single Recommendation
 * stream, merges duplicates, and prioritises by (Potential Impact × severity
 * × confidence × score gap). The Marketplace AI Assistant reads ONLY the top
 * recommendation — modules never talk to the UI directly. This preserves
 * "one message, one action" at every surface.
 *
 * The broker is deliberately dumb: no per-module knowledge, no branching.
 * Any new module that emits IntelligenceModule is automatically included.
 */
import type { IntelligenceModule, PotentialImpact } from "./intelligence-module";

export type Recommendation = {
  module: string;
  priority: number;
  impact: PotentialImpact;
  recommendation: string;
  action: string;
  actionHref?: string;
  confidence: number;
  status: IntelligenceModule["status"];
  score: number;
};

const IMPACT_WEIGHT: Record<PotentialImpact, number> = {
  High: 100,
  Medium: 60,
  Low: 25,
};

function priorityFor(m: IntelligenceModule): number {
  const impact = IMPACT_WEIGHT[m.potentialImpact ?? "Low"];
  const scoreGap = 100 - m.score; // worse scores → higher priority
  const conf = m.confidence / 100;
  return Math.round((impact * 0.6 + scoreGap * 0.4) * conf);
}

/**
 * Normalise a set of IntelligenceModule outputs into a prioritised
 * Recommendation stream. Modules with no meaningful recommendation (score ≥ 95
 * AND status "green") are excluded so the broker never surfaces a healthy
 * module as a "top recommendation".
 */
export function brokerRecommendations(modules: IntelligenceModule[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const seen = new Set<string>();

  for (const m of modules) {
    if (!m.recommendation) continue;
    if (m.score >= 95 && m.status === "green") continue;

    // Dedup: same recommendation text from different modules collapses to the
    // higher-priority one.
    const key = m.recommendation.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    recs.push({
      module: m.moduleId,
      priority: priorityFor(m),
      impact: m.potentialImpact ?? "Low",
      recommendation: m.recommendation,
      action: m.action,
      actionHref: m.actionHref,
      confidence: m.confidence,
      status: m.status,
      score: m.score,
    });
  }

  return recs.sort((a, b) => b.priority - a.priority);
}

/** Convenience: single top recommendation, or null when everything is healthy. */
export function topRecommendation(modules: IntelligenceModule[]): Recommendation | null {
  return brokerRecommendations(modules)[0] ?? null;
}
