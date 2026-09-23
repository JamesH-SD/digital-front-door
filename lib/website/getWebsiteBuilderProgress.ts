import type { Tenant } from "@/lib/types/tenant";

export type WebsiteBuilderProgressItem = {
  label: string;
  complete: boolean;
  href: string;
};

/**
 * Website Builder setup/polish checklist — not Tenant Setup Readiness (see D-029).
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
      complete: Boolean(settings.heroHeadline),
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
      label: "About section",
      complete: Boolean(settings.aboutBody),
      href: "about",
    },
    {
      label: "FAQs added",
      complete: Boolean(settings.faqs && settings.faqs.length > 0),
      href: "faqs",
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
  const items = getWebsiteBuilderProgress(tenant);
  const completedCount = items.filter((item) => item.complete).length;
  const totalCount = items.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return { completedCount, totalCount, percent };
}
