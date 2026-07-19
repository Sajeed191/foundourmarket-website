/**
 * Infrastructure v2.0 — safeMutate wrapper.
 *
 * Runs a mutation. If it fails due to offline / transient network / 5xx,
 * enqueues an equivalent HTTP request for later retry and returns a
 * `{ queued: true }` marker so callers can show optimistic success.
 *
 * NEVER use for payments, auth, or security-sensitive operations.
 */

import { enqueue, type QueueKind } from "./request-queue";

export type SafeMutateMeta = {
  kind: QueueKind;
  endpoint: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  dedupeKey?: string;
  requiresAuth?: boolean;
};

export type SafeMutateResult<T> =
  | { ok: true; queued: false; data: T }
  | { ok: true; queued: true; queueId: string }
  | { ok: false; error: unknown };

function isTransient(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = err instanceof Error ? err.message : String(err);
  if (/network|fetch|timeout|aborted|failed to fetch/i.test(msg)) return true;
  // Supabase / postgrest often surface 5xx as { status: 5xx }
  const anyErr = err as { status?: number; code?: string } | null;
  const s = anyErr?.status;
  if (s === 502 || s === 503 || s === 504 || s === 408 || s === 429) return true;
  return false;
}

export async function safeMutate<T>(
  fn: () => Promise<T>,
  meta: SafeMutateMeta,
): Promise<SafeMutateResult<T>> {
  try {
    const data = await fn();
    return { ok: true, queued: false, data };
  } catch (err) {
    if (isTransient(err)) {
      try {
        const queueId = await enqueue(meta);
        return { ok: true, queued: true, queueId };
      } catch {
        return { ok: false, error: err };
      }
    }
    return { ok: false, error: err };
  }
}
