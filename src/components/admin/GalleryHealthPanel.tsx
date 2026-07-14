import { AlertTriangle, ArrowUpRight, CheckCircle2, Crown, Info, Sparkles, ShieldAlert } from "lucide-react";
import type {
  GalleryHealth,
  GalleryDimension,
  HealthBand,
  HeroRecommendation,
  ImageAnalysis,
} from "@/lib/image-normalization";
import { computeGalleryHealth, recommendHeroImage } from "@/lib/image-normalization";
import { cn } from "@/lib/utils";

/**
 * GalleryHealthPanel — cross-image quality summary for an admin uploader
 * or media manager. Purely presentational; scoring is deterministic and
 * lives in `computeGalleryHealth`.
 */

const BAND_TEXT: Record<HealthBand, string> = {
  excellent: "text-emerald-300",
  good: "text-sky-300",
  "needs-work": "text-amber-300",
  poor: "text-rose-300",
};

const BAND_BAR: Record<HealthBand, string> = {
  excellent: "bg-emerald-400",
  good: "bg-sky-400",
  "needs-work": "bg-amber-400",
  poor: "bg-rose-400",
};

const BAND_LABEL: Record<HealthBand, string> = {
  excellent: "Excellent",
  good: "Good",
  "needs-work": "Needs work",
  poor: "Poor",
};

export function GalleryHealthPanel({
  analyses,
  className,
  minImages = 1,
  currentPrimaryIndex = 0,
  onSetPrimary,
}: {
  analyses: (ImageAnalysis | null | undefined)[];
  className?: string;
  /** Only render when at least this many analyzed images exist. */
  minImages?: number;
  /** Index of the image currently used as hero (defaults to first). */
  currentPrimaryIndex?: number;
  /** When provided, renders a one-click "Set as Primary" action. */
  onSetPrimary?: (index: number) => void;
}) {
  const present = analyses.filter((a): a is ImageAnalysis => !!a);
  if (present.length < minImages) return null;

  const health: GalleryHealth = computeGalleryHealth(present);
  const overallBand = health.band;
  const hero: HeroRecommendation = recommendHeroImage(present, Math.min(currentPrimaryIndex, present.length - 1));

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
          <Sparkles className="size-4" />
        </span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              Gallery Health
            </p>
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider", BAND_TEXT[overallBand])}>
              {BAND_LABEL[overallBand]}
            </span>
          </div>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className={cn("font-display text-2xl font-semibold tabular-nums", BAND_TEXT[overallBand])}>
              {health.overall}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
            <span className="ml-2 text-[11px] text-muted-foreground">
              across {health.count} image{health.count === 1 ? "" : "s"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(Object.values(health.dimensions) as GalleryDimension[]).map((d) => (
          <DimensionRow key={d.key} dim={d} />
        ))}
      </div>

      {hero.shouldRecommend && (
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent/[0.06] p-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
              <Crown className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent">
                  Better hero available
                </span>
                <span className="font-mono text-[11px] font-semibold text-emerald-300">
                  +{hero.delta}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-white/85">
                Image {hero.recommendedIndex + 1} scores{" "}
                <span className="font-mono font-semibold text-white">{hero.recommendedScore}</span>{" "}
                vs the current hero at{" "}
                <span className="font-mono text-white/70">{hero.currentScore}</span>.
              </p>
              {hero.reasons.length > 0 && (
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {hero.reasons.map((r) => (
                    <li
                      key={r}
                      className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/75"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {onSetPrimary && (
              <button
                type="button"
                onClick={() => onSetPrimary(hero.recommendedIndex)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-accent-foreground transition hover:brightness-110"
              >
                Set as Primary
                <ArrowUpRight className="size-3" />
              </button>
            )}
          </div>
        </div>
      )}


      {health.recommendations.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
            <Info className="size-3" /> Recommendations
          </p>
          <ul className="space-y-1.5">
            {health.recommendations.map((r) => (
              <li key={r.key} className="flex items-start gap-2 text-[11px] text-white/85">
                {r.severity === "warning" ? (
                  <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-400" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-sky-400" />
                )}
                <span>{r.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DimensionRow({ dim }: { dim: GalleryDimension }) {
  const Icon =
    dim.band === "poor" ? ShieldAlert : dim.band === "needs-work" ? AlertTriangle : CheckCircle2;
  return (
    <div className="rounded-lg bg-white/[0.02] px-3 py-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1.5 text-white/80">
          <Icon className={cn("size-3", BAND_TEXT[dim.band])} />
          {dim.label}
        </span>
        <span className={cn("font-mono font-semibold tabular-nums", BAND_TEXT[dim.band])}>
          {dim.score}
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={cn("h-full rounded-full transition-all", BAND_BAR[dim.band])}
          style={{ width: `${dim.score}%` }}
        />
      </div>
    </div>
  );
}
