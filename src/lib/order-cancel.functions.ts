/**
 * Customer-facing order cancellation.
 *
 * Enforcement is layered: this server fn re-checks the window/status for a
 * clean message, and the SECURITY DEFINER `customer_cancel_order` DB function
 * is the authoritative guard (verifies ownership, pending/confirmed status and
 * the 1-hour window, releases stock, logs the action). Never trust the client.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CANNOT_CANCEL =
  "This order can no longer be cancelled because processing has started.";

export const cancelMyOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, status, cancel_window_expires_at, created_at")
      .eq("id", data.orderId)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!order || order.user_id !== userId) throw new Error("Order not found.");

    const status = (order.status ?? "").toLowerCase();
    const expires = order.cancel_window_expires_at
      ? new Date(order.cancel_window_expires_at).getTime()
      : new Date(order.created_at).getTime() + 3_600_000;
    if (!["pending", "confirmed"].includes(status) || Date.now() >= expires) {
      throw new Error(CANNOT_CANCEL);
    }

    const { error } = await supabaseAdmin.rpc("customer_cancel_order", {
      _order_id: data.orderId,
      _user_id: userId,
    });
    if (error) {
      // Surface the friendly window message for the trigger's check_violation.
      if (/cancelled|processing|window/i.test(error.message)) throw new Error(CANNOT_CANCEL);
      throw new Error(error.message);
    }
    return { ok: true };
  });
