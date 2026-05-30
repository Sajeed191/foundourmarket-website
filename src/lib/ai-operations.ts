import type { ExecutiveModel, Opportunity, ExecRisk } from "@/lib/executive-intelligence";
import type { FinancialMarketingAlert, FinancialRecommendation } from "@/lib/financial-marketing";

/* ------------------------------------------------------------------ types */

export type AICategory =
  | "critical" | "recommended" | "growth" | "risk" | "efficiency" | "profit";

export type AIPriority = "critical" | "high" | "medium" | "low";

export type AISystem =
  | "products" | "inventory" | "customers" | "marketing"
  | "financial" | "storefront" | "support" | "executive";

export type AIRecommendation = {
  /** deterministic, stable across reloads — used as DB rec_key */
  key: string;
  title: string;
  /** reasoning summary */
  detail: string;
  category: AICategory;
  priority: AIPriority;
  systems: AISystem[];
  impact: number;
  confidence: number; // 0-100
  actionKind: string;
  to?: string;
  campaignId?: string;
};

export const PRIORITY_RANK: Record<AIPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const CATEGORY_META: Record<AICategory, { label: string; tone: string; dot: string }> = {
  critical:   { label: "Critical Actions",        tone: "text-rose-300 border-rose-400/30 bg-rose-400/10",     dot: "bg-rose-400" },
  risk:       { label: "Risk Alerts",             tone: "text-amber-300 border-amber-400/30 bg-amber-400/10",  dot: "bg-amber-400" },
  recommended:{ label: "Recommended Actions",     tone: "text-accent border-accent/30 bg-accent/10",           dot: "bg-accent" },
  growth:     { label: "Growth Opportunities",    tone: "text-teal-300 border-teal-400/30 bg-teal-400/10",     dot: "bg-teal-400" },
  profit:     { label: "Profit Opportunities",    tone: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10", dot: "bg-emerald-400" },
  efficiency: { label: "Efficiency Improvements", tone: "text-violet-300 border-violet-400/30 bg-violet-400/10", dot: "bg-violet-400" },
};

export const CATEGORY_ORDER: AICategory[] = ["critical", "risk", "profit", "growth", "efficiency", "recommended"];

export const PRIORITY_META: Record<AIPriority, { label: string; tone: string }> = {
  critical: { label: "Critical", tone: "text-rose-300 border-rose-400/40 bg-rose-400/10" },
  high:     { label: "High",     tone: "text-amber-300 border-amber-400/40 bg-amber-400/10" },
  medium:   { label: "Medium",   tone: "text-accent border-accent/40 bg-accent/10" },
  low:      { label: "Low",      tone: "text-muted-foreground border-border bg-white/5" },
};

/* ------------------------------------------------------------- mappings */

const riskSystems: Record<ExecRisk["kind"], AISystem[]> = {
  margin_collapse: ["financial"],
  inventory_risk: ["inventory"],
  stockouts: ["inventory", "products"],
  refund_spike: ["financial", "support"],
  support_spike: ["support"],
  campaign_loss: ["marketing", "financial"],
  customer_churn: ["customers"],
  dead_inventory: ["inventory"],
};

const oppSystems: Record<Opportunity["kind"], AISystem[]> = {
  increase_spend: ["marketing", "financial"],
  vip_campaign: ["customers", "marketing"],
  restock: ["inventory", "products"],
  clear_dead_stock: ["inventory"],
  feature_high_margin: ["products", "marketing"],
  recover_at_risk: ["customers"],
  bundle: ["products"],
  regional_expansion: ["marketing", "financial"],
};

const oppCategory: Record<Opportunity["kind"], AICategory> = {
  increase_spend: "growth",
  vip_campaign: "profit",
  restock: "growth",
  clear_dead_stock: "efficiency",
  feature_high_margin: "profit",
  recover_at_risk: "profit",
  bundle: "profit",
  regional_expansion: "growth",
};

const oppActionKind: Record<Opportunity["kind"], string> = {
  increase_spend: "increase_spend",
  vip_campaign: "vip_campaign",
  restock: "restock",
  clear_dead_stock: "clear_dead_stock",
  feature_high_margin: "feature_product",
  recover_at_risk: "recover_customer",
  bundle: "bundle",
  regional_expansion: "launch_campaign",
};

function recCategory(action: FinancialRecommendation["action"]): AICategory {
  switch (action) {
    case "pause":
    case "reduce_spend":
    case "reduce_discounts":
    case "increase_margin":
      return "efficiency";
    case "scale":
    case "increase_spend":
      return "growth";
    default:
      return "profit";
  }
}

function recPriority(action: FinancialRecommendation["action"], tone: FinancialRecommendation["tone"]): AIPriority {
  if (tone === "danger") return "high";
  if (action === "increase_margin" || action === "reduce_discounts" || action === "reduce_spend") return "high";
  return "medium";
}

function recSystems(action: FinancialRecommendation["action"]): AISystem[] {
  switch (action) {
    case "feature_product": return ["products", "marketing"];
    case "increase_margin": return ["products", "financial"];
    case "reduce_discounts": return ["financial"];
    case "vip_campaign": return ["customers", "marketing"];
    case "retention_campaign": return ["customers", "marketing"];
    case "bundle": return ["products"];
    default: return ["marketing", "financial"];
  }
}

const alertSystems: Record<FinancialMarketingAlert["kind"], AISystem[]> = {
  negative_roi: ["marketing", "financial"],
  margin_collapse: ["financial"],
  high_refund: ["financial", "support"],
  campaign_loss: ["marketing", "financial"],
  profit_opportunity: ["marketing", "financial"],
  regional_opportunity: ["marketing"],
};

/* --------------------------------------------------------- the builder */

export type FinModelLite = {
  recs: FinancialRecommendation[];
  alerts: FinancialMarketingAlert[];
} | null | undefined;

/**
 * Normalizes the real executive + financial intelligence models into a
 * single prioritized stream of AI operations recommendations. No simulated
 * data — every entry is derived from live orders, returns, campaigns,
 * customers, products and inventory.
 */
export function buildAIRecommendations(model: ExecutiveModel | null, fm: FinModelLite): AIRecommendation[] {
  if (!model) return [];
  const out: AIRecommendation[] = [];
  const seen = new Set<string>();
  const push = (r: AIRecommendation) => {
    if (seen.has(r.key)) return;
    seen.add(r.key);
    out.push(r);
  };

  // Risks → critical / risk
  for (const r of model.risks) {
    const priority: AIPriority = r.severity === "high" ? "critical" : r.severity === "medium" ? "high" : "medium";
    push({
      key: `risk:${r.id}`,
      title: r.title,
      detail: r.detail,
      category: priority === "critical" ? "critical" : "risk",
      priority,
      systems: riskSystems[r.kind] ?? ["executive"],
      impact: 0,
      confidence: r.severity === "high" ? 92 : r.severity === "medium" ? 78 : 64,
      actionKind: r.kind,
      to: r.to,
      campaignId: r.campaignId,
    });
  }

  // Opportunities → growth / profit
  const maxImpact = Math.max(1, ...model.opportunities.map((o) => o.impact));
  for (const o of model.opportunities) {
    const big = o.impact >= maxImpact * 0.5;
    push({
      key: `opp:${o.id}`,
      title: o.title,
      detail: o.detail,
      category: oppCategory[o.kind] ?? "growth",
      priority: big ? "high" : "medium",
      systems: oppSystems[o.kind] ?? ["executive"],
      impact: o.impact,
      confidence: big ? 84 : 72,
      actionKind: oppActionKind[o.kind] ?? "review",
      to: o.to,
      campaignId: o.campaignId,
    });
  }

  // Financial recommendations → efficiency / profit / growth
  for (const rec of fm?.recs ?? []) {
    const cat = recCategory(rec.action);
    push({
      key: `frec:${rec.id}`,
      title: rec.title,
      detail: rec.detail,
      category: cat,
      priority: recPriority(rec.action, rec.tone),
      systems: recSystems(rec.action),
      impact: rec.impact,
      confidence: rec.tone === "danger" ? 88 : rec.tone === "good" ? 82 : rec.tone === "warn" ? 70 : 60,
      actionKind: rec.action,
      campaignId: rec.campaignId,
    });
  }

  // Financial / marketing alerts → risk / profit / growth
  for (const a of fm?.alerts ?? []) {
    const cat: AICategory = a.kind === "profit_opportunity" ? "profit" : a.kind === "regional_opportunity" ? "growth" : "risk";
    const priority: AIPriority = a.severity === "high" ? "critical" : a.severity === "medium" ? "high" : "low";
    push({
      key: `alert:${a.id}`,
      title: a.title,
      detail: a.detail,
      category: priority === "critical" && cat === "risk" ? "critical" : cat,
      priority,
      systems: alertSystems[a.kind] ?? ["financial"],
      impact: 0,
      confidence: a.severity === "high" ? 90 : a.severity === "medium" ? 75 : 62,
      actionKind: a.kind,
      campaignId: a.campaignId,
    });
  }

  return out.sort((x, y) => PRIORITY_RANK[x.priority] - PRIORITY_RANK[y.priority] || y.impact - x.impact);
}

export function groupByCategory(recs: AIRecommendation[]): Record<AICategory, AIRecommendation[]> {
  const g = { critical: [], risk: [], profit: [], growth: [], efficiency: [], recommended: [] } as Record<AICategory, AIRecommendation[]>;
  for (const r of recs) g[r.category].push(r);
  return g;
}

/* ----------------------------------------------------- system assistants */

export type AssistantGroup = { system: AISystem; label: string; recs: AIRecommendation[] };

const ASSISTANT_DEF: { system: AISystem; label: string }[] = [
  { system: "inventory", label: "AI Inventory Assistant" },
  { system: "customers", label: "AI Customer Assistant" },
  { system: "marketing", label: "AI Marketing Assistant" },
  { system: "financial", label: "AI Financial Assistant" },
  { system: "storefront", label: "AI Storefront Assistant" },
];

export function assistantGroups(recs: AIRecommendation[]): AssistantGroup[] {
  return ASSISTANT_DEF.map((d) => ({
    ...d,
    recs: recs.filter((r) => r.systems.includes(d.system)),
  }));
}

/* ------------------------------------------------------- daily briefing */

export type DailyBriefing = {
  date: string;
  whatHappened: string[];
  whatChanged: string[];
  biggestRisks: string[];
  biggestOpportunities: string[];
  recommendedActions: string[];
  expectedOutcomes: string[];
};

const money = (n: number, c = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: c, maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);

export function buildDailyBriefing(
  model: ExecutiveModel | null,
  today: { orders: number; revenue: number; profit: number; newCustomers: number; refunds: number } | null,
  recs: AIRecommendation[],
  currency = "USD",
): DailyBriefing | null {
  if (!model) return null;
  const s = model.scorecard;
  const topRisks = recs.filter((r) => r.category === "critical" || r.category === "risk").slice(0, 3);
  const topOpps = recs.filter((r) => r.category === "profit" || r.category === "growth").slice(0, 3);
  const actions = recs.slice(0, 4);
  return {
    date: new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
    whatHappened: [
      today ? `${today.orders} orders today for ${money(today.revenue, currency)} revenue and ${money(today.profit, currency)} profit.` : `No orders recorded yet today.`,
      today ? `${today.newCustomers} new customers · ${money(today.refunds, currency)} in refunds today.` : `Tracking new customers and refunds in real time.`,
    ],
    whatChanged: [
      `Revenue ${s.growth >= 0 ? "up" : "down"} ${Math.abs(s.growth).toFixed(0)}% vs the prior 90 days.`,
      `Business health is ${model.health.overall}/100 (${model.health.risk} risk), net margin ${s.netMargin.toFixed(1)}%.`,
    ],
    biggestRisks: topRisks.length ? topRisks.map((r) => `${r.title} — ${r.detail}`) : ["No critical risks detected."],
    biggestOpportunities: topOpps.length ? topOpps.map((o) => `${o.title}${o.impact ? ` (${money(o.impact, currency)})` : ""}`) : ["No new opportunities detected."],
    recommendedActions: actions.length ? actions.map((a) => a.title) : ["No actions required right now."],
    expectedOutcomes: topOpps.length
      ? [`Acting on top opportunities could unlock ~${money(topOpps.reduce((a, o) => a + o.impact, 0), currency)} in profit.`]
      : ["Maintaining current trajectory keeps margins stable."],
  };
}

/* ------------------------------------------------------- weekly report */

export type WeeklyReport = {
  growth: string;
  profit: string;
  customer: string;
  inventory: string;
  marketing: string;
  recommendations: string[];
};

export function buildWeeklyReport(model: ExecutiveModel | null, recs: AIRecommendation[], currency = "USD"): WeeklyReport | null {
  if (!model) return null;
  const s = model.scorecard;
  const topProfit = model.profitDrivers.products[0];
  const worstProduct = model.lossDrivers.products[0];
  return {
    growth: `Revenue ${money(s.revenue, currency)} with ${s.orders} orders (${s.growth >= 0 ? "+" : ""}${s.growth.toFixed(0)}% vs prior period). Conversion ${s.conversionRate.toFixed(2)}%, AOV ${money(s.aov, currency)}.`,
    profit: `Net profit ${money(s.profit, currency)} at ${s.netMargin.toFixed(1)}% margin. ${topProfit ? `Top profit driver: ${topProfit.label}.` : ""} ${worstProduct ? `Biggest loss driver: ${worstProduct.label}.` : ""}`,
    customer: `${s.customers} customers, lifetime value ${money(s.ltv, currency)}. ${recs.filter((r) => r.systems.includes("customers")).length} customer actions pending.`,
    inventory: `Inventory value ${money(s.inventoryValue, currency)}. ${recs.filter((r) => r.systems.includes("inventory")).length} inventory actions pending (restock / clearance / overstock).`,
    marketing: `Campaign ROI ${s.roi.toFixed(1)}×. ${recs.filter((r) => r.systems.includes("marketing")).length} marketing actions pending.`,
    recommendations: recs.slice(0, 6).map((r) => `${PRIORITY_META[r.priority].label}: ${r.title}`),
  };
}
