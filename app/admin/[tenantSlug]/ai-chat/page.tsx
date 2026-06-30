import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import AiChatSettingsPanel from "@/components/admin/ai/AiChatSettingsPanel";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { getSubscriptionState } from "@/lib/billing/getSubscriptionState";
import TrialExpiredPage from "@/components/admin/billing/TrialExpiredPage";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function AiChatPage({ params }: PageProps) {
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
      title="AI Receptionist"
      description="Continue customizing your AI receptionist, lead capture workflow, scheduling, QR code, and customer conversation experience."
    />
  );
}

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AI Receptionist"
        description="Manage the AI receptionist, lead capture flow, QR links, chat settings, and customer conversation experience."
      />
      <AiChatSettingsPanel tenant={tenant} />
    </div>
  );
}