import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getLeadsByTenantSlug } from "@/lib/db/leads";
import AdminBreadcrumbsSetter from "@/components/admin/AdminBreadcrumbsSetter";
import { getDashboardAnalytics } from "@/lib/db/dashboard-analytics";
import { formatLeadSource } from "@/lib/utils/leadSource";

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

  const [leads, analytics] = await Promise.all([
    getLeadsByTenantSlug(tenantSlug),
    getDashboardAnalytics(tenantSlug),
  ]);

  const recentLeads = [...leads]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

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
            {analytics.totalLeads}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            All captured customer opportunities
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-4 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            New Leads
          </p>

          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {analytics.newLeads}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Leads waiting for review or follow-up
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-4 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Booked
          </p>

          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {analytics.bookedLeads}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Leads with a booked appointment
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/60 bg-white/90 px-5 py-4 shadow-[0_4px_14px_rgba(17,24,39,0.04)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Booking Rate
          </p>

          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {analytics.bookingRate.toFixed(1)}%
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Booked appointments divided by total leads
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200/60 bg-white/90 p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-950">
              Lead Source Performance
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              See where customers are finding your business and which sources
              are producing booked appointments.
            </p>
          </div>

          {analytics.topSource ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-3 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                Top Source
              </p>

              <p className="mt-1 text-sm font-bold text-gray-950">
                {formatLeadSource(analytics.topSource.source)}
              </p>

              <p className="mt-1 text-xs text-gray-600">
                {analytics.topSource.leadCount} lead
                {analytics.topSource.leadCount === 1 ? "" : "s"} ·{" "}
                {analytics.topSource.bookingRate.toFixed(1)}% booked
              </p>
            </div>
          ) : null}
        </div>

        {analytics.sourceCounts.length > 0 ? (
          <div className="mt-5 space-y-4">
            {analytics.sourceCounts.map((source) => {
              const percentage =
                analytics.totalLeads > 0
                  ? (source.leadCount / analytics.totalLeads) * 100
                  : 0;

              return (
                <div
                  key={source.source}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-950">
                        {formatLeadSource(source.source)}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {source.bookedCount} booked ·{" "}
                        {source.bookingRate.toFixed(1)}% booking rate
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-gray-700">
                      {source.leadCount} lead
                      {source.leadCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-[#d35400]"
                      style={{
                        width: `${Math.max(
                          percentage,
                          source.leadCount > 0 ? 3 : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-7 text-center">
            <p className="text-sm text-gray-500">
              Lead source performance will appear after your first lead is
              captured.
            </p>
          </div>
        )}
      </section>

      {analytics.campaignCount > 0 ? (
        <section className="rounded-3xl border border-stone-200/60 bg-white/90 p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-950">
                Campaign Performance
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Review how your campaigns are generating leads and booked
                appointments.
              </p>
            </div>

            <Link
              href={`/admin/${tenantSlug}/campaigns`}
              className="text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              View campaigns →
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Campaigns
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-950">
                {analytics.campaignCount}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {analytics.activeCampaignCount} active
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Campaign Leads
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-950">
                {analytics.campaignLeadCount}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Campaign Bookings
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-950">
                {analytics.campaignBookedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Campaign Booking Rate
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-950">
                {analytics.campaignBookingRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {analytics.topCampaign ? (
            <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                Top Campaign
              </p>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-bold text-gray-950">
                    {analytics.topCampaign.name}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {analytics.topCampaign.leadCount} lead
                    {analytics.topCampaign.leadCount === 1 ? "" : "s"} ·{" "}
                    {analytics.topCampaign.bookedCount} booked ·{" "}
                    {analytics.topCampaign.bookingRate.toFixed(1)}% booking
                    rate
                  </p>
                </div>

                <Link
                  href={`/admin/${tenantSlug}/campaigns`}
                  className="text-sm font-semibold text-orange-700 hover:text-orange-800"
                >
                  Review results →
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center">
              <p className="text-sm text-gray-500">
                Your campaign results will appear after a campaign generates
                its first lead.
              </p>
            </div>
          )}
        </section>
      ) : null}

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
              Manage billing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}