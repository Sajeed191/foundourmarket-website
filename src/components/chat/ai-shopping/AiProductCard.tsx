// Inline product card rendered inside AI assistant messages.
// Deliberately minimal — one image, name, price, rating, "View" CTA.
import { Star } from "lucide-react";
import type { AiProductRef } from "@/lib/ai-shopping/types";

function formatInr(v: number | null): string {
  if (v == null) return "";
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

export function AiProductCard({ product }: { product: AiProductRef }) {
  const hasCompare = product.compare_price_inr && product.price_inr && product.compare_price_inr > product.price_inr;
  return (
    <a
      href={`/products/${product.slug}`}
      className="group flex gap-3 rounded-2xl border border-border/60 bg-card/70 p-2.5 backdrop-blur-xl transition-all hover:border-primary/50 hover:bg-card"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary/60">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">{product.name}</p>
        {product.tagline && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{product.tagline}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          {product.price_inr != null && (
            <span className="text-[13px] font-semibold text-foreground">{formatInr(product.price_inr)}</span>
          )}
          {hasCompare && (
            <span className="text-[11px] text-muted-foreground line-through">{formatInr(product.compare_price_inr)}</span>
          )}
          {product.rating != null && (
            <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              {product.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
