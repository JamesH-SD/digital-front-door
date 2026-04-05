import { notFound } from "next/navigation";
import LeadDetailClient from "@/components/admin/LeadDetailClient";
import { getLeadById } from "@/lib/db/leads";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
    leadId: string;
  }>;
};

export default async function LeadDetailPage({ params }: PageProps) {
  const { tenantSlug, leadId } = await params;

  const lead = await getLeadById(leadId);

  if (!lead || lead.tenantSlug !== tenantSlug) {
    notFound();
  }

  return <LeadDetailClient lead={lead} />;
}