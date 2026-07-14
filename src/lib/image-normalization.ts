/**
 * ImageNormalizationService — Phase A foundation.
 *
 * Single interface every gallery/PDP surface calls to render product media.
 * Today it returns the original image URL (identity transform) plus the fixed
 * display metadata the gallery needs to reserve space with zero CLS. Phase A.5
 * will wire in server-side normalized derivatives, and Phase B will add
 * AI-enhanced variants — gallery components do NOT need to change: they keep
 * calling `getDisplayImage(...)` and rendering into `PREMIUM_GALLERY_VIEWPORT`.
 *
 * Contract (stable):
 *   getDisplayImage(input) → { url, alt, isNormalized, ... }
 *   PREMIUM_GALLERY_VIEWPORT → responsive fixed heights + object-fit rule
 */

export type NormalizedImageSource = {
  url: string;
  alt?: string | null;
  /** Optional metadata a future normalizer may attach; today always false. */
  normalizedUrl?: string | null;
  width?: number | null;
  height?: number | null;
  aspectRatio?: number | null;
  productOccupancy?: number | null;
};

export type DisplayImage = {
  url: string;
  alt: string;
  /** True once the upload pipeline (Phase A.5+) produces a derivative. */
  isNormalized: boolean;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
};

/**
 * Fixed premium gallery viewport — the whole point of Phase A. Reserved via
 * CSS min-height so the browser paints the correct box before the image
 * decodes. Height is mobile-first with tablet/desktop overrides.
 */
export const PREMIUM_GALLERY_VIEWPORT = {
  heights: { mobile: 340, tablet: 380, desktop: 480 },
  /** Tailwind-friendly class snippet consumed by the PDP gallery. */
  className: "h-[340px] sm:h-[380px] lg:h-[480px]",
  objectFit: "contain" as const,
  /** Safe-zone padding around the product so it never touches edges. */
  safePadding: "p-4 sm:p-6 lg:p-8",
};

/**
 * Resolve any product image reference to the URL the gallery should display.
 * Today: identity. Tomorrow: prefers `normalizedUrl` when present.
 */
export function getDisplayImage(input: NormalizedImageSource | string | null | undefined, fallbackAlt = ""): DisplayImage {
  if (!input) {
    return { url: "", alt: fallbackAlt, isNormalized: false, width: null, height: null, aspectRatio: null };
  }
  if (typeof input === "string") {
    return { url: input, alt: fallbackAlt, isNormalized: false, width: null, height: null, aspectRatio: null };
  }
  const url = input.normalizedUrl || input.url;
  return {
    url,
    alt: input.alt || fallbackAlt,
    isNormalized: Boolean(input.normalizedUrl),
    width: input.width ?? null,
    height: input.height ?? null,
    aspectRatio: input.aspectRatio ?? (input.width && input.height ? input.width / input.height : null),
  };
}
