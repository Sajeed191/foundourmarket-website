import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/components/admin/AdminShell";
import { useExecutiveIntelligence } from "@/lib/use-executive-intelligence";
import { useFinancialMarketing } from "@/lib/use-financial-marketing";
import {
  buildAIRecommendations, buildDailyBriefing, buildWeeklyReport,
  type AIRecommendation,
} from "@/lib/ai-operations";

export type RecStatus = "pending" | "approved" | "rejected" | "snoozed" | "archived" | "executed";

export type RecState = {
  rec_key: string;
  status: RecStatus;
  snooze_until: string | null;
  assigned_to: string | null;
  outcome: string | null;
};

const HIDDEN: RecStatus[] = ["rejected", "archived", "executed"];

/**
 * Realtime AI Commerce Operations hook. Continuously derives prioritized
 * recommendations from live executive + financial intelligence and merges
 * them with persisted lifecycle state (approve / reject / snooze / assign /
 * archive / outcome). Every state change is database-backed and audited.
 */
export function useAIOperations() {
  const { user } = useAuth();
  const { model, today, loading: execLoading, currency } = useExecutiveIntelligence();
  const { model: fm } = useFinancialMarketing(365);

  const allRecs = useMemo(() => buildAIRecommendations(model, fm), [model, fm]);
  const [states, setStates] = useState<Record<string, RecState>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const loggedRef = useRef(false);

  // Load persisted lifecycle state + realtime subscription
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("ai_recommendations")
        .select("rec_key,status,snooze_until,assigned_to,outcome");
      if (!alive || !data) return;
      const map: Record<string, RecState> = {};
      for (const r of data as RecState[]) map[r.rec_key] = r;
      setStates(map);
    };
    load();
    const ch = supabase
      .channel(`ai-ops-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_recommendations" }, load)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  // Audit: recommendations generated (once per session load)
  useEffect(() => {
    if (loggedRef.current || execLoading || allRecs.length === 0) return;
    loggedRef.current = true;
    logActivity("ai_recommendation_generated", "ai_operations", undefined, { count: allRecs.length });
  }, [execLoading, allRecs.length]);

  const stateFor = useCallback((key: string): RecState | undefined => states[key], [states]);

  // Active list: hide rejected/archived/executed and not-yet-due snoozed items
  const active = useMemo(() => {
    const now = Date.now();
    return allRecs.filter((r) => {
      const st = states[r.key];
      if (!st) return true;
      if (HIDDEN.includes(st.status)) return false;
      if (st.status === "snoozed" && st.snooze_until && +new Date(st.snooze_until) > now) return false;
      return true;
    });
  }, [allRecs, states]);

  const briefing = useMemo(() => buildDailyBriefing(model, today, active, currency), [model, today, active, currency]);
  const weekly = useMemo(() => buildWeeklyReport(model, active, currency), [model, active, currency]);

  /** Persist a lifecycle change for a recommendation + audit it. */
  const act = useCallback(async (
    rec: AIRecommendation,
    status: RecStatus,
    extra?: { snoozeHours?: number; assignTo?: string | null; outcome?: string; outcomeValue?: number },
  ) => {
    setBusy(rec.key);
    const row = {
      rec_key: rec.key,
      title: rec.title,
      category: rec.category,
      priority: rec.priority,
      affected_systems: rec.systems,
      impact: rec.impact,
      confidence: rec.confidence,
      reasoning: rec.detail,
      action_kind: rec.actionKind,
      deep_link: rec.to ?? null,
      payload: { campaignId: rec.campaignId ?? null },
      status,
      snooze_until: extra?.snoozeHours ? new Date(Date.now() + extra.snoozeHours * 3600_000).toISOString() : null,
      assigned_to: extra?.assignTo ?? null,
      outcome: extra?.outcome ?? null,
      outcome_value: extra?.outcomeValue ?? null,
      acted_by: user?.id ?? null,
      acted_at: new Date().toISOString(),
      created_by: user?.id ?? null,
    };
    const { error } = await supabase.from("ai_recommendations").upsert(row, { onConflict: "rec_key" });
    setBusy(null);
    if (!error) {
      setStates((s) => ({ ...s, [rec.key]: { rec_key: rec.key, status, snooze_until: row.snooze_until, assigned_to: row.assigned_to, outcome: row.outcome } }));
      logActivity(`ai_recommendation_${status}`, "ai_operations", undefined, {
        rec_key: rec.key, title: rec.title, priority: rec.priority, category: rec.category,
        systems: rec.systems, ...(extra?.outcome ? { outcome: extra.outcome } : {}),
      });
    }
    return { error: error?.message };
  }, [user?.id]);

  return {
    loading: execLoading,
    currency,
    recs: active,
    allRecs,
    states,
    stateFor,
    busy,
    briefing,
    weekly,
    today,
    model,
    act,
  };
}
