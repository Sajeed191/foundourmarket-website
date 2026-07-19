/**
 * Infrastructure v2.0 — network quality detector.
 *
 * Reads navigator.connection.effectiveType + saveData and window online/offline.
 * Event-driven: no setInterval, no polling. Safe on SSR (no-ops).
 */

import { emit } from "./event-bus";

export type NetworkTier = "offline" | "slow-2g" | "2g" | "3g" | "4g" | "wifi";

type NavConn = {
  effectiveType?: string;
  saveData?: boolean;
  type?: string;
  addEventListener?: (t: string, cb: () => void) => void;
  removeEventListener?: (t: string, cb: () => void) => void;
};

let current: { tier: NetworkTier; saveData: boolean } = { tier: "4g", saveData: false };
let started = false;

function getConn(): NavConn | null {
  if (typeof navigator === "undefined") return null;
  const n = navigator as unknown as {
    connection?: NavConn;
    mozConnection?: NavConn;
    webkitConnection?: NavConn;
  };
  return n.connection || n.mozConnection || n.webkitConnection || null;
}

function computeTier(): { tier: NetworkTier; saveData: boolean } {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { tier: "offline", saveData: false };
  }
  const c = getConn();
  const saveData = Boolean(c?.saveData);
  const et = c?.effectiveType;
  if (c?.type === "wifi" || c?.type === "ethernet") return { tier: "wifi", saveData };
  switch (et) {
    case "slow-2g": return { tier: "slow-2g", saveData };
    case "2g": return { tier: "2g", saveData };
    case "3g": return { tier: "3g", saveData };
    case "4g": return { tier: "4g", saveData };
    default: return { tier: "4g", saveData };
  }
}

function update() {
  const next = computeTier();
  if (next.tier === current.tier && next.saveData === current.saveData) return;
  current = next;
  emit("network:quality", next);
}

export function startNetworkQuality() {
  if (started || typeof window === "undefined") return;
  started = true;
  current = computeTier();
  emit("network:quality", current);
  window.addEventListener("online", () => { update(); emit("network:online", undefined); });
  window.addEventListener("offline", () => { update(); emit("network:offline", undefined); });
  const c = getConn();
  c?.addEventListener?.("change", update);
}

export function getNetworkQuality() {
  return current;
}

export function isSlow(): boolean {
  return current.saveData || current.tier === "slow-2g" || current.tier === "2g" || current.tier === "3g";
}

export function isOffline(): boolean {
  return current.tier === "offline";
}
