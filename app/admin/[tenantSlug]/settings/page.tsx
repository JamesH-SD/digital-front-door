import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import SettingsForm from "@/components/admin/settings/SettingsForm";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function SettingsPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Business Identity"
        description="Manage the business profile, service area, services, hours, and calendar details used by the website and AI receptionist."
      />

      <SettingsForm
        tenant={tenant}
        initialTab="businessIdentity"
        showTabs={false}
      />
    </div>
  );
}