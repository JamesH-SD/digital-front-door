import type { ReadinessItemStatus } from "@/lib/readiness/types";

export function hasText(value?: string | null) {
  return Boolean(value && value.trim());
}

export function itemStatus(complete: boolean): ReadinessItemStatus {
  return complete ? "complete" : "needs_attention";
}

export function tenantHasServices(input: {
  servicesOffered?: string[] | null;
  websiteServices?: Array<{ title?: string }> | null;
}) {
  const offered = (input.servicesOffered || []).filter((service) => service.trim()).length;
  const website = (input.websiteServices || []).filter(
    (service) => service.title && service.title.trim()
  ).length;

  return offered > 0 || website > 0;
}

export function tenantHasConfiguredHours(hours?: Record<string, unknown> | null) {
  if (!hours || typeof hours !== "object") {
    return false;
  }

  return Object.values(hours).some((day) => {
    if (!day || typeof day !== "object") {
      return false;
    }

    const value = day as { closed?: boolean; open?: string; close?: string };

    if (value.closed) {
      return false;
    }

    return hasText(value.open) && hasText(value.close);
  });
}

export function tenantHasRichServiceArea(input: {
  addressLine1?: string | null;
  serviceCities?: string[] | null;
}) {
  const cities = (input.serviceCities || []).filter(Boolean).length;
  return hasText(input.addressLine1) || cities > 0;
}
