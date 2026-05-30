import { useEffect, useMemo, useState } from "react";
import { Reorder } from "framer-motion";
import {
  Monitor, Tablet, Smartphone, Globe, Plus, GripVertical, Layers, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useStorefrontBlocks,
  createBlock,
  reorderBlocks,
  type StorefrontBlock,
  type BlockRegion,
  type BlockType,
} from "@/lib/use-storefront-blocks";
import { BlockPreview } from "@/components/builder/BlockPreview";
import { BlockToolbar } from "@/components/builder/BlockToolbar";
import { BlockEditorSheet } from "@/components/builder/BlockEditorSheet";
import { BlockAnalyticsPanel } from "@/components/builder/BlockAnalyticsPanel";
import { AddBlockMenu } from "@/components/builder/AddBlockMenu";

type Device = "desktop" | "tablet" | "mobile";
const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "48rem",
  mobile: "24rem",
};

const REGIONS: BlockRegion[] = ["all", "india", "international"];
const STATUS_FILTERS = ["all", "draft", "published", "scheduled", "archived"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function matchesStatusFilter(b: StorefrontBlock, f: StatusFilter): boolean {
  if (f === "all") return true;
  if (f === "scheduled") {
    const now = Date.now();
    return (
      (!!b.publish_at && new Date(b.publish_at).getTime() > now) ||
      (!!b.unpublish_at && new Date(b.unpublish_at).getTime() > now)
    );
  }
  return b.status === f;
}

const seg =
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors";

/**
 * Visual Storefront Builder. Lets staff manage the homepage block layout
 * directly — drag-to-reorder (touch + mouse), per-block toolbar, inline editor
 * sheet, analytics, device/region/schedule previews and a floating add button.
 * All mutations flow through the existing realtime + protection backend.
 */
export function HomepageBuilder() {
  const { blocks, loading } = useStorefrontBlocks();
  const [device, setDevice] = useState<Device>("desktop");
  const [region, setRegion] = useState<BlockRegion>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [order, setOrder] = useState<string[]>([]);
  const [editing, setEditing] = useState<StorefrontBlock | null>(null);
  const [analytics, setAnalytics] = useState<StorefrontBlock | null>(null);
  const [adding, setAdding] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Keep a local order that mirrors the realtime feed unless the user is dragging.
  useEffect(() => {
    setOrder(blocks.map((b) => b.id));
  }, [blocks]);

  const byId = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);
  const ordered = order.map((id) => byId.get(id)).filter(Boolean) as StorefrontBlock[];
  const visible = ordered.filter((b) => matchesStatusFilter(b, status));
  const visibleIds = visible.map((b) => b.id);

  async function commitOrder(next: string[]) {
    setOrder(next);
    setReordering(true);
    try {
      await reorderBlocks(next);
    } catch (e) {
      toast.error("Reorder failed", { description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setReordering(false);
    }
  }

  // Reorder only the currently-visible subset, merging back into the full order
  // so hidden/filtered blocks keep their slots.
  async function commitVisibleOrder(nextVisible: string[]) {
    const visibleSet = new Set(nextVisible);
    let vi = 0;
    const merged = order.map((id) => (visibleSet.has(id) ? nextVisible[vi++] : id));
    await commitOrder(merged);
  }

  async function move(block: StorefrontBlock, dir: -1 | 1) {
    const idx = order.indexOf(block.id);
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[idx], next[target]] = [next[target], next[idx]];
    await commitOrder(next);
  }

  async function add(type: BlockType) {
    try {
      const created = await createBlock(type);
      if (created) {
        toast.success("Block added");
        setEditing(created);
      }
    } catch (e) {
      toast.error("Could not add block", { description: e instanceof Error ? e.message : "Try again." });
    }
  }

  return (
    <div className="relative">
      {/* Control bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Device */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card/60 p-1">
            {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
              <button key={d} onClick={() => setDevice(d)}
                className={`${seg} ${device === d ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="size-3.5" /> <span className="hidden sm:inline capitalize">{d}</span>
              </button>
            ))}
          </div>

          {/* Region preview */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card/60 p-1">
            <Globe className="ml-1.5 size-3.5 text-muted-foreground" />
            {REGIONS.map((r) => (
              <button key={r} onClick={() => setRegion(r)}
                className={`${seg} ${region === r ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                <span className="capitalize">{r}</span>
              </button>
            ))}
          </div>

          {/* Schedule / status filter */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card/60 p-1">
            {STATUS_FILTERS.map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`${seg} ${status === s ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                <span className="capitalize">{s}</span>
              </button>
            ))}
          </div>

          <div className="ml-auto inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {reordering && <Loader2 className="size-3.5 animate-spin text-accent" />}
            <Layers className="size-3.5" /> {visible.length} blocks
          </div>

          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground transition-all hover:brightness-110">
            <Plus className="size-3.5" /> Add block
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="mx-auto transition-[max-width] duration-300" style={{ maxWidth: DEVICE_WIDTH[device] }}>
        {loading ? (
          <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-accent" /></div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center">
            <Layers className="mx-auto mb-3 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No blocks yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Add your first block to start building the homepage.</p>
            <button onClick={() => setAdding(true)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground hover:brightness-110">
              <Plus className="size-3.5" /> Add block
            </button>
          </div>
        ) : (
          <Reorder.Group axis="y" values={visibleIds} onReorder={commitVisibleOrder} className="space-y-3">
            {visible.map((block) => {
              const idx = order.indexOf(block.id);
              return (
                <Reorder.Item key={block.id} value={block.id}
                  className="group rounded-2xl border border-transparent transition-colors"
                  whileDrag={{ scale: 1.01, boxShadow: "0 20px 50px -15px oklch(0 0 0 / 0.6)" }}
                >
                  <div className="rounded-2xl bg-background/40 p-2">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid size-8 cursor-grab touch-none place-items-center rounded-lg border border-white/10 text-muted-foreground active:cursor-grabbing"
                        aria-label="Drag to reorder">
                        <GripVertical className="size-4" />
                      </span>
                      <BlockToolbar
                        block={block}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < order.length - 1}
                        onEdit={() => setEditing(block)}
                        onAnalytics={() => setAnalytics(block)}
                        onMove={(dir) => move(block, dir)}
                      />
                    </div>
                    <BlockPreview block={block} previewRegion={region} />
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}
      </div>

      <BlockEditorSheet block={editing} open={!!editing} onClose={() => setEditing(null)} />
      <BlockAnalyticsPanel block={analytics} open={!!analytics} onClose={() => setAnalytics(null)} />
      <AddBlockMenu open={adding} onClose={() => setAdding(false)} onPick={add} />
    </div>
  );
}
