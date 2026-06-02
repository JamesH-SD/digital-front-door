import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import WebsiteSettingsPanel from "@/components/admin/settings/WebsiteSettingsPanel";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function WebsitePage({ params }: PageProps) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-950">Website</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the public website, branding, sections, services, images, and
          website content.
        </p>
      </div>

      <WebsiteSettingsPanel
        tenantSlug={tenant.slug}
        initialSettings={tenant.websiteSettings}
      />
    </div>
  );
}