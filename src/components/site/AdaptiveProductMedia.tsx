import { memo, useState } from "react";
import { ProductImage } from "@/components/site/ProductImage";
import { useImagePalette } from "@/lib/use-image-palette";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  children?: React.ReactNode;
};

/**
 * Adaptive product media container.
 *
 * Generates a premium radial background + soft color glow extracted from the
 * product image itself (cached per-src), shows a skeleton until both the palette
 * and the bitmap are ready, then fades the product in. Falls back to a neutral
 * premium gradient when extraction is unavailable (SSR / CORS / failure).
 */
function AdaptiveProductMediaImpl({ src, alt, priority = false, children }: Props) {
  const { palette, ready } = useImagePalette(src);
  const [imgLoaded, setImgLoaded] = useState(false);
  const revealed = ready && imgLoaded;

  return (
    <div
      data-product-media
      className="relative aspect-square w-full overflow-hidden rounded-t-[22px] p-4 sm:p-5"
      style={{
        background: palette.background,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -24px 40px -20px rgba(0,0,0,0.5)",
        transition: "background 450ms ease",
      }}
    >
      {/* Soft adaptive color glow behind the product. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 55% at 50% 48%, ${palette.glow} 0%, transparent 70%)`,
          opacity: revealed ? 1 : 0,
          transition: "opacity 450ms ease",
        }}
      />

      {/* Skeleton shimmer until palette + bitmap are ready. */}
      {!revealed && (
        <div
          aria-hidden
          className="absolute inset-0 animate-pulse"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
      )}

      <ProductImage
        src={src}
        alt={alt}
        width={800}
        height={800}
        priority={priority}
        onLoad={() => setImgLoaded(true)}
        className="relative z-[1] block h-full w-full object-contain object-center transition-[transform,opacity] duration-300 ease-out group-hover:scale-[1.03]"
        style={{ opacity: revealed ? 1 : 0 }}
      />

      {children}
    </div>
  );
}

export const AdaptiveProductMedia = memo(AdaptiveProductMediaImpl);
