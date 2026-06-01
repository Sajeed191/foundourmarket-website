import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Professional ecommerce rating display. Renders exactly 5 equally sized stars
 * and fills each to match the numeric rating rounded to the nearest 0.5
 * (e.g. 4.5 → 4 full + 1 half, 3.0 → 3 full + 2 empty, 0.5 → 1 half).
 *
 * Stars are the primary visual element. Optionally appends the numeric value
 * and/or the review count after the stars. When there are zero reviews it shows
 * an empty 5-star row plus a "No reviews yet" note so ratings are never
 * misleading.
 *
 * Each star is a fixed-size relative slot with an empty base star and a filled
 * star clipped from the left by an exact percentage (0%, 50%, 100%). Both icons
 * share the same className/size and are absolutely positioned at inset-0, so they
 * line up perfectly with no overlap, clipping artifacts, or misalignment.
 */
export function StarRating({
  rating,
  count,
  showValue = false,
  className,
  starClassName = "size-3.5",
  textClassName,
  glow = false,
}: {
  rating: number;
  /** Number of reviews. When 0 (and provided) shows empty stars + "No reviews yet". */
  count?: number;
  /** Show the numeric rating value after the stars. */
  showValue?: boolean;
  className?: string;
  starClassName?: string;
  textClassName?: string;
  glow?: boolean;
}) {
  const raw = Math.max(0, Math.min(5, Number(rating) || 0));
  // Round only to the nearest 0.5 so stars always show full / half / empty.
  const value = Math.round(raw * 2) / 2;
  const hasCount = typeof count === "number";
  const noReviews = hasCount && count === 0;

  return (
    <div
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}
      role="img"
      aria-label={
        noReviews
          ? "No reviews yet"
          : `Rating: ${value} out of 5${hasCount ? `, ${count} reviews` : ""}`
      }
    >
      <span className="inline-flex items-center gap-0.5 shrink-0">
        {Array.from({ length: 5 }).map((_, i) => {
          // 1 = full, 0.5 = half, 0 = empty for this slot.
          const fill = noReviews ? 0 : Math.max(0, Math.min(1, value - i));
          const pct = fill >= 1 ? 100 : fill >= 0.5 ? 50 : 0;
          return (
            <span
              key={i}
              className={cn("relative inline-flex shrink-0 leading-none", starClassName)}
            >
              {/* Empty base star */}
              <Star className={cn("text-muted-foreground/30", starClassName)} />
              {/* Filled overlay, clipped to exact percentage */}
              {pct > 0 && (
                <span
                  aria-hidden
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${pct}%` }}
                >
                  <Star
                    className={cn(
                      "fill-accent text-accent",
                      glow && "drop-shadow-[0_0_6px_oklch(0.74_0.19_49/0.6)]",
                      starClassName,
                    )}
                  />
                </span>
              )}
            </span>
          );
        })}
      </span>

      {noReviews ? (
        <span className={cn("text-muted-foreground tabular-nums", textClassName)}>
          No reviews yet
        </span>
      ) : (
        (showValue || hasCount) && (
          <span className={cn("text-foreground/80 tabular-nums", textClassName)}>
            {showValue && <span className="font-medium">{value.toFixed(1)}</span>}
            {hasCount && (
              <span className={cn("text-muted-foreground", showValue && "ml-1")}>
                ({count})
              </span>
            )}
          </span>
        )
      )}
    </div>
  );
}
