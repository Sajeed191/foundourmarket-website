/**
 * useBulkOperations — Marketplace Operations 1.0, Phase 2 runner hook.
 *
 * Manages the lifecycle of BulkOperation jobs in the browser. Delegates
 * every unit of work to registered analyzer callbacks in bulk-operations.ts
 * — this hook contains no detection, scoring, or AI logic of its own.
 *
 * Recent jobs are persisted to localStorage (last 25) so admins have an
 * audit trail across sessions.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useProducts } from "@/lib/use-products";
import { useMarketplaceHealth, type MarketplaceHealthListing } from "@/lib/use-marketplace-health";
import {
  BULK_OPERATIONS,
  type BulkOperation,
  type BulkOperationType,
  type BulkOpProductLike,
} from "@/lib/marketplace-operations/bulk-operations";

const HISTORY_KEY = "fom.bulk-operations.history.v1";
const HISTORY_LIMIT = 25;

function loadHistory(): BulkOperation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as BulkOperation[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(jobs: BulkOperation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(jobs.slice(0, HISTORY_LIMIT)));
  } catch {
    /* ignore quota errors */
  }
}

function newId(): string {
  return `bulk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toProductLike(l: MarketplaceHealthListing, byId: Map<string, BulkOpProductLike>): BulkOpProductLike {
  return (
    byId.get(l.productId) ??
    byId.get(l.productSlug) ?? {
      slug: l.productSlug,
      name: l.productName,
      category: l.categoryName,
      image: l.productImage,
    }
  );
}

export interface UseBulkOperations {
  loading: boolean;
  jobs: BulkOperation[];
  history: BulkOperation[];
  running: BulkOperation[];
  eligibleCount: (type: BulkOperationType) => number;
  start: (type: BulkOperationType) => void;
  cancel: (id: string) => void;
  clearHistory: () => void;
}

export function useBulkOperations(): UseBulkOperations {
  const { products } = useProducts();
  const { listings, loading } = useMarketplaceHealth();
  const [jobs, setJobs] = useState<BulkOperation[]>(() => loadHistory());
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  useEffect(() => {
    saveHistory(jobs);
  }, [jobs]);

  const eligibleCount = useCallback(
    (type: BulkOperationType) => {
      const spec = BULK_OPERATIONS[type];
      return listings.filter(spec.eligible).length;
    },
    [listings],
  );

  const start = useCallback(
    (type: BulkOperationType) => {
      const spec = BULK_OPERATIONS[type];
      const targets = listings.filter(spec.eligible);
      const byId = new Map<string, BulkOpProductLike>();
      for (const p of products) {
        const like: BulkOpProductLike = {
          id: p.id ?? p.slug,
          slug: p.slug,
          name: p.name,
          category: p.category ?? null,
          description: p.description ?? null,
          seoTitle: p.seoTitle ?? null,
          seoDescription: p.seoDescription ?? null,
          metaKeywords: p.metaKeywords ?? null,
          image: p.image ?? null,
          priceInr: p.priceInr ?? null,
          priceUsd: p.priceUsd ?? null,
          comparePriceInr: p.comparePriceInr ?? null,
          comparePriceUsd: p.comparePriceUsd ?? null,
          costPriceInr: p.costPriceInr ?? null,
          costPriceUsd: p.costPriceUsd ?? null,
          attributes:
            (p as unknown as { attributes?: Record<string, unknown> | null }).attributes ?? null,
          specifications:
            (p as unknown as { specifications?: Record<string, unknown> | null }).specifications ?? null,
        };
        byId.set(p.id ?? p.slug, like);
        byId.set(p.slug, like);
      }

      const job: BulkOperation = {
        id: newId(),
        type,
        label: spec.label,
        status: "running",
        progress: 0,
        totalItems: targets.length,
        processedItems: 0,
        failedItems: 0,
        startedAt: new Date().toISOString(),
        summary: {},
        audit: [],
      };

      setJobs((prev) => [job, ...prev]);

      // Fire-and-forget async runner with cancellation via jobsRef.
      void (async () => {
        for (let i = 0; i < targets.length; i++) {
          const current = jobsRef.current.find((j) => j.id === job.id);
          if (!current || current.cancelRequested) {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === job.id
                  ? { ...j, status: "cancelled", finishedAt: new Date().toISOString(), progress: j.progress }
                  : j,
              ),
            );
            return;
          }
          const listing = targets[i]!;
          const product = toProductLike(listing, byId);
          try {
            const res = await spec.run(listing, product);
            setJobs((prev) =>
              prev.map((j) => {
                if (j.id !== job.id) return j;
                const nextSummary = { ...(j.summary ?? {}) };
                for (const [k, v] of Object.entries(res.counters ?? {})) {
                  nextSummary[k] = (nextSummary[k] ?? 0) + v;
                }
                const nextAudit = j.audit ?? [];
                if (nextAudit.length < 20) {
                  nextAudit.push({ productSlug: listing.productSlug, result: res.audit });
                }
                const processed = j.processedItems + 1;
                return {
                  ...j,
                  processedItems: processed,
                  failedItems: j.failedItems + (res.ok ? 0 : 1),
                  progress: processed / Math.max(1, j.totalItems),
                  summary: nextSummary,
                  audit: nextAudit,
                };
              }),
            );
          } catch (err) {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === job.id
                  ? {
                      ...j,
                      processedItems: j.processedItems + 1,
                      failedItems: j.failedItems + 1,
                      progress: (j.processedItems + 1) / Math.max(1, j.totalItems),
                      error: (err as Error).message,
                    }
                  : j,
              ),
            );
          }
          // Yield to the event loop so the UI stays responsive.
          if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0));
        }
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  status: j.failedItems === j.totalItems && j.totalItems > 0 ? "failed" : "completed",
                  finishedAt: new Date().toISOString(),
                  progress: 1,
                }
              : j,
          ),
        );
      })();
    },
    [listings, products],
  );

  const cancel = useCallback((id: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, cancelRequested: true } : j)));
  }, []);

  const clearHistory = useCallback(() => {
    setJobs((prev) => prev.filter((j) => j.status === "running" || j.status === "queued"));
  }, []);

  const running = jobs.filter((j) => j.status === "running" || j.status === "queued");
  const history = jobs.filter((j) => j.status !== "running" && j.status !== "queued");

  return { loading, jobs, running, history, eligibleCount, start, cancel, clearHistory };
}
