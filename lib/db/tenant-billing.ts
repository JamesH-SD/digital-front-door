import { createAdminClient } from "@/lib/supabase/admin";

export type TenantBillingStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | string;

export type TenantBilling = {
  tenantSlug: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus: TenantBillingStatus;
  priceId?: string | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
};

export async function getTenantBillingBySlug(
  tenantSlug: string
): Promise<TenantBilling | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_billing")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching tenant billing:", error);
    return null;
  }

  if (!data) return null;

  return {
    tenantSlug: data.tenant_slug,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    subscriptionStatus: data.subscription_status,
    priceId: data.price_id,
    trialEndsAt: data.trial_ends_at,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
  };
}