import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  ChevronDown,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { BUILD_ID } from "@/lib/build-version";

const EASE = "cubic-bezier(0.2,0.8,0.2,1)";

type NavGroup = {
  title: string;
  links: { label: string; to?: string; badge?: string }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Blog", to: "/blog" },
      { label: "Careers", badge: "Soon" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", to: "/contact" },
      { label: "Help Center", to: "/help" },
      { label: "Track Order", to: "/track" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms & Conditions", to: "/terms" },
      { label: "Refund Policy", to: "/returns" },
    ],
  },
  {
    title: "Categories",
    links: [
      { label: "Shop All", to: "/" },
      { label: "Buyer Protection", to: "/buyer-protection" },
      { label: "Shipping Policy", to: "/pages/shipping" },
    ],
  },
];

const TRUST = [
  { label: "Fast Delivery", icon: Truck },
  { label: "Secure Checkout", icon: ShieldCheck },
  { label: "Easy Returns", icon: RotateCcw },
  { label: "24/7 Support", icon: Headphones },
];

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/foundourmarket?igsh=MXgwd3QwcXlleXhueQ==", demo: false },
  { icon: Twitter, label: "Twitter", href: "#", demo: true },
  { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/share/1DHs1PbeUN/", demo: false },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@foundourmarket?si=JsljIPlZFQtWIb1t", demo: false },
];

/** Footer link with a subtle hover-underline (transform only). */
function FooterLink({ to, label, badge }: { to?: string; label: string; badge?: string }) {
  const inner = (
    <span className="relative inline-flex items-center gap-1.5 min-h-[28px]">
      <span className="footer-underline relative">
        {label}
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 -bottom-0.5 h-px w-full origin-left scale-x-0 bg-accent/70 transition-transform duration-200"
          style={{ transitionTimingFunction: EASE }}
        />
      </span>
      {badge && (
        <span className="rounded-full border border-border/60 px-1.5 py-px text-[8px] font-mono uppercase tracking-wider text-accent">
          {badge}
        </span>
      )}
    </span>
  );

  if (!to) {
    return <span className="text-muted-foreground/90 cursor-default">{inner}</span>;
  }
  return (
    <Link
      to={to}
      className="group text-muted-foreground/90 hover:text-foreground transition-colors [&_.footer-underline>span]:hover:scale-x-100"
    >
      {inner}
    </Link>
  );
}

/** Nav group — accordion on mobile, always-expanded on desktop. */
function FooterSection({
  group,
  isOpen,
  onToggle,
}: {
  group: NavGroup;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/[0.06] md:border-0 pb-1 md:pb-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between py-3 md:py-0 md:pb-3 md:pointer-events-none min-h-[44px] md:min-h-0"
      >
        <h5 className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground/70">
          {group.title}
        </h5>
        <ChevronDown
          className="size-4 text-muted-foreground md:hidden"
          style={{
            transition: `transform 200ms ${EASE}`,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      <div
        className={`grid transition-all duration-200 md:!grid-rows-[1fr] md:!opacity-100 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        style={{ transitionTimingFunction: EASE }}
      >
        <ul className="overflow-hidden text-[13px] space-y-1 pb-2 md:pb-0">
          {group.links.map((link) => (
            <li key={link.label}>
              <FooterLink to={link.to} label={link.label} badge={link.badge} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Footer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const compact = pathname.startsWith("/checkout");
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Minimal, low-distraction footer during checkout to reduce abandonment.
  if (compact) {
    return (
      <footer className="relative px-4 sm:px-6 py-4 mobile-page-clearance lg:pb-4 border-t border-white/[0.06] bg-background">
        <div className="relative max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">© 2026 FoundOurMarket™</p>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/returns" className="hover:text-foreground transition-colors">Refunds</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="relative px-5 sm:px-6 pt-10 mobile-page-clearance md:py-14 border-t border-white/[0.06] overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #0C0C11 0%, #09090D 60%, #08080B 100%)",
      }}
    >
      {/* Ambient top glow — soft depth, opacity only */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[70%] h-56 opacity-30"
        style={{ background: "var(--gradient-ember-soft)" }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* ── 1. Brand moment ── */}
        <div className="max-w-md">
          <Link
            to="/"
            aria-label="FoundOurMarket home"
            className="inline-block text-2xl sm:text-3xl font-display font-semibold tracking-tight hover:opacity-90 transition-opacity duration-200"
          >
            FoundOurMarket<span className="text-accent">™</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground/80 leading-relaxed">
            Curated global products, delivered with precision.
          </p>
        </div>

        {/* ── 2. Trust strip ── */}
        <div className="mt-8 -mx-1 flex gap-2.5 overflow-x-auto no-scrollbar sm:flex-wrap sm:overflow-visible pb-1">
          {TRUST.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="shrink-0 inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3.5 py-2"
            >
              <Icon className="size-3.5 text-accent" aria-hidden />
              <span className="text-xs font-medium text-foreground/85 whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>

        {/* hairline divider */}
        <div aria-hidden className="mt-9 mb-8 h-px w-full bg-white/[0.06]" />

        {/* ── 3. Link grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-0 md:gap-y-8">
          {NAV_GROUPS.map((group) => (
            <FooterSection
              key={group.title}
              group={group}
              isOpen={openSection === group.title}
              onToggle={() => setOpenSection((cur) => (cur === group.title ? null : group.title))}
            />
          ))}
        </div>

        {/* ── 4. Contact + 5. Social ── */}
        <div className="mt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <a
              href="mailto:support@foundourmarket.com"
              className="block text-sm text-foreground/85 hover:text-foreground transition-colors"
            >
              support@foundourmarket.com
            </a>
            <a
              href="https://wa.me/919745844213"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-muted-foreground/80 hover:text-foreground transition-colors"
            >
              +91 97458 44213
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-accent hover:gap-2.5 transition-all duration-200"
              style={{ transitionTimingFunction: EASE }}
            >
              Contact Support
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {SOCIALS.map(({ icon: Icon, label, href, demo }) => (
              <a
                key={label}
                href={href}
                {...(demo
                  ? { onClick: (e: React.MouseEvent) => e.preventDefault() }
                  : { target: "_blank", rel: "noopener noreferrer" })}
                aria-label={demo ? `${label} (demo)` : label}
                className="grid size-10 place-items-center rounded-full border border-white/[0.08] text-muted-foreground/80 transition-[transform,color,box-shadow,border-color] duration-200 hover:text-accent hover:border-accent/40 hover:-translate-y-0.5"
                style={{
                  transitionTimingFunction: EASE,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 0 18px color-mix(in oklab, var(--color-accent) 28%, transparent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {/* ── 6. Bottom bar ── */}
        <div className="mt-10 pt-5 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
          <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest">
            © 2026 FoundOurMarket — All rights reserved.
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/40 tracking-widest">
            build {BUILD_ID}
          </p>
        </div>
      </div>
    </footer>
  );
}
