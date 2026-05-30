import { Link } from "@tanstack/react-router";
import { Globe, RadioTower, ChevronRight, TrendingUp } from "lucide-react";
import { useTrafficSummary } from "@/lib/use-traffic-summary";

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/**
 * Compact Traffic Intelligence summary for the Executive Dashboard / AI Ops.
 * Reads the shared analytics pipeline (page_views, visitor_sessions,
 * analytics_events, orders) — same source as the full Command Center.
 */
export function TrafficSummaryCard() {
  const s = useTrafficSummary();
  if (s.loading) return null;

  return (
    <Link
      to="/admin-traffic"
      className="block rounded-2xl glass p-4 border border-white/[0.08] hover:border-accent/30 transition-all"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="size-4 text-accent" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/80">Traffic Intelligence</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-accent">
          <RadioTower className="size-3" /> {s.live} live
          <ChevronRight className="size-3.5 text-muted-foreground ml-1" />
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Stat label="Views" value={s.views.toLocaleString()} />
        <Stat label="Sessions" value={s.sessions.toLocaleString()} />
        <Stat label="Orders" value={s.orders.toLocaleString()} />
        <Stat label="Conv" value={`${s.conversion.toFixed(1)}%`} />
        <Stat label="Revenue" value={inr(s.revenue)} tone="text-emerald-300" />
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1.5">
        <TrendingUp className="size-3" /> Top source: <span className="text-foreground">{s.topSource}</span>
      </p>
    </Link>
  );
}

function Stat({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-1.5">
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
