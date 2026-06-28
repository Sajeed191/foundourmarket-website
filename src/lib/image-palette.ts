// Adaptive product-image palette extraction.
//
// Extracts a small dominant-color palette from a product image on a downscaled
// offscreen canvas, then derives a premium gradient + glow that matches the
// product. Results are cached per-src so we never recompute for the same image,
// and a module-level in-flight map dedupes concurrent extractions.

export type ImagePalette = {
  /** Dominant product color (most saturated significant cluster). */
  primary: string;
  /** Secondary supporting color. */
  secondary: string;
  /** CSS background for the image container (radial premium gradient). */
  background: string;
  /** Soft color glow (very low opacity) layered behind the product. */
  glow: string;
  /** True when the product is very light (so we darken the bg slightly). */
  isLightProduct: boolean;
};

/** Premium neutral fallback used when extraction is impossible. */
export const FALLBACK_PALETTE: ImagePalette = {
  primary: "#222222",
  secondary: "#111111",
  background: "linear-gradient(180deg, #181818 0%, #111111 100%)",
  glow: "transparent",
  isLightProduct: false,
};

const cache = new Map<string, ImagePalette>();
const inflight = new Map<string, Promise<ImagePalette>>();

type RGB = { r: number; g: number; b: number };

function luminance({ r, g, b }: RGB): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function rgbToHsl({ r, g, b }: RGB) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToCss(h: number, s: number, l: number, a = 1): string {
  return `hsla(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${a})`;
}

/** Build the adaptive palette from a representative dominant RGB. */
function buildPalette(dominant: RGB): ImagePalette {
  const { h, s } = rgbToHsl(dominant);
  const lum = luminance(dominant);
  const isLightProduct = lum > 0.72;
  const isDarkProduct = lum < 0.18;

  // Saturation floor so near-grey products still read as a tasteful tint.
  const sat = Math.min(0.55, Math.max(0.12, s));

  // Background lightness adapts for contrast: darken behind light products,
  // lighten behind dark products, keep mid products in a calm dark range.
  let bgL = 0.16;
  if (isLightProduct) bgL = 0.1;
  else if (isDarkProduct) bgL = 0.26;

  const innerL = Math.min(0.34, bgL + 0.12);
  const center = hslToCss(h, sat * 0.7, innerL);
  const edge = hslToCss(h, sat * 0.55, bgL * 0.6);
  const vignette = hslToCss(h, sat * 0.4, Math.max(0.04, bgL * 0.4));

  // Radial premium gradient: soft glow at center, gentle vignette at edges.
  const background = `radial-gradient(120% 120% at 50% 38%, ${center} 0%, ${edge} 55%, ${vignette} 100%)`;

  // Subtle color glow behind the product (10–15% opacity).
  const glow = hslToCss(h, Math.min(0.7, sat + 0.15), 0.55, 0.13);

  return {
    primary: hslToCss(h, sat, 0.55),
    secondary: hslToCss(h, sat * 0.8, 0.3),
    background,
    glow,
    isLightProduct,
  };
}

/**
 * Extract the dominant color cluster from image pixels using a coarse hue/value
 * histogram, ignoring near-transparent and near-white background pixels so the
 * product (not the photo backdrop) drives the palette.
 */
function extractDominant(data: Uint8ClampedArray): RGB {
  const buckets = new Map<string, { sum: RGB; count: number; score: number }>();
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 125) continue;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    // Skip pure white/near-white photo backdrops and pure black borders.
    if (lum > 0.96 || lum < 0.04) continue;
    const { h, s, l } = rgbToHsl({ r, g, b });
    // Weight saturated, mid-light pixels — those define the product's identity.
    const score = (0.25 + s) * (1 - Math.abs(l - 0.5));
    const key = `${Math.round(h / 24)}_${Math.round(s * 4)}_${Math.round(l * 4)}`;
    const prev = buckets.get(key);
    if (prev) {
      prev.sum.r += r; prev.sum.g += g; prev.sum.b += b;
      prev.count += 1; prev.score += score;
    } else {
      buckets.set(key, { sum: { r, g, b }, count: 1, score });
    }
  }
  let best: { sum: RGB; count: number; score: number } | null = null;
  for (const v of buckets.values()) {
    if (!best || v.score > best.score) best = v;
  }
  if (!best) return { r: 34, g: 34, b: 34 };
  return {
    r: best.sum.r / best.count,
    g: best.sum.g / best.count,
    b: best.sum.b / best.count,
  };
}

/**
 * Extract (and cache) the adaptive palette for a product image src. Returns the
 * fallback palette if running on the server, the image can't be read (CORS), or
 * extraction otherwise fails. Never throws.
 */
export function getImagePalette(src: string): Promise<ImagePalette> {
  if (cache.has(src)) return Promise.resolve(cache.get(src)!);
  if (inflight.has(src)) return inflight.get(src)!;
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(FALLBACK_PALETTE);
  }

  const promise = new Promise<ImagePalette>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    const finish = (palette: ImagePalette) => {
      cache.set(src, palette);
      inflight.delete(src);
      resolve(palette);
    };

    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return finish(FALLBACK_PALETTE);
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        finish(buildPalette(extractDominant(data)));
      } catch {
        finish(FALLBACK_PALETTE);
      }
    };
    img.onerror = () => finish(FALLBACK_PALETTE);
    img.src = src;
  });

  inflight.set(src, promise);
  return promise;
}

/** Synchronous cache peek for SSR-safe first paint. */
export function getCachedPalette(src: string): ImagePalette | null {
  return cache.get(src) ?? null;
}
