/**
 * Phase B Step 4 — AI Product Detection + Background Intelligence.
 *
 * ONE gateway call per image populates BOTH `analysis.product` and
 * `analysis.background`. Deterministic Tier 1 analysis remains authoritative
 * for every other field. Results are cached in `media_assets.analysis` and
 * never re-run automatically unless the caller passes `force: true`.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ImageAnalysis, BackgroundType } from "@/lib/image-normalization";

const STAFF_ROLES = ["admin", "super_admin", "manager", "editor"];

const AI_MODEL = "google/gemini-2.5-flash-lite";
const AI_PROVIDER = "Google";
const AI_MODEL_VERSION = "2025.01"; // bump to invalidate cached AI payloads

const SYSTEM_PROMPT = `You are a computer vision analyst for a premium marketplace catalog.
You inspect ONE product photograph and return STRICT JSON only (no markdown, no prose).

Return exactly this shape:
{
  "product": {
    "objectCount": <integer, 0-10>,
    "primaryObject": <1-based index of the main product, or null>,
    "confidence": <number 0-1, overall detection confidence>,
    "objects": [
      {
        "id": <1-based integer>,
        "label": "<short product noun, e.g. 'shoe', 'lamp'>",
        "confidence": <number 0-1>,
        "bbox": { "x": <0-1>, "y": <0-1>, "width": <0-1>, "height": <0-1> }
      }
    ],
    "suitableForNormalization": <boolean>,
    "notes": "<one short sentence, max 120 chars>"
  },
  "background": {
    "type": "solid" | "gradient" | "photo" | "transparent",
    "confidence": <number 0-1>,
    "dominantColor": "<#rrggbb or null>",
    "clutterScore": <number 0-1, 0 = pristine, 1 = very busy>,
    "removable": <boolean>
  }
}

Rules:
- bbox values are normalized (0.0-1.0) relative to image dimensions.
- If no product is detectable, return objectCount: 0, objects: [], primaryObject: null, suitableForNormalization: false.
- If multiple products, list each object; primaryObject is the largest/most centered.
- Never fabricate. Set confidence low if uncertain.
- Output JSON ONLY.`;

// ─────────────────────────────────────────────────────────────────────────────
// AI payload shapes
// ─────────────────────────────────────────────────────────────────────────────

export type AiProductObject = {
  id: number;
  label: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
};

export type AiProductPayload = {
  analyzed: true;
  objectCount: number;
  primaryObject: number | null;
  confidence: number;
  objects: AiProductObject[];
  suitableForNormalization: boolean;
  notes: string;
  // Bridge to Tier 1 flat fields (kept for back-compat readers):
  occupancy: number;
  emptyMarginPct: number;
};

export type AiBackgroundPayload = {
  type: BackgroundType;
  confidence: number;
  colorHex: string | null;
  dominantColor: string | null;
  clutterScore: number;
  removable: boolean;
  hasTransparentBorder: boolean;
};

export type AiMeta = {
  provider: string;
  model: string;
  version: string;
  analyzedAt: string;
  cacheVersion: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Gateway call
// ─────────────────────────────────────────────────────────────────────────────

async function callVisionAI(imageUrl: string): Promise<{
  product: AiProductPayload;
  background: AiBackgroundPayload;
}> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this product image. Return JSON only." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings.");
  if (!res.ok) throw new Error(`AI vision request failed (${res.status}).`);

  const json = await res.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "{}";
  let parsed: {
    product?: Record<string, unknown>;
    background?: Record<string, unknown>;
  };
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : {};
  }

  return {
    product: normalizeProduct(parsed.product ?? {}),
    background: normalizeBackground(parsed.background ?? {}),
  };
}

function clamp01(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function normalizeProduct(raw: Record<string, unknown>): AiProductPayload {
  const rawObjects = Array.isArray(raw.objects) ? raw.objects : [];
  const objects: AiProductObject[] = rawObjects.slice(0, 10).map((o, i) => {
    const src = (o ?? {}) as Record<string, unknown>;
    const bbox = (src.bbox ?? {}) as Record<string, unknown>;
    return {
      id: Number.isInteger(src.id) ? (src.id as number) : i + 1,
      label: String(src.label ?? "product").slice(0, 40),
      confidence: clamp01(src.confidence),
      bbox: {
        x: clamp01(bbox.x),
        y: clamp01(bbox.y),
        width: clamp01(bbox.width),
        height: clamp01(bbox.height),
      },
    };
  });

  const objectCount = Number.isInteger(raw.objectCount)
    ? Math.max(0, Math.min(10, raw.objectCount as number))
    : objects.length;

  // Bridge AI bbox → Tier 1 occupancy so downstream framing/hero scoring
  // benefits automatically without new call sites.
  const primary = objects.find((o) => o.id === raw.primaryObject) ?? objects[0];
  const occupancy = primary
    ? Math.round(primary.bbox.width * primary.bbox.height * 100)
    : 0;

  return {
    analyzed: true,
    objectCount,
    primaryObject:
      typeof raw.primaryObject === "number"
        ? raw.primaryObject
        : objects[0]?.id ?? null,
    confidence: clamp01(raw.confidence),
    objects,
    suitableForNormalization: Boolean(raw.suitableForNormalization),
    notes: String(raw.notes ?? "").slice(0, 200),
    occupancy,
    emptyMarginPct: Math.max(0, 100 - occupancy),
  };
}

function normalizeBackground(raw: Record<string, unknown>): AiBackgroundPayload {
  const t = String(raw.type ?? "photo").toLowerCase();
  const type: BackgroundType =
    t === "solid" || t === "gradient" || t === "photo" || t === "transparent"
      ? (t as BackgroundType)
      : "photo";
  const color = String(raw.dominantColor ?? "").trim();
  const validHex = /^#[0-9a-f]{6}$/i.test(color) ? color : null;
  return {
    type,
    confidence: clamp01(raw.confidence),
    colorHex: validHex,
    dominantColor: validHex,
    clutterScore: clamp01(raw.clutterScore),
    removable: Boolean(raw.removable),
    hasTransparentBorder: type === "transparent",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Persist into media_assets.analysis (v2 namespace merge — additive only)
// ─────────────────────────────────────────────────────────────────────────────

function mergeIntoAnalysis(
  existing: Partial<ImageAnalysis> | null,
  product: AiProductPayload,
  background: AiBackgroundPayload,
  ai: AiMeta,
): Partial<ImageAnalysis> {
  const base = (existing ?? {}) as Partial<ImageAnalysis>;
  return {
    ...base,
    version: 2,
    product: {
      ...(base.product ?? { analyzed: false, occupancy: 0, emptyMarginPct: 0, objects: [], confidence: null }),
      analyzed: true,
      occupancy: product.occupancy,
      emptyMarginPct: product.emptyMarginPct,
      objects: product.objects,
      confidence: product.confidence,
    },
    background: {
      ...(base.background ?? { type: "photo", colorHex: null, hasTransparentBorder: false, confidence: null }),
      type: background.type,
      colorHex: background.colorHex,
      hasTransparentBorder: background.hasTransparentBorder,
      confidence: background.confidence,
    },
    ai: {
      provider: ai.provider,
      model: ai.model,
      version: ai.version,
      analyzedAt: ai.analyzedAt,
      cacheVersion: ai.cacheVersion,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Server functions
// ─────────────────────────────────────────────────────────────────────────────

async function assertStaff(supabase: {
  from: (t: string) => {
    select: (c: string) => {
      eq: (c: string, v: string) => {
        in: (c: string, v: string[]) => Promise<{ data: unknown[] | null }>;
      };
    };
  };
}, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", STAFF_ROLES);
  if (!data || data.length === 0) {
    throw new Error("Forbidden: staff access required.");
  }
}

const analyzeInput = z.object({
  mediaAssetId: z.string().uuid(),
  force: z.boolean().optional(),
});

/**
 * Analyze a persisted media_asset with AI vision. Cached: returns the stored
 * payload unless `force: true` OR the cached AI model version differs.
 */
export const analyzeMediaAssetWithAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => analyzeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as {
      supabase: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      userId: string;
    };
    await assertStaff(supabase, userId);

    const { data: row, error } = await supabase
      .from("media_assets")
      .select("id, url, normalized_url, analysis")
      .eq("id", data.mediaAssetId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Media asset not found.");

    const cached = (row.analysis ?? null) as Partial<ImageAnalysis> | null;
    const cachedAi = cached?.ai;
    if (
      !data.force &&
      cached?.product?.analyzed &&
      cachedAi?.model === AI_MODEL &&
      cachedAi?.version === AI_MODEL_VERSION
    ) {
      return {
        cached: true,
        analysis: cached,
      };
    }

    const imageUrl = row.normalized_url || row.url;
    if (!imageUrl) throw new Error("Media asset has no accessible URL.");

    const { product, background } = await callVisionAI(imageUrl);

    const ai: AiMeta = {
      provider: AI_PROVIDER,
      model: AI_MODEL,
      version: AI_MODEL_VERSION,
      analyzedAt: new Date().toISOString(),
      cacheVersion: (cachedAi?.cacheVersion ?? 0) + 1,
    };

    const merged = mergeIntoAnalysis(cached, product, background, ai);
    const { error: upErr } = await supabase
      .from("media_assets")
      .update({ analysis: merged })
      .eq("id", row.id);
    if (upErr) throw new Error(upErr.message);

    return { cached: false, analysis: merged };
  });
