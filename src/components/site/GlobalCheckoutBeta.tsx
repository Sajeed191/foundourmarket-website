import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Globe, ShieldCheck, Truck, Store, Loader2, Sparkles, ArrowRight,
  CheckCircle2, MapPin, Plus, BellRing, PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { placeDemoOrder, joinGlobalWaitlist } from "@/lib/global-beta.functions";
import { buildOrderAttribution } from "@/lib/marketing-tracking";
import { AddressForm } from "@/components/site/AddressForm";
import { SavedAddressRail } from "@/components/site/SavedAddressRail";
import type { Address } from "@/lib/use-addresses";

type CartLine = { slug: string; qty: number; product: { name: string; image: string } };

type Props = {
  user: { email?: string | null } | null;
  addresses: Address[];
  addrLoading: boolean;
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string) => void;
  createAddress: (input: any) => Promise<Address>;
  updateAddress: (id: string, input: any) => Promise<unknown>;
  removeAddress: (id: string) => Promise<unknown>;
  setDefaultShipping: (id: string) => Promise<unknown>;
  detailed: CartLine[];
  fmt: (n: number) => string;
  subtotal: number;
  shipping: number;
  total: number;
  itemsCount: number;
  eta: string;
  onDemoPlaced: (orderId: string) => void;
  clear: () => void;
};

export function GlobalCheckoutBeta(p: Props) {
  const placeDemo = useServerFn(placeDemoOrder);
  const joinWaitlist = useServerFn(joinGlobalWaitlist);

  const [addingAddress, setAddingAddress] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [waitOpen, setWaitOpen] = useState(false);
  const [waitName, setWaitName] = useState("");
  const [waitEmail, setWaitEmail] = useState(p.user?.email ?? "");
  const [waitCountry, setWaitCountry] = useState("");
  const [waitBusy, setWaitBusy] = useState(false);
  const [waitDone, setWaitDone] = useState(false);

  const selected = p.addresses.find((a) => a.id === p.selectedAddressId);
  const canOrder = !!selected && p.detailed.length > 0 && !placing;
  const topProduct = useMemo(() => p.detailed[0]?.slug ?? null, [p.detailed]);

  async function handleDemoOrder() {
    if (!selected) {
      toast.error("Please select or add a shipping address.");
      return;
    }
    setPlacing(true);
    try {
      const res = await placeDemo({
        data: {
          items: p.detailed.map((i) => ({ slug: i.slug, qty: i.qty })),
          addressId: selected.id,
          attribution: buildOrderAttribution(),
        },
      });
      p.clear();
      p.onDemoPlaced(res.orderId);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not place your demo order.");
    } finally {
      setPlacing(false);
    }
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!waitName.trim() || !waitEmail.trim()) return;
    setWaitBusy(true);
    try {
      await joinWaitlist({
        data: {
          name: waitName.trim(),
          email: waitEmail.trim(),
          country: waitCountry.trim() || (selected?.country ?? null),
          productSlug: topProduct,
        },
      });
      setWaitDone(true);
      toast.success("You're on the list — we'll notify you at launch.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save your details.");
    } finally {
      setWaitBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 lg:gap-12 min-w-0">
      {/* Left: address + beta panel */}
      <div className="lg:col-span-2 space-y-5 sm:space-y-6 min-w-0">
        {/* Hero beta banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden glass border border-sky-400/20 rounded-3xl p-6 sm:p-8"
          style={{ boxShadow: "0 30px 80px -40px color-mix(in oklab, #5b9dff 60%, transparent)" }}
        >
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="size-10 grid place-items-center rounded-2xl bg-sky-400/12 border border-sky-400/25 text-sky-300">
                <Globe className="size-5" />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-sky-300 font-bold">
                <Sparkles className="size-3" /> Global Beta
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-semibold mb-2 tracking-tight">Global Checkout Beta</h2>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              FoundOurMarket Global Payments are currently in beta. You can place a demo order while
              we complete international payment integrations.
            </p>

            <div className="mt-5 grid sm:grid-cols-3 gap-2.5">
              <Assurance icon={<ShieldCheck className="size-4" />} label="Secure Checkout" />
              <Assurance icon={<Truck className="size-4" />} label="International Shipping Support" />
              <Assurance icon={<Store className="size-4" />} label="Global Marketplace Access" />
            </div>
          </div>
        </motion.div>

        {/* Shipping address */}
        <section className="glass border border-white/10 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm uppercase tracking-widest font-medium inline-flex items-center gap-2">
              <MapPin className="size-4 text-accent" /> Shipping address
            </h2>
            {!addingAddress && !editingId && (
              <button type="button" onClick={() => setAddingAddress(true)}
                className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent inline-flex items-center gap-1.5 transition-colors active:scale-95">
                <Plus className="size-3" /> New
              </button>
            )}
          </div>

          {p.addrLoading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
              <div className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
            </div>
          ) : addingAddress || p.addresses.length === 0 ? (
            <AddressForm
              onSubmit={async (input) => {
                const created = await p.createAddress({ ...input, is_default_shipping: p.addresses.length === 0 ? true : input.is_default_shipping });
                p.setSelectedAddressId(created.id);
                setAddingAddress(false);
                toast.success("Address saved");
              }}
              onCancel={p.addresses.length > 0 ? () => setAddingAddress(false) : undefined}
              submitLabel="Save & use this address"
            />
          ) : editingId ? (
            <AddressForm
              initial={p.addresses.find((a) => a.id === editingId)}
              onSubmit={async (input) => { await p.updateAddress(editingId, input); setEditingId(null); }}
              onCancel={() => setEditingId(null)}
              submitLabel="Save changes"
            />
          ) : (
            <SavedAddressRail
              addresses={p.addresses}
              selectedId={p.selectedAddressId}
              onSelect={p.setSelectedAddressId}
              onEdit={(id) => setEditingId(id)}
              onSetDefault={(id) => p.setDefaultShipping(id).catch(() => {})}
              onDelete={(id) => p.removeAddress(id).catch(() => {})}
              onAddNew={() => setAddingAddress(true)}
              eta={p.eta}
            />
          )}
        </section>

        {/* Trust strip */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <Trust icon={<ShieldCheck className="size-4" />} title="Encrypted" sub="256-bit SSL" />
          <Trust icon={<Globe className="size-4" />} title="Worldwide" sub="Ships globally" />
          <Trust icon={<PackageCheck className="size-4" />} title="Tracked" sub="Every order" />
        </section>
      </div>

      {/* Right: summary + actions */}
      <aside className="min-w-0">
        <div className="glass border border-white/10 rounded-2xl p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-medium">Summary</h2>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{p.itemsCount} item{p.itemsCount !== 1 ? "s" : ""}</span>
          </div>

          <ul className="space-y-3 mb-5 max-h-56 overflow-y-auto pr-1">
            {p.detailed.map((i) => (
              <li key={i.slug} className="flex items-center gap-3 text-sm">
                <img src={i.product.image} alt="" loading="lazy" className="size-12 rounded-lg object-cover bg-black/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{i.product.name}</p>
                  <p className="text-xs text-muted-foreground">× {i.qty}</p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="space-y-2.5 text-sm border-t border-white/10 pt-4">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-mono">{p.fmt(p.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="font-mono">{p.shipping === 0 ? <span className="text-emerald-400">Free</span> : p.fmt(p.shipping)}</dd></div>
            <div className="border-t border-white/10 pt-3 flex justify-between items-end">
              <dt className="font-medium text-base">Total</dt>
              <dd className="font-mono text-2xl font-semibold text-accent leading-none">{p.fmt(p.total)}</dd>
            </div>
          </dl>

          <button type="button" onClick={handleDemoOrder} disabled={!canOrder}
            className="w-full mt-5 min-h-[56px] inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold rounded-full text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {placing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-3.5" />}
            <span>{placing ? "Placing demo order…" : "Place Demo Order"}</span>
            {!placing && canOrder && <ArrowRight className="size-3.5" />}
          </button>

          <button type="button" onClick={() => setWaitOpen((v) => !v)}
            className="w-full mt-2.5 min-h-[52px] inline-flex items-center justify-center gap-2 glass border border-sky-400/25 text-sky-300 font-bold rounded-full text-xs uppercase tracking-widest hover:border-sky-400/50 transition-all">
            <BellRing className="size-3.5" />
            Notify Me When Global Payments Launch
          </button>

          {!selected && !p.addrLoading && (
            <p className="text-[11px] text-amber-400/90 text-center mt-3">Add a shipping address to place your demo order.</p>
          )}

          {waitOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="mt-4 overflow-hidden">
              {waitDone ? (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 text-center">
                  <CheckCircle2 className="size-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-medium">You're on the waitlist</p>
                  <p className="text-xs text-muted-foreground mt-1">We'll email you the moment global payments go live.</p>
                </div>
              ) : (
                <form onSubmit={handleWaitlist} className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <input required value={waitName} onChange={(e) => setWaitName(e.target.value)} placeholder="Full name"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400/40" />
                  <input required type="email" value={waitEmail} onChange={(e) => setWaitEmail(e.target.value)} placeholder="Email"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400/40" />
                  <input value={waitCountry} onChange={(e) => setWaitCountry(e.target.value)} placeholder="Country (optional)"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400/40" />
                  <button type="submit" disabled={waitBusy}
                    className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-sky-500 text-white font-bold rounded-full text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60">
                    {waitBusy ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-3.5" />}
                    Notify me at launch
                  </button>
                </form>
              )}
            </motion.div>
          )}

          <p className="flex text-[10px] text-muted-foreground text-center mt-3 font-mono uppercase tracking-widest items-center justify-center gap-1.5 w-full">
            <ShieldCheck className="size-3" /> Demo order · No payment charged
          </p>
        </div>
      </aside>
    </div>
  );
}

function Assurance({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-sky-400/15 bg-sky-400/[0.05] px-3 py-2.5">
      <span className="text-sky-300 shrink-0">{icon}</span>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </div>
  );
}

function Trust({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="glass border border-white/10 rounded-xl p-3 flex items-center gap-2.5">
      <span className="size-8 grid place-items-center rounded-lg bg-accent/10 text-accent shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-tight truncate">{title}</p>
        <p className="text-[10px] text-muted-foreground truncate">{sub}</p>
      </div>
    </div>
  );
}
