import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getLeadsByTenantSlug } from "@/lib/db/leads";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function AdminTenantPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  const leads = await getLeadsByTenantSlug(tenantSlug);

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {tenant.businessName} Admin
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Leads captured from the Digital Front Door chat flow.
          </p>
        </div>

        <div className="rounded-2xl border shadow-sm overflow-hidden">
          <div className="grid grid-cols-6 gap-4 border-b bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
            <div>Name</div>
            <div>Contact</div>
            <div>Project</div>
            <div>Location</div>
            <div>Timeline</div>
            <div>Status</div>
          </div>

          {leads.length === 0 ? (
            <div className="px-4 py-8 text-sm text-gray-500">
              No leads captured yet.
            </div>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                className="grid grid-cols-6 gap-4 border-b px-4 py-4 text-sm text-gray-700"
              >
                <div>{lead.customerName}</div>
                <div>{lead.contact}</div>
                <div>{lead.projectType}</div>
                <div>{lead.location}</div>
                <div>{lead.timeline}</div>
                <div className="font-medium capitalize">{lead.status}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}