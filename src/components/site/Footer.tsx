import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  ChevronDown,
  Headphones,
  ArrowRight,
} from "lucide-react";


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
    title: "Explore",
    links: [
      { label: "Shop All", to: "/" },
      { label: "Buyer Protection", to: "/buyer-protection" },
      { label: "Shipping Policy", to: "/pages/shipping" },
    ],
  },
];

const TRUST = ["Fast Global Delivery", "Secure Payments", "Verified Sellers", "Easy Returns"];

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/foundourmarket?igsh=MXgwd3QwcXlleXhueQ==", demo: false },
  { icon: Twitter, label: "Twitter", href: "#", demo: true },
  { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/share/1DHs1PbeUN/", demo: false },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@foundourmarket?si=JsljIPlZFQtWIb1t", demo: false },
];

/** Footer link with a soft, slow hover-underline (transform only). */
function FooterLink({ to, label, badge }: { to?: string; label: string; badge?: string }) {
  const inner = (
    <span className="relative inline-flex items-center gap-1.5">
      <span className="footer-underline relative">
        {label}
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 -bottom-0.5 h-px w-full origin-left scale-x-0 bg-accent/60 transition-transform duration-[280ms]"
          style={{ transitionTimingFunction: EASE }}
        />
      </span>
      {badge && (
        <span className="rounded-full px-1.5 py-px text-[8px] font-mono uppercase tracking-wider text-accent/80 bg-accent/10">
          {badge}
        </span>
      )}
    </span>
  );

  if (!to) {
    return <span className="text-muted-foreground/70 cursor-default">{inner}</span>;
  }
  return (
    <Link
      to={to}
      className="group inline-flex text-muted-foreground/70 hover:text-foreground transition-colors duration-200 [&_.footer-underline>span]:hover:scale-x-100"
    >
      {inner}
    </Link>
  );
}

/** Nav group — quiet category zone; accordion on mobile, always-expanded on desktop. */
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
    <div className="border-b border-white/[0.05] md:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between py-3.5 md:py-0 md:pb-4 md:pointer-events-none min-h-[44px] md:min-h-0"
      >
        <h5 className="text-[11px] font-medium uppercase tracking-[0.24em] text-foreground/55">
          {group.title}
        </h5>
        <ChevronDown
          className="size-4 text-muted-foreground/60 md:hidden"
          style={{
            transition: `transform 240ms ${EASE}`,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      <div
        className={`grid transition-all duration-[280ms] md:!grid-rows-[1fr] md:!opacity-100 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        style={{ transitionTimingFunction: EASE }}
      >
        <ul className="overflow-hidden text-sm space-y-2.5 pb-4 md:pb-0">
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
      <footer className="relative px-4 sm:px-6 py-4 mobile-page-clearance lg:pb-4 border-t border-white/[0.05] bg-background">
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
      className="relative px-6 sm:px-8 pt-16 mobile-page-clearance md:py-20 overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #101017 0%, #0A0A0E 45%, #070709 100%)",
      }}
    >
      <div className="relative max-w-6xl mx-auto">
        {/* ── 1. Brand identity block ── */}
        <div className="max-w-2xl">
          <Link
            to="/"
            aria-label="FoundOurMarket home"
            className="inline-block text-xl sm:text-2xl font-display font-medium tracking-tight text-foreground/95 hover:opacity-90 transition-opacity duration-200"
          >
            FoundOurMarket<span className="text-accent font-normal">™</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground/75 leading-relaxed">
            Global marketplace built for precision sourcing.
          </p>
          {/* soft animated gradient divider */}
          <div aria-hidden className="mt-7 h-px w-full overflow-hidden">
            <div
              className="animate-footer-line h-px w-[130%]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-accent) 45%, transparent), transparent)",
              }}
            />
          </div>
        </div>

        {/* ── 2. Quick trust pills ── */}
        <div className="mt-8 -mx-1 flex gap-2.5 overflow-x-auto no-scrollbar sm:flex-wrap sm:overflow-visible pb-1">
          {TRUST.map((label) => (
            <span
              key={label}
              className="shrink-0 inline-flex items-center rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[12.5px] font-light text-muted-foreground/70 whitespace-nowrap transition-[transform,color,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:text-foreground hover:border-accent/25"
              style={{ transitionTimingFunction: EASE }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 24px -14px color-mix(in oklab, var(--color-accent) 45%, transparent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* ── 3. Compact link grid + 4. Need help support strip ── */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-2 md:gap-y-0">
          <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-4 gap-x-8">
            {NAV_GROUPS.map((group) => (
              <FooterSection
                key={group.title}
                group={group}
                isOpen={openSection === group.title}
                onToggle={() => setOpenSection((cur) => (cur === group.title ? null : group.title))}
              />
            ))}
          </div>

          {/* Need help — hero support block */}
          <div className="md:col-span-4 pt-8 md:pt-0 md:pl-8 md:border-l md:border-white/[0.05]">
            <h4 className="text-base font-medium text-foreground/90">Need help?</h4>
            <div className="mt-3 space-y-1.5">
              <a
                href="mailto:support@foundourmarket.com"
                className="block text-[13px] text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                support@foundourmarket.com
              </a>
              <a
                href="https://wa.me/919745844213"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                +91 97458 44213
              </a>
            </div>
            <Link
              to="/contact"
              className="group relative mt-5 inline-flex items-center gap-2 rounded-[16px] px-5 py-3 text-sm font-medium text-foreground overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{ transitionTimingFunction: EASE }}
            >
              <span
                aria-hidden
                className="animate-cta-breathe absolute inset-0 rounded-[16px]"
                style={{
                  background:
                    "radial-gradient(120% 120% at 30% 30%, color-mix(in oklab, var(--color-accent) 32%, transparent), transparent 70%)",
                }}
              />
              <span aria-hidden className="absolute inset-0 rounded-[16px] bg-white/[0.04] border border-white/[0.06]" />
              <Headphones className="relative size-4 text-accent" />
              <span className="relative">Talk to Support</span>
              <ArrowRight className="relative size-4 transition-transform duration-200 group-hover:translate-x-0.5" style={{ transitionTimingFunction: EASE }} />
            </Link>
          </div>
        </div>

        {/* ── 5. Minimal social bar ── */}
        <div className="mt-14 flex justify-center gap-2">
          {SOCIALS.map(({ icon: Icon, label, href, demo }) => (
            <a
              key={label}
              href={href}
              {...(demo
                ? { onClick: (e: React.MouseEvent) => e.preventDefault() }
                : { target: "_blank", rel: "noopener noreferrer" })}
              aria-label={demo ? `${label} (demo)` : label}
              className="grid size-10 place-items-center rounded-full text-muted-foreground/60 transition-[transform,color,box-shadow] duration-200 hover:text-accent hover:-translate-y-0.5"
              style={{ transitionTimingFunction: EASE }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 18px -4px color-mix(in oklab, var(--color-accent) 45%, transparent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Icon className="size-[18px]" />
            </a>
          ))}
        </div>

        {/* ── 6. Copyright bar ── */}
        <div className="mt-10 pt-6 border-t border-white/[0.05] flex items-center justify-center">
          <p className="text-[11px] font-light text-muted-foreground/50 tracking-wide">
            © 2026 FoundOurMarket — All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

