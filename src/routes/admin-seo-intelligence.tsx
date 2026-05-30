import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Loader2, RefreshCw, Download, Gauge, TrendingUp, MousePointerClick,
  FileWarning, Link2, DollarSign, Lightbulb, AlertTriangle, CheckCircle2, RotateCcw,
} from "lucide-react";
import { AdminShell, logActivity } from "@/components/admin/AdminShell";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getSeoIntelligenceFn, syncSearchConsoleFn } from "@/lib/seo-intelligence.functions";
import {
  detectOpportunities, buildExecutive, fmtInt, fmtPct, fmtMoney, fmtPos,
  issueLabel, entityEditPath, auditToCsv, keywordsToCsv, revenueKeywordsToCsv,
  type SeoRaw, type SitemapHealth, type SeoOpportunity,
} from "@/lib/seo-intelligence";

export const Route = createFileRoute("/admin-seo-intelligence")({
  head: () => ({
    meta: [
      { title: "SEO Intelligence — FoundOurMarket™" },
      { name: "description", content: "Search Console rankings, metadata scores, broken links, sitemap health, CTR optimisation and organic revenue attribution." },
    ],
  }),
  component: SeoPage,
});

const RANGES = [
  { k: "7d", label: "7d" }, { k: "30d", label: "30d" },
  { k: "90d", label: "90d" }, { k: "365d", label: "1y" },
] as const;
type Range = (typeof RANGES)[number]["k"];

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function Kpi({ icon: Icon, label, value, sub, tone = "default" }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneCls = tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-rose-400" : tone === "warn" ? "text-amber-400" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={`mt-1 text-lg font-semibold leading-tight ${toneCls}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

const sevTone: Record<SeoOpportunity["severity"], string> = {
  high: "border-rose-500/40 bg-rose-500/5",
  medium: "border-amber-500/40 bg-amber-500/5",
  low: "border-border bg-card/40",
};

function SeoPage() {
  const fetchSeo = useServerFn(getSeoIntelligenceFn);
  const syncGsc = useServerFn(syncSearchConsoleFn);
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [raw, setRaw] = useState<SeoRaw | null>(null);
  const [sitemap, setSitemap] = useState<SitemapHealth | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSeo({ data: { range, checkSitemap: true } });
      setRaw(res.intelligence);
      setSitemap(res.sitemap);
    } catch (e) {
      toast.error((e as Error).message || "Failed to load SEO intelligence");
    } finally {
      setLoading(false);
    }
  }, [fetchSeo, range]);

  useEffect(() => { load(); }, [load]);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await syncGsc({ data: { days: 28 } });
      if (!res.connected) toast.error("Connect Google Search Console in Connectors to sync rankings.");
      else if (res.error) toast.error(res.error);
      else { toast.success(`Synced ${res.inserted} Search Console rows`); logActivity?.("seo_sync", `Synced ${res.inserted} Search Console rows`); await load(); }
    } catch (e) {
      toast.error((e as Error).message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [syncGsc, load]);

  const opps = useMemo(() => (raw ? detectOpportunities(raw, sitemap) : []), [raw, sitemap]);
  const exec = useMemo(() => (raw ? buildExecutive(raw, opps) : null), [raw, opps]);
  const sc = raw?.search_console;

  return (
    <AdminShell title="SEO Intelligence" subtitle="Rankings, metadata, links & organic revenue" allow={["admin", "super_admin", "manager", "editor"]}>
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-card/40 p-0.5">
            {RANGES.map((r) => (
              <button key={r.k} onClick={() => setRange(r.k)}
                className={`px-2.5 py-1 text-xs rounded-md ${range === r.k ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/40 px-2.5 py-1 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={sync} disabled={syncing} className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs text-accent">
            <RotateCcw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> Sync Search Console
          </button>
        </div>

        {loading && !raw ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !raw ? (
          <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-muted-foreground">No SEO data available.</div>
        ) : (
          <>
            {/* Executive summary */}
            {exec && (
              <div className="rounded-xl border border-border bg-card/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">SEO Health</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{exec.health_score}</span>
                      <span className="text-sm text-muted-foreground">/100 · Grade {exec.grade}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{exec.headline}</p>
                  </div>
                  <Gauge className="h-8 w-8 text-accent shrink-0" />
                </div>
                <ul className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  {exec.highlights.map((h, i) => <li key={i} className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />{h}</li>)}
                </ul>
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Kpi icon={Gauge} label="Metadata score" value={`${raw.audit.avg_score}`} sub={`${raw.audit.perfect}/${raw.audit.total} complete`} tone={raw.audit.avg_score >= 80 ? "good" : raw.audit.avg_score >= 60 ? "warn" : "bad"} />
              <Kpi icon={MousePointerClick} label="Organic clicks" value={sc?.available ? fmtInt(sc.totals!.clicks) : "—"} sub={sc?.available ? `${fmtInt(sc.totals!.impressions)} impr` : "Not connected"} />
              <Kpi icon={TrendingUp} label="Avg CTR" value={sc?.available ? fmtPct(sc.totals!.ctr) : "—"} />
              <Kpi icon={Search} label="Avg position" value={sc?.available ? fmtPos(sc.totals!.position) : "—"} />
              <Kpi icon={DollarSign} label="Organic revenue" value={fmtMoney(exec?.organic_revenue ?? 0)} sub="attributed" tone="good" />
              <Kpi icon={Link2} label="Sitemap URLs" value={sitemap ? fmtInt(sitemap.url_count) : "—"} sub={sitemap ? `${sitemap.broken.length} broken` : "—"} tone={sitemap && sitemap.broken.length > 0 ? "bad" : "default"} />
            </div>

            {/* Opportunities */}
            <section>
              <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-accent" /> Opportunities</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {opps.length === 0 && <div className="text-xs text-muted-foreground">No issues detected — SEO is in great shape.</div>}
                {opps.map((o) => (
                  <div key={o.id} className={`rounded-xl border p-3 ${sevTone[o.severity]}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{o.title}</span>
                      {o.metric && <span className="text-[10px] rounded-full border border-border px-1.5 py-0.5 text-muted-foreground">{o.metric}</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{o.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Metadata audit */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold"><FileWarning className="h-4 w-4 text-accent" /> Metadata issues</h3>
                <button onClick={() => download(`seo-audit-${range}.csv`, auditToCsv(raw.audit.rows))} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Download className="h-3.5 w-3.5" /> Export</button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-card/60 text-muted-foreground"><tr>
                    <th className="p-2 text-left">Page</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Score</th><th className="p-2 text-left">Issues</th>
                  </tr></thead>
                  <tbody>
                    {raw.audit.rows.slice(0, 40).map((r) => (
                      <tr key={`${r.type}-${r.id}`} className="border-t border-border">
                        <td className="p-2"><a href={entityEditPath[r.type](r.slug, r.id)} className="hover:text-accent">{r.title || r.slug}</a><div className="text-[10px] text-muted-foreground">{r.url}</div></td>
                        <td className="p-2 capitalize text-muted-foreground">{r.type}</td>
                        <td className={`p-2 font-semibold ${r.score >= 80 ? "text-emerald-400" : r.score >= 60 ? "text-amber-400" : "text-rose-400"}`}>{r.score}</td>
                        <td className="p-2"><div className="flex flex-wrap gap-1">{r.issues.map((i) => <span key={i} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{issueLabel(i)}</span>)}</div></td>
                      </tr>
                    ))}
                    {raw.audit.rows.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No metadata issues 🎉</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Search Console: keywords */}
            {sc?.available ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <KeywordTable title="Striking distance (pos 4–20)" rows={sc.striking_distance ?? []} onExport={() => download("striking-distance.csv", keywordsToCsv(sc.striking_distance ?? []))} />
                <KeywordTable title="CTR opportunities" rows={sc.ctr_opportunities ?? []} onExport={() => download("ctr-opportunities.csv", keywordsToCsv(sc.ctr_opportunities ?? []))} showExpected />
                <KeywordTable title="Top keywords" rows={sc.top_keywords ?? []} onExport={() => download("top-keywords.csv", keywordsToCsv(sc.top_keywords ?? []))} />
                <RevenueTable rows={raw.revenue_keywords} onExport={() => download("revenue-per-keyword.csv", revenueKeywordsToCsv(raw.revenue_keywords))} />
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
                <div className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-amber-400" /> Search Console not connected</div>
                <p className="mt-1 text-xs text-muted-foreground">Connect Google Search Console in Connectors, then click “Sync Search Console” to unlock keyword rankings, CTR optimisation, index coverage and revenue-per-keyword attribution.</p>
              </div>
            )}

            {/* Broken links */}
            {sitemap && sitemap.broken.length > 0 && (
              <section>
                <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold"><Link2 className="h-4 w-4 text-rose-400" /> Broken URLs ({sitemap.broken.length})</h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs"><tbody>
                    {sitemap.broken.map((b) => (
                      <tr key={b.url} className="border-t border-border first:border-0"><td className="p-2">{b.url}</td><td className="p-2 text-rose-400">{b.status}</td></tr>
                    ))}
                  </tbody></table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}

function KeywordTable({ title, rows, onExport, showExpected }: { title: string; rows: { keyword: string; clicks: number; impressions: number; ctr: number; position: number; expected_ctr?: number }[]; onExport: () => void; showExpected?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card/40">
      <div className="flex items-center justify-between border-b border-border p-2.5">
        <span className="text-sm font-medium">{title}</span>
        <button onClick={onExport} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Download className="h-3.5 w-3.5" /></button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-card/60 text-muted-foreground sticky top-0"><tr>
            <th className="p-2 text-left">Keyword</th><th className="p-2 text-right">Clicks</th><th className="p-2 text-right">Impr</th><th className="p-2 text-right">CTR</th>{showExpected && <th className="p-2 text-right">Exp.</th>}<th className="p-2 text-right">Pos</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.keyword} className="border-t border-border">
                <td className="p-2 max-w-[180px] truncate">{r.keyword}</td>
                <td className="p-2 text-right">{fmtInt(r.clicks)}</td>
                <td className="p-2 text-right">{fmtInt(r.impressions)}</td>
                <td className="p-2 text-right">{fmtPct(r.ctr)}</td>
                {showExpected && <td className="p-2 text-right text-muted-foreground">{fmtPct(r.expected_ctr ?? 0)}</td>}
                <td className="p-2 text-right">{fmtPos(r.position)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={showExpected ? 6 : 5} className="p-4 text-center text-muted-foreground">No data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevenueTable({ rows, onExport }: { rows: { keyword: string; clicks: number; est_revenue: number }[]; onExport: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card/40">
      <div className="flex items-center justify-between border-b border-border p-2.5">
        <span className="text-sm font-medium">Revenue per keyword</span>
        <button onClick={onExport} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Download className="h-3.5 w-3.5" /></button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-card/60 text-muted-foreground sticky top-0"><tr>
            <th className="p-2 text-left">Keyword</th><th className="p-2 text-right">Clicks</th><th className="p-2 text-right">Revenue</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.keyword} className="border-t border-border">
                <td className="p-2 max-w-[200px] truncate">{r.keyword}</td>
                <td className="p-2 text-right">{fmtInt(r.clicks)}</td>
                <td className="p-2 text-right text-emerald-400">{fmtMoney(r.est_revenue)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No organic revenue attributed yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
