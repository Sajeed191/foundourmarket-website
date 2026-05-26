import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, HelpCircle, Mail, Package, RotateCcw, CreditCard, Truck, Shield } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [
    { title: "Help Center — FoundOurMarket™" },
    { name: "description", content: "FAQs, order help, shipping, returns and contact." },
  ] }),
  component: HelpPage,
});

const FAQS: Array<{ icon: any; q: string; a: string }> = [
  { icon: Package, q: "Where is my order?", a: "Open Account → Orders to see live tracking. We email you the moment your parcel ships." },
  { icon: Truck, q: "How long does shipping take?", a: "Standard 3–7 business days, Express 1–3. Cut-off is 2pm local time on weekdays." },
  { icon: RotateCcw, q: "How do I return an item?", a: "Go to Account → Returns and pick the order. Refunds land back on your original payment within 5–10 days of receipt." },
  { icon: CreditCard, q: "What payment methods do you accept?", a: "All major cards, Apple Pay, Google Pay and select buy-now-pay-later providers at checkout." },
  { icon: Shield, q: "Is my payment secure?", a: "Yes. Payments are processed via PCI-compliant providers — we never store your card details." },
  { icon: Mail, q: "How do I contact support?", a: "Email support@foundourmarket.com or use the form below. Median first response: under 4 hours." },
];

function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="container-page py-10 sm:py-16 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-10">
        <Link to="/account" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-3" /> Back to account
        </Link>
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent">Support</p>
        <h1 className="text-fluid-2xl font-display font-semibold mt-2 flex items-center gap-3">
          <HelpCircle className="size-6 text-accent" /> Help Center
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Quick answers to the questions we hear most.</p>
      </motion.div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        {FAQS.map((f, i) => {
          const Icon = f.icon;
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center gap-4 px-5 sm:px-6 py-4 text-left hover:bg-white/5 transition-colors"
              >
                <div className="size-9 grid place-items-center rounded-full border border-border text-muted-foreground">
                  <Icon className="size-4" />
                </div>
                <span className="flex-1 font-medium text-sm">{f.q}</span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="px-5 sm:px-6 pb-5 pl-[4.25rem] text-sm text-muted-foreground"
                >
                  {f.a}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">
        <Mail className="size-5 mx-auto text-accent" />
        <h2 className="font-display text-lg font-semibold mt-3">Still need a human?</h2>
        <p className="text-sm text-muted-foreground mt-1">We reply within 4 hours during business days.</p>
        <a href="mailto:support@foundourmarket.com" className="cta-primary mt-5 inline-flex">Email support</a>
      </div>
    </div>
  );
}
