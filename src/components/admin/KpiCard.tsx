import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function KpiCard({ label, value, icon, delta, sub }: {
  label: string; value: ReactNode; icon?: ReactNode; delta?: number | null; sub?: ReactNode;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden card-premium rounded-2xl p-5 hover:border-accent/40 transition-colors"
    >
      <div className="absolute -top-16 -right-16 size-32 rounded-full bg-accent/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          {icon && <span className="text-accent">{icon}</span>}
          <span className="text-[10px] font-mono uppercase tracking-[0.3em]">{label}</span>
        </div>
        <p className="text-2xl font-display font-semibold tabular-nums">{value}</p>
        {delta != null && (
          <span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${
            positive
              ? "text-accent border-accent/30 bg-accent/10"
              : "text-destructive border-destructive/30 bg-destructive/10"
          }`}>
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <div className="mt-2">{sub}</div>}
      </div>
    </motion.div>
  );
}
