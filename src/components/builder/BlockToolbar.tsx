import { useState } from "react";
import {
  Pencil, Copy, Eye, EyeOff, Rocket, Archive, ArrowUp, ArrowDown,
  Trash2, BarChart3, MoreHorizontal, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  type StorefrontBlock,
  setBlockStatus,
  toggleBlockActive,
  duplicateBlock,
  deleteBlock,
} from "@/lib/use-storefront-blocks";

interface Props {
  block: StorefrontBlock;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: () => void;
  onAnalytics: () => void;
  onMove: (dir: -1 | 1) => void;
}

const btn =
  "grid size-8 place-items-center rounded-lg border border-white/10 bg-background/60 text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-muted-foreground";

/** Inline per-block action toolbar shown only in builder (admin) mode. */
export function BlockToolbar({ block, canMoveUp, canMoveDown, onEdit, onAnalytics, onMove }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [more, setMore] = useState(false);

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key);
    try { await fn(); toast.success(ok); }
    catch (e) { toast.error("Action failed", { description: e instanceof Error ? e.message : "Try again." }); }
    finally { setBusy(null); }
  }

  const hidden = !block.active || block.status === "archived";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button className={btn} onClick={onEdit} aria-label="Edit block"><Pencil className="size-3.5" /></button>

      <button className={btn} disabled={busy === "dup"}
        onClick={() => run("dup", () => duplicateBlock(block), "Block duplicated")} aria-label="Duplicate">
        {busy === "dup" ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
      </button>

      <button className={btn} disabled={busy === "vis"}
        onClick={() => run("vis", () => toggleBlockActive(block.id, !block.active), block.active ? "Hidden" : "Shown")}
        aria-label={block.active ? "Hide" : "Show"}>
        {busy === "vis" ? <Loader2 className="size-3.5 animate-spin" /> : block.active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>

      <button className={btn} disabled={busy === "up" || !canMoveUp} onClick={() => onMove(-1)} aria-label="Move up">
        <ArrowUp className="size-3.5" />
      </button>
      <button className={btn} disabled={busy === "down" || !canMoveDown} onClick={() => onMove(1)} aria-label="Move down">
        <ArrowDown className="size-3.5" />
      </button>

      <button className={btn} onClick={onAnalytics} aria-label="Analytics"><BarChart3 className="size-3.5" /></button>

      <div className="relative">
        <button className={btn} onClick={() => setMore((v) => !v)} aria-label="More actions"><MoreHorizontal className="size-3.5" /></button>
        {more && (
          <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-white/10 bg-background/95 p-1 backdrop-blur-2xl shadow-xl"
            onMouseLeave={() => setMore(false)}>
            {block.status !== "published" && (
              <MenuItem icon={Rocket} label="Publish" busy={busy === "pub"}
                onClick={() => { setMore(false); run("pub", () => setBlockStatus(block.id, "published"), "Published"); }} />
            )}
            {block.status !== "archived" && (
              <MenuItem icon={Archive} label="Archive" busy={busy === "arc"}
                onClick={() => { setMore(false); run("arc", () => setBlockStatus(block.id, "archived"), "Archived"); }} />
            )}
            {block.status !== "draft" && (
              <MenuItem icon={Pencil} label="Move to draft" busy={busy === "dft"}
                onClick={() => { setMore(false); run("dft", () => setBlockStatus(block.id, "draft"), "Moved to draft"); }} />
            )}
            <MenuItem icon={Trash2} label="Delete" danger busy={busy === "del"}
              onClick={() => {
                setMore(false);
                if (confirm("Delete this block? This cannot be undone.")) run("del", () => deleteBlock(block.id), "Deleted");
              }} />
          </div>
        )}
      </div>

      {hidden && (
        <span className="ml-1 rounded-md bg-white/5 px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
          {block.status === "archived" ? "Archived" : "Hidden"}
        </span>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger, busy }: {
  icon: typeof Pencil; label: string; onClick: () => void; danger?: boolean; busy?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={busy}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-white/5 disabled:opacity-50 ${danger ? "text-destructive" : "text-foreground"}`}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />} {label}
    </button>
  );
}
