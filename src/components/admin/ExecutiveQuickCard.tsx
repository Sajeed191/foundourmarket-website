import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Crown, Wallet, TrendingUp, AlertTriangle, Sparkles, ArrowUpRight, Loader2 } from "lucide-react";
import { useExecutiveIntelligence } from "@/lib/use-executive-intelligence";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const money = (n: number, c = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: c, maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);

export function ExecutiveQuickCard() {
  const { model, loading, currency } = useExecutiveIntelligence();

  const healthTone = (v: number) => (v >= 70 ? "text-emerald-300" : v >= 50 ? "text-amber-300" : "text-rose-300");
  const topRisk = model?.risks?.[0];
  const topOpp = model?.opportunities?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
      className="relative overflow-hidden rounded-2xl glass glass-reflect p-5"
      style={{ boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.05), 0 22px 50px -32px oklch(0 0 0 / 0.85)" }}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-accent shrink-0"><Crown className="size-4" /></span>
          <h2 className="text-[13px] font-medium truncate">Executive Snapshot</h2>
        </div>
        <Link to="/admin-executive" className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-all inline-flex items-center gap-1">
          Open <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {loading || !model ? (
        <div className="min-h-[160px] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            <Link to="/admin-executive" search={{ view: "health" }} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:border-accent/30 transition-all">
              <p className={cn("text-xl font-display font-semibold tabular-nums", healthTone(model.health.overall))}>{model.health.overall}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Health</p>
            </Link>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <p className="text-xl font-display font-semibold tabular-nums flex items-center gap-1"><Wallet className="size-3.5 text-accent" />{money(model.scorecard.revenue, currency)}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Revenue</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <p className={cn("text-xl font-display font-semibold tabular-nums flex items-center gap-1", model.scorecard.profit >= 0 ? "text-emerald-300" : "text-rose-300")}><TrendingUp className="size-3.5" />{money(model.scorecard.profit, currency)}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Profit</p>
            </div>
          </div>

          <Link to="/admin-executive" search={{ view: "risks" }} className="block rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 hover:border-rose-400/40 transition-all">
            <div className="flex items-center gap-2 mb-0.5"><AlertTriangle className="size-3.5 text-rose-300" /><span className="text-[10px] font-mono uppercase tracking-widest text-rose-300">Top Risk</span></div>
            <p className="text-xs text-foreground/90 truncate">{topRisk ? topRisk.title : "No active risks"}</p>
          </Link>

          <Link to="/admin-executive" search={{ view: "opportunities" }} className="block rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 hover:border-emerald-400/40 transition-all">
            <div className="flex items-center gap-2 mb-0.5"><Sparkles className="size-3.5 text-emerald-300" /><span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">Top Opportunity</span></div>
            <p className="text-xs text-foreground/90 truncate">{topOpp ? topOpp.title : "No new opportunities"}</p>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
