import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getLeadsByTenantSlug } from "@/lib/db/leads";
import AdminLeadListClient from "@/components/admin/AdminLeadListClient";

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

  const sortedLeads = [...leads].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const newLeadCount = sortedLeads.filter(
    (lead) => lead.status === "new"
  ).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Total Leads
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {sortedLeads.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            New Leads
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {newLeadCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Contacted
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {sortedLeads.filter((lead) => lead.status === "contacted").length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Booked
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {sortedLeads.filter((lead) => lead.status === "booked").length}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
          <p className="mt-1 text-sm text-gray-600">
            Review captured leads and open each one for full detail.
          </p>
        </div>

        <AdminLeadListClient tenantSlug={tenantSlug} leads={sortedLeads} />
      </section>
    </div>
  );
}