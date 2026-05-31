/**
 * Service-role customer notification for shipment status transitions.
 *
 * Problem: the `notifications` table RLS only lets admins insert, so when a
 * warehouse / fulfillment / operations / logistics staffer updates a shipment,
 * the customer notification silently fails. We do NOT loosen RLS and we do NOT
 * grant client insert. Instead this server function:
 *   1. runs the insert with the service-role client (bypasses RLS),
 *   2. re-verifies the actor holds an approved staff role,
 *   3. inserts the notification,
 *   4. writes a security audit entry,
 *   5. returns success/failure (never throws on notify failure).
 *
 * The shipment update + shipment_event creation stay client-side and must
 * succeed independently of notification delivery.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRoles, logSecurity, type StaffRole } from "./admin-guard.server";

/** Staff roles permitted to trigger customer shipment notifications. */
const NOTIFY_STAFF: StaffRole[] = [
  "super_admin",
  "admin",
  "manager",
  "support",
  "fulfillment",
  "warehouse_staff",
];

const SHIP_STATUSES = [
  "pending",
  "packed",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed_delivery",
  "returned",
  "cancelled",
] as const;

const STATUS_NOTIFICATION: Record<
  string,
  { title: string; body: string; priority: "high" | "normal" }
> = {
  packed: { title: "📦 Order packed", body: "Your order has been packed.", priority: "normal" },
  shipped: { title: "🚚 Order shipped", body: "Your order has been shipped.", priority: "normal" },
  in_transit: { title: "🚚 In transit", body: "Your order is in transit.", priority: "normal" },
  out_for_delivery: { title: "📍 Out for delivery", body: "Your package is out for delivery.", priority: "high" },
  delivered: { title: "✅ Delivered", body: "Your package has been delivered.", priority: "high" },
  failed_delivery: { title: "⚠️ Delivery failed", body: "Delivery attempt failed. We'll retry shortly.", priority: "high" },
  returned: { title: "↩️ Order returned", body: "Your order has been returned.", priority: "normal" },
  cancelled: { title: "❌ Shipment cancelled", body: "Your shipment has been cancelled.", priority: "normal" },
};

export const createShipmentNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        targetUserId: z.string().uuid(),
        orderId: z.string().uuid(),
        status: z.enum(SHIP_STATUSES),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const action = "shipment.notify";
    const target = data.orderId;

    // 1. Re-verify actor is an approved staff role.
    let roles: string[];
    try {
      roles = await getRoles(userId);
    } catch {
      return { ok: false as const, reason: "role_check_failed" };
    }
    const matched = roles.filter((r) => (NOTIFY_STAFF as string[]).includes(r));
    if (matched.length === 0) {
      await logSecurity({
        actorId: userId,
        actorRole: roles[0] ?? null,
        action,
        target,
        success: false,
        detail: { reason: "forbidden", attemptedRoles: roles, status: data.status },
      });
      return { ok: false as const, reason: "forbidden" };
    }

    const copy = STATUS_NOTIFICATION[data.status];
    // pending has no customer-facing copy — nothing to send, still a success.
    if (!copy) {
      return { ok: true as const, skipped: true };
    }

    // 2. Insert notification with service role (bypasses RLS, no client grant).
    const { error: insErr } = await supabaseAdmin.from("notifications").insert({
      user_id: data.targetUserId,
      type: "shipment",
      title: copy.title,
      body: copy.body,
      link: "/track",
      priority: copy.priority,
      data: { order_id: data.orderId, status: data.status },
    });

    // 3. Audit log (always written, success or failure).
    await logSecurity({
      actorId: userId,
      actorRole: matched[0]!,
      action,
      target,
      success: !insErr,
      detail: {
        status: data.status,
        targetUserId: data.targetUserId,
        ...(insErr ? { error: insErr.message } : {}),
      },
    });

    if (insErr) {
      console.error("[shipment.notify] insert failed", insErr.message);
      return { ok: false as const, reason: "insert_failed" };
    }
    return { ok: true as const };
  });
