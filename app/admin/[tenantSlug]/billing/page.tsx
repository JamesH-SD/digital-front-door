export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getTenantBillingBySlug } from "@/lib/db/tenant-billing";
import BillingStatusBanner from "@/components/admin/BillingStatusBanner";
import { getSubscriptionState } from "@/lib/billing/getSubscriptionState";

type PageProps = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function AdminBillingPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const billing = await getTenantBillingBySlug(tenantSlug);
  const subscriptionState = await getSubscriptionState(tenantSlug);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-stone-200/60 bg-white/90 p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
          Billing
        </p>

        <h2 className="mt-2 text-2xl font-bold text-gray-950">
          Subscription & trial
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Manage your Contactor subscription, start your 7-day free trial, or
          update billing details.
        </p>
      </section>

      <BillingStatusBanner
        billing={billing}
        subscriptionState={subscriptionState}
      />

      <section className="rounded-3xl border border-stone-200/60 bg-white/90 p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
        <h3 className="text-base font-bold text-gray-950">
          What is included?
        </h3>

        <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
          <p>✓ AI receptionist</p>
          <p>✓ Website tools</p>
          <p>✓ Lead capture</p>
          <p>✓ Scheduling support</p>
          <p>✓ Knowledge base</p>
          <p>✓ Project gallery</p>
          <p>✓ No hidden usage fees</p>
          <p>✓ Cancel anytime</p>
        </div>
      </section>
    </div>
  );
}