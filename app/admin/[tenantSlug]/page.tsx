import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getLeadsByTenantSlug } from "@/lib/db/leads";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

/**
 * Formats ISO timestamps into a readable date/time for the admin UI.
 */
function formatDate(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Returns Tailwind classes for lead status badges.
 * This keeps badge styling centralized and easy to update later.
 */
function getStatusClasses(status: string) {
  switch (status) {
    case "new":
      return "bg-green-100 text-green-700 border-green-200";
    case "contacted":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "booked":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "closed":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default async function AdminTenantPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  // Validate the tenant before rendering the admin page.
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  // Load all leads for this tenant.
  const leads = await getLeadsByTenantSlug(tenantSlug);

  // Sort newest first so recent opportunities are shown at the top.
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
        {sortedLeads.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              No leads captured yet
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Once a visitor completes the chat intake flow, their lead will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="hidden grid-cols-6 gap-4 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid">
              <div>Lead</div>
              <div>Name</div>
              <div>Project</div>
              <div>Location</div>
              <div>Status</div>
              <div>Created</div>
            </div>

            <div>
              {sortedLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/${tenantSlug}/leads/${lead.id}`}
                  className="block border-b px-4 py-4 transition hover:bg-gray-50"
                >
                  {/* Mobile layout */}
                  <div className="space-y-2 md:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {lead.leadNumber || lead.id}
                        </p>
                        <h2 className="mt-1 text-sm font-semibold text-gray-900">
                          {lead.customerName}
                        </h2>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>{lead.projectType}</p>
                      <p>{lead.location}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(lead.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden grid-cols-6 gap-4 md:grid">
                    <div className="text-sm text-gray-600">{lead.leadNumber || lead.id}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {lead.customerName}
                    </div>
                    <div className="text-sm text-gray-600">{lead.projectType}</div>
                    <div className="text-sm text-gray-600">{lead.location}</div>
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(lead.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}