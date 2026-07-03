import { cn } from "@/lib/utils";

/**
 * Canonical FoundOurMarket™ brand wordmark.
 * Always renders the ember gradient on "FoundOurMarket" and the ™ symbol,
 * so the brand name looks consistent everywhere it appears.
 */
export function BrandName({
  className,
  tmClassName,
}: {
  className?: string;
  tmClassName?: string;
}) {
  return (
    <span className={cn("text-gradient-ember", className)}>
      FoundOurMarket
      <span className={cn("align-super text-[0.6em] text-accent", tmClassName)}>™</span>
    </span>
  );
}

export default BrandName;
