/**
 * Executive Business Intelligence Center — staff-gated server functions.
 *
 * Only `super_admin`, `admin` and `manager` may read executive analytics.
 * All metrics are aggregated server-side by the `svc_executive_analytics`
 * SECURITY DEFINER RPC over real tables (orders, order_items, payments,
 * products, profiles, shipments, refunds, returns, support_tickets,
 * marketing_campaigns, fraud_alerts). Every read and export is written to
 * the security audit log. No mock data, no hard-coded metrics.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireStaff, adminRpc, logSecurity, type StaffRole } from "./admin-guard.server";

const BI_STAFF: StaffRole[] = ["super_admin", "admin", "manager"];

export type ExecutiveAnalytics = {
  kpis: {
    rev_today: number; rev_week: number; rev_month: number; rev_year: number; rev_all: number;
    ord_today: number; ord_week: number; ord_month: number; ord_all: number;
    active_customers: number;
  };
  profit: {
    gross_profit: number; total_cost: number; net_profit: number; aov: number;
    refund_value: number; refund_rate: number; return_rate: number; repeat_rate: number;
    new_customers: number; repeat_customers: number;
  };
  revenue_by_country: { k: string; v: number; n: number }[];
  revenue_by_method: { k: string; v: number; n: number }[];
  revenue_by_category: { k: string; v: number; units: number }[];
  revenue_by_brand: { k: string; v: number }[];
  revenue_by_courier: { k: string; n: number; delivered: number; returned: number }[];
  top_products: { slug: string; name: string; units: number; revenue: number }[];
  worst_products: { slug: string; name: string; sold: number; views: number }[];
  most_viewed: { slug: string; name: string; views: number; sold: number }[];
  most_wishlisted: { slug: string; name: string; wishlist: number }[];
  top_customers: { user_id: string; full_name: string | null; spend: number; orders: number }[];
  inventory: { low_stock: number; out_of_stock: number; dead_stock: number; total_products: number };
  order_analytics: {
    successful: number; failed: number; cancelled: number; cod: number; prepaid: number;
    delivered: number; returned: number; refunded: number;
  };
  payment_analytics: { total: number; succeeded: number; failed: number; pending: number };
  shipping_analytics: { total: number; delivered: number; returned: number; avg_delivery_days: number | null };
  support_analytics: {
    open: number; pending: number; resolved: number; escalated: number; avg_resolution_hours: number | null;
  };
  marketing_analytics: { spend: number; campaigns: number; active_campaigns: number };
  fraud_analytics: { total: number; open_alerts: number };
  daily: { date: string; revenue: number; orders: number }[];
  generated_at: string;
};

/** Full executive dashboard payload (KPIs + all analytics groups). */
export const getExecutiveAnalyticsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    const { primaryRole } = await requireStaff(userId, BI_STAFF, "analytics.executive.view");

    const { data, error } = await adminRpc("svc_executive_analytics", { _actor: userId });
    if (error) {
      console.error("[svc_executive_analytics] rpc error", error.message);
      throw new Error(error.message);
    }

    await logSecurity({
      actorId: userId,
      actorRole: primaryRole,
      action: "analytics.executive.view",
      success: true,
    });

    return data as ExecutiveAnalytics;
  });

/** Record an export action in the security audit log (called before client download). */
export const logAnalyticsExportFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      format: z.enum(["csv", "excel", "pdf"]),
      report: z.string().min(2).max(60),
    }).parse(input),
  )
  .handler(async ({ data: input, context }) => {
    const { userId } = context as { userId: string };
    const { primaryRole } = await requireStaff(userId, BI_STAFF, "analytics.executive.export");

    await logSecurity({
      actorId: userId,
      actorRole: primaryRole,
      action: "analytics.executive.export",
      success: true,
      detail: { format: input.format, report: input.report },
    });

    return { ok: true };
  });
