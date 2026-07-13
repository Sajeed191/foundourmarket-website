/**
 * Marketplace Intelligence — centralized recommendation engine.
 *
 * Public surface: import the provider + `useRecommendationRail` from here.
 * Every discovery surface consumes this one engine so scoring is never
 * scattered across components, and every recommendation carries a score,
 * confidence and reason.
 */
export { runEngine, runEngineProducts } from "./engine";
export {
  RecommendationProvider,
  useRecommendationSignals,
  useRecommendationRail,
} from "./context";
export { buildAffinity, scoreProduct, isFresh, inventoryHealth } from "./scorer";
export { diversify } from "./diversity";
export { activeSeasons, seasonalRelevance } from "./seasonal";
export type { Season } from "./seasonal";
export { journeyRails, primaryStrategy } from "./strategies";
export type { JourneyStage, JourneyRail } from "./strategies";
export { resolveBusinessRules } from "./rules";
export type { BusinessRule, RuleKind, RuleTargetType, ResolvedRules } from "./rules";
export { getGraphEdges, getGraphEdgeSets } from "./graph.functions";
export type { GraphEdge, GraphEdgeType } from "./graph.functions";
export {
  getVisitorId,
  assignVariant,
  resolveExperiment,
  currentVariant,
} from "./experiments";
export type { Experiment } from "./experiments";
export {
  recordImpression,
  recordClick,
  priorityMultiplier,
  getPerformanceSnapshot,
  getPerformanceReport,
  qualityScore,
  recordFunnelEvent,
  markRecommendationClick,
  attributeStage,
} from "./performance";
export type { FunnelStage, SourcePerformance } from "./performance";
export type {
  RecommendationItem,
  RecommendationSignals,
  RecommendationSource,
  StrategyKey,
  EngineConfig,
  RecommendationBoosts,
  LocationSignal,
  ScoreBreakdown,
} from "./types";
