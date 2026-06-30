import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import SettingsForm from "@/components/admin/settings/SettingsForm";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { getSubscriptionState } from "@/lib/billing/getSubscriptionState";
import TrialExpiredPage from "@/components/admin/billing/TrialExpiredPage";

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

  const subscriptionState = await getSubscriptionState(tenantSlug);

if (subscriptionState.isExpired) {
  return (
    <TrialExpiredPage
      tenantSlug={tenantSlug}
      title="Business Settings"
      description="Continue managing your business profile, services, hours, service area, branding, and company information."
    />
  );
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