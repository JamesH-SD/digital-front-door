import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getCampaignByQrSlug } from "@/lib/db/campaigns";
import { TenantWebsite } from "@/components/tenant/TenantWebsite";
import { buildPublicTenantView } from "@/lib/website/publicTenant";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
    qrSlug: string;
  }>;
};

export default async function CampaignPage({ params }: PageProps) {
  const { tenantSlug, qrSlug } = await params;

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const campaign = await getCampaignByQrSlug({
    tenantSlug,
    qrSlug,
  });

  if (!campaign) {
    notFound();
  }

  if (tenant.websiteStatus !== "published") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
        <div className="max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-950">
            Website Coming Soon
          </h1>

          <p className="mt-3 text-sm leading-7 text-gray-600">
            This business website has not been published yet.
          </p>
        </div>
      </main>
    );
  }

  return (
    <TenantWebsite
      tenant={buildPublicTenantView(tenant)}
      leadSource="campaign"
      campaignId={campaign.id}
      autoOpenChat
      isPreview={false}
    />
  );
}