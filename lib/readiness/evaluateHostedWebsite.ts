import { getReadinessAdminPaths } from "@/lib/readiness/adminPaths";
import { computeCategoryResult } from "@/lib/readiness/computeCategoryResult";
import {
  hasText,
  itemStatus,
  tenantHasServices,
} from "@/lib/readiness/helpers";
import type {
  ReadinessCategoryResult,
  TenantSetupReadinessInput,
} from "@/lib/readiness/types";

export function evaluateHostedWebsite(
  input: TenantSetupReadinessInput
): ReadinessCategoryResult {
  const { tenant } = input;
  const paths = getReadinessAdminPaths(tenant.slug);
  const applicable = tenant.deploymentMode === "hosted";

  const items = applicable
    ? [
        {
          id: "website_published",
          label: "Website published",
          tier: "required" as const,
          status: itemStatus(tenant.websiteStatus === "published"),
          adminHref: paths.website,
        },
        {
          id: "website_services",
          label: "Services available on website",
          tier: "required" as const,
          status: itemStatus(
            tenantHasServices({
              servicesOffered: tenant.servicesOffered,
              websiteServices: tenant.websiteSettings?.services,
            })
          ),
          adminHref: paths.website,
        },
        {
          id: "website_phone",
          label: "Customer phone on profile",
          tier: "required" as const,
          status: itemStatus(hasText(tenant.primaryPhone)),
          adminHref: paths.businessProfile,
        },
      ]
    : [];

  return computeCategoryResult({
    key: "website",
    label: "Website",
    applicable,
    items,
    adminHref: paths.website,
  });
}
