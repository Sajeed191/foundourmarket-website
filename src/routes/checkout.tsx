import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useRegion } from "@/lib/region";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — FoundOurMarket™" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user, loading } = useAuth();
  const { detailed, subtotalUSD, clear, count } = useCart();
  const { format, region } = useRegion();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", address: "", city: "", postal: "", country: region === "IN" ? "India" : "" });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (count === 0) nav({ to: "/cart" });
  }, [count, nav]);

  const shipping = subtotalUSD > 50 ? 0 : 9.99;
  const tax = subtotalUSD * 0.08;
  const total = subtotalUSD + shipping + tax;

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "confirmed",
          currency: "USD",
          subtotal: Number(subtotalUSD.toFixed(2)),
          shipping: Number(shipping.toFixed(2)),
          tax: Number(tax.toFixed(2)),
          total: Number(total.toFixed(2)),
          contact_email: user.email,
          shipping_address: form,
        })
        .select()
        .single();
      if (oErr) throw oErr;

      const items = detailed.map((i) => ({
        order_id: order.id,
        product_slug: i.slug,
        name: i.product.name,
        image: i.product.image,
        unit_price: i.product.price,
        quantity: i.qty,
        line_total: Number((i.product.price * i.qty).toFixed(2)),
      }));
      const { error: iErr } = await supabase.from("order_items").insert(items);
      if (iErr) throw iErr;

      clear();
      nav({ to: "/account" });
    } catch (err: any) {
      setError(err?.message ?? "Could not place order");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user || count === 0) {
    return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent mb-3">Checkout</p>
      <h1 className="text-3xl md:text-5xl font-display font-semibold mb-12">Almost yours</h1>

      <form onSubmit={placeOrder} className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-sm uppercase tracking-widest font-medium mb-2">Shipping</h2>
            <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full bg-background border border-border rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
            <input required placeholder="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-background border border-border rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-background border border-border rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
              <input required placeholder="Postal code" value={form.postal} onChange={(e) => setForm({ ...form, postal: e.target.value })} className="bg-background border border-border rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
            </div>
            <input required placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full bg-background border border-border rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-sm uppercase tracking-widest font-medium mb-3">Payment</h2>
            <p className="text-xs text-muted-foreground">
              Payments are coming soon. Your order will be placed as <span className="text-accent">confirmed</span> for preview.
            </p>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <aside>
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-medium mb-6">Summary</h2>
            <ul className="space-y-3 mb-5">
              {detailed.map((i) => (
                <li key={i.slug} className="flex items-center gap-3 text-sm">
                  <img src={i.product.image} alt="" className="size-12 rounded-lg object-cover bg-black/30" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{i.product.name}</p>
                    <p className="text-xs text-muted-foreground">× {i.qty}</p>
                  </div>
                  <span className="font-mono text-xs">{format(i.product.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-mono">{format(subtotalUSD)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="font-mono">{shipping === 0 ? "Free" : format(shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="font-mono">{format(tax)}</dd></div>
              <div className="border-t border-border pt-2 flex justify-between text-base"><dt className="font-medium">Total</dt><dd className="font-mono text-accent">{format(total)}</dd></div>
            </dl>
            <button disabled={busy} className="w-full mt-6 bg-accent text-accent-foreground font-bold py-3 rounded-full text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {busy && <Loader2 className="size-3 animate-spin" />}
              Place Order
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-3 font-mono uppercase tracking-widest inline-flex items-center justify-center gap-1.5 w-full">
              <ShieldCheck className="size-3" /> Secure · Encrypted
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
