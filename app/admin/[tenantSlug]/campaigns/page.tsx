import CampaignManager from "@/components/admin/campaigns/CampaignManager";

type Props = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function CampaignsPage({ params }: Props) {
  const { tenantSlug } = await params;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
          AI Receptionist
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
          Campaigns
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Create focused AI receptionist experiences for promotions, events,
          offers, and other temporary campaigns. Campaign content remains
          separate from your public website.
        </p>
      </div>

      <CampaignManager tenantSlug={tenantSlug} />
    </div>
  );
}