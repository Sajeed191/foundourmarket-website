/**
 * Vendor Analytics — Track A, Phase 4.
 *
 * Presentation-only surface over the FROZEN Platform v1.0 contracts.
 * Reuses:
 *   - useMarketplaceHealth      (VendorIntelligence + listings + modules)
 *   - useRecommendationAnalytics (marketplace-wide lifecycle context)
 *
 * All vendor-scoped numbers are composed from data already produced by
 * the platform — no new analyzers, no new scoring, no new lifecycle
 * tracking beyond a tiny per-vendor snapshot used to compute deltas.
 *
 * Freeze contract:
 *   - Vendor-only view of the recommendation lifecycle
 *   - No comparisons to other vendors
 *   - One suggested action per "Area to Improve" row
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Sparkles, Layers,
  CheckCircle2, ListChecks, RefreshCw, Package, Store, ArrowRight,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";
import { useMarketplaceHealth, type MarketplaceHealthListing } from "@/lib/use-marketplace-health";
import type { IntelligenceModule } from "@/lib/catalog-intelligence";

const VENDOR_KEY = "fom.vendor-portal.current.v1";
function loadVendor(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(VENDOR_KEY); } catch { return null; }
}

/** Per-vendor snapshot used only to compute deltas / lifecycle counts. */
type VendorSnapshot = {
  savedAt: string;
  score: number;
  readiness: number;
  blockerKeys: string[];   // `${module}::${action}` for each top blocker
};
function snapKey(vendorId: string): string {
  return `fom.vendor-portal.snap.${vendorId}.v1`;
}
function loadSnap(vendorId: string): VendorSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(snapKey(vendorId));
    return raw ? (JSON.parse(raw) as VendorSnapshot) : null;
  } catch { return null; }
}
function saveSnap(vendorId: string, snap: VendorSnapshot) {
  try { window.localStorage.setItem(snapKey(vendorId), JSON.stringify(snap)); } catch { /* ignore */ }
}

const MODULE_LABEL: Record<string, string> = {
  product_completeness: "Completeness",
  attribute_intelligence: "Attributes",
  variant_intelligence: "Variants",
  seo_intelligence: "SEO",
  pricing_intelligence: "Pricing",
  image_intelligence: "Images",
};

const MODULE_ACTION: Record<string, string> = {
  product_completeness: "Review Listings",
  attribute_intelligence: "Complete Attributes",
  variant_intelligence: "Manage Variants",
  seo_intelligence: "Improve SEO",
  pricing_intelligence: "Review Pricing",
  image_intelligence: "Review Images",
};

function scoreTint(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-sky-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}

function deltaTone(delta: number): string {
  if (delta > 1) return "text-emerald-300";
  if (delta < -1) return "text-rose-300";
  return "text-muted-foreground";
}

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 1) return <TrendingUp className="h-3.5 w-3.5" />;
  if (delta < -1) return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

export const Route = createFileRoute("/vendor-analytics")({
  head: () => ({
    meta: [
      { title: "My Analytics — FoundOurMarket™" },
      {
        name: "description",
        content:
          "Your store's health, resolution rate, and areas to improve — powered by the frozen FoundOurMarket™ Platform.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: VendorAnalyticsPage,
});

function VendorAnalyticsPage() {
  const bundle = useMarketplaceHealth();
  const vendorId = loadVendor();

  const currentVendor = useMemo(
    () => bundle.vendors.find((v) => v.vendorId === vendorId) ?? null,
    [bundle.vendors, vendorId],
  );

  const vendorNameLc = (currentVendor?.vendorName ?? "").toLowerCase();
  const vendorListings: MarketplaceHealthListing[] = useMemo(
    () => (vendorNameLc
      ? bundle.listings.filter((l) => (l.vendorName ?? "").toLowerCase() === vendorNameLc)
      : []),
    [bundle.listings, vendorNameLc],
  );

  // Blocker keys for lifecycle diffing (top blocker per listing).
  const currentBlockerKeys = useMemo(() => {
    const keys: string[] = [];
    for (const l of vendorListings) {
      const top = l.readiness.topRecommendation;
      if (top) keys.push(`${top.module}::${top.action}`);
    }
    return keys;
  }, [vendorListings]);

  // Read prior snapshot once, then persist a new one after render.
  const priorRef = useRef<VendorSnapshot | null>(null);
  if (priorRef.current === null && currentVendor) {
    priorRef.current = loadSnap(currentVendor.vendorId);
  }
  useEffect(() => {
    if (!currentVendor) return;
    const next: VendorSnapshot = {
      savedAt: new Date().toISOString(),
      score: currentVendor.score,
      readiness: currentVendor.averages.readiness,
      blockerKeys: currentBlockerKeys,
    };
    saveSnap(currentVendor.vendorId, next);
  }, [currentVendor, currentBlockerKeys]);

  const prior = priorRef.current;
  const scoreDelta = prior && currentVendor ? currentVendor.score - prior.score : 0;
  const readinessDelta = prior && currentVendor ? currentVendor.averages.readiness - prior.readiness : 0;

  // Lifecycle counts (vendor-scoped) — pure diff over blocker keys.
  const lifecycleCounts = useMemo(() => {
    const priorSet = new Set(prior?.blockerKeys ?? []);
    const currSet = new Set(currentBlockerKeys);
    let newCount = 0, persistent = 0, resolved = 0, regressed = 0;
    for (const k of currSet) (priorSet.has(k) ? persistent++ : newCount++);
    for (const k of priorSet) if (!currSet.has(k)) resolved++;
    // Regressed = items that were resolved earlier snapshot and re-appear now.
    // With a single snapshot window we can't detect this reliably; leave 0
    // rather than inventing new logic (frozen platform is source of truth).
    void regressed;
    return { new: newCount, persistent, resolved, regressed: 0 };
  }, [prior, currentBlockerKeys]);

  // Areas to Improve — average per-module score across vendor's listings.
  const areasToImprove = useMemo(() => {
    if (vendorListings.length === 0) return [];
    const sums = new Map<string, { sum: number; count: number }>();
    for (const l of vendorListings) {
      for (const m of l.modules as IntelligenceModule[]) {
        const s = sums.get(m.moduleId) ?? { sum: 0, count: 0 };
        s.sum += m.score;
        s.count += 1;
        sums.set(m.moduleId, s);
      }
    }
    return [...sums.entries()]
      .map(([moduleId, { sum, count }]) => ({
        moduleId,
        averageScore: Math.round(sum / count),
        listingCount: count,
      }))
      .sort((a, b) => a.averageScore - b.averageScore); // weakest first
  }, [vendorListings]);

  // Recent improvements — a plain-language list synthesised from resolved keys.
  const recentImprovements = useMemo(() => {
    const priorSet = new Set(prior?.blockerKeys ?? []);
    const currSet = new Set(currentBlockerKeys);
    const resolved = [...priorSet].filter((k) => !currSet.has(k));
    // Group by module for a clean summary.
    const grouped = new Map<string, number>();
    for (const k of resolved) {
      const [mod = "other"] = k.split("::");
      grouped.set(mod, (grouped.get(mod) ?? 0) + 1);
    }
    return [...grouped.entries()]
      .map(([mod, count]) => ({ moduleId: mod, count }))
      .sort((a, b) => b.count - a.count);
  }, [prior, currentBlockerKeys]);

  return (
    <AdminShell
      title="My Analytics"
      subtitle="Your store's progress on the FoundOurMarket™ platform"
      actions={
        <Link
          to="/vendor"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border/70 transition"
        >
          <ArrowLeft className="size-3.5" /> Dashboard
        </Link>
      }
    >
      {currentVendor && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border/40 bg-card/40 px-3 py-2 text-xs text-muted-foreground">
          <Store className="size-3.5 text-muted-foreground" />
          Store: <span className="text-foreground">{currentVendor.vendorName}</span>
          <span className="ml-auto tabular-nums">
            {vendorListings.length} listing{vendorListings.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {bundle.loading ? (
        <div className="rounded-2xl border border-border/40 bg-card/40 p-8 text-center text-sm text-muted-foreground">
          <RefreshCw className="mx-auto mb-3 size-5 animate-spin text-accent" />
          Assembling your analytics…
        </div>
      ) : !currentVendor ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-8 text-center text-sm text-muted-foreground">
          Pick a store on the Vendor Dashboard first.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview */}
          <section>
            <SectionHeader icon={Sparkles} title="Overview" subtitle="Your store at a glance" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Store Health"
                value={currentVendor.score}
                suffix=" / 100"
                delta={scoreDelta}
                deltaSuffix=" today"
                valueTone={scoreTint(currentVendor.score)}
              />
              <StatCard
                label="Readiness (avg)"
                value={currentVendor.averages.readiness}
                delta={readinessDelta}
                deltaSuffix=" today"
                valueTone={scoreTint(currentVendor.averages.readiness)}
              />
              <StatCard
                label="Ready to Publish"
                value={currentVendor.distribution.ready ?? 0}
                sub={`${currentVendor.distribution.almost_ready ?? 0} almost ready`}
                valueTone="text-emerald-400"
              />
              <StatCard
                label="Needs Attention"
                value={
                  (currentVendor.distribution.needs_attention ?? 0) +
                  (currentVendor.distribution.not_ready ?? 0)
                }
                sub={`${lifecycleCounts.persistent} persistent`}
                valueTone="text-amber-400"
              />
            </div>
            {!prior && (
              <div className="mt-2 text-[11px] text-muted-foreground">
                First visit — trend deltas will appear once we have a second snapshot to compare.
              </div>
            )}
          </section>

          {/* Progress History */}
          <section className="grid gap-3 md:grid-cols-2">
            <div className="card-premium rounded-2xl p-5">
              <SectionHeader icon={ListChecks} title="Progress History" subtitle="Since your last visit" small />
              <div className="mt-4 space-y-3 text-sm">
                <FunnelRow label="New" value={lifecycleCounts.new} tone="bg-sky-400/70" />
                <FunnelRow label="Persistent" value={lifecycleCounts.persistent} tone="bg-amber-400/70" />
                <FunnelRow label="Resolved" value={lifecycleCounts.resolved} tone="bg-emerald-400/70" />
                <FunnelRow label="Regressed" value={lifecycleCounts.regressed} tone="bg-destructive/70" />
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">
                Resolved items were showing as blockers last time and no longer are.
              </div>
            </div>

            <div className="card-premium rounded-2xl p-5">
              <SectionHeader icon={CheckCircle2} title="Recent Improvements" subtitle="What you fixed most recently" small />
              {recentImprovements.length === 0 ? (
                <div className="mt-4 rounded-xl border border-border/30 bg-card/30 p-4 text-xs text-muted-foreground">
                  Nothing new to report yet — resolve a recommendation to see it here.
                </div>
              ) : (
                <ul className="mt-4 space-y-2">
                  {recentImprovements.map((r) => (
                    <li key={r.moduleId} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                      <span className="text-foreground">{MODULE_LABEL[r.moduleId] ?? r.moduleId}</span>
                      <span className="ml-auto tabular-nums text-muted-foreground">
                        +{r.count} resolved
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Areas to Improve */}
          <section>
            <SectionHeader icon={Layers} title="Areas to Improve" subtitle="Your weakest areas across all listings" />
            {areasToImprove.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-border/40 bg-card/30 p-6 text-center text-xs text-muted-foreground">
                No data yet — add or index a listing to see per-area breakdown.
              </div>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {areasToImprove.slice(0, 6).map((a) => (
                  <div key={a.moduleId} className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/40 p-3">
                    <div className={cn("font-mono text-2xl tabular-nums", scoreTint(a.averageScore))}>
                      {a.averageScore}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{MODULE_LABEL[a.moduleId] ?? a.moduleId}</div>
                      <div className="text-[11px] text-muted-foreground">
                        avg across {a.listingCount} listing{a.listingCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <Link
                      to="/vendor-work-queue"
                      className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/20 transition"
                    >
                      {MODULE_ACTION[a.moduleId] ?? "Review"} <ArrowRight className="size-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Top Blockers — your listings */}
          <section>
            <SectionHeader icon={Package} title="Your Top Blockers" subtitle="One-click into the vendor product editor" />
            {currentVendor.topBlockers.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 text-center text-xs text-emerald-300">
                No priority blockers right now — you're all clear. 🎉
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {currentVendor.topBlockers.slice(0, 5).map((r, i) => (
                  <motion.div
                    key={`${r.module}-${r.action}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/40 bg-card/40 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{r.recommendation}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {MODULE_LABEL[r.module] ?? r.module} · confidence {r.confidence}%
                      </div>
                    </div>
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      r.impact === "High" ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : r.impact === "Medium" ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                      : "border-sky-400/40 bg-sky-400/10 text-sky-300",
                    )}>{r.impact} Impact</span>
                    <Link
                      to="/vendor-work-queue"
                      className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/20 transition"
                    >
                      {r.action} <ArrowRight className="size-3" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <div className="rounded-2xl border border-border/30 bg-card/20 p-4 text-[11px] text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-2 text-foreground/80 text-xs font-medium">
              <Sparkles className="size-3.5 text-accent" /> How this view is computed
            </div>
            <p className="mt-2">
              Everything here is derived from the same public contracts that power Admin —
              Vendor Intelligence, Marketplace Readiness, and the module scores your listings
              already produce. Nothing new is scored or detected. Your deltas come from a
              lightweight snapshot stored locally between visits.
            </p>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function SectionHeader({
  icon: Icon, title, subtitle, small,
}: {
  icon: typeof Sparkles;
  title: string;
  subtitle?: string;
  small?: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className={cn("text-accent", small ? "size-3.5" : "size-4")} />
          <span className={cn("font-mono uppercase tracking-[0.22em]", small ? "text-[10px]" : "text-[11px]")}>{title}</span>
        </div>
        {subtitle && <div className={cn("mt-0.5 text-muted-foreground/80", small ? "text-[11px]" : "text-xs")}>{subtitle}</div>}
      </div>
    </div>
  );
}

function StatCard({
  label, value, suffix, sub, delta, deltaSuffix, valueTone,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  sub?: string;
  delta?: number;
  deltaSuffix?: string;
  valueTone?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", valueTone)}>
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
      </div>
      {typeof delta === "number" && delta !== 0 ? (
        <div className={cn("mt-1 inline-flex items-center gap-1 text-[11px]", deltaTone(delta))}>
          <TrendIcon delta={delta} />
          {delta > 0 ? "+" : ""}{delta}{deltaSuffix ?? ""}
        </div>
      ) : sub ? (
        <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}

function FunnelRow({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-muted-foreground shrink-0">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value * 8)}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={cn("h-full rounded-full", tone)}
        />
      </div>
      <div className="w-8 text-right text-sm tabular-nums">{value}</div>
    </div>
  );
}
