import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ChevronDown, Smartphone, Home as HomeIcon, Gem, HeartPulse,
  Car, Tent, PawPrint, Baby, ArrowRight, type LucideIcon,
} from "lucide-react";

type Sub = { name: string; main: string; sub: string };
type MainCat = {
  name: string;
  slug: string;
  icon: LucideIcon;
  blurb: string;
  subs: Sub[];
};

/** Static merchandising map mirrors the published catalog taxonomy. */
const MENU: MainCat[] = [
  {
    name: "Electronics & Gadgets", slug: "electronics", icon: Smartphone,
    blurb: "Audio, lighting & smart tech",
    subs: [
      { name: "Audio & Speakers", main: "electronics", sub: "speakers" },
      { name: "LED Lighting", main: "electronics", sub: "led" },
      { name: "Portable Gadgets", main: "electronics", sub: "portablegad" },
      { name: "Mobile Accessories", main: "electronics", sub: "mobile-accessories" },
      { name: "Computer Accessories", main: "electronics", sub: "computer-accessories" },
      { name: "Smartwatches", main: "electronics", sub: "smartwatches" },
    ],
  },
  {
    name: "Home & Kitchen", slug: "homeandkitchen", icon: HomeIcon,
    blurb: "Decor, storage & appliances",
    subs: [
      { name: "Bathroom Accessories", main: "homeandkitchen", sub: "homeutilities" },
      { name: "Cleaning Supplies", main: "homeandkitchen", sub: "cleaningsupplies" },
      { name: "Home Decor", main: "homeandkitchen", sub: "homedecor" },
      { name: "Kitchen Tools", main: "homeandkitchen", sub: "kitchentools" },
      { name: "Storage & Organization", main: "homeandkitchen", sub: "storage" },
      { name: "Home Appliances", main: "homeandkitchen", sub: "homeappli" },
    ],
  },
  {
    name: "Beauty & Personal Care", slug: "bhandpersonalcareeauen", icon: Gem,
    blurb: "Devices, grooming & skincare",
    subs: [
      { name: "Beauty Devices", main: "bhandpersonalcareeauen", sub: "healthandwesjsj" },
      { name: "Grooming", main: "bhandpersonalcareeauen", sub: "massagetoolssnsjsj" },
      { name: "Hair Care", main: "bhandpersonalcareeauen", sub: "haircare" },
      { name: "Skincare Tools", main: "bhandpersonalcareeauen", sub: "toothbrush" },
    ],
  },
  {
    name: "Health & Wellness", slug: "healthandwellness", icon: HeartPulse,
    blurb: "Fitness, recovery & wellness",
    subs: [
      { name: "Fitness Accessories", main: "healthandwellness", sub: "fitness" },
      { name: "Massagers", main: "healthandwellness", sub: "masaage" },
      { name: "Posture Support", main: "healthandwellness", sub: "post" },
      { name: "Wellness Devices", main: "healthandwellness", sub: "wellnessdevis" },
    ],
  },
  {
    name: "Car & Bike Accessories", slug: "automotiveaccessories", icon: Car,
    blurb: "On-the-go essentials",
    subs: [
      { name: "Bike Accessories", main: "automotiveaccessories", sub: "bikeaccessories" },
      { name: "Car Accessories", main: "automotiveaccessories", sub: "caraccessories" },
      { name: "Cleaning Tools", main: "automotiveaccessories", sub: "cleaningtools" },
      { name: "Electronics", main: "automotiveaccessories", sub: "bikeanncar" },
      { name: "Phone Holders", main: "automotiveaccessories", sub: "phonehild" },
      { name: "Organizers", main: "automotiveaccessories", sub: "oraganizers" },
    ],
  },
  {
    name: "Sports & Outdoor", slug: "sportsandoutdoor", icon: Tent,
    blurb: "Camping, fitness & travel",
    subs: [
      { name: "Camping Gear", main: "sportsandoutdoor", sub: "camping" },
      { name: "Fitness Gear", main: "sportsandoutdoor", sub: "fitnessgear" },
      { name: "Outdoor Equipment", main: "sportsandoutdoor", sub: "ooutdooreu" },
      { name: "Travel Essentials", main: "sportsandoutdoor", sub: "ttravelessen" },
    ],
  },
  {
    name: "Pet Supplies", slug: "pet-supplies", icon: PawPrint,
    blurb: "Everything for your pets",
    subs: [
      { name: "Pet Accessories", main: "pet-supplies", sub: "ppetasse" },
      { name: "Pet Feeding", main: "pet-supplies", sub: "catfood" },
      { name: "Pet Grooming", main: "pet-supplies", sub: "ppetgroom" },
      { name: "Pet Toys", main: "pet-supplies", sub: "ppettoys" },
    ],
  },
  {
    name: "Baby & Kids", slug: "banykid", icon: Baby,
    blurb: "Gentle care for little ones",
    subs: [
      { name: "Baby Care", main: "banykid", sub: "babycare" },
    ],
  },
];

/** Premium desktop mega-menu. Desktop-only; mobile uses the existing drawer. */
export function MegaMenu() {
  const [active, setActive] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = (slug: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActive(slug);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActive(null), 140);
  };

  return (
    <div className="hidden md:flex flex-1 justify-center items-center gap-0.5 lg:gap-1 text-[13px] lg:text-[14px] font-medium text-muted-foreground">
      <Link
        to="/"
        activeOptions={{ exact: true }}
        activeProps={{ className: "text-foreground bg-white/5" }}
        className="px-3.5 py-2 rounded-full hover:text-foreground hover:bg-white/5 transition-all duration-200 whitespace-nowrap"
      >
        Shop
      </Link>

      {MENU.map((cat) => {
        const Icon = cat.icon;
        const isOpen = active === cat.slug;
        return (
          <div
            key={cat.slug}
            className="relative"
            onMouseEnter={() => open(cat.slug)}
            onMouseLeave={scheduleClose}
          >
            <Link
              to="/category/$slug"
              params={{ slug: cat.slug }}
              className={`flex items-center gap-1 px-2.5 lg:px-3 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
                isOpen ? "text-foreground bg-white/5" : "hover:text-foreground hover:bg-white/5"
              }`}
            >
              <span className="hidden lg:inline">{cat.name.split(" & ")[0].split(" ")[0]}</span>
              <span className="lg:hidden">{cat.name.split(" ")[0]}</span>
              <ChevronDown
                className={`size-3 transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : "opacity-60"}`}
              />
            </Link>

            {/* Mega dropdown panel */}
            <div
              className={`absolute left-1/2 top-full z-50 pt-3 -translate-x-1/2 transition-all duration-200 ${
                isOpen
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="w-[440px] rounded-2xl glass-strong ring-1 ring-white/12 shadow-[var(--shadow-float),0_0_60px_-20px_oklch(0.74_0.19_49/0.5)] p-4 backdrop-blur-2xl">
                {/* Header */}
                <Link
                  to="/category/$slug"
                  params={{ slug: cat.slug }}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 mb-2 bg-gradient-to-r from-accent/10 to-transparent ring-1 ring-accent/15 hover:ring-accent/35 transition"
                >
                  <span className="grid place-items-center size-10 rounded-xl bg-accent/15 ring-1 ring-accent/30 text-accent shrink-0">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground truncate">{cat.name}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{cat.blurb}</span>
                  </span>
                  <ArrowRight className="ml-auto size-4 text-accent opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" />
                </Link>

                {/* Subcategory grid */}
                <div className="grid grid-cols-2 gap-1">
                  {cat.subs.map((s) => (
                    <Link
                      key={s.sub}
                      to="/category/$main/$sub"
                      params={{ main: s.main, sub: s.sub }}
                      className="group flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
                    >
                      <span className="size-1.5 rounded-full bg-accent/40 group-hover:bg-accent transition shrink-0" />
                      <span className="truncate">{s.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <Link
        to="/deals"
        activeProps={{ className: "text-foreground bg-white/5" }}
        className="px-3.5 py-2 rounded-full hover:text-foreground hover:bg-white/5 transition-all duration-200 whitespace-nowrap"
      >
        Deals
      </Link>
    </div>
  );
}
