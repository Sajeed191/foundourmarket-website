import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LifeBuoy, MessageSquare, ChevronRight, History, ShieldCheck, Flag,
  CheckCircle2, XCircle, UserCheck, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ContactSupportButton } from "@/components/site/ContactSupportButton";
import type { SupportPrefill } from "@/lib/support-context";
import { cn } from "@/lib/utils";

type TicketRow = {
  id: string;
  ticket_number: string | null;
  subject: string;
  category: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  last_message_at: string | null;
  unread_customer_count: number | null;
  created_at: string;
  resolved_at: string | null;
  closed_at: string | null;
};

type EventRow = {
  id: string;
  ticket_id: string;
  event_type: string;
  to_status: string | null;
  created_at: string;
};

type MsgRow = { id: string; ticket_id: string; sender_role: string | null; created_at: string };

type TimelineItem = {
  id: string;
  at: string;
  label: string;
  tone: "accent" | "emerald" | "amber" | "muted" | "destructive";
  icon: typeof MessageSquare;
};

const STATUS_CLS: Record<string, string> = {
  open: "text-accent border-accent/30 bg-accent/10",
  pending: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
  processing: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  escalated: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  resolved: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  closed: "text-muted-foreground border-border bg-muted/30",
};
const PRIORITY_CLS: Record<string, string> = {
  low: "text-muted-foreground border-border bg-muted/20",
  normal: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  high: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  urgent: "text-destructive border-destructive/30 bg-destructive/10",
};
const cap = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const fmt = (s: string) =>
  new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Embedded support surface for an order. Shows linked tickets (Priority 1 & 4
 * — status, assigned agent, last reply, unread, view conversation) plus a
 * realtime support-activity timeline (Priority 2). Falls back to a "Need help
 * with this order?" CTA when no ticket exists yet.
 */
export function OrderSupportSection({
  orderId,
  prefill,
}: {
  orderId: string;
  prefill: SupportPrefill & { context?: Record<string, unknown> };
}) {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [agents, setAgents] = useState<Map<string, string>>(new Map());
  const [events, setEvents] = useState<EventRow[]>([]);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data: tk } = await supabase
      .from("support_tickets")
      .select(
        "id,ticket_number,subject,category,status,priority,assigned_to,last_message_at,unread_customer_count,created_at,resolved_at,closed_at",
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    const rows = (tk as TicketRow[]) ?? [];
    setTickets(rows);

    const ids = rows.map((t) => t.id);
    if (ids.length) {
      const [{ data: ev }, { data: ms }, { data: ag }] = await Promise.all([
        supabase
          .from("support_ticket_events")
          .select("id,ticket_id,event_type,to_status,created_at")
          .in("ticket_id", ids)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("support_messages")
          .select("id,ticket_id,sender_role,created_at")
          .in("ticket_id", ids)
          .order("created_at", { ascending: true })
          .limit(300),
        (async () => {
          const aids = [...new Set(rows.map((t) => t.assigned_to).filter(Boolean) as string[])];
          if (!aids.length) return { data: [] };
          return supabase.from("profiles").select("id,full_name").in("id", aids);
        })(),
      ]);
      setEvents((ev as EventRow[]) ?? []);
      setMessages((ms as MsgRow[]) ?? []);
      setAgents(
        new Map(
          ((ag as { id: string; full_name: string | null }[]) ?? []).map((p) => [p.id, p.full_name ?? "Agent"]),
        ),
      );
    } else {
      setEvents([]);
      setMessages([]);
      setAgents(new Map());
    }
    setLoaded(true);
  }, [orderId]);

  useEffect(() => {
    void load();
    const schedule = () => void load();
    const ch = supabase
      .channel(`order-support:${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets", filter: `order_id=eq.${orderId}` }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_ticket_events" }, schedule)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [orderId, load]);

  // ── Build customer-facing support timeline (Priority 2) ──
  const timeline: TimelineItem[] = [];
  for (const t of tickets) {
    timeline.push({
      id: `c-${t.id}`,
      at: t.created_at,
      label: "Support ticket created",
      tone: "accent",
      icon: LifeBuoy,
    });
  }
  for (const m of messages) {
    const staffReply = !!m.sender_role && m.sender_role !== "customer" && m.sender_role !== "user";
    timeline.push({
      id: `m-${m.id}`,
      at: m.created_at,
      label: staffReply ? "Support agent replied" : "You replied",
      tone: staffReply ? "accent" : "muted",
      icon: MessageSquare,
    });
  }
  for (const e of events) {
    if (e.event_type === "status_change") {
      const to = e.to_status ?? "";
      if (to === "escalated") timeline.push({ id: e.id, at: e.created_at, label: "Ticket escalated", tone: "amber", icon: Flag });
      else if (to === "resolved") timeline.push({ id: e.id, at: e.created_at, label: "Ticket resolved", tone: "emerald", icon: CheckCircle2 });
      else if (to === "closed") timeline.push({ id: e.id, at: e.created_at, label: "Ticket closed", tone: "muted", icon: XCircle });
    } else if (e.event_type === "assignment") {
      timeline.push({ id: e.id, at: e.created_at, label: "Agent assigned", tone: "accent", icon: UserCheck });
    }
  }
  timeline.sort((a, b) => +new Date(b.at) - +new Date(a.at));

  if (!loaded) return null;

  const active = tickets.filter((t) => t.status !== "closed" && t.status !== "resolved");

  return (
    <div className="mt-6 space-y-6">
      <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
          <LifeBuoy className="size-3.5" /> Support
        </h3>

        {tickets.length === 0 ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Need help with this order?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Our team can help with delivery, returns, refunds and more.
              </p>
            </div>
            <ContactSupportButton prefill={prefill} variant="solid" className="shrink-0" />
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const unread = t.unread_customer_count ?? 0;
              const agent = t.assigned_to ? agents.get(t.assigned_to) ?? "Agent" : "Unassigned";
              const lastActivity = t.last_message_at ?? t.created_at;
              return (
                <div key={t.id} className="rounded-xl border border-border/70 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-accent">{t.ticket_number ?? `#${t.id.slice(0, 8)}`}</p>
                      <p className="text-sm font-medium truncate mt-0.5">{t.subject}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-mono uppercase border", STATUS_CLS[t.status] ?? "border-border")}>{cap(t.status)}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-mono uppercase border", PRIORITY_CLS[t.priority] ?? "border-border")}>{cap(t.priority)}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><UserCheck className="size-3" />Assigned</p>
                      <p className="font-medium truncate">{agent}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="size-3" />Last activity</p>
                      <p className="font-medium truncate">{fmt(lastActivity)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                    {unread > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest">
                        {unread} unread {unread === 1 ? "message" : "messages"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">No unread messages</span>
                    )}
                    <Link
                      to="/account/support"
                      search={{ ticket: t.id }}
                      className="inline-flex items-center gap-1 rounded-full border border-accent/30 text-accent px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:bg-accent/10"
                    >
                      <MessageSquare className="size-3" /> View Conversation
                    </Link>
                  </div>
                </div>
              );
            })}
            {active.length === 0 && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-muted-foreground">Still need help with this order?</p>
                <ContactSupportButton prefill={prefill} variant="subtle" label="New Request" className="shrink-0" />
              </div>
            )}
          </div>
        )}
      </section>

      {timeline.length > 0 && (
        <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
            <History className="size-3.5" /> Support Activity
          </h3>
          <ol className="relative border-l border-border/60 pl-4 space-y-3">
            {timeline.map((it) => {
              const Icon = it.icon;
              return (
                <li key={it.id} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[21px] top-0.5 size-3.5 rounded-full grid place-items-center ring-2 ring-background",
                      it.tone === "accent" ? "bg-accent/20 text-accent" :
                      it.tone === "emerald" ? "bg-emerald-400/20 text-emerald-400" :
                      it.tone === "amber" ? "bg-amber-400/20 text-amber-400" :
                      it.tone === "destructive" ? "bg-destructive/20 text-destructive" :
                      "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-2" />
                  </span>
                  <p className="text-xs font-medium">{it.label}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{fmt(it.at)}</p>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
