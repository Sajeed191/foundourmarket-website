// Browser-only localStorage persistence for AI Shopping threads.
// Threads live entirely on the customer's device — no backend, no sync.
import type { AiMessage, AiThread, AiThreadIndexEntry } from "./types";

const INDEX_KEY = "fom_ai_threads_v1";
const THREAD_PREFIX = "fom_ai_thread_v1__";
const MAX_THREADS = 20;
const MAX_MESSAGES_PER_THREAD = 60;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — silently ignore */
  }
}

export function listThreads(): AiThreadIndexEntry[] {
  const idx = safeGet<AiThreadIndexEntry[]>(INDEX_KEY, []);
  return [...idx].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadThread(id: string): AiThread | null {
  return safeGet<AiThread | null>(THREAD_PREFIX + id, null);
}

export function saveThread(thread: AiThread): void {
  const trimmed: AiThread = {
    ...thread,
    messages: thread.messages.slice(-MAX_MESSAGES_PER_THREAD),
    updatedAt: Date.now(),
  };
  safeSet(THREAD_PREFIX + thread.id, trimmed);

  const idx = listThreads().filter((t) => t.id !== thread.id);
  idx.unshift({ id: trimmed.id, title: trimmed.title, updatedAt: trimmed.updatedAt });

  // Enforce max thread count — drop oldest.
  while (idx.length > MAX_THREADS) {
    const dropped = idx.pop();
    if (dropped) {
      try { window.localStorage.removeItem(THREAD_PREFIX + dropped.id); } catch { /* noop */ }
    }
  }
  safeSet(INDEX_KEY, idx);
}

export function deleteThread(id: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(THREAD_PREFIX + id); } catch { /* noop */ }
  const idx = listThreads().filter((t) => t.id !== id);
  safeSet(INDEX_KEY, idx);
}

export function createEmptyThread(): AiThread {
  const now = Date.now();
  return {
    id: `t_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function makeMessage(role: AiMessage["role"], content: string, products?: AiMessage["products"]): AiMessage {
  return {
    id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    ts: Date.now(),
    products,
  };
}

export function titleFromFirstMessage(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean;
}
