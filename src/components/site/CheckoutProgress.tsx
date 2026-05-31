import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { CHECKOUT_STEPS, type CheckoutStepId } from "@/lib/checkout-state";

export function CheckoutProgress({
  currentStep,
  completedSteps,
}: {
  currentStep: CheckoutStepId;
  completedSteps: CheckoutStepId[];
}) {
  const currentIndex = CHECKOUT_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Checkout progress" className="w-full">
      <ol className="flex items-center gap-1 sm:gap-2">
        {CHECKOUT_STEPS.map((step, i) => {
          const done = completedSteps.includes(step.id) && step.id !== currentStep;
          const active = step.id === currentStep;
          const reached = i <= currentIndex || done;
          return (
            <li key={step.id} className="flex items-center gap-1 sm:gap-2 min-w-0">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span
                  aria-current={active ? "step" : undefined}
                  className={`grid place-items-center rounded-full size-6 sm:size-7 text-[10px] font-bold transition-colors ${
                    done
                      ? "bg-emerald-500/90 text-background"
                      : active
                        ? "bg-accent text-accent-foreground ring-2 ring-accent/30"
                        : "bg-white/[0.06] text-muted-foreground border border-white/10"
                  }`}
                >
                  {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                </span>
                <span
                  className={`text-[8px] sm:text-[9px] font-mono uppercase tracking-widest whitespace-nowrap ${
                    active ? "text-accent" : reached ? "text-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < CHECKOUT_STEPS.length - 1 && (
                <span className="relative flex-1 h-px min-w-3 sm:min-w-5 -translate-y-2 bg-white/10 overflow-hidden rounded-full">
                  <motion.span
                    initial={false}
                    animate={{ scaleX: i < currentIndex || done ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ originX: 0 }}
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500/80 to-accent"
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
