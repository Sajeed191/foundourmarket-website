/**
 * Infrastructure v2.0 — durable request queue.
 *
 * IndexedDB-backed FIFO queue for retryable, non-payment, non-auth writes.
 * - Preserves insertion order.
 * - Dedupes on `dedupeKey` (latest wins).
 * - Idempotency key sent as header so the server can drop duplicates.
 * - Auth token is read at flush time, never persisted with the payload.
 * - Retries on `online`; exponential backoff for transient 5xx / network errors.
 */

import { emit } from "./event-bus";

const DB_NAME = "fom_infra_v1";
const STORE = "request_queue";

/** Allowlist of queueable action kinds. Payments/auth are intentionally absent. */
export type QueueKind =
  | "cart.add"
  | "cart.update"
  | "cart.remove"
  | "wishlist.add"
  | "wishlist.remove"
  | "newsletter.subscribe"
  | "contact.submit"
  | "profile.update"
  | "review.submit"
  | "qa.submit"
  | "support.ticket.create"
  | "support.message.send"
  | "analytics.event";

export type QueuedRequest = {
  id: string;
  kind: QueueKind;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body: unknown;
  headers?: Record<string, string>;
  dedupeKey?: string;
  idempotencyKey: string;
  requiresAuth: boolean;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
};

const MAX_ATTEMPTS = 8;
const BACKOFF_MS = [1000, 2000, 4000, 8000, 15000, 30000, 60000, 120000];

let dbPromise: Promise<IDBDatabase> | null = null;
let flushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let authTokenProvider: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(fn: () => Promise<string | null>) {
  authTokenProvider = fn;
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("dedupeKey", "dedupeKey", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => Promise<T> | T): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result: T;
    Promise.resolve(fn(store)).then((v) => { result = v; }).catch(reject);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function enqueue(input: {
  kind: QueueKind;
  endpoint: string;
  method?: QueuedRequest["method"];
  body?: unknown;
  headers?: Record<string, string>;
  dedupeKey?: string;
  requiresAuth?: boolean;
}): Promise<string> {
  const now = Date.now();
  const req: QueuedRequest = {
    id: uuid(),
    kind: input.kind,
    endpoint: input.endpoint,
    method: input.method ?? "POST",
    body: input.body,
    headers: input.headers,
    dedupeKey: input.dedupeKey,
    idempotencyKey: uuid(),
    requiresAuth: input.requiresAuth ?? false,
    createdAt: now,
    attempts: 0,
    nextAttemptAt: now,
  };

  await tx("readwrite", async (store) => {
    // Dedupe: remove existing entries with same dedupeKey.
    if (req.dedupeKey) {
      await new Promise<void>((res, rej) => {
        const idx = store.index("dedupeKey");
        const cursorReq = idx.openCursor(IDBKeyRange.only(req.dedupeKey));
        cursorReq.onsuccess = () => {
          const c = cursorReq.result;
          if (c) { c.delete(); c.continue(); } else res();
        };
        cursorReq.onerror = () => rej(cursorReq.error);
      });
    }
    store.put(req);
  });

  const size = await count();
  emit("queue:enqueued", { id: req.id, kind: req.kind, size });
  scheduleFlush(50);
  return req.id;
}

export async function count(): Promise<number> {
  return tx("readonly", (store) => new Promise<number>((resolve, reject) => {
    const r = store.count();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  }));
}

async function nextReady(): Promise<QueuedRequest | null> {
  return tx("readonly", (store) => new Promise<QueuedRequest | null>((resolve, reject) => {
    const idx = store.index("createdAt");
    const cursorReq = idx.openCursor();
    const now = Date.now();
    cursorReq.onsuccess = () => {
      const c = cursorReq.result;
      if (!c) return resolve(null);
      const v = c.value as QueuedRequest;
      if (v.nextAttemptAt <= now) return resolve(v);
      c.continue();
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  }));
}

async function remove(id: string) {
  await tx("readwrite", (store) => { store.delete(id); });
}

async function update(rec: QueuedRequest) {
  await tx("readwrite", (store) => { store.put(rec); });
}

function isTransient(err: unknown, status?: number): boolean {
  if (status === 502 || status === 503 || status === 504 || status === 408 || status === 429) return true;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /network|fetch|timeout|aborted|failed/i.test(msg);
}

async function attemptSend(rec: QueuedRequest): Promise<{ ok: boolean; status?: number; transient?: boolean; error?: unknown }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Idempotency-Key": rec.idempotencyKey,
      "X-Queued": "1",
      ...(rec.headers || {}),
    };
    if (rec.requiresAuth && authTokenProvider) {
      const token = await authTokenProvider();
      if (!token) {
        // Auth not ready — defer, not a permanent failure.
        return { ok: false, transient: true };
      }
      headers["Authorization"] = `Bearer ${token}`;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(rec.endpoint, {
      method: rec.method,
      headers,
      body: rec.body === undefined ? undefined : JSON.stringify(rec.body),
      signal: controller.signal,
      credentials: "same-origin",
    });
    clearTimeout(timeout);
    if (res.ok) return { ok: true, status: res.status };
    return { ok: false, status: res.status, transient: isTransient(null, res.status) };
  } catch (err) {
    return { ok: false, transient: isTransient(err), error: err };
  }
}

function scheduleFlush(delay = 0) {
  if (typeof window === "undefined") return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => { flushTimer = null; void flush(); }, delay);
}

export async function flush(): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  flushing = true;
  try {
    while (true) {
      const rec = await nextReady();
      if (!rec) break;
      const result = await attemptSend(rec);
      if (result.ok) {
        await remove(rec.id);
        emit("queue:flushed", { id: rec.id, kind: rec.kind, attempts: rec.attempts + 1 });
        continue;
      }
      const attempts = rec.attempts + 1;
      if (!result.transient || attempts >= MAX_ATTEMPTS) {
        await remove(rec.id);
        emit("queue:failed", {
          id: rec.id,
          kind: rec.kind,
          attempts,
          reason: result.transient ? "max_attempts" : `status_${result.status ?? "err"}`,
        });
        continue;
      }
      const delay = BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)];
      await update({ ...rec, attempts, nextAttemptAt: Date.now() + delay });
      scheduleFlush(delay);
      break; // stop this pass; timer will resume
    }
    const size = await count();
    if (size === 0) emit("queue:drained", { size: 0 });
  } finally {
    flushing = false;
  }
}

let started = false;
export function startRequestQueue() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => scheduleFlush(200));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleFlush(200);
  });
  scheduleFlush(500);
}
