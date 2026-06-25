import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Loader2, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Minus, Filter,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  useCheckoutFunnel,
  type FunnelWindow,
  type CategoryStat,
} from "@/lib/use-checkout-funnel";

export const Route = createFileRoute("/admin-checkout-funnel")({
  head: () => ({ meta: [{ title: "Checkout Funnel — Admin" }] }),
  component: CheckoutFunnelPage,
});

type Role = "admin" | "super_admin" | "manager";
const ALLOW: Role[] = ["admin", "super_admin", "manager"];

const WINDOWS = [
  { key: "last24h", label: "Last 24 Hours" },
  { key: "last7d", label: "Last 7 Days" },
  { key: "last30d", label: "Last 30 Days" },
] as const;

type WindowKey = (typeof WINDOWS)[number]["key"];

function Card({ title, icon, children }: { title?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card-premium rounded-2xl p-4 sm:p-5 w-full min-w-0">
      {title && (
        <h2 className="text-sm font-medium flex items-center gap-2 mb-4 min-w-0">
          <span className="shrink-0 text-accent">{icon}</span>
          <span className="truncate">{title}</span>
        </h2>
      )}
      {children}
    </div>
  );
}

function Bar({ value, max, color = "bg-accent" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Trend({ value }: { value: number }) {
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
        <Minus className="size-3" /> 0%
      </span>
    );
  const up = value > 0;
  // For failures, "up" is bad (more failures), "down" is good.
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] tabular-nums ${up ? "text-destructive" : "text-emerald-400"}`}>
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {up ? "+" : ""}{value}%
    </span>
  );
}

const CAT_COLOR: Record<string, string> = {
  SDK: "bg-sky-400",
  Network: "bg-amber-400",
  Gateway: "bg-fuchsia-400",
  Validation: "bg-orange-400",
  Authentication: "bg-rose-400",
  Stock: "bg-yellow-400",
  Other: "bg-slate-400",
};

function FunnelSteps({ w }: { w: FunnelWindow }) {
  const max = w.steps[0]?.count || 1;
  return (
    <div className="space-y-3">
      {w.steps.map((s) => (
        <div key={s.key} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span className="tabular-nums font-medium">{s.count}</span>
          </div>
          <Bar value={s.count} max={max} />
        </div>
      ))}
    </div>
  );
}

function Categories({ cats, total }: { cats: CategoryStat[]; total: number }) {
  if (total === 0) return <p className="text-xs text-muted-foreground">No failures in this window. 🎉</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="text-left font-medium pb-2">Category</th>
            <th className="text-right font-medium pb-2">Count</th>
            <th className="text-right font-medium pb-2">%</th>
            <th className="text-right font-medium pb-2">Trend</th>
          </tr>
        </thead>
        <tbody>
          {cats.map((c) => (
            <tr key={c.category} className="border-t border-white/5">
              <td className="py-2">
                <span className="inline-flex items-center gap-2">
                  <span className={`size-2 rounded-full ${CAT_COLOR[c.category] ?? "bg-slate-400"}`} />
                  {c.category}
                </span>
              </td>
              <td className="py-2 text-right tabular-nums font-medium">{c.count}</td>
              <td className="py-2 text-right tabular-nums text-muted-foreground">{c.percentage}%</td>
              <td className="py-2 text-right"><Trend value={c.trend} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopReasons({ w }: { w: FunnelWindow }) {
  if (w.topReasons.length === 0)
    return <p className="text-xs text-muted-foreground">No failure reasons in this window.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="text-left font-medium pb-2">Reason</th>
            <th className="text-left font-medium pb-2">Category</th>
            <th className="text-right font-medium pb-2">Count</th>
          </tr>
        </thead>
        <tbody>
          {w.topReasons.map((r, i) => (
            <tr key={`${r.reason}-${i}`} className="border-t border-white/5">
              <td className="py-2 font-mono max-w-[220px] truncate" title={r.reason}>{r.reason}</td>
              <td className="py-2">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className={`size-2 rounded-full ${CAT_COLOR[r.category] ?? "bg-slate-400"}`} />
                  {r.category}
                </span>
              </td>
              <td className="py-2 text-right tabular-nums font-medium">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CheckoutFunnelPage() {
  const [windowKey, setWindowKey] = useState<WindowKey>("last7d");
  const { data, loading, error, refresh } = useCheckoutFunnel();
  const w = data?.[windowKey];

  return (
    <AdminShell title="Checkout Funnel" allow={ALLOW}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Checkout Funnel Analytics</h1>
            <p className="text-xs text-muted-foreground">Step volumes, failure categories & top reasons</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-white/10 overflow-hidden">
              {WINDOWS.map((win) => (
                <button
                  key={win.key}
                  onClick={() => setWindowKey(win.key)}
                  className={`px-3 py-1.5 text-xs whitespace-nowrap ${windowKey === win.key ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {win.label}
                </button>
              ))}
            </div>
            <button onClick={() => refresh()} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs hover:border-accent/40">
              <RefreshCw className="size-3.5" /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <Card><p className="text-xs text-destructive flex items-center gap-2"><AlertTriangle className="size-4" />{error}</p></Card>
        ) : !w ? null : (
          <>
            <Card title="Funnel Steps" icon={<Filter className="size-4" />}>
              <FunnelSteps w={w} />
            </Card>

            <Card title={`Failure Categories · ${w.totalFailures} total`} icon={<AlertTriangle className="size-4" />}>
              <Categories cats={w.categories} total={w.totalFailures} />
            </Card>

            <Card title="Top Failure Reasons" icon={<TrendingDown className="size-4" />}>
              <TopReasons w={w} />
            </Card>
          </>
        )}
      </div>
    </AdminShell>
  );
}
