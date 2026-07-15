import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, Loader2, Play, Ban,
  ShieldCheck, Package, ListChecks, Trash2,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";
import { useBulkOperations } from "@/lib/use-bulk-operations";
import {
  BULK_OPERATIONS,
  BULK_OPERATION_ORDER,
  STATUS_LABEL,
  type BulkOperation,
  type BulkOperationType,
} from "@/lib/marketplace-operations/bulk-operations";

export const Route = createFileRoute("/admin-bulk-operations")({
  head: () => ({
    meta: [
      { title: "Bulk Operations — FoundOurMarket™" },
      {
        name: "description",
        content:
          "Run FoundOurMarket™ Intelligence Platform analyzers across many listings at once — never mutates originals, never auto-publishes.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BulkOperationsPage,
});

const STATUS_TONE: Record<BulkOperation["status"], string> = {
  queued: "border-muted/40 bg-muted/10 text-muted-foreground",
  running: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  completed: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
  cancelled: "border-amber-400/40 bg-amber-400/10 text-amber-300",
};

function formatDuration(start?: string, end?: string): string {
  if (!start) return "—";
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const secs = Math.max(0, Math.round((e - s) / 1000));
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const r = secs % 60;
  return `${m}m ${r}s`;
}

function OperationCard({
  type,
  eligible,
  disabled,
  onStart,
}: {
  type: BulkOperationType;
  eligible: number;
  disabled: boolean;
  onStart: () => void;
}) {
  const spec = BULK_OPERATIONS[type];
  const estSecs = Math.max(1, Math.round(eligible * spec.estimatedSecondsPerItem));
  const estLabel = estSecs < 60 ? `~${estSecs}s` : `~${Math.round(estSecs / 60)}m`;
  return (
    <motion.div
      layout
      className="rounded-xl border border-border/40 bg-card/40 p-4 hover:border-border/70 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden>{spec.emoji}</span>
            <span className="truncate">{spec.label}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{spec.description}</p>
          <p className="mt-1.5 text-[11px] text-muted-foreground/80 italic">{spec.doesNotDo}</p>
        </div>
        <button
          type="button"
          disabled={disabled || eligible === 0}
          onClick={onStart}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
            disabled || eligible === 0
              ? "border border-border/30 bg-muted/10 text-muted-foreground/60 cursor-not-allowed"
              : "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
          )}
        >
          <Play className="size-3.5" /> Run
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Package className="size-3" /> {eligible.toLocaleString()} eligible
        </span>
        <span>Est. {estLabel}</span>
      </div>
    </motion.div>
  );
}

function JobRow({ job, onCancel }: { job: BulkOperation; onCancel: () => void }) {
  const pct = Math.round(job.progress * 100);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border border-border/40 bg-card/40 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden>{BULK_OPERATIONS[job.type].emoji}</span>
            <span className="truncate">{job.label}</span>
            <span
              className={cn(
                "ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide",
                STATUS_TONE[job.status],
              )}
            >
              {job.status === "running" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : job.status === "completed" ? (
                <CheckCircle2 className="size-3" />
              ) : job.status === "failed" ? (
                <XCircle className="size-3" />
              ) : job.status === "cancelled" ? (
                <Ban className="size-3" />
              ) : null}
              {STATUS_LABEL[job.status]}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {job.processedItems.toLocaleString()} / {job.totalItems.toLocaleString()} items
            {job.failedItems > 0 && ` · ${job.failedItems} failed`}
            {` · ${formatDuration(job.startedAt, job.finishedAt)}`}
          </div>
        </div>
        {(job.status === "running" || job.status === "queued") && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-[11px] text-destructive hover:bg-destructive/20"
          >
            <Ban className="size-3" /> Cancel
          </button>
        )}
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
        <motion.div
          className={cn(
            "h-full rounded-full",
            job.status === "failed"
              ? "bg-destructive"
              : job.status === "cancelled"
                ? "bg-amber-400"
                : "bg-primary",
          )}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {job.summary && Object.keys(job.summary).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(job.summary).map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/10 px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {k}: <span className="text-foreground font-medium">{v}</span>
            </span>
          ))}
        </div>
      )}

      {job.error && (
        <p className="mt-2 text-[11px] text-destructive">{job.error}</p>
      )}
    </motion.div>
  );
}

function BulkOperationsPage() {
  const { loading, running, history, eligibleCount, start, cancel, clearHistory } = useBulkOperations();
  const hasRunning = running.length > 0;

  return (
    <AdminShell
      title="Bulk Operations"
      subtitle="Run existing Intelligence Platform analyzers at scale — safe, reversible, audited"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border/70 transition"
          >
            <ArrowLeft className="size-3.5" /> Admin Home
          </Link>
          <Link
            to="/admin-work-queue"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border/70 transition"
          >
            Smart Work Queue <ArrowRight className="size-3.5" />
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Safety banner */}
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4 text-xs text-emerald-200/90">
          <div className="flex items-start gap-2">
            <ShieldCheck className="size-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-emerald-200">Safety rules apply to every bulk operation</div>
              <ul className="mt-1 space-y-0.5 text-emerald-200/80">
                <li>· Never overwrites originals · Never auto-publishes products · Never auto-changes prices · Never deletes data</li>
                <li>· Every operation invokes an existing analyzer · Every run is reversible where practical · Every run is audited</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Available operations */}
        <section>
          <h2 className="text-sm font-semibold text-foreground/90 mb-3">Available Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {BULK_OPERATION_ORDER.map((type) => (
              <OperationCard
                key={type}
                type={type}
                eligible={eligibleCount(type)}
                disabled={loading || hasRunning}
                onStart={() => start(type)}
              />
            ))}
          </div>
          {hasRunning && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              A job is currently running — start another when it completes.
            </p>
          )}
        </section>

        {/* Running jobs */}
        <section>
          <h2 className="text-sm font-semibold text-foreground/90 mb-3 inline-flex items-center gap-2">
            <Loader2 className={cn("size-4", hasRunning && "animate-spin text-sky-300")} />
            Running Jobs
          </h2>
          <div className="space-y-2.5">
            <AnimatePresence>
              {running.map((j) => (
                <JobRow key={j.id} job={j} onCancel={() => cancel(j.id)} />
              ))}
            </AnimatePresence>
            {!hasRunning && (
              <p className="text-xs text-muted-foreground italic">No jobs are running right now.</p>
            )}
          </div>
        </section>

        {/* Recent jobs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground/90 inline-flex items-center gap-2">
              <ListChecks className="size-4" /> Recent Jobs
            </h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="size-3" /> Clear history
              </button>
            )}
          </div>
          <div className="space-y-2.5">
            <AnimatePresence>
              {history.map((j) => (
                <JobRow key={j.id} job={j} onCancel={() => cancel(j.id)} />
              ))}
            </AnimatePresence>
            {history.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No completed jobs yet — start an operation above to build an audit trail.
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
