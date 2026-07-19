/**
 * Typed diagnostics helpers used by the admin panel.
 * Wraps sendToSW with the shapes the SW /sw.js sends back.
 */

import { sendToSW } from "./sw-controller";
import { getDeploymentStats } from "./deployment-recovery";
import { getChunkRecoveryStats } from "./chunk-recovery-v2";
import { getHealth } from "./health-monitor";
import { getNetworkQuality } from "./network-quality";
import { getRequestQueue } from "./request-queue";

export type SWDiagnostics = {
  ok: boolean;
  active: string | null;
  buckets: Array<{ name: string; entries: number; approxBytes: number }>;
  totalBytes: number;
  deployment: ReturnType<typeof getDeploymentStats>;
  chunk: ReturnType<typeof getChunkRecoveryStats>;
  health: ReturnType<typeof getHealth>;
  network: ReturnType<typeof getNetworkQuality>;
  queue: Awaited<ReturnType<typeof getRequestQueue>>;
};

export async function readDiagnostics(): Promise<SWDiagnostics> {
  const sw = await sendToSW<{
    ok: boolean;
    active?: string;
    buckets?: Array<{ name: string; entries: number; approxBytes: number }>;
    totalBytes?: number;
  }>({ type: "DIAGNOSTICS" }, 5_000);
  return {
    ok: !!sw?.ok,
    active: sw?.active ?? null,
    buckets: sw?.buckets ?? [],
    totalBytes: sw?.totalBytes ?? 0,
    deployment: getDeploymentStats(),
    chunk: getChunkRecoveryStats(),
    health: getHealth(),
    network: getNetworkQuality(),
    queue: await getRequestQueue(),
  };
}
