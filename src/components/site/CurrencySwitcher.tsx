import { useRegion } from "@/lib/region";

const FLAGS: Record<string, string> = { INR: "🇮🇳", USD: "🇺🇸" };

export function CurrencySwitcher() {
  const { currency } = useRegion();
  const flag = FLAGS[currency] ?? "🌍";

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border text-[11px] font-mono uppercase tracking-widest"
      aria-label="Active currency"
    >
      <span className="text-sm leading-none">{flag}</span>
      <span>{currency}</span>
    </div>
  );
}
