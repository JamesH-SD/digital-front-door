import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getLeadById } from "@/lib/db/leads";
import LeadDetailClient from "@/components/admin/LeadDetailClient";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
    leadId: string;
  }>;
};

/**
 * Formats a timestamp for display in the lead detail view.
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

export default async function LeadDetailPage({ params }: PageProps) {
  const { tenantSlug, leadId } = await params;

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const lead = await getLeadById(tenantSlug, leadId);

  if (!lead) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link
            href={`/admin/${tenantSlug}`}
            className="inline-flex text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            ← Back to leads
          </Link>

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Lead Details</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              {lead.customerName}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Captured {formatDate(lead.createdAt)}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Lead: {lead.leadNumber || lead.id}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <LeadDetailClient lead={lead} />
      </section>
    </main>
  );
}