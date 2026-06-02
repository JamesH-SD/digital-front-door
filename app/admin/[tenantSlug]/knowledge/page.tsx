import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import TenantKnowledgeManager from "@/components/admin/settings/TenantKnowledgeManager";

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
      <div>
        <h1 className="text-2xl font-semibold text-gray-950">
          Knowledge Base
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage documents, FAQs, policies, and business knowledge the AI
          receptionist can use when answering customer questions.
        </p>
      </div>

      <TenantKnowledgeManager tenantSlug={tenant.slug} />
    </div>
  );
}