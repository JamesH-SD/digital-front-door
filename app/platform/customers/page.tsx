import Link from "next/link";
import { getContactorCustomers } from "@/lib/db/contactor-customers";

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StatusBadge({
  value,
  tone = "neutral",
}: {
  value: string;
  tone?: "neutral" | "green" | "amber" | "red" | "orange";
}) {
  const classes = {
    neutral: "bg-stone-100 text-gray-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${classes[tone]}`}
    >
      {value}
    </span>
  );
}

function getBillingTone(status?: string | null) {
  if (status === "active" || status === "trialing") return "green";
  if (status === "past_due") return "amber";
  if (status === "canceled" || status === "unpaid") return "red";
  return "neutral";
}

function getWebsiteTone(status?: string | null) {
  if (status === "published") return "green";
  if (status === "draft") return "amber";
  return "neutral";
}

export default async function ContactorCustomersPage() {
  const customers = await getContactorCustomers();

  const total = customers.length;
  const published = customers.filter((c) => c.websiteStatus === "published").length;
  const trialing = customers.filter((c) => c.subscriptionStatus === "trialing").length;
  const active = customers.filter((c) => c.subscriptionStatus === "active").length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
          Contactor Admin
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-950">Customers</h1>

        <p className="mt-2 text-sm text-gray-600">
          Internal customer view for soft-launch support.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Tenants</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{total}</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Published</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{published}</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Trialing</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{trialing}</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Active</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{active}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="font-bold text-gray-950">Tenant Accounts</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review tenant status and open support view when needed.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3">Trial Ends</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Links</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-orange-50/40">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-gray-950">
                      {customer.businessName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{customer.slug}</p>
                  </td>

                  <td className="px-4 py-4 text-gray-700">
                    {customer.email || "—"}
                  </td>

                  <td className="px-4 py-4 text-gray-700">
                    {customer.phone || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge
                      value={customer.websiteStatus || "unknown"}
                      tone={getWebsiteTone(customer.websiteStatus)}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge
                      value={customer.subscriptionStatus || "none"}
                      tone={getBillingTone(customer.subscriptionStatus)}
                    />
                  </td>

                  <td className="px-4 py-4 text-gray-700">
                    {formatDate(customer.trialEndsAt)}
                  </td>

                  <td className="px-4 py-4 text-gray-700">
                    {formatDate(customer.createdAt)}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/${customer.slug}?supportMode=1`}
                        className="font-semibold text-orange-700 hover:text-orange-800"
                      >
                        Support →
                      </Link>

                      <Link
                        href={`/${customer.slug}?preview=true`}
                        target="_blank"
                        className="font-semibold text-gray-600 hover:text-gray-900"
                      >
                        Website →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}