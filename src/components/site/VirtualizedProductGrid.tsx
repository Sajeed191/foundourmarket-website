import { useEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

type Cols = { base: number; sm?: number; md?: number; lg?: number; xl?: number };

type Props<T> = {
  items: T[];
  /** Render a single item. Must return a keyed React element. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Column counts per Tailwind breakpoint, used by the virtualized path. */
  cols: Cols;
  /** Fallback grid className used for small lists (SSR-safe, no virtualization). */
  className?: string;
  /** Rough row height estimate; corrected by measurement after first paint. */
  estimateRowHeight?: number;
  /** Overscan rows above/below the viewport. */
  overscan?: number;
  /** Only virtualize once the list exceeds this size. */
  virtualizeThreshold?: number;
};

function colsForWidth(cols: Cols, w: number): number {
  if (w >= 1280 && cols.xl) return cols.xl;
  if (w >= 1024 && cols.lg) return cols.lg;
  if (w >= 768 && cols.md) return cols.md;
  if (w >= 640 && cols.sm) return cols.sm;
  return cols.base;
}

// Mirrors the gap-3 / sm:gap-5 / lg:gap-6 rhythm used across the storefront.
function gapForWidth(w: number): number {
  if (w >= 1024) return 24;
  if (w >= 640) return 20;
  return 12;
}

/**
 * Window-virtualized product grid. Renders only the rows near the viewport
 * (plus a small overscan), keeping the DOM tiny even for catalogs with
 * hundreds of products — critical for 2–4GB Android devices where a large
 * card count causes jank and memory pressure.
 *
 * Small lists fall back to a plain responsive grid so layout/SSR stay
 * identical to before and there is zero virtualization overhead.
 */
export function VirtualizedProductGrid<T>({
  items,
  renderItem,
  cols,
  className,
  estimateRowHeight = 340,
  overscan = 4,
  virtualizeThreshold = 32,
}: Props<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const shouldVirtualize = items.length > virtualizeThreshold && width > 0;
  const colCount = useMemo(() => colsForWidth(cols, width || 1280), [cols, width]);
  const gap = gapForWidth(width || 1280);
  const rowCount = Math.ceil(items.length / colCount);

  const rowVirtualizer = useWindowVirtualizer({
    count: shouldVirtualize ? rowCount : 0,
    estimateSize: () => estimateRowHeight + gap,
    overscan,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  // Fallback: plain responsive grid (also the SSR / first-paint output).
  if (!shouldVirtualize) {
    return (
      <div ref={parentRef} className={className}>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    );
  }

  return (
    <div ref={parentRef} style={{ position: "relative", height: rowVirtualizer.getTotalSize() }}>
      {rowVirtualizer.getVirtualItems().map((vRow) => {
        const start = vRow.index * colCount;
        const rowItems = items.slice(start, start + colCount);
        return (
          <div
            key={vRow.key}
            data-index={vRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vRow.start - rowVirtualizer.options.scrollMargin}px)`,
              display: "grid",
              gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
              gap,
              paddingBottom: gap,
              alignItems: "stretch",
            }}
          >
            {rowItems.map((item, i) => renderItem(item, start + i))}
          </div>
        );
      })}
    </div>
  );
}

export default VirtualizedProductGrid;
