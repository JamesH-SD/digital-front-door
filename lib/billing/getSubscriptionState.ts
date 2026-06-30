import { createAdminClient } from "@/lib/supabase/admin";

export type SubscriptionState = {
  status: string;
  isActive: boolean;
  isTrialing: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
  trialEndsAt: string | null;
};

export async function getSubscriptionState(
  tenantSlug: string
): Promise<SubscriptionState> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_billing")
    .select("subscription_status, trial_ends_at")
    .eq("tenant_slug", tenantSlug)
    .maybeSingle();

  if (error) {
    console.error("Subscription state error:", error.message);
  }

  const status = data?.subscription_status || "unknown";
  const trialEndsAt = data?.trial_ends_at || null;

  const trialEndDate = trialEndsAt ? new Date(trialEndsAt) : null;
  const now = Date.now();

  const daysRemaining =
    trialEndDate && trialEndDate.getTime() > now
      ? Math.ceil((trialEndDate.getTime() - now) / (1000 * 60 * 60 * 24))
      : trialEndDate
      ? 0
      : null;

  const isTrialing =
    status === "trialing" && !!trialEndDate && trialEndDate.getTime() > now;

  const isActive = status === "active" || isTrialing || status === "past_due";

  const isExpired =
    status === "trialing" && !!trialEndDate && trialEndDate.getTime() <= now;

  return {
    status,
    isActive,
    isTrialing,
    isExpired,
    daysRemaining,
    trialEndsAt,
  };
}