import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Trophy, TrendingUp, TrendingDown, Minus, Loader2, Eye, ShoppingCart, DollarSign, Activity } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { KpiCard } from "@/components/admin/KpiCard";
import { fetchProductPerformance, tierMeta, type ProductPerf, type PerfTier } from "@/lib/admin-performance";

export const Route = createFileRoute("/admin-performance")({
  head: () => ({ meta: [{ title: "Performance Dashboard — Admin" }] }),
  component: PerformancePage,
});

const TIERS: PerfTier[] = ["top", "high", "average", "low"];

function PerformancePage() {
  const [data, setData] = useState<ProductPerf[] | null>(null);
  const [filter, setFilter] = useState<PerfTier | "all">("all");

  useEffect(() => { fetchProductPerformance(90).then(setData); }, []);

  const counts = useMemo(() => {
    const c: Record<PerfTier, number> = { top: 0, high: 0, average: 0, low: 0 };
    for (const d of data ?? []) c[d.tier] += 1;
    return c;
  }, [data]);

  const filtered = useMemo(
    () => (data ?? []).filter((d) => filter === "all" || d.tier === filter),
    [data, filter],
  );

  return (
    <AdminShell title="Product Performance" subtitle="Last 90 days · views, orders, revenue & conversion" allow={["admin", "super_admin", "manager"]}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {TIERS.map((t) => {
          const m = tierMeta(t);
          return (
            <button key={t} onClick={() => setFilter(filter === t ? "all" : t)} className="text-left">
              <KpiCard label={m.label} value={counts[t]} icon={<span className={m.color}><Activity className="size-4" /></span>} />
            </button>
          );
        })}
      </div>

      <div className="card-premium rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur z-10">
          <h2 className="text-sm font-medium flex items-center gap-2"><Trophy className="size-4 text-accent" /> Rankings</h2>
          <div className="flex items-center gap-1.5">
            {(["all", ...TIERS] as const).map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${filter === t ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-white/5"}`}>
                {t === "all" ? "All" : tierMeta(t).label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        {data === null ? (
          <div className="p-8"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border sticky top-[49px] bg-card/80 backdrop-blur">
                <tr>
                  <th className="text-left px-5 py-2">Product</th>
                  <th className="text-left px-3 py-2">Tier</th>
                  <th className="text-right px-3 py-2"><Eye className="size-3 inline" /></th>
                  <th className="text-right px-3 py-2"><ShoppingCart className="size-3 inline" /></th>
                  <th className="text-right px-3 py-2"><DollarSign className="size-3 inline" /></th>
                  <th className="text-right px-3 py-2">Conv.</th>
                  <th className="text-right px-5 py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const m = tierMeta(d.tier);
                  const Trend = d.tier === "top" || d.tier === "high" ? TrendingUp : d.tier === "low" ? TrendingDown : Minus;
                  return (
                    <tr key={d.product.id} className="border-b border-border/40 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5">
                        <Link to="/products/$slug" params={{ slug: d.product.slug }} className="text-xs hover:text-accent">{d.product.name}</Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${m.ring} ${m.bg} ${m.color}`}>
                          <Trend className="size-2.5" /> {m.label.split(" ")[0]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">{d.views}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs">{d.orders}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs">${d.revenue.toFixed(0)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">{(d.conversion * 100).toFixed(1)}%</td>
                      <td className="px-5 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full ${m.bg.replace("/10", "/60")}`} style={{ width: `${d.score}%` }} />
                          </div>
                          <span className={`font-mono text-xs ${m.color}`}>{d.score}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-xs text-muted-foreground">No products.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
