import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, BadgeCheck, Truck, Search, CreditCard,
  ShieldCheck, Clock, Headphones, Lock, Repeat, Wrench,
  ChevronDown, Smartphone, Shirt, Home, Sparkles, Watch,
  CircleDollarSign, PackageCheck, RefreshCw,
} from "lucide-react";

/* ---------------- shared bits ---------------- */
const cardBg = "rgba(255,255,255,0.03)";

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-accent mb-2">
        <Sparkles className="size-3" />
        <span>{eyebrow}</span>
      </div>
      <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-white">{title}</h2>
      {subtitle && <p className="text-sm text-white/55 mt-1.5 max-w-xl">{subtitle}</p>}
    </div>
  );
}

function reveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.5, delay },
  };
}

/* ---------------- 1. Return Process Timeline ---------------- */
const STEPS = [
  { icon: FileText, title: "Request Return", desc: "Pick the item and reason in seconds." },
  { icon: BadgeCheck, title: "Approval", desc: "Most requests approved within 24h." },
  { icon: Truck, title: "Pickup / Ship Back", desc: "Free pickup or prepaid label." },
  { icon: Search, title: "Inspection", desc: "Quick quality check on arrival." },
  { icon: CreditCard, title: "Refund Completed", desc: "Money back to your source." },
];

function ProcessTimeline() {
  return (
    <motion.section {...reveal()} className="mt-12">
      <SectionHeader eyebrow="How returns work" title="A 5-step return process" subtitle="Transparent at every stage — you always know what happens next." />
      <div className="relative rounded-3xl p-5 sm:p-7 ring-1 ring-white/10 backdrop-blur-xl" style={{ background: cardBg }}>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative flex sm:flex-col items-start sm:items-center gap-3 sm:text-center">
              {/* connector */}
              {i < STEPS.length - 1 && (
                <span aria-hidden className="hidden sm:block absolute top-6 left-1/2 w-full h-px" style={{ background: "linear-gradient(90deg, rgba(255,122,0,0.5), rgba(255,255,255,0.08))" }} />
              )}
              <div className="relative shrink-0 size-12 grid place-items-center rounded-2xl ring-1 ring-accent/30 bg-accent/10" style={{ boxShadow: "0 8px 26px -12px rgba(255,122,0,0.6)" }}>
                <s.icon className="size-5 text-accent" />
                <span className="absolute -top-1.5 -right-1.5 size-5 grid place-items-center rounded-full text-[10px] font-mono font-bold text-black" style={{ background: "linear-gradient(135deg,#FF7A00,#FF9F43)" }}>{i + 1}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <p className="text-[11px] text-white/55 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ---------------- 2. Refund Status Tracker ---------------- */
const REFUND_STAGES = [
  { icon: PackageCheck, label: "Return Received", note: "Item scanned at our hub" },
  { icon: Search, label: "Quality Inspection", note: "Verifying condition" },
  { icon: RefreshCw, label: "Refund Initiated", note: "Processing to your method" },
  { icon: CircleDollarSign, label: "Refund Completed", note: "Funds released" },
];

function RefundTracker() {
  const [active, setActive] = useState(2);
  return (
    <motion.section {...reveal()} className="mt-12">
      <SectionHeader eyebrow="Live tracking" title="Refund status tracker" subtitle="Follow your refund through every stage — no guessing, no waiting in the dark." />
      <div className="rounded-3xl p-5 sm:p-7 ring-1 ring-white/10 backdrop-blur-xl" style={{ background: cardBg }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-white/50">Demo timeline</p>
          <div className="flex gap-1">
            {REFUND_STAGES.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} className="size-2 rounded-full transition" style={{ background: i <= active ? "#FF7A00" : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {REFUND_STAGES.map((st, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <div key={st.label} className="flex items-center gap-4">
                <div className="relative">
                  <div className="size-10 grid place-items-center rounded-xl ring-1 transition" style={{ background: done || current ? "rgba(255,122,0,0.12)" : "rgba(255,255,255,0.03)", borderColor: done || current ? "rgba(255,122,0,0.4)" : "rgba(255,255,255,0.1)" }}>
                    <st.icon className="size-4" style={{ color: done || current ? "#FF9F43" : "rgba(255,255,255,0.4)" }} />
                  </div>
                  {current && <span className="absolute inset-0 rounded-xl ring-2 ring-accent/50 animate-ping" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: done || current ? "#fff" : "rgba(255,255,255,0.5)" }}>{st.label}</p>
                  <p className="text-[11px] text-white/45">{st.note}</p>
                </div>
                {done && <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Done</span>}
                {current && <span className="text-[10px] font-mono uppercase tracking-wider text-accent">In progress</span>}
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

/* ---------------- 3. Return Window by Category ---------------- */
const WINDOWS = [
  { icon: Shirt, cat: "Fashion & Apparel", window: "4 days", note: "Tags attached, unworn" },
  { icon: Home, cat: "Home & Living", window: "5 days", note: "Original packaging" },
  { icon: Smartphone, cat: "Electronics", window: "Warranty", note: "Repair / replace" },
  { icon: Watch, cat: "Watches & Accessories", window: "5 days", note: "Unused, boxed" },
  { icon: Sparkles, cat: "Beauty & Hygiene", window: "Non-returnable", note: "Sealed items only" },
  { icon: PackageCheck, cat: "General Goods", window: "4 days", note: "From delivery date" },
];

function ReturnWindows() {
  return (
    <motion.section {...reveal()} className="mt-12">
      <SectionHeader eyebrow="Eligibility" title="Return window by category" subtitle="Different products, different rules — here's exactly how long you have." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {WINDOWS.map((w) => (
          <div key={w.cat} className="rounded-2xl p-4 ring-1 ring-white/10 backdrop-blur-md hover:ring-accent/40 transition" style={{ background: cardBg }}>
            <w.icon className="size-4 text-accent mb-2" />
            <p className="text-xs font-semibold text-white leading-tight">{w.cat}</p>
            <p className="text-sm font-display font-semibold text-accent mt-1">{w.window}</p>
            <p className="text-[10px] text-white/45 mt-0.5">{w.note}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* ---------------- 4. Trust Metrics ---------------- */
const METRICS = [
  { icon: ShieldCheck, value: "98%", label: "Resolution Rate" },
  { icon: Clock, value: "3–5 Days", label: "Refund Speed" },
  { icon: Headphones, value: "24/7", label: "Support" },
  { icon: Lock, value: "100%", label: "Secure Processing" },
];

function TrustMetrics() {
  return (
    <motion.section {...reveal()} className="mt-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {METRICS.map((m) => (
          <div key={m.label} className="relative overflow-hidden rounded-2xl p-5 text-center ring-1 ring-white/10 backdrop-blur-xl" style={{ background: "linear-gradient(135deg, rgba(255,122,0,0.07), rgba(255,255,255,0.03))" }}>
            <div aria-hidden className="absolute -top-10 -right-10 size-24 rounded-full blur-2xl opacity-40" style={{ background: "radial-gradient(circle,#FF7A00,transparent 70%)" }} />
            <m.icon className="size-5 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display font-semibold text-white">{m.value}</p>
            <p className="text-[11px] text-white/55 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* ---------------- 5. Return Reason Selector ---------------- */
const REASONS = [
  "Defective / Damaged", "Wrong Item Received", "Item Doesn't Fit", "Other",
];

function ReasonSelector() {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <motion.section {...reveal()} className="mt-12">
      <SectionHeader eyebrow="Start a return" title="Why are you returning?" subtitle="Tell us the reason — it helps us improve and speeds up your approval." />
      <div className="rounded-3xl p-5 sm:p-7 ring-1 ring-white/10 backdrop-blur-xl" style={{ background: cardBg }}>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => {
            const on = sel === r;
            return (
              <button
                key={r}
                onClick={() => setSel(on ? null : r)}
                className="text-xs rounded-full px-3.5 py-2 ring-1 transition active:scale-95"
                style={{
                  background: on ? "linear-gradient(135deg,#FF7A00,#FF9F43)" : "rgba(255,255,255,0.03)",
                  color: on ? "#000" : "rgba(255,255,255,0.85)",
                  borderColor: on ? "transparent" : "rgba(255,255,255,0.12)",
                }}
              >
                {r}
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {sel && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl p-4 ring-1 ring-accent/25" style={{ background: "rgba(255,122,0,0.06)" }}>
                <p className="text-xs text-white/75"><span className="text-accent font-medium">{sel}</span> — look up your order above to continue.</p>
                <BadgeCheck className="size-4 text-accent shrink-0" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

/* ---------------- 6. Protection / Exchange / Warranty ---------------- */
const PILLARS = [
  {
    icon: ShieldCheck, title: "Buyer Protection",
    points: ["Full refund if item never arrives", "Covered against damage in transit", "Money-back on not-as-described items", "Disputes resolved within 48 hours"],
  },
  {
    icon: Repeat, title: "Exchange Policy",
    points: ["Free like-for-like size/color swaps", "No restocking fees on exchanges", "Priority dispatch on replacements", "One easy exchange per eligible item"],
  },
  {
    icon: Wrench, title: "Warranty Information",
    points: ["Manufacturer warranty on electronics", "Repair, replace or service options", "Genuine parts guaranteed", "Extended coverage on select brands"],
  },
];

function ProtectionPillars() {
  return (
    <motion.section {...reveal()} className="mt-12">
      <SectionHeader eyebrow="Peace of mind" title="You're fully protected" subtitle="Every order is backed by buyer protection, easy exchanges and warranty support." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {PILLARS.map((p) => (
          <div key={p.title} className="relative overflow-hidden rounded-3xl p-5 sm:p-6 ring-1 ring-white/10 backdrop-blur-xl" style={{ background: cardBg }}>
            <div aria-hidden className="absolute -top-16 -right-16 size-40 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle,#FF7A00,transparent 70%)" }} />
            <div className="relative">
              <div className="size-11 grid place-items-center rounded-2xl ring-1 ring-accent/30 bg-accent/10 mb-3">
                <p.icon className="size-5 text-accent" />
              </div>
              <p className="text-base font-semibold text-white">{p.title}</p>
              <ul className="mt-3 space-y-2">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2 text-xs text-white/70">
                    <BadgeCheck className="size-3.5 text-accent shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* ---------------- 7. FAQ ---------------- */
const FAQS = [
  { q: "How long does a refund take?", a: "Once your return passes inspection, refunds are initiated immediately and reach your original payment method within 3–5 business days." },
  { q: "Who pays for return shipping?", a: "Returns for damaged, defective or wrong items are always free. For other reasons, a small prepaid label fee may apply depending on the seller." },
  { q: "Can I exchange instead of refund?", a: "Yes. Many items support a free like-for-like exchange for a different size or color with no restocking fee." },
  { q: "What if my return window has expired?", a: "You may still qualify for manufacturer warranty support or direct seller assistance. Look up your order to see all available options." },
  { q: "How do I track my refund?", a: "Use the refund status tracker above after starting a return — you'll see live updates at every stage." },
  { q: "Which items can't be returned?", a: "Hygiene-sensitive, customized, digital and clearance items are generally non-returnable unless they arrive damaged or defective." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <motion.section {...reveal()} className="mt-12">
      <SectionHeader eyebrow="Questions" title="Frequently asked questions" subtitle="Everything you need to know about returns, refunds and protection." />
      <div className="space-y-2.5">
        {FAQS.map((f, i) => {
          const on = open === i;
          return (
            <div key={f.q} className="rounded-2xl ring-1 ring-white/10 backdrop-blur-xl overflow-hidden" style={{ background: cardBg }}>
              <button onClick={() => setOpen(on ? null : i)} className="w-full flex items-center justify-between gap-3 p-4 text-left">
                <span className="text-sm font-medium text-white">{f.q}</span>
                <ChevronDown className={`size-4 text-accent shrink-0 transition-transform duration-300 ${on ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <p className="px-4 pb-4 text-xs leading-relaxed text-white/60">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

/* ---------------- export ---------------- */
export function ReturnCenterSections() {
  return (
    <>
      <TrustMetrics />
      <ProcessTimeline />
      <RefundTracker />
      <ReturnWindows />
      <ReasonSelector />
      <ProtectionPillars />
      <FAQ />
    </>
  );
}
