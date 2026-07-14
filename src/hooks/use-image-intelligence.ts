import { useEffect, useState } from "react";
import { analyzeGallery, type ImageQuality } from "@/lib/catalog-intelligence";

/**
 * Debounced, cached image-quality analysis for the editor. Runs in-browser,
 * never blocks typing, and returns an aggregate score plus per-image results.
 */
export function useImageIntelligence(urls: string[], enabled = true) {
  const [state, setState] = useState<{ images: ImageQuality[]; score: number; loading: boolean }>({
    images: [],
    score: 0,
    loading: false,
  });

  const key = urls.filter(Boolean).join("|");

  useEffect(() => {
    if (!enabled || !key) {
      setState({ images: [], score: 0, loading: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    const timer = setTimeout(() => {
      analyzeGallery(key.split("|")).then((res) => {
        if (!cancelled) setState({ images: res.images, score: res.score, loading: false });
      });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, enabled]);

  return state;
}
