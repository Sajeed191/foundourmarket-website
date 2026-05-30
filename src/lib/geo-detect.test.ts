/**
 * Dependency-free verification script for the region detection engine.
 * Run with:  bun run src/lib/geo-detect.test.ts
 * (No test framework is installed; this uses plain assertions.)
 */
import { blendDetection, AUTO_THRESHOLD, CONFIDENCE_THRESHOLD } from "./geo-detect";
import type { EdgeGeo } from "./region.functions";

function edge(p: Partial<EdgeGeo>): EdgeGeo {
  return {
    suggested: "international",
    countryCode: null,
    edgeConfidence: 0,
    vpnSuspected: false,
    timezone: null,
    ...p,
  };
}

let passed = 0;
function assert(label: string, cond: boolean) {
  if (!cond) throw new Error(`FAILED: ${label}`);
  passed++;
  console.log(`✓ ${label}`);
}

// India IP → india + reasons
const india = blendDetection(edge({ suggested: "india", countryCode: "IN" }));
assert("India IP → india", india.region === "india");
assert("India IP has reasons", india.reasons.some((x) => x.includes("India")));

// US IP → international
const us = blendDetection(edge({ suggested: "international", countryCode: "US" }));
assert("US IP → international", us.region === "international");

// previous choice reinforces + raises confidence
const withPrev = blendDetection(edge({ suggested: "india", countryCode: "IN" }), "india");
assert("previous choice reinforces india", withPrev.region === "india");
assert("previous choice raises confidence", withPrev.confidence >= india.confidence);
assert("previous choice in reasons", withPrev.reasons.includes("Previous selection: India"));

// VPN forces pick tier
const vpn = blendDetection(edge({ suggested: "india", countryCode: "IN", vpnSuspected: true }));
assert("VPN flagged", vpn.vpnSuspected === true);
assert("VPN → pick tier", vpn.tier === "pick");
assert("VPN caps confidence", vpn.confidence < CONFIDENCE_THRESHOLD);

// no signals → international low confidence pick
const none = blendDetection(edge({}));
assert("no signals → international", none.region === "international");
assert("no signals → pick tier", none.tier === "pick");

// thresholds ordered
assert("AUTO > CONFIRM threshold", AUTO_THRESHOLD > CONFIDENCE_THRESHOLD);

console.log(`\nAll ${passed} region-detection checks passed.`);
