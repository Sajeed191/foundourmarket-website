import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";

const ITEMS = [
  { icon: Truck, label: "Fast Delivery" },
  { icon: ShieldCheck, label: "Secure Checkout" },
  { icon: RotateCcw, label: "Easy Returns" },
  { icon: Headphones, label: "24/7 Support" },
];

/**
 * Compact trust strip between the hero and categories. Minimal icons, no
 * animation, mobile-first 4-up layout — zero performance impact.
 */
export function TrustBadgesStrip() {
  return (
    <section className="px-4 sm:px-6 pt-1 pb-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        {ITEMS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-xl glass px-1.5 py-2.5 ring-1 ring-white/5 text-center"
          >
            <Icon className="size-4 text-accent shrink-0" strokeWidth={2} />
            <span className="text-[9px] sm:text-[11px] font-medium leading-tight text-white/90">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
