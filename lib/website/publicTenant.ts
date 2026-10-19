import type { Tenant, TenantWebsiteSettings } from "@/lib/types/tenant";

/** Minimal tenant shape for customer-facing chat chrome (no private address). */
export type PublicChatTenant = {
  slug: string;
  businessName: string;
  primaryColor?: string;
  websiteSettings?: Pick<
    TenantWebsiteSettings,
    "primaryColor" | "accentColor" | "logoUrl"
  >;
};

/** Hosted website + public helpers — private street address omitted unless permitted. */
export type PublicTenant = {
  id: string;
  slug: string;
  businessName: string;
  primaryPhone?: string;
  email?: string;
  tagline?: string;
  aboutUs?: string;
  primaryCategory?: string;
  licenseNumber?: string;
  isInsured?: boolean;
  hours?: Record<string, unknown>;
  servicesOffered?: string[];
  serviceAreaSummary?: string;
  serviceCities?: string[];
  primaryColor?: string;
  websiteSettings?: TenantWebsiteSettings;
  /** Preformatted address for display; only when tenant opted in publicly. */
  publicBusinessAddress?: string;
};

function formatPublicBusinessAddress(tenant: Tenant): string | undefined {
  const line1 = tenant.addressLine1?.trim();
  if (!line1) return undefined;

  const parts = [
    line1,
    tenant.addressLine2?.trim(),
    [tenant.city?.trim(), tenant.state?.trim()].filter(Boolean).join(", "),
    tenant.zip?.trim(),
  ].filter(Boolean);

  return parts.join(", ").replace(/\s+,/g, ",").trim();
}

type ChatTenantSource = Pick<
  Tenant,
  "slug" | "businessName" | "primaryColor" | "websiteSettings"
>;

export function buildPublicChatTenant(tenant: ChatTenantSource): PublicChatTenant {
  const websiteSettings = tenant.websiteSettings || {};

  return {
    slug: tenant.slug,
    businessName: tenant.businessName,
    primaryColor: tenant.primaryColor,
    websiteSettings: {
      primaryColor: websiteSettings.primaryColor,
      accentColor: websiteSettings.accentColor,
      logoUrl: websiteSettings.logoUrl,
    },
  };
}

export function buildPublicTenantView(tenant: Tenant): PublicTenant {
  const publicBusinessAddress =
    tenant.showBusinessAddressPublicly === true
      ? formatPublicBusinessAddress(tenant)
      : undefined;

  return {
    id: tenant.id,
    slug: tenant.slug,
    businessName: tenant.businessName,
    primaryPhone: tenant.primaryPhone,
    email: tenant.email,
    tagline: tenant.tagline,
    aboutUs: tenant.aboutUs,
    primaryCategory: tenant.primaryCategory,
    licenseNumber: tenant.licenseNumber,
    isInsured: tenant.isInsured,
    hours: tenant.hours,
    servicesOffered: tenant.servicesOffered,
    serviceAreaSummary: tenant.serviceAreaSummary,
    serviceCities: tenant.serviceCities,
    primaryColor: tenant.primaryColor,
    websiteSettings: tenant.websiteSettings,
    ...(publicBusinessAddress ? { publicBusinessAddress } : {}),
  };
}

/** Keys that must never appear on public client payloads when address is private. */
export const PRIVATE_ADDRESS_SERIALIZATION_KEYS = [
  "addressLine1",
  "addressLine2",
  "shareBusinessAddressInChat",
  "showBusinessAddressPublicly",
] as const;
