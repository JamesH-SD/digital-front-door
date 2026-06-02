import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import AiChatSettingsPanel from "@/components/admin/ai/AiChatSettingsPanel";

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
      <div>
        <h1 className="text-2xl font-semibold text-gray-950">AI & Chat</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the AI receptionist, lead capture flow, QR links, chat settings,
          and customer conversation experience.
        </p>
      </div>

      <AiChatSettingsPanel tenant={tenant} />
    </div>
  );
}