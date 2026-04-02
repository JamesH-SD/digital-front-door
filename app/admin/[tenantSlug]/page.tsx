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

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Admin Dashboard</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                {tenant.businessName}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Review captured leads and open each one for full detail.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  {sortedLeads.filter((lead) => lead.status === "new").length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <AdminLeadListClient tenantSlug={tenantSlug} leads={sortedLeads} />
      </section>
    </main>
  );
}