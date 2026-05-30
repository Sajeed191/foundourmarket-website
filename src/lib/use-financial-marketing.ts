import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchFinancialMarketing,
  computeProfitAnalytics,
  campaignProfitability,
  customerProfitability,
  productProfitabilityReport,
  regionalProfitability,
  executiveKpis,
  detectFinancialMarketingAlerts,
  buildFinancialRecommendations,
  type FinancialMarketingData,
} from "@/lib/financial-marketing";

/**
 * Shared realtime loader for every cross-module financial integration panel.
 * One subscription per mount, refreshing from real orders / returns /
 * campaigns / customers / inventory changes. No simulated data.
 */
export function useFinancialMarketing(days = 365) {
  const [data, setData] = useState<FinancialMarketingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const d = await fetchFinancialMarketing(days);
      if (!alive) return;
      setData(d);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`fin-mkt-shared-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "returns" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "marketing_campaigns" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, load)
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [days]);

  const model = useMemo(() => {
    if (!data) return null;
    const pa = computeProfitAnalytics(data);
    const campaigns = campaignProfitability(data.campaigns);
    const customers = customerProfitability(data.customers);
    const products = productProfitabilityReport(data);
    const regions = regionalProfitability(data);
    const kpis = executiveKpis(pa, campaigns, products, customers);
    const alerts = detectFinancialMarketingAlerts(pa, campaigns, products);
    const recs = buildFinancialRecommendations(pa, campaigns, products, customers);
    return { pa, campaigns, customers, products, regions, kpis, alerts, recs };
  }, [data]);

  return { data, loading, model, refresh: () => setData(null) };
}

/** Inventory financials derived from real product stock × unit cost. */
export function inventoryFinancials(data: FinancialMarketingData | null) {
  if (!data) return null;
  const products = data.financial.products;
  // Units sold per slug from paid orders (for dead/overstock detection)
  const soldMap = new Map<string, number>();
  for (const o of data.financial.orders) {
    for (const it of o.order_items ?? []) {
      const slug = it.product_slug ?? "";
      if (!slug) continue;
      soldMap.set(slug, (soldMap.get(slug) ?? 0) + (it.quantity ?? 0));
    }
  }
  let inventoryValue = 0;
  let deadStockLoss = 0;
  let overstockCost = 0;
  let unitsAtRisk = 0;
  for (const p of products) {
    const cost = Number(p.cost) || 0;
    const stock = Number(p.stock_quantity) || 0;
    const value = cost * stock;
    inventoryValue += value;
    const sold = soldMap.get(p.slug) ?? 0;
    if (sold === 0 && stock > 0) {
      deadStockLoss += value;
      unitsAtRisk += stock;
    } else if (sold > 0 && stock > sold * 3) {
      // more than 3× of trailing demand sitting as stock → overstock capital
      overstockCost += cost * (stock - sold * 3);
    }
  }
  const pa = computeProfitAnalytics(data);
  const grossProfit = pa.profit;
  const inventoryRoi = inventoryValue > 0 ? grossProfit / inventoryValue : 0;
  const profitAtRisk = deadStockLoss + overstockCost * 0.4;
  // Restock ROI = projected gross profit per currency reinvested in best sellers
  const restockRoi = pa.cogs > 0 ? grossProfit / pa.cogs : 0;
  const clearanceImpact = deadStockLoss * 0.6; // recoverable via clearance at ~60%
  return {
    inventoryValue,
    deadStockLoss,
    overstockCost,
    clearanceImpact,
    profitAtRisk,
    inventoryRoi,
    restockRoi,
    unitsAtRisk,
  };
}
