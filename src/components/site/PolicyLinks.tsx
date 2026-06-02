import { Link } from "@tanstack/react-router";
import {
  ShieldCheck, FileText, Truck, RotateCcw, Wallet, Headset,
  HelpCircle, Mail, Info, BadgeCheck, type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

/**
 * Central registry for the FoundOurMarket™ legal & trust ecosystem.
 * Every policy / support page links to the same canonical, crawlable URLs.
 */
export type PolicyKey =
  | "about"
  | "contact"
  | "help"
  | "support"
  | "faq"
  | "privacy"
  | "terms"
  | "shipping"
  | "refund"
  | "return"
  | "buyerProtection"
  | "track";

type PolicyEntry = {
  label: string;
  to: string;
  icon: ComponentType<LucideProps>;
  desc: string;
};

export const POLICY_LINKS: Record<PolicyKey, PolicyEntry> = {
  about: { label: "About Us", to: "/about", icon: Info, desc: "Our mission, values & story" },
  contact: { label: "Contact Us", to: "/contact", icon: Mail, desc: "Reach our support team" },
  help: { label: "Help Center", to: "/help", icon: Headset, desc: "Guides & live support" },
  support: { label: "Support Center", to: "/help", icon: Headset, desc: "24/7 assistance" },
  faq: { label: "FAQ", to: "/help", icon: HelpCircle, desc: "Common questions answered" },
  privacy: { label: "Privacy Policy", to: "/privacy", icon: ShieldCheck, desc: "How we protect your data" },
  terms: { label: "Terms & Conditions", to: "/terms", icon: FileText, desc: "Rules for using our store" },
  shipping: { label: "Shipping Policy", to: "/pages/shipping", icon: Truck, desc: "Delivery times & coverage" },
  refund: { label: "Refund Policy", to: "/returns", icon: Wallet, desc: "Refund eligibility & timelines" },
  return: { label: "Return Policy", to: "/returns", icon: RotateCcw, desc: "Return windows by category" },
  buyerProtection: { label: "Buyer Protection", to: "/buyer-protection", icon: BadgeCheck, desc: "Every order, guaranteed" },
  track: { label: "Track Order", to: "/track", icon: Truck, desc: "Live shipment status" },
};

/**
 * Renders a grid of cross-links between policy / trust pages.
 * Used across every policy page to form one interconnected trust network.
 * `variant="dark"` suits pages with a dark navy custom background (returns, shipping).
 */
export function PolicyCrossLinks({
  title = "Related policies",
  subtitle,
  keys,
  variant = "default",
}: {
  title?: string;
  subtitle?: string;
  keys: PolicyKey[];
  variant?: "default" | "dark";
}) {
  const dark = variant === "dark";
  return (
    <section aria-label={title} className="mt-2">
      <div className="mb-4 flex items-center gap-3">
        <span className={`text-[10px] font-mono uppercase tracking-[0.3em] ${dark ? "text-orange-300" : "text-accent"}`}>
          {title}
        </span>
        <div className={`flex-1 h-px ${dark ? "bg-white/10" : "bg-border"}`} />
      </div>
      {subtitle && <p className={`mb-4 text-sm ${dark ? "text-white/55" : "text-muted-foreground"}`}>{subtitle}</p>}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {keys.map((k) => {
          const item = POLICY_LINKS[k];
          const Icon = item.icon;
          return (
            <Link
              key={k}
              to={item.to as never}
              className={`group flex items-center gap-3 rounded-2xl p-3.5 transition-all active:scale-[0.98] ${
                dark
                  ? "ring-1 ring-white/10 bg-white/[0.03] hover:ring-orange-400/40 hover:bg-white/[0.05]"
                  : "card-premium hover:border-accent/40"
              }`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                  dark ? "bg-orange-500/10 text-orange-300 ring-1 ring-orange-400/20" : "bg-accent/10 text-accent border border-accent/25"
                }`}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${dark ? "text-white" : "text-foreground"} group-hover:translate-x-0.5 transition-transform`}>
                  {item.label}
                </span>
                <span className={`block truncate text-[11px] ${dark ? "text-white/45" : "text-muted-foreground"}`}>
                  {item.desc}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
