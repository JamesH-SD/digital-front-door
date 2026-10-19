import type { Tenant } from "@/lib/types/tenant";
import { tenantHasConfiguredHours } from "@/lib/readiness/helpers";

export type WebsiteBuilderProgressItem = {
  label: string;
  complete: boolean;
  href: string;
  /** When false, row appears in Website setup but does not affect readiness %. */
  countsTowardReadiness?: boolean;
  /** Badge when incomplete; essentials default to needs_attention. */
  incompleteStatus?: "needs_attention" | "optional";
  /** Badge when complete; gallery uses "added". */
  completeStatus?: "complete" | "added";
};

function hasPublishableGalleryProject(tenant: Tenant): boolean {
  const gallery = tenant.websiteSettings?.projectGallery || [];

  return gallery.some(
    (item) =>
      item.enabled !== false &&
      item.title?.trim() &&
      item.imageUrl?.trim()
  );
}

/**
 * Website setup grid (essentials + optional Project Gallery row).
 * Readiness % uses only items with countsTowardReadiness !== false.
 */
export function getWebsiteBuilderProgress(tenant: Tenant): WebsiteBuilderProgressItem[] {
  const settings = tenant.websiteSettings || {};

  return [
    {
      label: "Logo added",
      complete: Boolean(settings.logoUrl),
      href: "brand",
    },
    {
      label: "Browser tab icon",
      complete: Boolean(settings.faviconUrl),
      href: "brand",
    },
    {
      label: "Home page headline",
      complete: Boolean(settings.heroHeadline?.trim() || tenant.tagline?.trim()),
      href: "hero",
    },
    {
      label: "Why Us section",
      complete: Boolean(settings.whyUsTitle),
      href: "why-us",
    },
    {
      label: "Services added",
      complete: Boolean(
        (settings.services && settings.services.length > 0) ||
          (tenant.servicesOffered && tenant.servicesOffered.length > 0)
      ),
      href: "services",
    },
    {
      label: "Project Gallery",
      complete: hasPublishableGalleryProject(tenant),
      href: "project-gallery",
      countsTowardReadiness: false,
      incompleteStatus: "optional",
      completeStatus: "added",
    },
    {
      label: "FAQs added",
      complete: Boolean(settings.faqs && settings.faqs.length > 0),
      href: "faqs",
    },
    {
      label: "About section",
      complete: Boolean(settings.aboutBody?.trim() || tenant.aboutUs?.trim()),
      href: "about",
    },
    {
      label: "Business hours on website",
      complete: tenantHasConfiguredHours(tenant.hours),
      href: "business-hours",
    },
    {
      label: "Business contact complete",
      complete: Boolean(tenant.primaryPhone && tenant.email),
      href: "../settings",
    },
  ];
}

export function getWebsiteBuilderProgressPercent(tenant: Tenant): {
  completedCount: number;
  totalCount: number;
  percent: number;
} {
  const items = getWebsiteBuilderProgress(tenant).filter(
    (item) => item.countsTowardReadiness !== false
  );
  const completedCount = items.filter((item) => item.complete).length;
  const totalCount = items.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return { completedCount, totalCount, percent };
}
