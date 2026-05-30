import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  type StorefrontBlock,
  type BlockStatus,
  type BlockRegion,
  BLOCK_TYPE_META,
  updateBlock,
} from "@/lib/use-storefront-blocks";
import { useEditorProtection } from "@/hooks/use-editor-protection";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { EditorSaveBar } from "@/components/admin/EditorSaveBar";
import { BLOCK_ICON } from "@/components/builder/block-icons";

type Form = {
  title: string;
  subtitle: string;
  status: BlockStatus;
  region: BlockRegion;
  publish_at: string | null;
  unpublish_at: string | null;
  active: boolean;
  config: Record<string, any>;
};

const STATUSES: BlockStatus[] = ["draft", "published", "archived"];
const REGIONS: BlockRegion[] = ["all", "india", "international"];

function toForm(b: StorefrontBlock): Form {
  return {
    title: b.title ?? "",
    subtitle: b.subtitle ?? "",
    status: b.status,
    region: b.region,
    publish_at: b.publish_at,
    unpublish_at: b.unpublish_at,
    active: b.active,
    config: b.config ?? {},
  };
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
function fromLocalInput(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

const inputCls =
  "w-full rounded-xl border border-border bg-card/80 px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/55";

/**
 * Reusable visual-builder editor sheet. Every storefront block opens the same
 * sheet, fully wired into the unified protection ecosystem: autosave, draft
 * recovery, version history, undo/redo and activity logging.
 */
export function BlockEditorSheet({
  block,
  open,
  onClose,
}: {
  block: StorefrontBlock | null;
  open: boolean;
  onClose: () => void;
}) {
  const baselineBlock = block;
  const initial = useMemo<Form>(
    () => (baselineBlock ? toForm(baselineBlock) : ({} as Form)),
    [baselineBlock?.id],
  );
  const { state: f, set, undo, redo, canUndo, canRedo, reset } = useUndoRedo<Form>(initial);
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (baselineBlock) {
      const next = toForm(baselineBlock);
      reset(next);
      setBaseline(JSON.stringify(next));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baselineBlock?.id]);

  const protection = useEditorProtection({
    entityType: "storefront_block",
    entityId: block?.id ?? "new",
    value: f as unknown as Record<string, unknown>,
    baseline,
    enabled: open && !!block,
  });

  if (typeof document === "undefined" || !block) return null;
  const meta = BLOCK_TYPE_META[block.type];
  const Icon = BLOCK_ICON[block.type];
  const cfg = (k: string, v: any) => set((p) => ({ ...p, config: { ...p.config, [k]: v } }));

  async function save() {
    if (!block) return;
    setSaving(true);
    try {
      await protection.recordVersion(block.id, f as unknown as Record<string, unknown>, "Updated");
      await updateBlock(block.id, {
        title: f.title.trim() || meta.label,
        subtitle: f.subtitle,
        status: f.status,
        region: f.region,
        publish_at: f.publish_at,
        unpublish_at: f.unpublish_at,
        active: f.active,
        config: f.config,
      });
      await protection.markClean();
      setBaseline(JSON.stringify(f));
      toast.success("Block saved");
      onClose();
    } catch (e) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[130] print:hidden">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => !saving && onClose()}
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-accent/20 bg-background/95 backdrop-blur-2xl shadow-[-30px_0_80px_-30px_oklch(0.74_0.19_49/0.4)]"
          >
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
              <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-accent to-primary text-accent-foreground">
                <Icon className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-accent">Edit block</p>
                <p className="text-sm font-medium">{meta.label}</p>
              </div>
              <button onClick={() => !saving && onClose()} aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-white/5 hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <EditorSaveBar
                state={protection.state}
                lastSavedAt={protection.lastSavedAt}
                recovery={protection.recovery}
                onRestore={() => {
                  const d = protection.restoreDraft();
                  if (d) reset(d as Form);
                }}
                onDismiss={protection.dismissDraft}
                entityType="storefront_block"
                entityId={block.id}
                onRestoreVersion={(snap) => reset(snap as Form)}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
              />

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Title</span>
                <input value={f.title} onChange={(e) => set((p) => ({ ...p, title: e.target.value }))} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Subtitle</span>
                <input value={f.subtitle} onChange={(e) => set((p) => ({ ...p, subtitle: e.target.value }))} className={inputCls} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Status</span>
                  <select value={f.status} onChange={(e) => set((p) => ({ ...p, status: e.target.value as BlockStatus }))} className={inputCls}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Region</span>
                  <select value={f.region} onChange={(e) => set((p) => ({ ...p, region: e.target.value as BlockRegion }))} className={inputCls}>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Publish at</span>
                  <input type="datetime-local" value={toLocalInput(f.publish_at)} onChange={(e) => set((p) => ({ ...p, publish_at: fromLocalInput(e.target.value) }))} className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Unpublish at</span>
                  <input type="datetime-local" value={toLocalInput(f.unpublish_at)} onChange={(e) => set((p) => ({ ...p, unpublish_at: fromLocalInput(e.target.value) }))} className={inputCls} />
                </label>
              </div>

              {/* Type-specific config */}
              {("limit" in (meta.defaultConfig ?? {}) || ["featured_products", "new_arrivals", "trending_products", "category_showcase", "blog"].includes(block.type)) && (
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Item limit</span>
                  <input type="number" min={1} max={24} value={f.config.limit ?? 8} onChange={(e) => cfg("limit", Number(e.target.value))} className={inputCls} />
                </label>
              )}
              {block.type === "spacer" && (
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Height (px)</span>
                  <input type="number" min={8} max={400} value={f.config.height ?? 48} onChange={(e) => cfg("height", Number(e.target.value))} className={inputCls} />
                </label>
              )}
              {block.type === "custom_html" && (
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Custom HTML</span>
                  <textarea rows={6} value={f.config.html ?? ""} onChange={(e) => cfg("html", e.target.value)} className={`${inputCls} font-mono text-xs`} />
                </label>
              )}

              <button type="button" onClick={() => set((p) => ({ ...p, active: !p.active }))}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 transition-all ${f.active ? "border-accent/50 bg-accent/15" : "border-border bg-card hover:border-accent/30"}`}>
                <span className="text-left">
                  <span className="block text-xs font-medium text-foreground">Active</span>
                  <span className="block text-[10px] text-muted-foreground">{f.active ? "Eligible to display" : "Force-hidden"}</span>
                </span>
                <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${f.active ? "bg-accent" : "bg-white/15"}`} aria-hidden>
                  <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${f.active ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 border-t border-border/60 px-4 py-3">
              <button onClick={() => !saving && onClose()} disabled={saving}
                className="rounded-xl border border-border px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={save} disabled={saving}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-60">
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save changes
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
