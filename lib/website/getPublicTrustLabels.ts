import type { PublicTenant } from "@/lib/website/publicTenant";

/**
 * Trust bar labels backed by stored tenant facts only (no template filler).
 */
export function getPublicTrustLabels(tenant: PublicTenant): string[] {
  const labels: string[] = [];

  if (tenant.licenseNumber?.trim()) {
    labels.push(`Licensed ${tenant.licenseNumber.trim()}`);
  }

  if (tenant.isInsured) {
    labels.push("Insured");
  }

  return labels;
}
