import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X, TrendingUp, Clock, Tag, ArrowRight, Loader2 } from "lucide-react";
import { useProducts } from "@/lib/use-products";
import { useCategories } from "@/lib/use-categories";
import { useRegion } from "@/lib/region";

const TRENDING = ["Wireless headphones", "Leather jacket", "Ceramic mug", "Smart watch", "Linen shirt"];
const RECENT_KEY = "fom-recent-searches";

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function pushRecent(q: string) {
  const cleaned = q.trim();
  if (!cleaned) return;
  const list = [cleaned, ...readRecent().filter((r) => r.toLowerCase() !== cleaned.toLowerCase())].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

export function SearchCommand({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const { format } = useRegion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setRecent(readRecent());
      setQ("");
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const term = q.trim().toLowerCase();
  const productMatches = useMemo(() => {
    if (!term) return [];
    return products
      .filter((p) => `${p.name} ${p.tagline ?? ""} ${p.category} ${p.description ?? ""}`.toLowerCase().includes(term))
      .slice(0, 6);
  }, [products, term]);
  const catMatches = useMemo(() => {
    if (!term) return [];
    return categories.filter((c) => c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)).slice(0, 4);
  }, [categories, term]);

  function go(query: string) {
    pushRecent(query);
    nav({ to: "/search", search: { q: query } });
    onClose();
  }

  function clearRecent() {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute left-1/2 top-[8vh] -translate-x-1/2 w-[94%] sm:w-[90%] max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[84vh]">
        <form onSubmit={(e) => { e.preventDefault(); if (term) go(q); }} className="relative border-b border-border">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, categories, brands…"
            className="w-full bg-transparent pl-12 pr-14 py-5 text-base focus:outline-none"
          />
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full grid place-items-center hover:bg-white/5">
            <X className="size-4" />
          </button>
        </form>

        <div className="overflow-y-auto flex-1">
          {!term ? (
            <div className="p-5 space-y-6">
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground inline-flex items-center gap-2"><Clock className="size-3" /> Recent</h4>
                    <button onClick={clearRecent} className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button key={r} onClick={() => go(r)} className="px-3 py-1.5 rounded-full border border-border text-xs hover:border-accent/50 hover:text-accent transition-colors">{r}</button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3 inline-flex items-center gap-2"><TrendingUp className="size-3" /> Trending</h4>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map((t) => (
                    <button key={t} onClick={() => go(t)} className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-colors">{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3 inline-flex items-center gap-2"><Tag className="size-3" /> Categories</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.slice(0, 6).map((c) => (
                    <Link
                      key={c.slug}
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      onClick={onClose}
                      className="px-3 py-2.5 rounded-xl border border-border text-sm hover:border-accent/50 hover:text-accent transition-colors truncate"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="py-16 grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : productMatches.length === 0 && catMatches.length === 0 ? (
            <div className="py-16 text-center px-5">
              <p className="text-sm text-muted-foreground">No matches for "{q}".</p>
              <button onClick={() => go(q)} className="mt-4 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent border-b border-accent pb-0.5">
                Search anyway <ArrowRight className="size-3" />
              </button>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {catMatches.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Categories</p>
                  {catMatches.map((c) => (
                    <Link
                      key={c.slug}
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <span className="size-9 rounded-lg bg-accent/10 text-accent grid place-items-center"><Tag className="size-4" /></span>
                      <span className="flex-1 text-sm">{c.name}</span>
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
              {productMatches.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Products</p>
                  {productMatches.map((p) => (
                    <Link
                      key={p.slug}
                      to="/products/$slug"
                      params={{ slug: p.slug }}
                      onClick={() => { pushRecent(q); onClose(); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <img src={p.image} alt="" className="size-12 rounded-lg object-cover border border-border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">{p.category}</p>
                      </div>
                      <span className="font-mono text-sm text-accent">{format(p.price)}</span>
                    </Link>
                  ))}
                  <button
                    onClick={() => go(q)}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-border hover:border-accent/50 text-xs font-mono uppercase tracking-widest text-accent transition-colors"
                  >
                    See all results for "{q}" <ArrowRight className="size-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border px-5 py-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <span>Enter to search</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
