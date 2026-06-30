import Link from "next/link";
import type { SubscriptionState } from "@/lib/billing/getSubscriptionState";

type Props = {
  tenantSlug: string;
  subscriptionState?: SubscriptionState;
  children: React.ReactNode;
};

export default function SubscriptionLock({
  tenantSlug,
  subscriptionState,
  children,
}: Props) {
  if (!subscriptionState?.isExpired) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
      <p className="text-sm font-bold uppercase tracking-wide text-orange-700">
        Trial Expired
      </p>

      <h2 className="mt-2 text-2xl font-bold text-gray-950">
        Subscribe to continue using this feature.
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-7 text-orange-900">
        Your free trial has ended. Billing and account settings remain available,
        but editing website, AI receptionist, knowledge base, and lead management
        features requires an active subscription.
      </p>

      <Link
        href={`/admin/${tenantSlug}/billing`}
        className="saas-button-accent mt-5 inline-flex px-5 py-3 text-sm font-semibold"
      >
        View Billing
      </Link>
    </div>
  );
}