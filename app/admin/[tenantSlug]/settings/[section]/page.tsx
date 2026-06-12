import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import SettingsForm from "@/components/admin/settings/SettingsForm";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
    section: string;
  }>;
};

const sectionMap = {
  "service-area": {
    tab: "locationServiceArea",
    title: "Service Area",
    description:
      "Manage the business address, service area summary, service cities, and out-of-area messaging.",
  },
  hours: {
    tab: "businessHours",
    title: "Business Hours",
    description:
      "Set the days and times customers can expect your business to be available.",
  },
  calendar: {
    tab: "calendar",
    title: "Calendar",
    description:
      "Manage the calendar connection used for calls, site visits, and appointment scheduling.",
  },
} as const;

export default async function BusinessIdentitySectionPage({
  params,
}: PageProps) {
  const { tenantSlug, section } = await params;

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const sectionConfig = sectionMap[section as keyof typeof sectionMap];

  if (!sectionConfig) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={sectionConfig.title}
        description={sectionConfig.description}
      />

      <SettingsForm
        tenant={tenant}
        initialTab={sectionConfig.tab}
        showTabs={false}
      />
    </div>
  );
}