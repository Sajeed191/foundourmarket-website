/**
 * Vendor Intelligence.
 *
 * A deterministic vendor quality score derived from real vendor activity:
 * duplicate attempts, catalog completeness, SEO/image quality, approval and
 * rejection rates, and merge history. Every input is a measured count — no
 * simulated metrics. Pure.
 */
export type VendorSignals = {
  vendorId: string;
  vendorName: string;
  totalProducts: number;
  duplicateAttempts: number;
  rejectedUploads: number;
  approvedUploads: number;
  merges: number;
  avgCatalogHealth: number; // 0–100 across their products
  avgSeoScore: number; // 0–100
  avgImageScore: number; // 0–100
};

export type VendorQuality = {
  vendorId: string;
  vendorName: string;
  score: number; // 0–100
  grade: "Trusted" | "Reliable" | "Watch" | "At Risk";
  factors: { label: string; value: string; positive: boolean }[];
};

function grade(score: number): VendorQuality["grade"] {
  if (score >= 85) return "Trusted";
  if (score >= 70) return "Reliable";
  if (score >= 50) return "Watch";
  return "At Risk";
}

export function scoreVendor(s: VendorSignals): VendorQuality {
  const uploads = Math.max(1, s.approvedUploads + s.rejectedUploads);
  const approvalRate = s.approvedUploads / uploads;
  const dupRate = s.totalProducts ? s.duplicateAttempts / s.totalProducts : 0;

  // Weighted blend of quality (60%) and behaviour (40%).
  const quality = s.avgCatalogHealth * 0.5 + s.avgSeoScore * 0.25 + s.avgImageScore * 0.25;
  const behaviour = approvalRate * 100 * 0.6 + (1 - Math.min(1, dupRate)) * 100 * 0.4;
  const score = Math.round(quality * 0.6 + behaviour * 0.4);

  const factors = [
    { label: "Approval rate", value: `${Math.round(approvalRate * 100)}%`, positive: approvalRate >= 0.8 },
    { label: "Duplicate attempts", value: `${s.duplicateAttempts}`, positive: s.duplicateAttempts === 0 },
    { label: "Avg catalog health", value: `${Math.round(s.avgCatalogHealth)}`, positive: s.avgCatalogHealth >= 70 },
    { label: "Avg SEO", value: `${Math.round(s.avgSeoScore)}`, positive: s.avgSeoScore >= 70 },
    { label: "Avg image quality", value: `${Math.round(s.avgImageScore)}`, positive: s.avgImageScore >= 70 },
    { label: "Merges", value: `${s.merges}`, positive: true },
  ];

  return { vendorId: s.vendorId, vendorName: s.vendorName, score: Math.max(0, Math.min(100, score)), grade: grade(score), factors };
}
