import { useCallback, useEffect, useState } from "react";

const KEY = "fom_compare";
const MAX = 4;
const subs = new Set<(slugs: string[]) => void>();

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string").slice(0, MAX) : [];
  } catch { return []; }
}

function write(slugs: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(slugs));
  subs.forEach((s) => s(slugs));
}

export function useCompare() {
  const [slugs, setSlugs] = useState<string[]>(() => read());

  useEffect(() => {
    setSlugs(read());
    const sub = (s: string[]) => setSlugs(s);
    subs.add(sub);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setSlugs(read()); };
    window.addEventListener("storage", onStorage);
    return () => { subs.delete(sub); window.removeEventListener("storage", onStorage); };
  }, []);

  const toggle = useCallback((slug: string) => {
    const cur = read();
    const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [slug, ...cur].slice(0, MAX);
    write(next);
  }, []);

  const remove = useCallback((slug: string) => write(read().filter((s) => s !== slug)), []);
  const clear = useCallback(() => write([]), []);
  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);
  const isFull = slugs.length >= MAX;

  return { slugs, toggle, remove, clear, has, isFull, max: MAX };
}
