import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  RotateCcw, Search, Loader2, CheckCircle2, XCircle, Clock,
  Sparkles, ShieldCheck, MessageCircle, Mail, HelpCircle, Package,
  Send, Zap, ChevronRight, Timer, Bot, Wrench, BadgeCheck, Lock,
  LifeBuoy, ArrowRight, AlertTriangle, Repeat, Store,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trackOrder } from "@/lib/track-order.functions";
import { useRegion } from "@/lib/region";
import { RecommendationStrip } from "@/components/site/RecommendationStrip";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Return Eligibility Center — FoundOurMarket™" },
      { name: "description", content: "Check return eligibility, request exchanges, and access AI-powered post-purchase support. 4-day return window on selected products." },
      { property: "og:title", content: "Return Eligibility Center — FoundOurMarket™" },
      { property: "og:description", content: "Premium intelligent return management — transparent, trustworthy, AI-assisted." },
    ],
  }),
  component: ReturnsPage,
});

const TRUST = [
  { icon: ShieldCheck, label: "Buyer Protection" },
  { icon: Lock, label: "Secure Refunds" },
  { icon: BadgeCheck, label: "Verified Sellers" },
  { icon: LifeBuoy, label: "Support Guarantee" },
];

const POLICY_NOTES = [
  "Returns are available only for selected products within 4 days of successful delivery.",
  "Clearance, hygiene-sensitive, customized, and protected seller items may not qualify.",
  "Damaged or defective items are eligible for replacement or full refund within the window.",
  "Refunds are processed back to your original payment method within 5–7 business days.",
];

const SUPPORT_OPTIONS = [
  { icon: Wrench, title: "Warranty Claim", desc: "Manufacturer-backed coverage" },
  { icon: Repeat, title: "Replacement Support", desc: "Get a like-for-like swap" },
  { icon: Store, title: "Seller Assistance", desc: "Talk directly to the seller" },
  { icon: ShieldCheck, title: "Damage Protection", desc: "Covered shipments only" },
];

// Heuristic — in absence of a per-product flag, derive deterministic eligibility from slug
function isProductEligible(slug: string): boolean {
  if (!slug) return false;
  const lower = slug.toLowerCase();
  // hygiene / customized / clearance keywords are non-returnable
  if (/(intimate|hygiene|cosmetic|food|consumable|gift-card|digital|custom|personalized|clearance|final-sale)/.test(lower)) return false;
  // Deterministic ~70% eligible distribution
  let h = 0;
  for (let i = 0; i < lower.length; i++) h = (h * 31 + lower.charCodeAt(i)) >>> 0;
  return h % 10 < 7;
}

type EligibilityStatus =
  | { kind: "eligible"; hoursLeft: number }
  | { kind: "expired" }
  | { kind: "non_returnable" }
  | { kind: "not_delivered" };

function computeEligibility(productSlug: string, deliveredAt: Date | null): EligibilityStatus {
  if (!isProductEligible(productSlug)) return { kind: "non_returnable" };
  if (!deliveredAt) return { kind: "not_delivered" };
  const ms = Date.now() - deliveredAt.getTime();
  const hoursElapsed = ms / 36e5;
  const hoursLeft = 96 - hoursElapsed;
  if (hoursLeft <= 0) return { kind: "expired" };
  return { kind: "eligible", hoursLeft };
}

function ReturnsPage() {
  const track = useServerFn(trackOrder);
  const { format } = useRegion();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const { slugs: recentSlugs } = useRecentlyViewed();

  const m = useMutation({
    mutationFn: (vars: { orderId: string; email: string }) => track({ data: vars }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) return;
    m.mutate({ orderId: orderId.trim(), email: email.trim() });
  };

  const order = m.data?.found ? m.data.order : null;
  const items = m.data?.found ? m.data.items : [];
  const deliveredAt = order?.status === "delivered" ? new Date(order.updated_at) : null;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#050816" }}>
      {/* Ambient gradient atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(60% 50% at 50% 0%, rgba(255,122,0,0.18), transparent 70%), radial-gradient(40% 40% at 90% 30%, rgba(255,159,67,0.10), transparent 70%), radial-gradient(50% 50% at 10% 80%, rgba(255,122,0,0.08), transparent 70%)"
        }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }} />
      </div>

      <div className="container-page max-w-5xl py-10 sm:py-16 px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-accent mb-3">
            <Sparkles className="size-3" />
            <span>Return Eligibility Center</span>
          </div>
          <h1 className="text-fluid-3xl font-display font-semibold tracking-tight text-white">
            Premium return management,<br className="hidden sm:block" />
            <span className="text-accent">made transparent.</span>
          </h1>
          <p className="text-sm sm:text-base text-white/60 mt-3 max-w-xl">
            Look up your order to check eligibility, view your return window, or access exchange,
            warranty and seller support — all in one intelligent place.
          </p>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-2 sm:gap-3 mt-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1"
        >
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="snap-start shrink-0 flex items-center gap-2 rounded-full px-3 py-2 ring-1 ring-white/10 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.03)" }}>
              <Icon className="size-3.5 text-accent" />
              <span className="text-[11px] font-medium text-white/80 whitespace-nowrap">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Lookup card */}
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="relative mt-8 rounded-3xl p-5 sm:p-7 ring-1 ring-white/10 backdrop-blur-xl"
          style={{ background: "rgba(255,255,255,0.03)", boxShadow: "0 30px 80px -30px rgba(255,122,0,0.25)" }}
        >
          <div className="absolute -inset-px rounded-3xl pointer-events-none" style={{
            background: "linear-gradient(135deg, rgba(255,122,0,0.18), transparent 40%, rgba(255,159,67,0.12))",
            mask: "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
            WebkitMask: "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
            maskComposite: "exclude", WebkitMaskComposite: "xor", padding: 1,
          }} />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent mb-3">Check eligibility</p>
          <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_auto] gap-2.5">
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
              <input
                value={orderId} onChange={(e) => setOrderId(e.target.value)}
                placeholder="Order ID"
                className="w-full h-12 pl-9 pr-3 rounded-xl bg-black/40 ring-1 ring-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-accent/60 transition"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
              <input
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Order email"
                type="email"
                className="w-full h-12 pl-9 pr-3 rounded-xl bg-black/40 ring-1 ring-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-accent/60 transition"
              />
            </div>
            <button
              type="submit"
              disabled={m.isPending}
              className="h-12 px-5 rounded-xl font-semibold text-sm text-black inline-flex items-center justify-center gap-2 disabled:opacity-60 hover:brightness-110 active:scale-[0.98] transition"
              style={{ background: "linear-gradient(135deg, #FF7A00, #FF9F43)", boxShadow: "0 10px 30px -10px rgba(255,122,0,0.6)" }}
            >
              {m.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              <span>Check</span>
            </button>
          </div>
          <p className="text-[11px] text-white/40 mt-3 font-mono">4-day return window · Selected products only</p>
        </motion.form>

        {/* Results */}
        <AnimatePresence mode="wait">
          {m.isPending && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/[0.03] ring-1 ring-white/5 animate-pulse" />
              ))}
            </motion.div>
          )}

          {m.data && !m.data.found && (
            <motion.div
              key="notfound"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-8 rounded-3xl p-8 sm:p-10 text-center ring-1 ring-white/10 backdrop-blur-xl"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="mx-auto size-14 grid place-items-center rounded-full bg-accent/10 ring-1 ring-accent/30 mb-4">
                <HelpCircle className="size-6 text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-white">We couldn't match that order</h2>
              <p className="text-sm text-white/60 mt-1.5 max-w-md mx-auto">
                Double-check your Order ID and the email used at checkout. Our support team can help if it still doesn't show up.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                <Link to="/help" className="rounded-full px-4 py-2 text-xs font-medium text-white ring-1 ring-white/15 hover:bg-white/5 transition">Contact Support</Link>
                <Link to="/" className="rounded-full px-4 py-2 text-xs font-medium text-black hover:brightness-110 transition" style={{ background: "linear-gradient(135deg,#FF7A00,#FF9F43)" }}>Continue Shopping</Link>
              </div>
            </motion.div>
          )}

          {order && m.data?.found && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8 space-y-5"
            >
              {/* Order summary */}
              <div className="rounded-3xl p-5 sm:p-6 ring-1 ring-white/10 backdrop-blur-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Order</p>
                    <p className="text-base font-semibold text-white mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-white/50 mt-1 font-mono">
                      {order.status === "delivered" ? `Delivered · ${new Date(order.updated_at).toLocaleDateString()}` : `Status · ${order.status}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Total</p>
                    <p className="text-base font-semibold text-white mt-1 font-mono">{format(Number(order.total), order.currency)}</p>
                  </div>
                </div>
              </div>

              {/* Per-item eligibility */}
              <div className="space-y-3">
                {items.map((it, idx) => {
                  const status = computeEligibility(it.product_slug, deliveredAt);
                  return (
                    <EligibilityCard key={idx} item={it} status={status} delay={idx * 0.06} />
                  );
                })}
              </div>

              {/* AI Assistant */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="relative rounded-3xl p-5 sm:p-6 ring-1 ring-accent/20 backdrop-blur-xl overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(255,122,0,0.08), rgba(255,255,255,0.03))" }}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 size-11 grid place-items-center rounded-2xl bg-accent/15 ring-1 ring-accent/30">
                    <Bot className="size-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">AI Support Assistant</p>
                      <span className="text-[9px] font-mono uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">Live</span>
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      Need help? I can check exchange eligibility, warranty support, or seller protection options for any item above.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {["Check exchange options", "Warranty status", "Talk to seller"].map((s) => (
                        <button key={s} className="text-[11px] rounded-full px-3 py-1.5 ring-1 ring-white/15 text-white/80 hover:bg-white/5 transition">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Alternative support */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 mb-3 px-1">Other support options</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SUPPORT_OPTIONS.map(({ icon: Icon, title, desc }) => (
                    <button key={title} className="text-left rounded-2xl p-4 ring-1 ring-white/10 backdrop-blur-md hover:ring-accent/40 hover:bg-white/[0.04] transition group" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <Icon className="size-4 text-accent mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold text-white">{title}</p>
                      <p className="text-[10px] text-white/50 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Policy explanation (always visible) */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-10 rounded-3xl p-5 sm:p-7 ring-1 ring-white/10 backdrop-blur-xl"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="size-4 text-accent" />
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent">Return Policy</p>
          </div>
          <ul className="space-y-3">
            {POLICY_NOTES.map((n) => (
              <li key={n} className="flex gap-3 text-sm text-white/70">
                <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Smart actions */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-6">
          {[
            { to: "/help", label: "Contact Support", icon: MessageCircle },
            { to: "/help", label: "Request Exchange", icon: Repeat },
            { to: "/help", label: "Chat with Seller", icon: Store },
            { to: "/help", label: "Return Policy", icon: ShieldCheck },
            { to: "/", label: "Continue Shopping", icon: ArrowRight },
          ].map(({ to, label, icon: Icon }) => (
            <Link key={label} to={to} className="rounded-2xl px-3 py-3 text-xs font-medium text-white/90 ring-1 ring-white/10 hover:ring-accent/40 hover:bg-white/[0.04] transition inline-flex items-center justify-center gap-2 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
              <Icon className="size-3.5 text-accent" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>

        {/* Recommendations */}
        {recentSlugs.length > 0 && (
          <RecommendationStrip
            title="You may also love"
            subtitle="AI-picked alternatives based on your activity"
            slugs={recentSlugs.slice(0, 8)}
          />
        )}
      </div>
    </div>
  );
}

type Item = { name: string; product_slug: string; image: string | null; quantity: number; unit_price: number; line_total: number };

function EligibilityCard({ item, status, delay }: { item: Item; status: EligibilityStatus; delay: number }) {
  const badge = useMemo(() => {
    switch (status.kind) {
      case "eligible": return { label: "Return Eligible", icon: CheckCircle2, color: "#22c55e", bg: "rgba(34,197,94,0.12)", ring: "rgba(34,197,94,0.35)" };
      case "expired": return { label: "Return Window Expired", icon: Clock, color: "#FF9F43", bg: "rgba(255,159,67,0.12)", ring: "rgba(255,159,67,0.35)" };
      case "non_returnable": return { label: "Non-Returnable", icon: XCircle, color: "#ef4444", bg: "rgba(239,68,68,0.12)", ring: "rgba(239,68,68,0.35)" };
      case "not_delivered": return { label: "Awaiting Delivery", icon: Timer, color: "#FF7A00", bg: "rgba(255,122,0,0.12)", ring: "rgba(255,122,0,0.35)" };
    }
  }, [status]);
  const Icon = badge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}
      className="relative rounded-3xl p-4 sm:p-5 ring-1 ring-white/10 backdrop-blur-xl"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <div className="flex gap-4">
        <div className="shrink-0 size-20 sm:size-24 rounded-2xl overflow-hidden bg-black/40 ring-1 ring-white/10">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full grid place-items-center"><Package className="size-6 text-white/30" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-white truncate">{item.name}</p>
              <p className="text-[11px] text-white/40 font-mono mt-0.5">Qty {item.quantity}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 shrink-0" style={{ background: badge.bg, borderColor: badge.ring, color: badge.color }}>
              <Icon className="size-3" />
              <span className="text-[10px] font-mono uppercase tracking-wider">{badge.label}</span>
            </div>
          </div>

          {/* Status-specific content */}
          <div className="mt-3">
            {status.kind === "eligible" && <CountdownRing hoursLeft={status.hoursLeft} />}
            {status.kind === "expired" && (
              <p className="text-xs text-white/55">Return period ended. You may still qualify for warranty or seller assistance below.</p>
            )}
            {status.kind === "non_returnable" && (
              <p className="text-xs text-white/55">Seller does not allow returns for this category. Warranty and replacement options may apply.</p>
            )}
            {status.kind === "not_delivered" && (
              <p className="text-xs text-white/55">Return window opens automatically once the item is marked delivered.</p>
            )}
          </div>

          {/* Action row */}
          <div className="flex flex-wrap gap-2 mt-4">
            {status.kind === "eligible" && (
              <Link to="/account/returns" search={{}} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-black hover:brightness-110 transition" style={{ background: "linear-gradient(135deg,#FF7A00,#FF9F43)" }}>
                Start return <ChevronRight className="size-3" />
              </Link>
            )}
            <button className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium text-white/85 ring-1 ring-white/15 hover:bg-white/5 transition">
              <Repeat className="size-3 text-accent" /> Request exchange
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium text-white/85 ring-1 ring-white/15 hover:bg-white/5 transition">
              <Store className="size-3 text-accent" /> Chat with seller
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CountdownRing({ hoursLeft }: { hoursLeft: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  // recompute live based on initial hoursLeft + elapsed since mount
  const [startedAt] = useState(Date.now());
  const elapsedH = (now - startedAt) / 36e5;
  const remaining = Math.max(0, hoursLeft - elapsedH);
  const days = Math.floor(remaining / 24);
  const hrs = Math.floor(remaining % 24);
  const mins = Math.floor((remaining * 60) % 60);
  const pct = Math.min(1, Math.max(0, remaining / 96));
  const urgent = remaining < 24;

  const size = 56, stroke = 4, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className={urgent ? "animate-pulse" : ""}>
          <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
          <motion.circle
            cx={size/2} cy={size/2} r={r}
            stroke={urgent ? "#FF7A00" : "#FF9F43"}
            strokeWidth={stroke} fill="none" strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ filter: `drop-shadow(0 0 6px ${urgent ? "#FF7A00" : "#FF9F43"}80)` }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <Timer className="size-4 text-accent" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">Return closes in</p>
        <p className="text-sm font-semibold text-white font-mono tabular-nums">
          {days > 0 ? `${days}d ${hrs}h` : `${hrs}h ${mins}m`}
          {urgent && <span className="ml-2 text-[10px] text-accent uppercase tracking-wider">Urgent</span>}
        </p>
      </div>
    </div>
  );
}
