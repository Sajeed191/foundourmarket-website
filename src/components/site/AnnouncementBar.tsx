import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2, Truck, Sparkles, Flame, ShieldCheck } from "lucide-react";

const MESSAGES = [
  { icon: Truck, text: "Free worldwide shipping on orders over $50" },
  { icon: ShieldCheck, text: "Buyer protection · Encrypted checkout" },
  { icon: Sparkles, text: "New arrivals just landed — fresh drops daily" },
  { icon: Flame, text: "Flash deals live · Limited stock" },
  { icon: Globe2, text: "Trusted by shoppers in 180+ countries" },
];

/**
 * Slim sticky announcement bar — homepage / shopping pages only.
 * Sits above the main nav. Auto-rotates every 4s.
 */
export function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % MESSAGES.length), 4000);
    return () => clearInterval(t);
  }, []);
  const M = MESSAGES[i];
  const Icon = M.icon;
  return (
    <div
      role="region"
      aria-label="Announcements"
      className="relative h-9 overflow-hidden border-b border-accent/15 bg-background/80 backdrop-blur-md"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: "var(--gradient-ember-soft)" }}
      />
      <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-foreground/90"
          >
            <Icon className="size-3.5 text-accent shrink-0" />
            <span className="truncate">{M.text}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
