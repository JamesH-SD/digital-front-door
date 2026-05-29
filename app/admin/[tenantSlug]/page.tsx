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
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-3 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Total Leads
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {sortedLeads.length}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-3 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            New Leads
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {newLeadCount}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-3 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Contacted
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {sortedLeads.filter((lead) => lead.status === "contacted").length}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-3 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Booked
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {sortedLeads.filter((lead) => lead.status === "booked").length}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200/60 bg-white/90 p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)] sm:p-6">
        <AdminLeadListClient tenantSlug={tenantSlug} leads={sortedLeads} />
      </section>
    </div>
  );
}