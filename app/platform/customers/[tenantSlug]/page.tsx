import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlatformCustomerDetail } from "@/lib/db/platform-customer";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

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

export default async function PlatformCustomerDetailPage({
  params,
}: PageProps) {
  const { tenantSlug } = await params;
  const customer = await getPlatformCustomerDetail(tenantSlug);

  if (!customer) {
    notFound();
  }

  const { tenant, billing, users, readiness, healthScore } = customer;

  const healthTone =
    healthScore >= 80 ? "green" : healthScore >= 50 ? "amber" : "red";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/platform/customers"
              className="text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              ← Back to Customers
            </Link>

            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-orange-700">
              Customer Account
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-950">
              {tenant.businessName}
            </h1>

            <p className="mt-2 text-sm text-gray-600">{tenant.slug}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/${tenant.slug}?supportMode=1`}
              className="saas-button-accent px-4 py-2 text-sm font-semibold"
            >
              Open Support View
            </Link>

            <Link
              href={`/admin/${tenant.slug}/settings?supportMode=1`}
              className="saas-button-secondary px-4 py-2 text-sm font-semibold"
            >
              Update Business Info
            </Link>

            <Link
              href={`/admin/${tenant.slug}/billing?supportMode=1`}
              className="saas-button-secondary px-4 py-2 text-sm font-semibold"
            >
              Manage Billing
            </Link>

            <Link
              href={`/${tenant.slug}?preview=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="saas-button-secondary px-4 py-2 text-sm font-semibold"
            >
              View Website ↗
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">
            Health Score
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-950">
            {healthScore}%
          </p>
          <div className="mt-3">
            <StatusBadge value={healthTone} tone={healthTone} />
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Website</p>
          <div className="mt-3">
            <StatusBadge
              value={tenant.websiteStatus || "draft"}
              tone={tenant.websiteStatus === "published" ? "green" : "amber"}
            />
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Published: {formatDate(tenant.websitePublishedAt)}
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Billing</p>
          <div className="mt-3">
            <StatusBadge
              value={billing?.subscriptionStatus || "none"}
              tone={
                billing?.subscriptionStatus === "active" ||
                billing?.subscriptionStatus === "trialing"
                  ? "green"
                  : "neutral"
              }
            />
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Trial ends: {formatDate(billing?.trialEndsAt)}
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Users</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">
            {users.length}
          </p>
          <p className="mt-3 text-sm text-gray-600">Workspace users</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-950">
            Customer Profile
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Business Email
              </p>
              <p className="mt-1 text-gray-900">{tenant.email || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Phone
              </p>
              <p className="mt-1 text-gray-900">
                {tenant.primaryPhone || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Address
              </p>
              <p className="mt-1 text-gray-900">
                {[tenant.addressLine1, tenant.city, tenant.state, tenant.zip]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Category
              </p>
              <p className="mt-1 text-gray-900">
                {tenant.primaryCategory || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-950">
            Launch Readiness
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Tracks the key setup steps that help customers get value from Contactor.
          </p>

          <div className="mt-5 space-y-3">
            {readiness.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-800">
                  {item.label}
                </span>

                <span
                  className={
                    item.complete
                      ? "text-xs font-bold text-emerald-700"
                      : "text-xs font-bold text-amber-700"
                  }
                >
                  {item.complete ? "Complete" : "Needs attention"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Workspace Users</h2>

        <div className="mt-5 divide-y divide-stone-100">
          {users.map((user) => (
            <div
              key={user.userId}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-950">
                  {user.email}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Added {formatDate(user.createdAt)}
                </p>
              </div>

              <StatusBadge value={user.role} tone="neutral" />
            </div>
          ))}

          {users.length === 0 ? (
            <p className="py-6 text-sm text-gray-500">No users found.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}