import {
  type StorefrontBlock,
  type BlockRegion,
  BLOCK_TYPE_META,
  isBlockLive,
} from "@/lib/use-storefront-blocks";
import { BLOCK_ICON } from "@/components/builder/block-icons";
import { CalendarClock, Clock } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-white/10 text-muted-foreground",
  published: "bg-emerald-500/15 text-emerald-400",
  archived: "bg-white/5 text-muted-foreground line-through",
};

function scheduleLabel(b: StorefrontBlock): { icon: typeof Clock; text: string } | null {
  const now = Date.now();
  if (b.publish_at && new Date(b.publish_at).getTime() > now)
    return { icon: CalendarClock, text: `Publishes ${new Date(b.publish_at).toLocaleString()}` };
  if (b.unpublish_at && new Date(b.unpublish_at).getTime() > now)
    return { icon: Clock, text: `Unpublishes ${new Date(b.unpublish_at).toLocaleString()}` };
  return null;
}

/**
 * Schematic live preview of a block on the builder canvas. Reflects block data
 * in realtime (title, status, region, schedule, config) so edits appear instantly.
 */
export function BlockPreview({
  block,
  previewRegion,
}: {
  block: StorefrontBlock;
  previewRegion: BlockRegion;
}) {
  const meta = BLOCK_TYPE_META[block.type];
  const Icon = BLOCK_ICON[block.type];
  const live = isBlockLive(block, previewRegion);
  const sched = scheduleLabel(block);

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 transition-opacity ${live ? "border-border bg-card/60" : "border-dashed border-border/60 bg-card/30 opacity-60"}`}>
      <div className="pointer-events-none absolute -right-6 -top-8 size-20 rounded-full opacity-20" style={{ background: "var(--gradient-ember-soft)", filter: "blur(18px)" }} />
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Icon className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-accent">{meta.label}</p>
            <span className={`rounded-md px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest ${STATUS_STYLE[block.status]}`}>{block.status}</span>
            {block.region !== "all" && (
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest text-muted-foreground">{block.region}</span>
            )}
            {!live && <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest text-amber-400">Not live here</span>}
          </div>
          <p className="mt-1 truncate text-sm font-medium text-foreground">{block.title || meta.label}</p>
          {block.subtitle && <p className="truncate text-xs text-muted-foreground">{block.subtitle}</p>}
          {sched && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono text-amber-400/90">
              <sched.icon className="size-3" /> {sched.text}
            </p>
          )}
          {typeof block.config?.limit === "number" && (
            <p className="mt-1 text-[10px] font-mono text-muted-foreground">{block.config.limit} items</p>
          )}
        </div>
      </div>
    </div>
  );
}
