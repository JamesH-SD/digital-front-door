import { notFound } from "next/navigation";
import LeadDetailClient from "@/components/admin/LeadDetailClient";
import { getLeadById } from "@/lib/db/leads";
import { getLeadActivities } from "@/lib/db/lead-activities";
import AdminBreadcrumbsSetter from "@/components/admin/AdminBreadcrumbsSetter";

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

  const activities = await getLeadActivities(lead.id);

  return (
    <>
      <AdminBreadcrumbsSetter
        items={[
          { label: "Admin" },
          { label: "Leads", href: `/admin/${tenantSlug}` },
          { label: lead.leadNumber || "Lead" },
        ]}
      />

      <LeadDetailClient lead={lead} activities={activities} />
    </>
  );
}