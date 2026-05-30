import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  country: string;
  flag: string;
  rating: number;
  active: boolean;
  sort_order: number;
};

const FALLBACK: Testimonial[] = [
  { id: "f1", quote: "Completely redefined how I source premium goods. The quality is unmatched.", name: "Marcus Thorne", role: "Curator", country: "United Kingdom", flag: "🇬🇧", rating: 5, active: true, sort_order: 0 },
  { id: "f2", quote: "Fast shipping, gorgeous packaging, and every item felt hand-picked for me.", name: "Ayaka Mori", role: "Designer", country: "Japan", flag: "🇯🇵", rating: 5, active: true, sort_order: 1 },
  { id: "f3", quote: "The best support I've dealt with from any online store, full stop.", name: "Diego Alvarez", role: "Founder", country: "Spain", flag: "🇪🇸", rating: 5, active: true, sort_order: 2 },
];

function normalize(row: Record<string, unknown>): Testimonial {
  return {
    id: String(row.id),
    quote: String(row.quote ?? ""),
    name: String(row.name ?? ""),
    role: String(row.role ?? ""),
    country: String(row.country ?? ""),
    flag: String(row.flag ?? ""),
    rating: Number(row.rating ?? 5),
    active: row.active !== false,
    sort_order: Number(row.sort_order ?? 0),
  };
}

let cache: Testimonial[] | null = null;
const subscribers = new Set<(t: Testimonial[]) => void>();

async function load(includeInactive = false): Promise<Testimonial[]> {
  let query = supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    cache = includeInactive ? cache ?? [] : FALLBACK;
    subscribers.forEach((s) => s(cache!));
    return cache!;
  }
  const list = (data as Record<string, unknown>[]).map(normalize);
  if (!includeInactive) {
    cache = list;
    subscribers.forEach((s) => s(list));
  }
  return list;
}

let realtimeBound = false;
function bindRealtime() {
  if (realtimeBound || typeof window === "undefined") return;
  realtimeBound = true;
  supabase
    .channel("rt-testimonials")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "testimonials" },
      () => load(),
    )
    .subscribe();
}

/** Live public testimonials for the homepage. Falls back to defaults when empty. */
export function useTestimonials() {
  const [items, setItems] = useState<Testimonial[]>(cache ?? FALLBACK);

  useEffect(() => {
    bindRealtime();
    let active = true;
    const sub = (t: Testimonial[]) => { if (active) setItems(t); };
    subscribers.add(sub);
    if (cache) setItems(cache);
    else load();
    return () => { active = false; subscribers.delete(sub); };
  }, []);

  return { items };
}

/** Admin: fetch all testimonials including inactive ones. */
export async function fetchAllTestimonials(): Promise<Testimonial[]> {
  return load(true);
}

export async function saveTestimonial(
  t: Partial<Testimonial> & { id?: string },
) {
  const payload = {
    quote: t.quote ?? "",
    name: t.name ?? "",
    role: t.role ?? null,
    country: t.country ?? null,
    flag: t.flag ?? null,
    rating: t.rating ?? 5,
    active: t.active ?? true,
    sort_order: t.sort_order ?? 0,
  };
  if (t.id && !t.id.startsWith("f")) {
    const { error } = await supabase.from("testimonials").update(payload).eq("id", t.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("testimonials").insert(payload);
    if (error) throw error;
  }
  await load();
}

export async function deleteTestimonial(id: string) {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw error;
  await load();
}
