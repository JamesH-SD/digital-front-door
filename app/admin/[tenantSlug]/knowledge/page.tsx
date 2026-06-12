import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import TenantKnowledgeManager from "@/components/admin/settings/TenantKnowledgeManager";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";

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