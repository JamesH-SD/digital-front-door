import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import AiChatSettingsPanel from "@/components/admin/ai/AiChatSettingsPanel";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";

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