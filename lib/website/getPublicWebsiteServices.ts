import type { TenantWebsiteService } from "@/lib/types/tenant";
import type { PublicTenant } from "@/lib/website/publicTenant";

export function getPublicWebsiteServices(tenant: PublicTenant): TenantWebsiteService[] {
  const websiteServices = tenant.websiteSettings?.services || [];

  const enabledWebsiteServices = websiteServices.filter(
    (service) => service.enabled !== false && service.title?.trim()
  );

  if (enabledWebsiteServices.length > 0) {
    return enabledWebsiteServices;
  }

  if (tenant.servicesOffered && tenant.servicesOffered.length > 0) {
    return tenant.servicesOffered
      .filter((service) => service.trim())
      .map((service) => ({
        id: service,
        title: service,
        description: "",
        imageUrl: "",
        enabled: true,
      }));
  }

  return [];
}

export function tenantHasPublicServiceAreaContent(tenant: PublicTenant): boolean {
  return Boolean(
    tenant.serviceCities?.some((city) => city.trim()) ||
      tenant.serviceAreaSummary?.trim()
  );
}
