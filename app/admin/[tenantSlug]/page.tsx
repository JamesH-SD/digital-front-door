import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getLeadsByTenantSlug } from "@/lib/db/leads";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

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

function getStatusClasses(status: string) {
  switch (status) {
    case "new":
      return "bg-green-100 text-green-700 border-green-200";
    case "contacted":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "closed":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default async function AdminTenantPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const leads = await getLeadsByTenantSlug(tenantSlug);

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Admin Dashboard</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                {tenant.businessName}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                View and manage leads captured from your Digital Front Door.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Total Leads
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {leads.length}
                </p>
              </div>

              <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  New Leads
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {leads.filter((lead) => lead.status === "new").length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              No leads captured yet
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Once visitors complete the chat intake flow, new leads will appear
              here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {leads.map((lead) => (
              <article
                key={lead.id}
                className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {lead.customerName}
                      </h2>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusClasses(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      Captured {formatDate(lead.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                    <p className="font-medium text-gray-900">Contact</p>
                    <p className="mt-1 text-gray-700">{lead.contact}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Project Type
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {lead.projectType}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Location
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {lead.location}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Timeline
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {lead.timeline}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}