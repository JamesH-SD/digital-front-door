import type { Tenant, TenantWebsiteSettings } from "@/lib/types/tenant";

export const LEGACY_SERVICES_SECTION_HEADING = "Services customers can ask about";
export const LEGACY_SERVICES_SECTION_TITLE = LEGACY_SERVICES_SECTION_HEADING;
export const LEGACY_SERVICES_SECTION_DESCRIPTION =
  "Explore common services and ask our AI receptionist about the one that fits your needs.";

const LEGACY_HEADINGS = new Set([
  "services",
  LEGACY_SERVICES_SECTION_HEADING.toLowerCase(),
]);

const LEGACY_TITLES = new Set([
  LEGACY_SERVICES_SECTION_TITLE.toLowerCase(),
  LEGACY_SERVICES_SECTION_DESCRIPTION.toLowerCase(),
]);

const LEGACY_DESCRIPTIONS = new Set([
  LEGACY_SERVICES_SECTION_DESCRIPTION.toLowerCase(),
]);

export const F1_SERVICES_SECTION_HEADING = "Our Services";
export const F1_SERVICES_SECTION_TITLE = "Services We Offer";

function normalizeCopy(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isLegacyServicesHeading(value: string): boolean {
  const normalized = normalizeCopy(value);
  return !normalized || LEGACY_HEADINGS.has(normalized);
}

function isLegacyServicesTitle(value: string): boolean {
  const normalized = normalizeCopy(value);
  return !normalized || LEGACY_TITLES.has(normalized);
}

function isLegacyServicesDescription(value: string): boolean {
  const normalized = normalizeCopy(value);
  if (!normalized) {
    return true;
  }
  return LEGACY_DESCRIPTIONS.has(normalized);
}

/**
 * Services section description copied from services_offered (not tenant-authored copy).
 */
export function isDerivedServicesSectionDescription(
  description: string,
  servicesOffered: string[] = []
): boolean {
  const normalized = normalizeCopy(description);
  if (!normalized || servicesOffered.length === 0) {
    return false;
  }

  const joined = normalizeCopy(servicesOffered.join(", "));
  if (normalized === joined) {
    return true;
  }

  if (servicesOffered.length === 1) {
    return normalized === normalizeCopy(servicesOffered[0]!);
  }

  return false;
}

export type ResolvedWebsiteServicesSection = {
  heading: string;
  title: string;
  description: string;
};

export function resolveWebsiteServicesSection(
  tenant: Pick<Tenant, "websiteSettings" | "servicesOffered">
): ResolvedWebsiteServicesSection {
  const settings = tenant.websiteSettings || {};
  const servicesOffered = tenant.servicesOffered || [];

  const headingRaw = settings.servicesSectionHeading?.trim() || "";
  const titleRaw = settings.servicesSectionTitle?.trim() || "";
  const descriptionRaw = settings.servicesSectionDescription?.trim() || "";

  const heading = isLegacyServicesHeading(headingRaw)
    ? F1_SERVICES_SECTION_HEADING
    : headingRaw;

  const title = isLegacyServicesTitle(titleRaw)
    ? F1_SERVICES_SECTION_TITLE
    : titleRaw;

  let description = descriptionRaw;
  if (
    isLegacyServicesDescription(descriptionRaw) ||
    isDerivedServicesSectionDescription(descriptionRaw, servicesOffered)
  ) {
    description = "";
  }

  return { heading, title, description };
}

/**
 * Clears known legacy / derived Services fields for admin editing (empty = use F1 defaults on public site).
 */
export function clearLegacyServicesSectionFields(
  settings: TenantWebsiteSettings,
  servicesOffered: string[] = []
): TenantWebsiteSettings {
  const headingRaw = settings.servicesSectionHeading?.trim() || "";
  const titleRaw = settings.servicesSectionTitle?.trim() || "";
  const descriptionRaw = settings.servicesSectionDescription?.trim() || "";

  return {
    ...settings,
    servicesSectionHeading: isLegacyServicesHeading(headingRaw)
      ? ""
      : settings.servicesSectionHeading,
    servicesSectionTitle: isLegacyServicesTitle(titleRaw)
      ? ""
      : settings.servicesSectionTitle,
    servicesSectionDescription:
      isLegacyServicesDescription(descriptionRaw) ||
      isDerivedServicesSectionDescription(descriptionRaw, servicesOffered)
        ? ""
        : settings.servicesSectionDescription,
  };
}
