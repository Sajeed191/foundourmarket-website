/**
 * Staff-gated server functions for the Revenue Automation execution layer.
 * Each call re-verifies staff role server-side, invokes a service_role-only
 * svc_* RPC via the admin client, and writes a security audit entry.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireStaff, logSecurity, adminRpc, type StaffRole } from "./admin-guard.server";

const MKT: StaffRole[] = ["admin", "super_admin", "manager", "editor"];

const SEGMENTS = [
  "vip", "high_value", "high_ltv", "high_spend", "frequent", "frequent_buyers",
  "dormant", "dormant_buyers", "winback", "new", "new_customers", "refund_risk",
  "abandoned_cart", "abandoned", "wishlist", "wishlist_heavy", "coupon_hunters",
] as const;

/** Execute a real action against a live customer segment. */
export const activateSegmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      segment: z.enum(SEGMENTS),
      action: z.enum(["notify", "coupon", "campaign", "export"]),
      label: z.string().max(120).optional().nullable(),
      message: z.string().max(500).optional().nullable(),
      kind: z.enum(["percent", "fixed"]).optional(),
      value: z.number().min(0).max(100000).optional(),
      link: z.string().max(200).optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data: i, context }) => {
    const { userId } = context as { userId: string };
    const { primaryRole } = await requireStaff(userId, MKT, "revenue.activate_segment", i.segment);
    const { data, error } = await adminRpc("svc_activate_segment", {
      _actor: userId,
      p_segment: i.segment,
      p_action: i.action,
      p_label: i.label ?? null,
      p_message: i.message ?? null,
      p_kind: i.kind ?? "percent",
      p_value: i.value ?? 10,
      p_link: i.link ?? null,
    });
    await logSecurity({
      actorId: userId, actorRole: primaryRole, action: "revenue.activate_segment",
      target: `${i.segment}:${i.action}`, success: !error,
      detail: error ? { error: error.message } : { result: data },
    });
    if (error) throw new Error(error.message);
    return data;
  });

/** Live revenue attribution KPIs. */
export const getRevenueAttributionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await requireStaff(userId, MKT, "revenue.attribution", "marketing");
    const { data, error } = await adminRpc("svc_revenue_attribution", { _actor: userId });
    if (error) throw new Error(error.message);
    return data;
  });
