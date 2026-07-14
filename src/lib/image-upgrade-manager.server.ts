/**
 * Image Intelligence Upgrade Manager — server-only helpers.
 *
 * Classifies existing product_images into actionable groups and runs
 * bulk reprocessing (dry-run or execute) so administrators can maintain
 * the catalog as engine versions bump.
 *
 *   🟢 current          — processed with the latest engine
 *   🔵 upgradeable      — older engine version OR never analyzed
 *   🟡 review           — latest job rejected by quality gate
 *   🔴 attention        — original asset missing / broken
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ENGINE_VERSION_MANIFEST, ENGINE_VERSION } from "@/lib/image-intelligence-versions";

export type UpgradeGroup = "current" | "upgradeable" | "review" | "attention";

export type UpgradeFilters = {
  category?: string | null;
  engineVersion?: string | null; // exact-match filter for reprocessing older builds
};

export type ClassificationSummary = {
  current: number;
  upgradeable: number;
  review: number;
  attention: number;
  total: number;
  currentEngineVersion: string;
};

type ImageRow = {
  id: string;
  product_slug: string | null;
  url: string | null;
  original_url: string | null;
  analyzed_at: string | null;
  optimized_url: string | null;
  engine_version: string | null;
};

async function loadRows(supabase: any, filters: UpgradeFilters): Promise<ImageRow[]> {
  let query = supabase
    .from("product_images")
    .select("id, product_slug, url, original_url, analyzed_at, optimized_url, engine_version");

  if (filters.category) {
    // Join through products by matching category (column name in products).
    const { data: catProducts } = await supabase
      .from("products").select("slug").eq("category", filters.category);
    const slugs = (catProducts ?? []).map((p: { slug: string }) => p.slug);
    if (slugs.length === 0) return [];
    query = query.in("product_slug", slugs);
  }
  if (filters.engineVersion) {
    query = query.eq("engine_version", filters.engineVersion);
  }

  const { data, error } = await query.limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []) as ImageRow[];
}

async function fetchLatestRejectedImageIds(supabase: any, imageIds: string[]): Promise<Set<string>> {
  if (imageIds.length === 0) return new Set();
  // Pull most recent status per image; treat 'rejected' as review-required.
  const { data } = await supabase
    .from("image_intelligence_jobs")
    .select("image_id, status, created_at")
    .in("image_id", imageIds)
    .order("created_at", { ascending: false })
    .limit(2000);
  const latest = new Map<string, string>();
  for (const row of data ?? []) {
    if (!row.image_id) continue;
    if (!latest.has(row.image_id)) latest.set(row.image_id, row.status);
  }
  const rejected = new Set<string>();
  for (const [id, status] of latest) if (status === "rejected") rejected.add(id);
  return rejected;
}

function classifyRow(row: ImageRow, rejected: Set<string>): UpgradeGroup {
  const hasOriginal = Boolean((row.original_url ?? row.url ?? "").trim());
  if (!hasOriginal) return "attention";
  if (rejected.has(row.id)) return "review";
  const analyzed = Boolean(row.analyzed_at);
  const currentEngine = row.engine_version === ENGINE_VERSION;
  if (!analyzed) return "upgradeable";
  if (row.optimized_url && !currentEngine) return "upgradeable";
  if (!row.optimized_url && !currentEngine) return "upgradeable";
  return "current";
}

export async function classifyImages(
  supabase: any,
  filters: UpgradeFilters,
): Promise<ClassificationSummary> {
  const rows = await loadRows(supabase, filters);
  const rejected = await fetchLatestRejectedImageIds(supabase, rows.map((r) => r.id));
  const counts = { current: 0, upgradeable: 0, review: 0, attention: 0 };
  for (const row of rows) counts[classifyRow(row, rejected)]++;
  return {
    ...counts,
    total: rows.length,
    currentEngineVersion: ENGINE_VERSION,
  };
}

export async function selectImagesForGroup(
  supabase: any,
  group: UpgradeGroup,
  filters: UpgradeFilters,
  limit: number,
): Promise<ImageRow[]> {
  const rows = await loadRows(supabase, filters);
  const rejected = await fetchLatestRejectedImageIds(supabase, rows.map((r) => r.id));
  const matching = rows.filter((r) => classifyRow(r, rejected) === group);
  return matching.slice(0, limit);
}

/**
 * Reprocess a single image through the full deterministic pipeline
 * (analyze → normalize → quality gate → upload → apply on success).
 * Records a job row stamped with the current engine manifest.
 */
export async function reprocessOneImage(params: {
  supabase: any;
  userId: string;
  row: ImageRow;
  categorySlug: string | null;
  autoApply: boolean;
  mode: string;
}): Promise<{ status: string; reason?: string; optimizedUrl?: string }> {
  const { supabase, userId, row, categorySlug, autoApply, mode } = params;
  const started = Date.now();
  const url = row.original_url ?? row.url ?? "";
  if (!url) return { status: "attention", reason: "Original asset missing." };

  const { analyzeImageServer } = await import("@/lib/image-intelligence.server");
  const { normalizeImage } = await import("@/lib/image-normalization.server");
  const { runQualityGate } = await import("@/lib/image-quality-gate.server");
  const { resolveCategoryFraming } = await import("@/lib/image-intelligence-types");

  const analysis = await analyzeImageServer({ imageUrl: url, categorySlug, depth: "full" });
  if (analysis.status !== "analyzed" || !analysis.pixels || !analysis.bytes || !analysis.intelligence) {
    await supabase.from("image_intelligence_jobs").insert({
      image_url: url, product_slug: row.product_slug, image_id: row.id,
      job_type: "reprocess", mode, status: "failed",
      analysis: analysis.intelligence ?? {},
      error_message: analysis.errorMessage ?? "Analysis prerequisite failed.",
      duration_ms: Date.now() - started, requested_by: userId,
      ...ENGINE_VERSION_MANIFEST,
    });
    return { status: "failed", reason: analysis.errorMessage ?? "Analysis failed." };
  }

  // Always at minimum persist the fresh analysis + stamp engine metadata.
  await supabase.from("product_images")
    .update({ analysis_json: analysis.intelligence, analyzed_at: new Date().toISOString() })
    .eq("id", row.id);

  const framing = resolveCategoryFraming(categorySlug);
  const norm = await normalizeImage(analysis.bytes, analysis.pixels, framing);
  if (norm.status !== "produced" || !norm.bytes) {
    await supabase.from("image_intelligence_jobs").insert({
      image_url: url, product_slug: row.product_slug, image_id: row.id,
      job_type: "reprocess", mode, status: "analyzed",
      analysis: analysis.intelligence, actions_json: norm.actions,
      error_message: `Normalization skipped: ${norm.skipReason ?? "unknown"}`,
      duration_ms: Date.now() - started, requested_by: userId,
      ...ENGINE_VERSION_MANIFEST,
    });
    return { status: "analyzed", reason: norm.skipReason };
  }

  const gate = await runQualityGate({
    originalPixels: analysis.pixels, optimizedBytes: norm.bytes, framing,
  });
  if (!gate.passed) {
    await supabase.from("image_intelligence_jobs").insert({
      image_url: url, product_slug: row.product_slug, image_id: row.id,
      job_type: "reprocess", mode, status: "rejected",
      analysis: analysis.intelligence, actions_json: norm.actions,
      rejection_reason: gate.reason ?? "Quality gate failed.",
      duration_ms: Date.now() - started, requested_by: userId,
      ...ENGINE_VERSION_MANIFEST,
    });
    return { status: "rejected", reason: gate.reason };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const key = `optimized/${crypto.randomUUID()}.webp`;
  const { error: uploadErr } = await supabaseAdmin.storage
    .from("product-images").upload(key, norm.bytes, { contentType: "image/webp", upsert: false });
  if (uploadErr) {
    await supabase.from("image_intelligence_jobs").insert({
      image_url: url, product_slug: row.product_slug, image_id: row.id,
      job_type: "reprocess", mode, status: "failed",
      analysis: analysis.intelligence, actions_json: norm.actions,
      error_message: `Upload failed: ${uploadErr.message}`,
      duration_ms: Date.now() - started, requested_by: userId,
      ...ENGINE_VERSION_MANIFEST,
    });
    return { status: "failed", reason: uploadErr.message };
  }
  const { data: pub } = supabaseAdmin.storage.from("product-images").getPublicUrl(key);
  const optimizedUrl = pub.publicUrl;

  await supabase.from("image_intelligence_jobs").insert({
    image_url: url, product_slug: row.product_slug, image_id: row.id,
    job_type: "reprocess", mode, status: "succeeded",
    analysis: analysis.intelligence, actions_json: norm.actions,
    optimized_url: optimizedUrl, health_score: analysis.intelligence.qualityScore,
    duration_ms: Date.now() - started, requested_by: userId,
    ...ENGINE_VERSION_MANIFEST,
  });

  if (autoApply) {
    await supabase.from("product_images").update({
      optimized_url: optimizedUrl,
      optimization_actions: norm.actions,
      optimization_applied_at: new Date().toISOString(),
      ...ENGINE_VERSION_MANIFEST,
    }).eq("id", row.id);
  }

  return { status: "succeeded", optimizedUrl };
}
