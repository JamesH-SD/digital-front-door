import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import TenantKnowledgeManager from "@/components/admin/settings/TenantKnowledgeManager";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { getSubscriptionState } from "@/lib/billing/getSubscriptionState";
import TrialExpiredPage from "@/components/admin/billing/TrialExpiredPage";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function KnowledgeBasePage({ params }: PageProps) {
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
      title="Knowledge Base"
      description="Continue uploading documents, FAQs, policies, and business knowledge used by your AI receptionist."
    />
  );
}

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Knowledge Base"
        description="Manage documents, FAQs, policies, and business knowledge the AI receptionist can use when answering customer questions."
      />
      <TenantKnowledgeManager tenantSlug={tenant.slug} />
    </div>
  );
}