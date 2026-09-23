import { getReadinessAdminPaths } from "@/lib/readiness/adminPaths";
import { computeCategoryResult } from "@/lib/readiness/computeCategoryResult";
import {
  hasText,
  itemStatus,
  tenantHasConfiguredHours,
  tenantHasRichServiceArea,
} from "@/lib/readiness/helpers";
import type {
  ReadinessCategoryResult,
  TenantSetupReadinessInput,
} from "@/lib/readiness/types";

export function evaluateBusinessProfile(
  input: TenantSetupReadinessInput
): ReadinessCategoryResult {
  const { tenant } = input;
  const paths = getReadinessAdminPaths(tenant.slug);

  const deploymentMode = tenant.deploymentMode ?? null;
  const hasDeploymentMode =
    deploymentMode === "existing_site" || deploymentMode === "hosted";

  const items = [
    {
      id: "business_name",
      label: "Business name",
      tier: "required" as const,
      status: itemStatus(hasText(tenant.businessName)),
      adminHref: paths.businessProfile,
    },
    {
      id: "primary_phone",
      label: "Primary phone",
      tier: "required" as const,
      status: itemStatus(hasText(tenant.primaryPhone)),
      adminHref: paths.businessProfile,
    },
    {
      id: "email",
      label: "Business email",
      tier: "required" as const,
      status: itemStatus(hasText(tenant.email)),
      adminHref: paths.businessProfile,
    },
    {
      id: "service_area_summary",
      label: "Service area summary",
      tier: "required" as const,
      status: itemStatus(hasText(tenant.serviceAreaSummary)),
      adminHref: paths.businessProfile,
    },
    {
      id: "services_offered",
      label: "At least one service",
      tier: "required" as const,
      status: itemStatus((tenant.servicesOffered || []).some((s) => s.trim())),
      adminHref: paths.businessProfile,
    },
    {
      id: "deployment_mode",
      label: "Customer website choice",
      tier: "required" as const,
      status: itemStatus(hasDeploymentMode),
      adminHref: paths.businessProfile,
    },
    ...(deploymentMode === "existing_site"
      ? [
          {
            id: "existing_site_url",
            label: "Existing website URL",
            tier: "required" as const,
            status: itemStatus(hasText(tenant.websiteUrl)),
            adminHref: paths.businessProfile,
          },
        ]
      : []),
    {
      id: "business_hours",
      label: "Business hours",
      tier: "recommended" as const,
      status: itemStatus(tenantHasConfiguredHours(tenant.hours)),
      adminHref: paths.businessHours,
    },
    {
      id: "tagline",
      label: "Tagline",
      tier: "recommended" as const,
      status: itemStatus(hasText(tenant.tagline)),
      adminHref: paths.businessProfile,
    },
    {
      id: "about",
      label: "About your business",
      tier: "recommended" as const,
      status: itemStatus(hasText(tenant.aboutUs)),
      adminHref: paths.businessProfile,
    },
    {
      id: "service_area_detail",
      label: "Address or service cities",
      tier: "recommended" as const,
      status: itemStatus(
        tenantHasRichServiceArea({
          addressLine1: tenant.addressLine1,
          serviceCities: tenant.serviceCities,
        })
      ),
      adminHref: paths.businessProfile,
    },
    {
      id: "license_or_insured",
      label: "License or insurance details",
      tier: "recommended" as const,
      status: itemStatus(
        hasText(tenant.licenseNumber) || Boolean(tenant.isInsured)
      ),
      adminHref: paths.businessProfile,
    },
  ];

  return computeCategoryResult({
    key: "business_profile",
    label: "Business Profile",
    applicable: true,
    items,
    adminHref: paths.businessProfile,
  });
}
