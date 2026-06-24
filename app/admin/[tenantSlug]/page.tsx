import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getLeadsByTenantSlug } from "@/lib/db/leads";
import AdminBreadcrumbsSetter from "@/components/admin/AdminBreadcrumbsSetter";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function AdminDashboardPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const leads = await getLeadsByTenantSlug(tenantSlug);

  const recentLeads = [...leads]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const newLeadCount = leads.filter((lead) => lead.status === "new").length;
  const bookedLeadCount = leads.filter((lead) => lead.status === "booked").length;

  return (
    <div className="space-y-5">
      <AdminBreadcrumbsSetter items={[{ label: "Dashboard" }]} />
      <section className="rounded-3xl border border-stone-200/60 bg-white/90 p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
          Dashboard
        </p>

        <h2 className="mt-2 text-2xl font-bold text-gray-950">
          Welcome to Contactor
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          This is your command center for leads, website setup, AI settings,
          knowledge base, scheduling, and billing.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/admin/${tenantSlug}/website`}
            className="saas-button-accent px-4 py-2 text-sm font-semibold"
          >
            Customize website
          </Link>

          <Link
            href={`/admin/${tenantSlug}/knowledge`}
            className="saas-button-secondary px-4 py-2 text-sm font-semibold"
          >
            Upload knowledge
          </Link>

          <Link
            href={`/admin/${tenantSlug}/ai-chat`}
            className="saas-button-secondary px-4 py-2 text-sm font-semibold"
          >
            Test AI
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-4 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Total Leads
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {leads.length}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-4 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            New Leads
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {newLeadCount}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-4 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Booked
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {bookedLeadCount}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-4 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Billing
          </p>
          <Link
            href={`/admin/${tenantSlug}/billing`}
            className="mt-2 inline-flex text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            Manage subscription →
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl border border-stone-200/60 bg-white/90 p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-950">
                Recent leads
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                The latest customer conversations captured by your AI.
              </p>
            </div>

            <Link
              href={`/admin/${tenantSlug}/leads`}
              className="text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentLeads.length ? (
              recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/${tenantSlug}/leads/${lead.id}`}
                  className="block rounded-2xl border border-stone-200 bg-white px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50/40"
                >
                  <p className="text-sm font-semibold text-gray-950">
                    {lead.customerName || "Unknown customer"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {lead.projectType || "No project type"} ·{" "}
                    {lead.status || "new"}
                  </p>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-gray-500">
                No leads yet. Test the AI chat or launch your website to start
                capturing customers.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200/60 bg-white/90 p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
          <h3 className="text-base font-bold text-gray-950">Launch checklist</h3>

          <div className="mt-4 space-y-3 text-sm">
            <Link
              href={`/admin/${tenantSlug}/website`}
              className="block rounded-2xl border border-stone-200 bg-white px-4 py-3 hover:border-orange-200 hover:bg-orange-50/40"
            >
              Customize your website
            </Link>

            <Link
              href={`/admin/${tenantSlug}/knowledge`}
              className="block rounded-2xl border border-stone-200 bg-white px-4 py-3 hover:border-orange-200 hover:bg-orange-50/40"
            >
              Upload FAQs and business information
            </Link>

            <Link
              href={`/admin/${tenantSlug}/settings/calendar`}
              className="block rounded-2xl border border-stone-200 bg-white px-4 py-3 hover:border-orange-200 hover:bg-orange-50/40"
            >
              Connect Google Calendar
            </Link>

            <Link
              href={`/admin/${tenantSlug}/billing`}
              className="block rounded-2xl border border-stone-200 bg-white px-4 py-3 hover:border-orange-200 hover:bg-orange-50/40"
            >
              Start your 7-day free trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}