import type { Tenant } from "@/lib/types/tenant";

export function tenantSharesBusinessAddressInChat(tenant: Tenant): boolean {
  return tenant.shareBusinessAddressInChat === true;
}

function formatFullBusinessAddress(tenant: Tenant): string | null {
  const line1 = tenant.addressLine1?.trim();
  if (!line1) return null;

  const parts = [
    line1,
    tenant.addressLine2?.trim(),
    [tenant.city?.trim(), tenant.state?.trim()].filter(Boolean).join(", "),
    tenant.zip?.trim(),
  ].filter(Boolean);

  return parts
    .join(", ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

/**
 * Location / service-area lines for customer-facing receptionist prompts.
 * When shareBusinessAddressInChat is false, private street address is omitted (data minimization).
 */
export function buildReceptionistLocationContextLines(tenant: Tenant): string[] {
  const lines: string[] = [];

  if (tenantSharesBusinessAddressInChat(tenant)) {
    const address = formatFullBusinessAddress(tenant);
    lines.push(`Business Address: ${address || "Not provided"}`);
    if (tenant.city?.trim()) {
      lines.push(`Business City: ${tenant.city.trim()}`);
    }
    if (tenant.state?.trim()) {
      lines.push(`Business State: ${tenant.state.trim()}`);
    }
    lines.push("Share Business Address In Chat: yes");
  } else {
    lines.push("Share Business Address In Chat: no");
  }

  lines.push(
    `Service Area Summary: ${tenant.serviceAreaSummary || "Not provided"}`
  );
  lines.push(
    `Service Cities: ${(tenant.serviceCities || []).join(", ") || "Not provided"}`
  );

  return lines;
}

/** True if context text includes the tenant's structured street line (for tests). */
export function receptionistContextIncludesPrivateStreet(
  tenant: Tenant,
  contextText: string
): boolean {
  const line1 = tenant.addressLine1?.trim();
  if (!line1) return false;
  return contextText.includes(line1);
}
