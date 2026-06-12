import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserTenantMembership } from "@/lib/auth/tenantAccess";
import { getTenantBySlug } from "@/lib/db/tenants";

type Props = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

function displayValue(value?: string | null) {
  return value && value.trim() ? value : "Not provided";
}

export default async function AccountPage({ params }: Props) {
  const { tenantSlug } = await params;

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    redirect("/unauthorized");
  }

  const membership = await getUserTenantMembership({
    userId: user.id,
    tenantSlug,
  });

  if (!membership) {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Account"
        description="Manage your profile, business contact details, and account status."
      />

      <div className="grid w-full max-w-6xl gap-6 xl:grid-cols-2">    
        <section className="rounded-2xl border border-stone-200/50 bg-white/90 p-5 shadow-[0_8px_24px_rgba(17,24,39,0.045)]">
          <h2 className="text-base font-semibold text-gray-950">Profile</h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email
              </p>
              <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
                {user.email}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Role
              </p>
              <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
                {membership.role}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200/50 bg-white/90 p-5 shadow-[0_8px_24px_rgba(17,24,39,0.045)]">
          <h2 className="text-base font-semibold text-gray-950">
            Business Contact
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Business Name
              </p>
              <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
                {displayValue(tenant.businessName)}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Phone
              </p>
              <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
                {displayValue(tenant.primaryPhone)}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Business Email
              </p>
              <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
                {displayValue(tenant.email)}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Address
              </p>
              <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
                {displayValue(
                  [tenant.addressLine1, tenant.city, tenant.state, tenant.zip]
                    .filter(Boolean)
                    .join(", ")
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200/50 bg-white/90 p-5 shadow-[0_8px_24px_rgba(17,24,39,0.045)] xl:col-span-2">
          <h2 className="text-base font-semibold text-gray-950">
            Subscription
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Billing and subscription management will be available after payment
            setup is added.
          </p>
        </section>
      </div>
    </div>
  );
}