import type { Tenant, TenantWebsiteService } from "@/lib/types/tenant";

export function getPublicWebsiteServices(tenant: Tenant): TenantWebsiteService[] {
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

export function tenantHasPublicServiceAreaContent(tenant: Tenant): boolean {
  return Boolean(
    tenant.serviceCities?.some((city) => city.trim()) ||
      tenant.serviceAreaSummary?.trim()
  );
}
