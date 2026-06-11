import { useEffect, useState } from "react";
import { useRegion } from "@/lib/region";

const FLAGS: Record<string, string> = { INR: "🇮🇳", USD: "🇺🇸" };

export function CurrencySwitcher() {
  const { currency } = useRegion();
  // Avoid SSR/client hydration mismatch: the server has no access to the
  // visitor's stored region, so only paint the resolved currency post-mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const shown = mounted ? currency : "USD";
  const flag = FLAGS[shown] ?? "🌍";

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border text-[11px] font-mono uppercase tracking-widest"
      aria-label="Active currency"
    >
      <span className="text-sm leading-none">{flag}</span>
      <span>{shown}</span>
    </div>
  );
}
