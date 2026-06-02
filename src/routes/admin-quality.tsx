import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Loader2, ImageOff, Search, FolderX, DollarSign, Boxes, EyeOff, AlertOctagon, Wrench } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { KpiCard } from "@/components/admin/KpiCard";
import { supabase } from "@/integrations/supabase/client";
import { detectQualityIssues, QUALITY_META, type ProductQuality, type QualityIssue } from "@/lib/admin-performance";
import type { ProductRow } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin-quality")({
  head: () => ({ meta: [{ title: "Quality Scanner — Admin" }] }),
  component: QualityPage,
});

const ISSUE_ICON: Record<QualityIssue, typeof ImageOff> = {
  no_image: ImageOff,
  no_seo: Search,
  no_category: FolderX,
  no_price: DollarSign,
  no_inventory: Boxes,
  hidden: EyeOff,
  broken: AlertOctagon,
};

const ISSUES = Object.keys(QUALITY_META) as QualityIssue[];

function QualityPage() {
  const [rows, setRows] = useState<ProductQuality[] | null>(null);
  const [filter, setFilter] = useState<QualityIssue | "all">("all");

  useEffect(() => {
    supabase.from("products").select("*").then(({ data }) => {
      setRows(detectQualityIssues((data as (ProductRow & Record<string, unknown>)[]) ?? []));
    });
  }, []);

  const counts = useMemo(() => {
    const c = {} as Record<QualityIssue, number>;
    for (const i of ISSUES) c[i] = 0;
    for (const r of rows ?? []) for (const i of r.issues) c[i] += 1;
    return c;
  }, [rows]);

  const filtered = useMemo(
    () => (rows ?? []).filter((r) => filter === "all" || r.issues.includes(filter)),
    [rows, filter],
  );

  return (
    <AdminShell title="Product Quality Scanner" subtitle="Catalog diagnostics & one-click fixes" allow={["admin", "super_admin", "manager", "editor"]}>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {ISSUES.map((i) => {
          const Icon = ISSUE_ICON[i];
          const m = QUALITY_META[i];
          return (
            <button key={i} onClick={() => setFilter(filter === i ? "all" : i)} className="text-left">
              <KpiCard
                label={m.label}
                value={counts[i]}
                icon={<span className={m.severity === "critical" ? "text-destructive" : "text-amber-400"}><Icon className="size-4" /></span>}
              />
            </button>
          );
        })}
      </div>

      <div className="card-premium rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2 sticky top-0 bg-card/80 backdrop-blur z-10">
          <h2 className="text-sm font-medium flex items-center gap-2"><ShieldCheck className="size-4 text-accent" /> {filtered.length} flagged</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={() => setFilter("all")} className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${filter === "all" ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-white/5"}`}>All</button>
            {ISSUES.map((i) => (
              <button key={i} onClick={() => setFilter(i)} className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${filter === i ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-white/5"}`}>
                {QUALITY_META[i].label.split(" ")[1] ?? QUALITY_META[i].label}
              </button>
            ))}
          </div>
        </div>
        {rows === null ? (
          <div className="p-8"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <ul className="divide-y divide-border/40">
            {filtered.map((r) => (
              <li key={r.product.id} className="px-4 py-3 flex items-center gap-3">
                <div className="size-11 rounded-lg bg-muted overflow-hidden shrink-0">
                  {r.product.image && <img src={r.product.image} alt={r.product.name} className="size-full object-cover" loading="lazy" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs truncate">{r.product.name || <span className="text-destructive">Untitled product</span>}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.issues.map((i) => {
                      const m = QUALITY_META[i];
                      return (
                        <span key={i} className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${m.severity === "critical" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-amber-400/30 bg-amber-400/10 text-amber-400"}`}>
                          {m.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <Link to="/admin-products" className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-accent hover:underline shrink-0">
                  <Wrench className="size-2.5" /> Fix
                </Link>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-5 py-10 text-center text-xs text-muted-foreground">No issues found. Catalog is healthy.</li>}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
