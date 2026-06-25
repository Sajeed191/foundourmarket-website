import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Checkout conversion analytics for the admin dashboard (Phase 2).
 *
 * Reads the funnel + address signals already written to `analytics_events`
 * by the storefront (no schema changes), and derives the abandonment and
 * conversion metrics the admin dashboard needs:
 *   - most abandoned address fields
 *   - most common validation errors
 *   - serviceability failures by pincode
 *   - address completion rate
 *   - checkout completion rate
 *
 * RLS already restricts SELECT on analytics_events to admins/managers, so a
 * direct client read is safe here.
 */

type Row = {
  event: string;
  value: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type CheckoutAnalytics = {
  windowDays: number;
  // Funnel counts (unique-ish step volumes)
  funnel: {
    started: number;
    addressCompleted: number;
    deliveryVerified: number;
    orderCreated: number;
    paymentOpened: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  rates: {
    addressCompletionRate: number; // addressCompleted / started
    checkoutCompletionRate: number; // completed / started
    addressToPayment: number; // paymentOpened / addressCompleted
  };
  abandonedFields: { key: string; count: number }[];
  validationErrors: { key: string; count: number }[];
  serviceabilityByPincode: { key: string; count: number }[];
  // Weekly buckets for the conversion report (most recent first)
  weekly: {
    weekStart: string;
    started: number;
    addressCompleted: number;
    completed: number;
    addressCompletionRate: number;
    checkoutCompletionRate: number;
  }[];
};

const COUNT_EVENT = (rows: Row[], names: string[]) =>
  rows.filter((r) => names.includes(r.event)).length;

function topGroup(
  rows: Row[],
  event: string,
  metaKey: string,
  limit = 12,
): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.event !== event) continue;
    const raw = (r.metadata?.[metaKey] ?? "") as unknown;
    const key = typeof raw === "string" && raw.trim() ? raw.trim() : "(unknown)";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function startOfWeek(d: Date): string {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function compute(rows: Row[], windowDays: number): CheckoutAnalytics {
  const started = COUNT_EVENT(rows, ["checkout_started", "funnel_proceed_to_checkout"]);
  const addressCompleted = COUNT_EVENT(rows, ["address_selected", "funnel_address_submitted"]);
  const deliveryVerified = COUNT_EVENT(rows, ["delivery_verified"]);
  const orderCreated = COUNT_EVENT(rows, ["funnel_order_created"]);
  const paymentOpened = COUNT_EVENT(rows, ["funnel_payment_initialized"]);
  const completed = COUNT_EVENT(rows, ["purchase", "funnel_payment_success", "funnel_cod_order_placed"]);
  const failed = COUNT_EVENT(rows, ["payment_failed", "funnel_payment_failed", "funnel_payment_init_failed"]);
  const cancelled = COUNT_EVENT(rows, ["funnel_payment_cancelled"]);

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

  // Weekly buckets
  const weeks = new Map<string, { started: number; addr: number; done: number }>();
  for (const r of rows) {
    const wk = startOfWeek(new Date(r.created_at));
    const b = weeks.get(wk) ?? { started: 0, addr: 0, done: 0 };
    if (["checkout_started", "funnel_proceed_to_checkout"].includes(r.event)) b.started++;
    if (["address_selected", "funnel_address_submitted"].includes(r.event)) b.addr++;
    if (["purchase", "funnel_payment_success", "funnel_cod_order_placed"].includes(r.event)) b.done++;
    weeks.set(wk, b);
  }
  const weekly = [...weeks.entries()]
    .map(([weekStart, b]) => ({
      weekStart,
      started: b.started,
      addressCompleted: b.addr,
      completed: b.done,
      addressCompletionRate: pct(b.addr, b.started),
      checkoutCompletionRate: pct(b.done, b.started),
    }))
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));

  return {
    windowDays,
    funnel: {
      started,
      addressCompleted,
      deliveryVerified,
      orderCreated,
      paymentOpened,
      completed,
      failed,
      cancelled,
    },
    rates: {
      addressCompletionRate: pct(addressCompleted, started),
      checkoutCompletionRate: pct(completed, started),
      addressToPayment: pct(paymentOpened, addressCompleted),
    },
    abandonedFields: topGroup(rows, "address_field_abandoned", "field"),
    validationErrors: topGroup(rows, "address_field_abandoned", "reason"),
    serviceabilityByPincode: topGroup(rows, "serviceability_failed", "postal"),
    weekly,
  };
}

const RELEVANT_EVENTS = [
  "checkout_started",
  "funnel_proceed_to_checkout",
  "address_selected",
  "funnel_address_submitted",
  "delivery_verified",
  "funnel_order_created",
  "funnel_payment_initialized",
  "purchase",
  "funnel_payment_success",
  "funnel_cod_order_placed",
  "payment_failed",
  "funnel_payment_failed",
  "funnel_payment_init_failed",
  "funnel_payment_cancelled",
  "address_field_abandoned",
  "serviceability_failed",
];

export function useCheckoutAnalytics(windowDays = 7) {
  const [data, setData] = useState<CheckoutAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - windowDays * 86400000).toISOString();
      const { data: rows, error: err } = await supabase
        .from("analytics_events")
        .select("event,value,metadata,created_at")
        .in("event", RELEVANT_EVENTS)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50000);
      if (err) throw err;
      setData(compute((rows ?? []) as Row[], windowDays));
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(() => ({ data, loading, error, refresh: load }), [data, loading, error, load]);
}
