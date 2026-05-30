import { trackVisit, trackEvent } from "@/lib/visitor";

/**
 * Backwards-compatible analytics facade. The real implementation now lives in
 * `@/lib/visitor` (the unified traffic intelligence engine). These wrappers
 * keep existing imports working while routing everything through one pipeline.
 */

export async function track(
  event: string,
  opts: {
    path?: string;
    productSlug?: string;
    value?: number;
    metadata?: Record<string, unknown>;
  } = {},
) {
  return trackEvent(event, opts);
}

export function trackPageView(path: string) {
  void trackVisit(path);
}

export { trackEvent, trackVisit };
