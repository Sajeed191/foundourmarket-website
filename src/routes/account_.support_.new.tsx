import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Plus, Send, MessageSquare, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRegion } from "@/lib/region";
import { notifySupportEvent } from "@/lib/support.functions";
import { SUPPORT_CATEGORIES, type SupportCategoryId, type SupportContextSnapshot } from "@/lib/support-context";
import { AttachmentPicker, uploadAttachments, ContextCard } from "@/routes/account_.support";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SearchParams = {
  order?: string;
  return?: string;
  refund?: string;
  category?: string;
  subject?: string;
};

export const Route = createFileRoute("/account_/support_/new")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
    return {
      order: str(search.order),
      return: str(search.return),
      refund: str(search.refund),
      category: str(search.category),
      subject: str(search.subject),
    };
  },
  head: () => ({
    meta: [
      { title: "New Ticket — FoundOurMarket™ Support" },
      { name: "description", content: "Open a new support ticket and our team will reply in real time." },
    ],
  }),
  component: NewTicketPage,
});

const CATEGORIES = SUPPORT_CATEGORIES;

function fireSupportEmail(ticketId: string) {
  void notifySupportEvent({ data: { ticketId, event: "created" } }).catch(() => {});
}

type OpenTicket = { id: string; subject: string; status: string; ticket_number: string };

function NewTicketPage() {
  const { user, loading } = useAuth();
  const { market } = useRegion();
  const nav = useNavigate();
  const search = useSearch({ from: Route.id });

  const prefill = useMemo(
    () => ({
      order: search.order,
      return: search.return,
      refund: search.refund,
      category: (search.category as SupportCategoryId) || undefined,
      subject: search.subject,
    }),
    [search.order, search.return, search.refund, search.category, search.subject],
  );

  const [subject, setSubject] = useState(prefill.subject ?? "");
  const [category, setCategory] = useState<string>(prefill.category ?? "other");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [ctx, setCtx] = useState<SupportContextSnapshot | null>(null);
  const [existing, setExisting] = useState<OpenTicket[] | null>(null);
  const [forceNew, setForceNew] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  // Build a context snapshot + duplicate check from the linked order/return/refund.
  useEffect(() => {
    let active = true;
    (async () => {
      const snap: SupportContextSnapshot = {};
      if (prefill.order) {
        const [{ data: order }, { data: items }, { data: ship }, { data: ret }] = await Promise.all([
          supabase.from("orders").select("id,status,total,currency,tracking_number,carrier").eq("id", prefill.order).maybeSingle(),
          supabase.from("order_items").select("name,image").eq("order_id", prefill.order).limit(1),
          supabase.from("shipments").select("status").eq("order_id", prefill.order).order("created_at", { ascending: false }).limit(1),
          supabase.from("returns").select("status,refund_status").eq("order_id", prefill.order).order("created_at", { ascending: false }).limit(1),
        ]);
        if (order) {
          snap.order_number = order.id.slice(0, 8).toUpperCase();
          snap.order_status = order.status;
          snap.total = order.total;
          snap.currency = order.currency;
          snap.tracking_number = order.tracking_number ?? undefined;
          snap.carrier = order.carrier ?? undefined;
        }
        const item = (items ?? [])[0];
        if (item) { snap.product_name = item.name; snap.product_image = item.image ?? undefined; }
        const s = (ship ?? [])[0];
        if (s) snap.delivery_status = s.status;
        const r = (ret ?? [])[0];
        if (r) { snap.return_status = r.status; snap.refund_status = r.refund_status ?? undefined; }

        const { data: open } = await supabase
          .from("support_tickets")
          .select("id,subject,status,ticket_number")
          .eq("order_id", prefill.order)
          .in("status", ["open", "pending"])
          .order("last_message_at", { ascending: false });
        if (active) setExisting((open as OpenTicket[]) ?? []);
      } else {
        if (active) setExisting([]);
      }
      if (active) setCtx(Object.keys(snap).length ? snap : null);
    })();
    return () => { active = false; };
  }, [prefill.order]);

  async function submit() {
    if (!user) return;
    if (!subject.trim()) { toast.error("Add a subject"); return; }
    if (!body.trim()) { toast.error("Describe your issue"); return; }
    setSaving(true);
    const { data: t, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        category,
        market_region: market,
        order_id: prefill.order ?? null,
        return_id: prefill.return ?? null,
        refund_id: prefill.refund ?? null,
        context: (ctx ?? {}) as unknown as never,
      })
      .select("id")
      .single();
    if (error || !t) { setSaving(false); toast.error(error?.message ?? "Failed to create ticket"); return; }
    const urls = await uploadAttachments(user.id, t.id, files);
    const { error: mErr } = await supabase.from("support_messages").insert({
      ticket_id: t.id, sender_id: user.id, sender_role: "customer", body: body.trim(), attachments: urls,
    });
    setSaving(false);
    if (mErr) { toast.error(mErr.message); return; }
    toast.success("Ticket created", { description: "We'll reply shortly." });
    fireSupportEmail(t.id);
    nav({ to: "/account/support/ticket/$ticketId", params: { ticketId: t.id }, replace: true });
  }

  if (loading || !user) {
    return <div className="min-h-[100dvh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;
  }

  const showDuplicateGate = existing && existing.length > 0 && !forceNew;

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[55vh] opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 shrink-0 backdrop-blur-xl bg-background/70 border-b border-white/[0.06]" style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}>
        <div className="container-page h-14 flex items-center gap-3">
          <Link to="/account/support" search={{}} className="size-9 -ml-2 grid place-items-center rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground" aria-label="Back to support">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-display font-semibold leading-tight truncate">New ticket</h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">Support</p>
          </div>
        </div>
      </header>

      {/* Scrollable form body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="container-page max-w-2xl py-6 space-y-4"
          style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}
        >
          {ctx && <ContextCard ctx={ctx} />}

          {showDuplicateGate ? (
            <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-4 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-accent">
                <AlertCircle className="size-4" /> You already have an active conversation for this order.
              </p>
              <p className="text-xs text-muted-foreground">
                Continuing keeps everything in one thread so our team has full context.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => nav({ to: "/account/support/ticket/$ticketId", params: { ticketId: existing![0].id }, replace: true })}
                  className="w-full bg-accent text-accent-foreground rounded-full px-5 py-2.5 text-xs uppercase tracking-widest font-bold hover:brightness-110 transition inline-flex items-center justify-center gap-2"
                >
                  <MessageSquare className="size-4" /> Continue existing ticket
                </button>
                <button
                  onClick={() => setForceNew(true)}
                  className="w-full bg-white/[0.04] ring-1 ring-white/10 text-foreground rounded-full px-5 py-2.5 text-xs uppercase tracking-widest font-semibold hover:ring-accent/40 transition inline-flex items-center justify-center gap-2"
                >
                  <Plus className="size-4" /> Create new ticket
                </button>
              </div>
            </div>
          ) : (
            <>
              <Field label="Subject">
                <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} placeholder="Brief summary of your issue"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent/60 transition" />
              </Field>
              <Field label="Category">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.id} onClick={() => setCategory(c.id)} type="button"
                      className={cn("rounded-full px-3 py-1.5 text-xs ring-1 transition", category === c.id ? "bg-accent/15 text-accent ring-accent/40" : "bg-white/[0.03] text-muted-foreground ring-white/10 hover:ring-accent/30")}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Message">
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} maxLength={4000} placeholder="Tell us what's going on…"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent/60 resize-none transition" />
              </Field>
              <Field label="Attachments">
                <AttachmentPicker files={files} setFiles={setFiles} />
              </Field>
            </>
          )}
        </motion.div>
      </div>

      {/* Sticky footer — always-visible submit */}
      {!showDuplicateGate && (
        <div
          className="shrink-0 border-t border-white/[0.06] backdrop-blur-xl bg-background/80"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="container-page max-w-2xl py-3">
            <button onClick={submit} disabled={saving}
              className="w-full bg-accent text-accent-foreground rounded-full px-6 py-3 text-xs uppercase tracking-widest font-bold disabled:opacity-50 hover:brightness-110 transition-all flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="size-4 animate-spin" /> Creating…</> : <><Send className="size-4" /> Submit ticket</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
