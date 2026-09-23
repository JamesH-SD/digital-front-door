import type { Tenant, TenantDeploymentMode } from "@/lib/types/tenant";

type WizardFormSnapshot = {
  businessName: string;
  primaryPhone: string;
  email: string;
  websiteUrl: string;
  deploymentMode: TenantDeploymentMode | null;
  serviceAreaSummary: string;
  serviceCities: string;
  servicesOffered: string;
  bookingType: string;
  tagline: string;
  aboutUs: string;
  licenseNumber: string;
  isInsured: boolean;
  addressLine1: string;
  hours: Record<string, unknown>;
};

function parseListInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Merges in-progress wizard form values onto the loaded tenant for readiness evaluation.
 */
export function buildWizardTenantSnapshot(
  tenant: Tenant,
  form: WizardFormSnapshot,
  customerHelpChoice: string | null
): Tenant {
  return {
    ...tenant,
    businessName: form.businessName.trim() || tenant.businessName,
    primaryPhone: form.primaryPhone.trim() || tenant.primaryPhone,
    email: form.email.trim() || tenant.email,
    websiteUrl: form.websiteUrl.trim() || tenant.websiteUrl,
    deploymentMode: form.deploymentMode ?? tenant.deploymentMode ?? null,
    serviceAreaSummary: form.serviceAreaSummary.trim() || tenant.serviceAreaSummary,
    serviceCities: parseListInput(form.serviceCities),
    servicesOffered: parseListInput(form.servicesOffered),
    bookingType: customerHelpChoice ?? form.bookingType ?? tenant.bookingType ?? null,
    tagline: form.tagline.trim() || tenant.tagline,
    aboutUs: form.aboutUs.trim() || tenant.aboutUs,
    licenseNumber: form.licenseNumber.trim() || tenant.licenseNumber,
    isInsured: form.isInsured,
    addressLine1: form.addressLine1.trim() || tenant.addressLine1,
    hours: form.hours,
  };
}
