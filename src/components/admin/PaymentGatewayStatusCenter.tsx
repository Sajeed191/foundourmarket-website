import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, ShieldCheck, ShieldAlert, AlertTriangle, Loader2, Globe,
  ToggleLeft, ToggleRight, FlaskConical, Rocket, KeyRound, Webhook, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  usePaymentGateways, gatewayWarnings, isGatewayLive,
  type PaymentGateway, type PaymentMode,
} from "@/lib/use-payment-gateways";

const PROVIDER_ICON: Record<string, typeof CreditCard> = {
  stripe: CreditCard,
  paypal: Globe,
};

async function logActivity(action: string, provider: string, metadata: Record<string, unknown>) {
  try {
    await supabase.rpc("log_admin_activity", {
      _action: action,
      _entity_type: "payment_gateway",
      _entity_id: provider,
      _metadata: metadata as any,
    });
  } catch {
    /* non-blocking */
  }
}

function GatewayCard({ g }: { g: PaymentGateway }) {
  const [busy, setBusy] = useState(false);
  const Icon = PROVIDER_ICON[g.provider] ?? CreditCard;
  const live = isGatewayLive(g);
  const warnings = gatewayWarnings(g);

  const patch = async (changes: Partial<PaymentGateway>, action: string) => {
    setBusy(true);
    const { error } = await supabase
      .from("payment_gateways")
      .update({ ...changes, last_checked_at: new Date().toISOString() })
      .eq("provider", g.provider);
    if (error) {
      toast.error(error.message || "Couldn't update gateway");
    } else {
      toast.success(`${g.display_name} updated`);
      logActivity(action, g.provider, changes as Record<string, unknown>);
    }
    setBusy(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`size-10 grid place-items-center rounded-xl ${live ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.04] text-muted-foreground"}`}>
            <Icon className="size-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">{g.display_name}</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {g.supports_region} payments
            </p>
          </div>
        </div>
        {live ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-emerald-400">
            <ShieldCheck className="size-3" /> Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-amber-400">
            <ShieldAlert className="size-3" /> Not connected
          </span>
        )}
      </div>

      {/* config checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <ConfigPill ok={g.publishable_key_present} icon={KeyRound} label="Client key" />
        <ConfigPill ok={g.secret_key_present} icon={KeyRound} label="Secret key" />
        <ConfigPill ok={g.webhook_configured} icon={Webhook} label="Webhook" />
      </div>

      {/* missing configuration alerts */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400 inline-flex items-center gap-1.5">
            <AlertTriangle className="size-3" /> Missing configuration
          </p>
          <ul className="space-y-1">
            {warnings.map((w) => (
              <li key={w} className="text-xs text-muted-foreground">• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => patch({ enabled: !g.enabled }, g.enabled ? "gateway_disabled" : "gateway_enabled")}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:border-accent/40 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : g.enabled ? <ToggleRight className="size-3.5 text-emerald-400" /> : <ToggleLeft className="size-3.5" />}
          {g.enabled ? "Enabled" : "Disabled"}
        </button>

        <div className="inline-flex rounded-full border border-white/10 overflow-hidden">
          {(["sandbox", "production"] as PaymentMode[]).map((m) => (
            <button
              key={m}
              type="button"
              disabled={busy}
              onClick={() => g.mode !== m && patch({ mode: m }, "gateway_mode_changed")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors disabled:opacity-50 ${g.mode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m === "sandbox" ? <FlaskConical className="size-3" /> : <Rocket className="size-3" />}
              {m === "sandbox" ? "Sandbox" : "Production"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/70">
        Checkout unlocks automatically once this gateway is enabled with valid keys — no code changes required.
      </p>
    </motion.div>
  );
}

function ConfigPill({ ok, icon: Icon, label }: { ok: boolean; icon: typeof KeyRound; label: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] ${ok ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-400" : "border-white/10 bg-white/[0.02] text-muted-foreground"}`}>
      {ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
      <Icon className="size-3 opacity-60" />
      {label}
    </div>
  );
}

/** Admin Payment Gateway Status Center — Stripe & PayPal connection status. */
export function PaymentGatewayStatusCenter() {
  const { gateways, loading, internationalLive } = usePaymentGateways();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm uppercase tracking-widest font-medium inline-flex items-center gap-2">
            <CreditCard className="size-4 text-accent" /> Payment Gateway Status Center
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            International checkout providers — Stripe & PayPal.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest ${internationalLive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-400"}`}>
          {internationalLive ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
          Intl checkout {internationalLive ? "unlocked" : "locked"}
        </span>
      </div>

      {loading ? (
        <div className="h-40 grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {gateways.map((g) => (
            <GatewayCard key={g.provider} g={g} />
          ))}
        </div>
      )}
    </section>
  );
}
