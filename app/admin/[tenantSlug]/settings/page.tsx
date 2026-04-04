import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import SettingsForm from "@/components/admin/settings/SettingsForm";

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
      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage your business profile, service area, services, and chat
            behavior from one place.
          </p>
        </div>

        <SettingsForm tenant={tenant} />
      </section>
    </div>
  );
}