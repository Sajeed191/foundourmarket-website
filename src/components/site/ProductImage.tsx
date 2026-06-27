import { memo, useCallback, useEffect, useRef, useState } from "react";
import { getResponsiveImage } from "@/lib/product-images";

type Props = {
  src: string;
  alt: string;
  /** Responsive sizes hint. Defaults tuned for the homepage card grid/rails. */
  sizes?: string;
  className?: string;
  /** Set true only for the LCP/above-the-fold image; everything else lazy-loads. */
  priority?: boolean;
  width?: number;
  height?: number;
};

/**
 * Stable, keyed product image.
 *
 * React must never reuse a decoded <img> DOM node for a different product while
 * sorting/filtering/incrementally loading. The key includes the src and intrinsic
 * dimensions so stale bitmaps cannot appear in another card. Loading is fully
 * lazy/async for non-LCP cards and opacity is the only transition.
 */
function ProductImageImpl({
  src,
  alt,
  sizes = "(min-width: 1024px) 300px, (min-width: 640px) 45vw, 76vw",
  className = "",
  priority = false,
  width = 800,
  height = 600,
}: Props) {
  const responsive = getResponsiveImage(src);
  const [loaded, setLoaded] = useState(false);
  const nodeRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    setLoaded(Boolean(node?.complete && node.naturalWidth > 0));
  }, [src]);

  const imgRef = useCallback((node: HTMLImageElement | null) => {
    nodeRef.current = node;
    if (!node) return;
    if (node.complete && node.naturalWidth > 0) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    node.decode?.().then(
      () => {
        if (!cancelled) setLoaded(true);
      },
      () => {
        /* decode aborted (node replaced) or failed — onLoad/onError will handle */
      },
    );
    (node as HTMLImageElement & { __cancelDecode?: () => void }).__cancelDecode = () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {!loaded && (
        <div
          aria-hidden
          data-product-image-placeholder
          className="absolute inset-0 bg-cover bg-center"
          style={responsive ? { backgroundImage: `url(${responsive.placeholder})` } : undefined}
        />
      )}
      <img
        key={`${src}|${width}x${height}`}
        ref={imgRef}
        src={src}
        srcSet={responsive?.srcset}
        sizes={responsive ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        data-product-image
        className={`${className} ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

export const ProductImage = memo(ProductImageImpl);