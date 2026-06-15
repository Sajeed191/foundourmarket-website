import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const STAFF_ROLES = ["staff", "admin", "super_admin", "manager", "support"];

/**
 * Lightweight, realtime-only watcher (no UI of its own). When staff reply to
 * one of the signed-in customer's tickets, surface a premium toast with a
 * direct deep-link into the exact conversation. Unread counts themselves are
 * driven by the existing `useSupportUnread` hook (notification bell + account
 * nav badge), so this component only adds the optional in-session toast.
 *
 * Backend, ticket system and notification infrastructure are untouched — this
 * is a pure presentation layer over the existing support_messages realtime
 * stream.
 */
export function SupportReplyWatcher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    seen.current = new Set();

    const ch = supabase
      .channel(`support-reply-toast:${user.id}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        async (payload) => {
          const row = payload.new as {
            id: string;
            ticket_id: string;
            sender_role: string;
            body: string | null;
          };
          if (!row?.id || seen.current.has(row.id)) return;
          if (!STAFF_ROLES.includes(row.sender_role)) return;

          // Confirm the ticket belongs to this customer (RLS already scopes
          // visibility, but this avoids reacting to seeded/foreign rows).
          const { data: ticket } = await supabase
            .from("support_tickets")
            .select("id")
            .eq("id", row.ticket_id)
            .eq("user_id", user.id)
            .maybeSingle();
          if (!ticket) return;

          seen.current.add(row.id);
          const preview = (row.body ?? "").replace(/\s+/g, " ").trim().slice(0, 100);

          toast("FoundOurMarket Support replied to your ticket", {
            description: preview || "You have a new reply.",
            duration: 7000,
            action: {
              label: "View Reply",
              onClick: () =>
                navigate({
                  to: "/account_/support",
                  search: { ticket: row.ticket_id } as never,
                }),
            },
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user, navigate]);

  return null;
}
