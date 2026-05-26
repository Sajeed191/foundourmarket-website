import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { TrendingUp, ShoppingBag, Users, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Star } from "lucide-react";
import { resolveImage } from "@/lib/products";

type Order = {
  id: string; user_id: string; status: string; total: number; currency: string;
  contact_email: string | null; created_at: string;
  order_items: { name: string; quantity: number; product_slug?: string; unit_price?: number; line_total?: number }[];
};

type ProductRow = {
  id: string; slug: string; name: string; category: string;
  price: number | string; rating: number | string; reviews: number;
  image: string | null; in_stock: boolean;
};

type Props = {
  orders: Order[] | null;
  products: ProductRow[] | null;
  customersCount: number;
};

const DAYS = 14;

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

export function DashboardOverview({ orders, products, customersCount }: Props) {
  const stats = useMemo(() => {
    const list = orders ?? [];
    const today = startOfDay(new Date());

    // Build last 14 days buckets
    const buckets: { date: Date; revenue: number; orders: number }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      buckets.push({ date: d, revenue: 0, orders: 0 });
    }
    const idxOf = (d: string) => {
      const ds = startOfDay(new Date(d)).getTime();
      return buckets.findIndex((b) => b.date.getTime() === ds);
    };

    let revenue = 0;
    const statusCounts: Record<string, number> = {};
    const productSales = new Map<string, { name: string; image?: string | null; units: number; revenue: number; slug?: string }>();

    for (const o of list) {
      const total = Number(o.total) || 0;
      revenue += total;
      statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
      const idx = idxOf(o.created_at);
      if (idx >= 0) { buckets[idx].revenue += total; buckets[idx].orders += 1; }
      for (const it of o.order_items ?? []) {
        const key = it.product_slug ?? it.name;
        const prev = productSales.get(key) ?? { name: it.name, units: 0, revenue: 0, slug: it.product_slug };
        prev.units += it.quantity;
        prev.revenue += Number(it.line_total ?? (it.unit_price ?? 0) * it.quantity) || 0;
        productSales.set(key, prev);
      }
    }

    // Attach product images
    const productMap = new Map((products ?? []).map((p) => [p.slug, p]));
    for (const [k, v] of productSales) {
      const match = v.slug ? productMap.get(v.slug) : undefined;
      if (match) v.image = match.image;
      productSales.set(k, v);
    }

    const topProducts = [...productSales.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Compare last 7 vs prior 7
    const last7 = buckets.slice(-7).reduce((s, b) => s + b.revenue, 0);
    const prev7 = buckets.slice(0, 7).reduce((s, b) => s + b.revenue, 0);
    const delta = prev7 === 0 ? (last7 > 0 ? 100 : 0) : ((last7 - prev7) / prev7) * 100;

    const ordersCount = list.length;
    const aov = ordersCount > 0 ? revenue / ordersCount : 0;
    const pendingCount = (statusCounts["pending"] ?? 0) + (statusCounts["processing"] ?? 0);

    // Low stock / catalog warnings
    const outOfStock = (products ?? []).filter((p) => !p.in_stock);

    // Highest rated
    const topRated = [...(products ?? [])]
      .filter((p) => p.reviews > 0)
      .sort((a, b) => Number(b.rating) - Number(a.rating))
      .slice(0, 4);

    return { buckets, revenue, ordersCount, aov, statusCounts, topProducts, delta, last7, prev7, pendingCount, outOfStock, topRated };
  }, [orders, products]);

  const max = Math.max(1, ...stats.buckets.map((b) => b.revenue));
  const w = 600, h = 120, pad = 8;
  const stepX = (w - pad * 2) / Math.max(1, stats.buckets.length - 1);
  const points = stats.buckets.map((b, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (b.revenue / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${(pad + (stats.buckets.length - 1) * stepX).toFixed(1)},${h - pad} L${pad},${h - pad} Z`;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-8">
        <Stat icon={<TrendingUp className="size-4" />} label="Revenue" value={`$${stats.revenue.toFixed(2)}`}
          sub={<TrendBadge delta={stats.delta} />} />
        <Stat icon={<ShoppingBag className="size-4" />} label="Orders" value={stats.ordersCount}
          sub={<span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">AOV ${stats.aov.toFixed(2)}</span>} />
        <Stat icon={<Users className="size-4" />} label="Customers" value={customersCount} />
        <Stat icon={<Package className="size-4" />} label="Products" value={products?.length ?? 0}
          sub={stats.outOfStock.length > 0
            ? <span className="text-[10px] font-mono uppercase tracking-widest text-accent inline-flex items-center gap-1"><AlertTriangle className="size-3" />{stats.outOfStock.length} out of stock</span>
            : <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">All in stock</span>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Last 14 days</p>
              <h2 className="text-lg font-medium mt-1">Revenue</h2>
            </div>
            <div className="text-right">
              <p className="font-mono text-accent">${stats.last7.toFixed(2)}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">past 7d</p>
            </div>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32" preserveAspectRatio="none">
            <defs>
              <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g className="text-accent">
              <path d={areaPath} fill="url(#spark)" />
              <path d={linePath} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
              {points.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={stats.buckets[i].revenue > 0 ? 2 : 0} fill="currentColor" />
              ))}
            </g>
          </svg>
          <div className="flex justify-between mt-2 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>{stats.buckets[0].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            <span>{stats.buckets[stats.buckets.length - 1].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Pipeline</p>
          <h2 className="text-lg font-medium mt-1 mb-4">Order status</h2>
          <ul className="space-y-3">
            {(["pending", "processing", "shipped", "delivered", "cancelled"] as const).map((s) => {
              const count = stats.statusCounts[s] ?? 0;
              const pct = stats.ordersCount > 0 ? (count / stats.ordersCount) * 100 : 0;
              return (
                <li key={s}>
                  <div className="flex justify-between text-[11px] font-mono uppercase tracking-widest mb-1">
                    <span className="text-muted-foreground">{s}</span>
                    <span className="text-foreground">{count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-background overflow-hidden">
                    <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          {stats.pendingCount > 0 && (
            <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-accent inline-flex items-center gap-1">
              <AlertTriangle className="size-3" /> {stats.pendingCount} need attention
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-baseline mb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Bestsellers</p>
              <h2 className="text-lg font-medium mt-1">Top products</h2>
            </div>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-muted-foreground w-4">{i + 1}</span>
                  <div className="size-10 rounded-lg overflow-hidden bg-background border border-border shrink-0">
                    {p.image && <img src={resolveImage(p.image)} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{p.name}</p>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{p.units} sold</p>
                  </div>
                  <p className="font-mono text-accent text-sm">${p.revenue.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-baseline mb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Catalog health</p>
              <h2 className="text-lg font-medium mt-1">Highlights</h2>
            </div>
          </div>
          {stats.outOfStock.length > 0 && (
            <div className="mb-4 p-3 rounded-xl border border-accent/30 bg-accent/5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2 inline-flex items-center gap-1">
                <AlertTriangle className="size-3" /> Out of stock ({stats.outOfStock.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stats.outOfStock.slice(0, 6).map((p) => (
                  <Link key={p.id} to="/products/$slug" params={{ slug: p.slug }} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background border border-border hover:border-accent transition-colors">
                    {p.name}
                  </Link>
                ))}
                {stats.outOfStock.length > 6 && <span className="text-[10px] font-mono text-muted-foreground">+{stats.outOfStock.length - 6} more</span>}
              </div>
            </div>
          )}
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Highest rated</p>
          {stats.topRated.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.topRated.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <div className="size-9 rounded-lg overflow-hidden bg-background border border-border shrink-0">
                    {p.image && <img src={resolveImage(p.image)} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{p.name}</p>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{p.reviews} reviews</p>
                  </div>
                  <p className="inline-flex items-center gap-1 font-mono text-sm text-accent">
                    <Star className="size-3 fill-current" /> {Number(p.rating).toFixed(1)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">{label}</span>
      </div>
      <p className="text-2xl font-display font-semibold">{value}</p>
      {sub && <div className="mt-2">{sub}</div>}
    </div>
  );
}

function TrendBadge({ delta }: { delta: number }) {
  const up = delta >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`text-[10px] font-mono uppercase tracking-widest inline-flex items-center gap-1 ${up ? "text-accent" : "text-muted-foreground"}`}>
      <Icon className="size-3" /> {Math.abs(delta).toFixed(0)}% vs prior 7d
    </span>
  );
}
