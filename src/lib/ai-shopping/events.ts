// Cross-widget events for the Communication Hub.
// The hub, LiveChat, and AI Shopping Assistant all coordinate through these.

export const HUB_OPEN_EVENT = "fom:hub:open";
export const AI_OPEN_EVENT = "fom:ai:open";
export const AI_CLOSE_EVENT = "fom:ai:close";
export const LAST_CHOICE_KEY = "fom_hub_last_choice";

export type HubChoice = "ai" | "support";

export function openHub(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HUB_OPEN_EVENT));
}

export function openAiAssistant(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AI_OPEN_EVENT));
}

export function closeAiAssistant(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AI_CLOSE_EVENT));
}

export function onHubOpen(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(HUB_OPEN_EVENT, cb);
  return () => window.removeEventListener(HUB_OPEN_EVENT, cb);
}

export function onAiOpen(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AI_OPEN_EVENT, cb);
  return () => window.removeEventListener(AI_OPEN_EVENT, cb);
}

export function onAiClose(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AI_CLOSE_EVENT, cb);
  return () => window.removeEventListener(AI_CLOSE_EVENT, cb);
}

export function getLastHubChoice(): HubChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(LAST_CHOICE_KEY);
    return v === "ai" || v === "support" ? v : null;
  } catch {
    return null;
  }
}

export function setLastHubChoice(choice: HubChoice): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LAST_CHOICE_KEY, choice); } catch { /* noop */ }
}
