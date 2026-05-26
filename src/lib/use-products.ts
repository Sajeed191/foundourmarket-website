import { useEffect, useState } from "react";
import { fetchProducts, fetchProduct, type Product } from "./products";

let cache: Product[] | null = null;
let inflight: Promise<Product[]> | null = null;
const subscribers = new Set<(p: Product[]) => void>();

export async function loadProducts(force = false): Promise<Product[]> {
  if (cache && !force) return cache;
  if (!inflight) {
    inflight = fetchProducts().then((p) => {
      cache = p;
      inflight = null;
      subscribers.forEach((s) => s(p));
      return p;
    });
  }
  return inflight;
}

export function invalidateProducts() {
  cache = null;
  loadProducts(true);
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);
  useEffect(() => {
    let active = true;
    const sub = (p: Product[]) => { if (active) setProducts(p); };
    subscribers.add(sub);
    loadProducts().then((p) => { if (active) { setProducts(p); setLoading(false); } });
    return () => { active = false; subscribers.delete(sub); };
  }, []);
  return { products, loading };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(
    cache?.find((p) => p.slug === slug) ?? null
  );
  const [loading, setLoading] = useState(!product);
  useEffect(() => {
    let active = true;
    if (cache) {
      const found = cache.find((p) => p.slug === slug) ?? null;
      setProduct(found);
      setLoading(false);
      if (found) return;
    }
    fetchProduct(slug).then((p) => { if (active) { setProduct(p); setLoading(false); } });
    return () => { active = false; };
  }, [slug]);
  return { product, loading };
}
