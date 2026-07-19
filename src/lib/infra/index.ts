/**
 * Infrastructure v2.0 — barrel + boot.
 *
 * Import from route entry lazily:  import("@/lib/infra").then(m => m.bootInfra())
 * Nothing here should be eagerly imported by the entry chunk.
 */

export * from "./event-bus";
export * from "./network-quality";
export * from "./request-queue";
export * from "./queue-adapter";

import { startNetworkQuality } from "./network-quality";
import { startRequestQueue, setAuthTokenProvider } from "./request-queue";

let booted = false;

export function bootInfra() {
  if (booted || typeof window === "undefined") return;
  booted = true;

  // Wire auth token provider lazily so the queue module has no static
  // dependency on the Supabase client.
  setAuthTokenProvider(async () => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  });

  startNetworkQuality();
  startRequestQueue();
}
