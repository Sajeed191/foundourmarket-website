import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accurate star rating display. Renders exactly 5 equally sized stars and
 * fills each to match the numeric rating rounded to the nearest 0.5
 * (e.g. 4.5 → 4 full + 1 half, 3.0 → 3 full + 2 empty, 0.5 → 1 half).
 *
 * Each star is a fixed-size relative slot with an empty base star and a
 * filled star clipped from the left by an exact percentage (0%, 50%, 100%).
 * Both icons share the same className/size and are absolutely positioned at
 * inset-0, so they line up perfectly with no overlap, clipping artifacts,
 * floating mini-stars, or misalignment.
 */
export function StarRating({
  rating,
  className,
  starClassName = "size-3.5",
  glow = false,
}: {
  rating: number;
  className?: string;
  starClassName?: string;
  glow?: boolean;
}) {
  const raw = Math.max(0, Math.min(5, Number(rating) || 0));
  // Round only to the nearest 0.5 so stars always show full / half / empty.
  const value = Math.round(raw * 2) / 2;

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Rating: ${value} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        // 1 = full, 0.5 = half, 0 = empty for this slot.
        const fill = Math.max(0, Math.min(1, value - i));
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
    </div>
  );
}
