import { useEffect, useState } from "react";
import {
  getImagePalette,
  getCachedPalette,
  FALLBACK_PALETTE,
  type ImagePalette,
} from "@/lib/image-palette";

/**
 * Returns the adaptive palette for a product image. Reads from the synchronous
 * cache first (no flash on revisits), then resolves the async extraction once.
 * `ready` flips true when a real (non-fallback) palette is available so callers
 * can animate the background/product in.
 */
export function useImagePalette(src: string | null | undefined) {
  const initial = src ? getCachedPalette(src) : null;
  const [palette, setPalette] = useState<ImagePalette>(initial ?? FALLBACK_PALETTE);
  const [ready, setReady] = useState<boolean>(initial != null);

  useEffect(() => {
    if (!src) {
      setPalette(FALLBACK_PALETTE);
      setReady(false);
      return;
    }
    const cached = getCachedPalette(src);
    if (cached) {
      setPalette(cached);
      setReady(true);
      return;
    }
    let active = true;
    setReady(false);
    void getImagePalette(src).then((p) => {
      if (!active) return;
      setPalette(p);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [src]);

  return { palette, ready };
}
