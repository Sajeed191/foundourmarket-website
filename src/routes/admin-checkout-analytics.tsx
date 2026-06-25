import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Loader2, AlertTriangle, RefreshCw, Download, TrendingDown, MapPinOff,
  CheckCircle2, CreditCard, Truck, FileText, Percent,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useCheckoutAnalytics, type CheckoutAnalytics } from "@/lib/use-checkout-analytics";

export const Route = createFileRoute("/admin-checkout-analytics")({
  head: () => ({ meta: [{ title: "Checkout Conversion — Admin" }] }),
  component: CheckoutAnalyticsPage,
});

type Role = "admin" | "super_admin" | "manager" | "support" | "fulfillment" | "warehouse_staff" | "editor";
const ALLOW: Role[] = ["admin", "super_admin", "manager"];

function Card({ title, icon, children, className = "", actions }: { title?: string; icon?: React.ReactNode; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <div className={`card-premium rounded-2xl p-4 sm:p-5 w-full min-w-0 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 mb-4">
          {title && <h2 className="text-sm font-medium flex items-center gap-2 min-w-0"><span className="shrink-0 text-accent">{icon}</span><span className="truncate">{title}</span></h2>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

function Kpi({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "default" | "good" | "bad" }) {
  const c = tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-destructive" : "text-foreground";
  return (
    <div className="card-premium rounded-2xl p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${c}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Bar({ value, max, color = "bg-accent" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>;
}

function RankList({ rows, color }: { rows: { key: string; count: number }[]; color?: string }) {
  const max = rows[0]?.count ?? 0;
  if (rows.length === 0) return <p className="text-xs text-muted-foreground">No data in this window.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.key} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-mono">{r.key}</span>
            <span className="tabular-nums text-muted-foreground shrink-0">{r.count}</span>
          </div>
          <Bar value={r.count} max={max} color={color} />
        </li>
      ))}
    </ul>
  );
}

function downloadReport(d: CheckoutAnalytics) {
  const lines: string[] = [];
  lines.push("FoundOurMarket Checkout Conversion Report");
  lines.push(`Window,${d.windowDays} days`);
  lines.push("");
  lines.push("Metric,Value");
  lines.push(`Checkouts started,${d.funnel.started}`);
  lines.push(`Address completed,${d.funnel.addressCompleted}`);
  lines.push(`Delivery verified,${d.funnel.deliveryVerified}`);
  lines.push(`Order created,${d.funnel.orderCreated}`);
  lines.push(`Payment opened,${d.funnel.paymentOpened}`);
  lines.push(`Completed,${d.funnel.completed}`);
  lines.push(`Failed,${d.funnel.failed}`);
  lines.push(`Cancelled,${d.funnel.cancelled}`);
  lines.push(`Address completion rate,${d.rates.addressCompletionRate}%`);
  lines.push(`Checkout completion rate,${d.rates.checkoutCompletionRate}%`);
  lines.push("");
  lines.push("Most abandoned fields,Count");
  d.abandonedFields.forEach((r) => lines.push(`${r.key},${r.count}`));
  lines.push("");
  lines.push("Validation errors,Count");
  d.validationErrors.forEach((r) => lines.push(`${r.key},${r.count}`));
  lines.push("");
  lines.push("Serviceability failures by pincode,Count");
  d.serviceabilityByPincode.forEach((r) => lines.push(`${r.key},${r.count}`));
  lines.push("");
  lines.push("Week,Started,Address completed,Completed,Address rate %,Checkout rate %");
  d.weekly.forEach((w) => lines.push(`${w.weekStart},${w.started},${w.addressCompleted},${w.completed},${w.addressCompletionRate},${w.checkoutCompletionRate}`));

  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `checkout-conversion-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function CheckoutAnalyticsPage() {
  const [windowDays, setWindowDays] = useState(7);
  const { data, loading, error, refresh } = useCheckoutAnalytics(windowDays);

  return (
    <AdminShell title="Checkout Conversion" allow={ALLOW}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Checkout Conversion</h1>
            <p className="text-xs text-muted-foreground">Address-step abandonment & funnel drop-off</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-white/10 overflow-hidden">
              {[3, 7, 14, 30].map((d) => (
                <button key={d} onClick={() => setWindowDays(d)}
                  className={`px-3 py-1.5 text-xs ${windowDays === d ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {d}d
                </button>
              ))}
            </div>
            <button onClick={() => refresh()} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs hover:border-accent/40">
              <RefreshCw className="size-3.5" /> Refresh
            </button>
            {data && (
              <button onClick={() => downloadReport(data)} className="inline-flex items-center gap-1.5 rounded-xl bg-accent text-accent-foreground px-3 py-1.5 text-xs font-medium">
                <Download className="size-3.5" /> Weekly report
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <Card><p className="text-xs text-destructive flex items-center gap-2"><AlertTriangle className="size-4" />{error}</p></Card>
        ) : !data ? null : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi label="Address completion" value={`${data.rates.addressCompletionRate}%`} sub={`${data.funnel.addressCompleted} of ${data.funnel.started} started`} tone={data.rates.addressCompletionRate >= 60 ? "good" : "bad"} />
              <Kpi label="Checkout completion" value={`${data.rates.checkoutCompletionRate}%`} sub={`${data.funnel.completed} completed`} tone={data.rates.checkoutCompletionRate >= 40 ? "good" : "bad"} />
              <Kpi label="Address → payment" value={`${data.rates.addressToPayment}%`} sub={`${data.funnel.paymentOpened} payment opens`} />
              <Kpi label="Failed / cancelled" value={`${data.funnel.failed + data.funnel.cancelled}`} sub={`${data.funnel.failed} failed · ${data.funnel.cancelled} cancelled`} tone="bad" />
            </div>

            <Card title="Funnel" icon={<Percent className="size-4" />}>
              <div className="space-y-3">
                {[
                  { label: "Checkout started", v: data.funnel.started, icon: <CheckCircle2 className="size-3.5" /> },
                  { label: "Address completed", v: data.funnel.addressCompleted, icon: <CheckCircle2 className="size-3.5" /> },
                  { label: "Delivery verified", v: data.funnel.deliveryVerified, icon: <Truck className="size-3.5" /> },
                  { label: "Order created", v: data.funnel.orderCreated, icon: <FileText className="size-3.5" /> },
                  { label: "Payment opened", v: data.funnel.paymentOpened, icon: <CreditCard className="size-3.5" /> },
                  { label: "Completed", v: data.funnel.completed, icon: <CheckCircle2 className="size-3.5" /> },
                ].map((s) => (
                  <div key={s.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">{s.icon}{s.label}</span>
                      <span className="tabular-nums">{s.v}</span>
                    </div>
                    <Bar value={s.v} max={data.funnel.started || 1} />
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid lg:grid-cols-3 gap-4">
              <Card title="Most abandoned fields" icon={<TrendingDown className="size-4" />}>
                <RankList rows={data.abandonedFields} color="bg-amber-400" />
              </Card>
              <Card title="Validation errors" icon={<AlertTriangle className="size-4" />}>
                <RankList rows={data.validationErrors} color="bg-destructive" />
              </Card>
              <Card title="Serviceability failures by pincode" icon={<MapPinOff className="size-4" />}>
                <RankList rows={data.serviceabilityByPincode} color="bg-rose-400" />
              </Card>
            </div>

            <Card title="Weekly conversion report" icon={<FileText className="size-4" />}
              actions={<button onClick={() => downloadReport(data)} className="inline-flex items-center gap-1.5 text-xs text-accent"><Download className="size-3.5" /> CSV</button>}>
              {data.weekly.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data in this window.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-white/10">
                        <th className="py-2 pr-3 font-medium">Week of</th>
                        <th className="py-2 px-3 font-medium text-right">Started</th>
                        <th className="py-2 px-3 font-medium text-right">Address ✓</th>
                        <th className="py-2 px-3 font-medium text-right">Completed</th>
                        <th className="py-2 px-3 font-medium text-right">Addr rate</th>
                        <th className="py-2 pl-3 font-medium text-right">Checkout rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.weekly.map((w) => (
                        <tr key={w.weekStart} className="border-b border-white/5">
                          <td className="py-2 pr-3 font-mono">{w.weekStart}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{w.started}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{w.addressCompleted}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{w.completed}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{w.addressCompletionRate}%</td>
                          <td className="py-2 pl-3 text-right tabular-nums">{w.checkoutCompletionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AdminShell>
  );
}
