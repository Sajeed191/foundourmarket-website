/**
 * Catalog Intelligence — public surface.
 *
 * The unified, explainable intelligence layer on top of the existing
 * Marketplace Intelligence engines. Deterministic scoring, grounded in real
 * catalog data, with human-readable reasons for every decision. Never blocks,
 * never mutates content.
 */
export * from "./types";
export { buildFingerprint, sharesStrongCode } from "./fingerprint";
export {
  classifyRelationship,
  classifyMatches,
  isDuplicateRisk,
  RELATIONSHIP_LABEL,
} from "./relationships";
export { scoreCatalogHealth } from "./catalog-health";
export type { HealthInput, CatalogHealth, HealthDimension, HealthSuggestion } from "./catalog-health";
export { analyzeImage, analyzeGallery } from "./image-quality";
export type { ImageQuality, ImageIssue, ImageIssueKey } from "./image-quality";
