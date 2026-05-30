import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchTrafficSummary, type TrafficSummary } from "@/lib/traffic-intelligence";

/**
 * Compact traffic summary for embedding on Executive / AI Ops dashboards.
 * Realtime-refreshed (debounced) + 30s poll. Shares the same analytics data
 * as the full Traffic Intelligence Command Center.
 */
export function useTrafficSummary(days = 14): TrafficSummary {
  const [state, setState] = useState<TrafficSummary>({
    live: 0, views: 0, sessions: 0, orders: 0, revenue: 0, conversion: 0, topSource: "Direct", loading: true,
  });
  const mounted = useRef(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      try {
        const s = await fetchTrafficSummary(days);
        if (mounted.current) setState({ ...s, loading: false });
      } catch {
        if (mounted.current) setState((p) => ({ ...p, loading: false }));
      }
    };
    load();
    const trigger = () => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(load, 3000);
    };
    const suffix = Math.random().toString(36).slice(2, 8);
    const ch = supabase
      .channel(`traffic-summary-${suffix}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "page_views" }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "visitor_sessions" }, trigger)
      .subscribe();
    const poll = setInterval(load, 30000);
    return () => { mounted.current = false; void supabase.removeChannel(ch); clearInterval(poll); if (debounce.current) clearTimeout(debounce.current); };
  }, [days]);

  return state;
}
