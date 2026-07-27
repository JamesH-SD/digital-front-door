import { notFound, redirect } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getCampaignByQrSlug } from "@/lib/db/campaigns";

type Props = {
  params: Promise<{
    tenantSlug: string;
    qrSlug: string;
  }>;
};

export default async function CampaignPage({ params }: Props) {
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
    redirect(`/${tenantSlug}?openChat=1`);
  }

  redirect(
    `/${tenantSlug}?openChat=1&source=campaign&campaign=${campaign.id}`
  );
}