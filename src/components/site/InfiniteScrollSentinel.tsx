import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Invisible sentinel that triggers `onLoadMore` when it approaches the
 * viewport. Powers continuous, button-free catalog browsing. Cheap and safe:
 * a single IntersectionObserver, guarded against double-fires while a load is
 * already in flight, and idle when there's nothing more to load.
 */
type Props = {
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void | Promise<void>;
  rootMargin?: string;
};

export function InfiniteScrollSentinel({
  hasMore,
  loading = false,
  onLoadMore,
  rootMargin = "800px 0px 800px 0px",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!hasMore) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !busyRef.current && !loading) {
            busyRef.current = true;
            try {
              const r = onLoadMore();
              Promise.resolve(r).finally(() => {
                // Release on next frame so DOM updates before we re-fire.
                requestAnimationFrame(() => { busyRef.current = false; });
              });
            } catch {
              busyRef.current = false;
            }
          }
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, onLoadMore, rootMargin]);

  if (!hasMore) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="mt-6 flex h-16 w-full items-center justify-center"
    >
      <Loader2 className="size-5 animate-spin text-muted-foreground/60" />
    </div>
  );
}

export default InfiniteScrollSentinel;
