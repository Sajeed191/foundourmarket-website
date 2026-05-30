import { describe, it, expect } from "vitest";
import { blendDetection, AUTO_THRESHOLD, CONFIDENCE_THRESHOLD } from "./geo-detect";
import type { EdgeGeo } from "./region.functions";

// Tests run in a jsdom-less node env, so browser signals (timezone/locale) are
// absent — this isolates the edge geo-IP + previous-choice scoring layers.
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

describe("blendDetection scoring engine", () => {
  it("India IP yields india region with reasons", () => {
    const r = blendDetection(edge({ suggested: "india", countryCode: "IN" }));
    expect(r.region).toBe("india");
    expect(r.reasons.some((x) => x.includes("India"))).toBe(true);
  });

  it("US IP yields international region", () => {
    const r = blendDetection(edge({ suggested: "international", countryCode: "US" }));
    expect(r.region).toBe("international");
  });

  it("previous India choice reinforces india + raises confidence", () => {
    const base = blendDetection(edge({ suggested: "india", countryCode: "IN" }));
    const withPrev = blendDetection(edge({ suggested: "india", countryCode: "IN" }), "india");
    expect(withPrev.region).toBe("india");
    expect(withPrev.confidence).toBeGreaterThanOrEqual(base.confidence);
    expect(withPrev.reasons).toContain("Previous selection: India");
  });

  it("VPN suspicion forces the pick tier and caps confidence", () => {
    const r = blendDetection(edge({ suggested: "india", countryCode: "IN", vpnSuspected: true }));
    expect(r.vpnSuspected).toBe(true);
    expect(r.tier).toBe("pick");
    expect(r.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
  });

  it("no signals defaults to international with low confidence", () => {
    const r = blendDetection(edge({}));
    expect(r.region).toBe("international");
    expect(r.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
    expect(r.tier).toBe("pick");
  });

  it("tier thresholds are ordered", () => {
    expect(AUTO_THRESHOLD).toBeGreaterThan(CONFIDENCE_THRESHOLD);
  });
});
