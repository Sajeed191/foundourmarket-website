import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, TrendingUp, TrendingDown, Minus, Loader2, Eye, ShoppingCart, DollarSign,
  Activity, Crown, Zap, Boxes, ChevronDown, Package, Lightbulb, Target, Gauge,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { KpiCard } from "@/components/admin/KpiCard";
import {
  fetchCategoryIntelligence, HEALTH_META,
  type CategoryIntel, type CatHealth, type CategoryInsight,
} from "@/lib/category-intelligence";

export const Route = createFileRoute("/admin-categories")({
  head: () => ({ meta: [{ title: "Category Intelligence — Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CategoryIntelligencePage,
});

const money = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(v);
const num = (v: number) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(v);

const HEALTHS: CatHealth[] = ["excellent", "good", "attention", "critical"];

function GlowTooltip({ active, payload, label, money: isMoney }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 px-3 py-2 backdrop-blur text-xs shadow-xl">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="tabular-nums" style={{ color: p.color }}>
          {p.name}: {isMoney ? money(p.value) : num(p.value)}
        </p>
      ))}
    </div>
  );
}

function CategoryIntelligencePage() {
  const [data, setData] = useState<CategoryIntel[] | null>(null);
  const [insights, setInsights] = useState<CategoryInsight[]>([]);
  const [filter, setFilter] = useState<CatHealth | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoryIntelligence(90).then(({ categories, insights }) => {
      setData(categories);
      setInsights(insights);
      if (categories.length) setSelected(categories[0].slug);
    });
  }, []);

  const totals = useMemo(() => {
    const d = data ?? [];
    return {
      revenue: d.reduce((s, c) => s + c.revenue, 0),
      orders: d.reduce((s, c) => s + c.orders, 0),
      views: d.reduce((s, c) => s + c.views, 0),
      products: d.reduce((s, c) => s + c.productCount, 0),
    };
  }, [data]);

  const healthCounts = useMemo(() => {
    const c: Record<CatHealth, number> = { excellent: 0, good: 0, attention: 0, critical: 0 };
    for (const d of data ?? []) c[d.health] += 1;
    return c;
  }, [data]);

  const leaders = useMemo(() => {
    const d = data ?? [];
    if (!d.length) return null;
    return {
      revenue: [...d].sort((a, b) => b.revenue - a.revenue)[0],
      conversion: [...d].sort((a, b) => b.conversion - a.conversion)[0],
      views: [...d].sort((a, b) => b.views - a.views)[0],
      growth: [...d].filter((c) => c.revenue > 0).sort((a, b) => b.growth - a.growth)[0] ?? d[0],
    };
  }, [data]);

  const filtered = useMemo(
    () => (data ?? []).filter((c) => filter === "all" || c.health === filter),
    [data, filter],
  );

  const sel = useMemo(() => (data ?? []).find((c) => c.slug === selected) ?? null, [data, selected]);

  return (
    <AdminShell
      title="Category Intelligence"
      subtitle="Last 90 days · revenue, conversion, growth & health per category"
      allow={["admin", "super_admin", "manager"]}
    >
      {data === null ? (
        <div className="grid place-items-center py-24"><Loader2 className="size-5 animate-spin text-accent" /></div>
      ) : (
        <div className="space-y-6">
          {/* ===== KPI SUMMARY ===== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Total Revenue" value={money(totals.revenue)} icon={<DollarSign className="size-4" />} />
            <KpiCard label="Total Orders" value={num(totals.orders)} icon={<ShoppingCart className="size-4" />} />
            <KpiCard label="Total Views" value={num(totals.views)} icon={<Eye className="size-4" />} />
            <KpiCard label="Products" value={num(totals.products)} icon={<Package className="size-4" />} />
          </div>

          {/* ===== LEADERBOARD ===== */}
          {leaders && (
            <section>
              <h2 className="text-sm font-medium flex items-center gap-2 mb-3"><Trophy className="size-4 text-accent" /> Category Leaderboard</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <LeaderCard icon={<Crown className="size-4" />} title="Highest Revenue" cat={leaders.revenue} metric={money(leaders.revenue.revenue)} onClick={() => setSelected(leaders.revenue.slug)} />
                <LeaderCard icon={<Target className="size-4" />} title="Highest Conversion" cat={leaders.conversion} metric={`${(leaders.conversion.conversion * 100).toFixed(1)}%`} onClick={() => setSelected(leaders.conversion.slug)} />
                <LeaderCard icon={<Eye className="size-4" />} title="Most Viewed" cat={leaders.views} metric={num(leaders.views.views)} onClick={() => setSelected(leaders.views.slug)} />
                <LeaderCard icon={<Zap className="size-4" />} title="Fastest Growing" cat={leaders.growth} metric={`${leaders.growth.growth >= 0 ? "+" : ""}${leaders.growth.growth.toFixed(0)}%`} onClick={() => setSelected(leaders.growth.slug)} />
              </div>
            </section>
          )}

          {/* ===== INSIGHTS ===== */}
          {insights.length > 0 && (
            <section className="card-premium rounded-2xl p-4">
              <h2 className="text-sm font-medium flex items-center gap-2 mb-3"><Lightbulb className="size-4 text-accent" /> Category Insights</h2>
              <div className="space-y-2">
                {insights.map((ins, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-xs ${
                      ins.tone === "positive" ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-200"
                      : ins.tone === "warning" ? "border-amber-400/30 bg-amber-400/5 text-amber-200"
                      : ins.tone === "negative" ? "border-destructive/30 bg-destructive/5 text-red-200"
                      : "border-border bg-white/[0.02] text-muted-foreground"
                    }`}
                  >
                    {ins.tone === "positive" ? <TrendingUp className="size-3.5 mt-0.5 shrink-0" />
                      : ins.tone === "negative" ? <TrendingDown className="size-3.5 mt-0.5 shrink-0" />
                      : <Activity className="size-3.5 mt-0.5 shrink-0" />}
                    <span className="leading-relaxed">{ins.text}</span>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ===== HEALTH FILTER ===== */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setFilter("all")}
              className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border ${filter === "all" ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-white/5"}`}>
              All · {(data ?? []).length}
            </button>
            {HEALTHS.map((h) => {
              const m = HEALTH_META[h];
              return (
                <button key={h} onClick={() => setFilter(filter === h ? "all" : h)}
                  className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border ${filter === h ? `${m.ring} ${m.bg} ${m.color}` : "border-border text-muted-foreground hover:bg-white/5"}`}>
                  {m.label} · {healthCounts[h]}
                </button>
              );
            })}
          </div>

          {/* ===== CATEGORY CARDS ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((c) => {
              const m = HEALTH_META[c.health];
              const Trend = c.growth > 1 ? TrendingUp : c.growth < -1 ? TrendingDown : Minus;
              const isExpanded = expanded === c.slug;
              const isSelected = selected === c.slug;
              return (
                <motion.div
                  key={c.slug}
                  layout
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className={`card-premium rounded-2xl overflow-hidden border transition-colors ${isSelected ? "border-accent/50" : "border-border"}`}
                >
                  <button onClick={() => setSelected(c.slug)} className="w-full text-left">
                    <div className="flex items-start gap-3 p-4">
                      <div className="size-16 rounded-xl overflow-hidden bg-muted shrink-0 ring-1 ring-inset ring-white/10">
                        {c.image
                          ? <img src={c.image} alt={c.name} className="size-full object-cover" loading="lazy" />
                          : <div className="size-full grid place-items-center"><Boxes className="size-5 text-muted-foreground" /></div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-medium truncate">{c.name}</h3>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${m.ring} ${m.bg} ${m.color}`}>
                            {m.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{c.productCount} products</p>
                        <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-mono">
                          <Trend className={`size-3 ${c.growth > 1 ? "text-emerald-400" : c.growth < -1 ? "text-destructive" : "text-muted-foreground"}`} />
                          <span className={c.growth > 1 ? "text-emerald-400" : c.growth < -1 ? "text-destructive" : "text-muted-foreground"}>
                            {c.growth >= 0 ? "+" : ""}{c.growth.toFixed(0)}% growth
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-px bg-border/40">
                    <Metric label="Revenue" value={money(c.revenue)} />
                    <Metric label="Orders" value={num(c.orders)} />
                    <Metric label="Views" value={num(c.views)} />
                    <Metric label="Conversion" value={`${(c.conversion * 100).toFixed(1)}%`} />
                    <Metric label="Avg Order" value={money(c.aov)} />
                    <Metric label="Score" value={String(c.score)} accent={m.color} />
                  </div>

                  {/* Top product */}
                  {c.topProduct && (
                    <Link to="/products/$slug" params={{ slug: c.topProduct.slug }}
                      className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-border hover:bg-white/[0.02]">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Trophy className="size-3 text-accent" /> Top product</span>
                      <span className="text-xs truncate text-accent">{c.topProduct.name}</span>
                    </Link>
                  )}

                  {/* Subcategories */}
                  {c.subcategories.length > 0 && (
                    <div className="border-t border-border">
                      <button onClick={() => setExpanded(isExpanded ? null : c.slug)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:bg-white/[0.02]">
                        <span>{c.subcategories.length} subcategories</span>
                        <ChevronDown className={`size-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-3 space-y-1.5">
                              {c.subcategories.map((s) => (
                                <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] px-3 py-2">
                                  <span className="text-xs truncate flex-1">{s.name}</span>
                                  <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{s.productCount}p</span>
                                  <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{num(s.orders)}o</span>
                                  <span className="text-[10px] font-mono whitespace-nowrap">{money(s.revenue)}</span>
                                  <span className="text-[10px] font-mono text-accent whitespace-nowrap">{(s.conversion * 100).toFixed(1)}%</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="md:col-span-2 card-premium rounded-2xl p-10 text-center text-xs text-muted-foreground">No categories in this segment.</div>
            )}
          </div>

          {/* ===== PERFORMANCE CHARTS ===== */}
          {sel && (
            <section className="card-premium rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Gauge className="size-4 text-accent" />
                <h2 className="text-sm font-medium">Performance Charts — <span className="text-accent">{sel.name}</span></h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ChartCard title="Revenue trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sel.trend} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
                      <defs>
                        <linearGradient id="catRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.72 0.17 50)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="oklch(0.72 0.17 50)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                      <XAxis dataKey="label" tick={{ fontSize: 8, fill: "oklch(0.7 0 0)" }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 8, fill: "oklch(0.7 0 0)" }} />
                      <Tooltip content={<GlowTooltip money />} />
                      <Area type="monotone" name="Revenue" dataKey="revenue" stroke="oklch(0.72 0.17 50)" strokeWidth={2} fill="url(#catRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Orders trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sel.trend} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                      <XAxis dataKey="label" tick={{ fontSize: 8, fill: "oklch(0.7 0 0)" }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 8, fill: "oklch(0.7 0 0)" }} allowDecimals={false} />
                      <Tooltip content={<GlowTooltip />} />
                      <Line type="monotone" name="Orders" dataKey="orders" stroke="oklch(0.7 0.15 200)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Views — by subcategory">
                  {sel.subcategories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sel.subcategories.map((s) => ({ label: s.name, orders: s.orders }))} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                        <XAxis dataKey="label" tick={{ fontSize: 8, fill: "oklch(0.7 0 0)" }} interval={0} />
                        <YAxis tick={{ fontSize: 8, fill: "oklch(0.7 0 0)" }} allowDecimals={false} />
                        <Tooltip content={<GlowTooltip />} />
                        <Bar dataKey="orders" name="Orders" fill="oklch(0.7 0.15 280)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="grid place-items-center h-full text-[11px] text-muted-foreground">No subcategory breakdown.</div>
                  )}
                </ChartCard>
              </div>
            </section>
          )}
        </div>
      )}
    </AdminShell>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-card px-3 py-2.5">
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-sm font-display font-semibold tabular-nums mt-0.5 ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function LeaderCard({ icon, title, cat, metric, onClick }: {
  icon: React.ReactNode; title: string; cat: CategoryIntel; metric: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="text-left card-premium rounded-2xl p-4 hover:border-accent/40 transition-colors group">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <span className="text-accent">{icon}</span>
        <span className="text-[9px] font-mono uppercase tracking-[0.25em]">{title}</span>
      </div>
      <p className="text-sm font-medium truncate group-hover:text-accent transition-colors">{cat.name}</p>
      <p className="text-xl font-display font-semibold tabular-nums mt-1 text-gradient-ember">{metric}</p>
    </button>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white/[0.02] p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      <div className="h-44">{children}</div>
    </div>
  );
}
