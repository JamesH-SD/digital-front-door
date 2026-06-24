import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import WebsiteSettingsPanel, {
  type WebsitePanelSection,
} from "@/components/admin/settings/WebsiteSettingsPanel";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminBreadcrumbsSetter from "@/components/admin/AdminBreadcrumbsSetter";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
    section: string;
  }>;
};

const sectionMap: Record<
  string,
  {
    panelSections: WebsitePanelSection[];
    title: string;
    description: string;
  }
> = {
  brand: {
    panelSections: ["brand", "socialLinks"],
    title: "Website Brand",
    description: "Manage the logo, website colors, and social profile links.",
  },
  hero: {
    panelSections: ["hero"],
    title: "Hero Section",
    description: "Manage the first section customers see.",
  },
  "why-us": {
    panelSections: ["whyUs"],
    title: "Why Us Section",
    description: "Manage trust points and the supporting image.",
  },
  services: {
    panelSections: ["services"],
    title: "Services Section",
    description: "Manage service cards, images, descriptions, and visibility.",
  },
  "project-gallery": {
    panelSections: ["projectGallery"],
    title: "Project Gallery",
    description: "Manage project photos shown below Services on the public website.",
  },
  banner: {
    panelSections: ["banner"],
    title: "CTA Banner",
    description: "Manage the mid-page call-to-action section.",
  },
  "service-areas": {
    panelSections: ["serviceAreas"],
    title: "Service Areas Section",
    description: "Manage service area heading and section title.",
  },
  about: {
    panelSections: ["about"],
    title: "About Section",
    description: "Manage about text, CTA label, and image.",
  },
  reviews: {
    panelSections: ["reviews"],
    title: "Reviews Section",
    description: "Manage review heading and section title.",
  },
  faqs: {
    panelSections: ["faqs"],
    title: "FAQs Section",
    description: "Manage FAQ heading, description, and CTA label.",
  },
  "social-links": {
    panelSections: ["socialLinks"],
    title: "Social Links",
    description: "Manage social and business profile links.",
  },
};

export default async function WebsiteSectionPage({ params }: PageProps) {
  const { tenantSlug, section } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const sectionConfig = sectionMap[section];

  if (!sectionConfig) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbsSetter
        items={[
          {
            label: "Website",
            href: `/admin/${tenant.slug}/website`,
          },
          {
            label: sectionConfig.title,
          },
        ]}
      />
      <AdminPageHeader
        title={sectionConfig.title}
        description={sectionConfig.description}
      />

      <WebsiteSettingsPanel
        tenantSlug={tenant.slug}
        initialSettings={{
          ...(tenant.websiteSettings || {}),
        }}
        visibleSections={sectionConfig.panelSections}
        title={sectionConfig.title}
        description={sectionConfig.description}
      />
    </div>
  );
}