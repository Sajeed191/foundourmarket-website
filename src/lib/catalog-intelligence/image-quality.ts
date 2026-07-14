/**
 * Image Intelligence — in-browser, deterministic image quality analysis.
 *
 * Draws each image to an offscreen canvas and derives real metrics: resolution,
 * aspect ratio, brightness (dark / overexposed), sharpness (Laplacian variance
 * for blur), and background whiteness. Produces a 0–100 quality score with
 * explainable issues and recommendations. Never rejects — only recommends.
 *
 * Browser-only (uses canvas). Results are cached per URL so each image is
 * analysed once. Matches the client-side approach of duplicate-detection's
 * image-hash.ts to avoid Worker native-dependency limits.
 */

export type ImageIssueKey =
  | "low_resolution"
  | "blurry"
  | "dark"
  | "overexposed"
  | "wrong_aspect"
  | "no_white_background"
  | "load_failed";

export type ImageIssue = {
  key: ImageIssueKey;
  label: string;
  severity: "warning" | "info";
  recommendation: string;
};

export type ImageQuality = {
  url: string;
  score: number; // 0–100
  width: number;
  height: number;
  brightness: number; // 0–255 avg luma
  sharpness: number; // Laplacian variance
  whiteBackground: boolean;
  issues: ImageIssue[];
};

const cache = new Map<string, ImageQuality>();
const MAX = 64; // downscale target for analysis

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load failed"));
    img.src = url;
  });
}

/** Analyse one image URL. Cached; safe to call repeatedly. */
export async function analyzeImage(url: string): Promise<ImageQuality> {
  if (cache.has(url)) return cache.get(url)!;
  if (typeof document === "undefined") {
    const empty: ImageQuality = { url, score: 0, width: 0, height: 0, brightness: 0, sharpness: 0, whiteBackground: false, issues: [] };
    return empty;
  }

  let result: ImageQuality;
  try {
    const img = await loadImage(url);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    const canvas = document.createElement("canvas");
    canvas.width = MAX;
    canvas.height = MAX;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, MAX, MAX);
    const { data } = ctx.getImageData(0, 0, MAX, MAX);

    // Grayscale luma buffer.
    const gray = new Float32Array(MAX * MAX);
    let sum = 0;
    for (let i = 0; i < MAX * MAX; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      gray[i] = l;
      sum += l;
    }
    const brightness = sum / (MAX * MAX);

    // Laplacian variance → sharpness (blur detection).
    let lapSum = 0, lapSq = 0, n = 0;
    for (let y = 1; y < MAX - 1; y++) {
      for (let x = 1; x < MAX - 1; x++) {
        const i = y * MAX + x;
        const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - MAX] - gray[i + MAX];
        lapSum += lap; lapSq += lap * lap; n++;
      }
    }
    const mean = lapSum / n;
    const sharpness = lapSq / n - mean * mean;

    // White-background heuristic: sample the four corners.
    const corners = [0, MAX - 1, (MAX - 1) * MAX, MAX * MAX - 1];
    const whiteBackground = corners.every((i) => gray[i] > 225);

    const issues: ImageIssue[] = [];
    if (w < 800 || h < 800) issues.push({ key: "low_resolution", label: `Low resolution (${w}×${h})`, severity: "warning", recommendation: "Upload at least 1000×1000px for zoom quality." });
    if (sharpness < 60) issues.push({ key: "blurry", label: "Image looks blurry", severity: "warning", recommendation: "Use a sharper, well-focused photo." });
    if (brightness < 60) issues.push({ key: "dark", label: "Image is dark", severity: "info", recommendation: "Brighten the image or improve lighting." });
    if (brightness > 235) issues.push({ key: "overexposed", label: "Image is overexposed", severity: "info", recommendation: "Reduce exposure; details are washed out." });
    const ratio = w && h ? w / h : 1;
    if (ratio < 0.8 || ratio > 1.25) issues.push({ key: "wrong_aspect", label: "Non-square aspect ratio", severity: "info", recommendation: "Use a ~1:1 square image for grid consistency." });
    if (!whiteBackground) issues.push({ key: "no_white_background", label: "No clean white background", severity: "info", recommendation: "A white/plain background improves the main image." });

    // Score: start at 100, deduct per issue weighted by severity.
    let score = 100;
    for (const iss of issues) score -= iss.severity === "warning" ? 22 : 10;
    score = Math.max(0, Math.min(100, score));

    result = { url, score, width: w, height: h, brightness, sharpness, whiteBackground, issues };
  } catch {
    result = {
      url, score: 0, width: 0, height: 0, brightness: 0, sharpness: 0, whiteBackground: false,
      issues: [{ key: "load_failed", label: "Could not load image", severity: "warning", recommendation: "Check the image URL is reachable." }],
    };
  }

  cache.set(url, result);
  return result;
}

/** Analyse a gallery and return per-image results plus an aggregate score. */
export async function analyzeGallery(urls: string[]): Promise<{ images: ImageQuality[]; score: number }> {
  const images = await Promise.all(urls.filter(Boolean).map(analyzeImage));
  const score = images.length ? Math.round(images.reduce((a, i) => a + i.score, 0) / images.length) : 0;
  return { images, score };
}
