import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

type PlatformRole = "owner" | "support" | null | undefined;

export async function requireActiveSubscription({
  tenantSlug,
  platformRole,
  pathname,
}: {
  tenantSlug: string;
  platformRole?: PlatformRole;
  pathname?: string;
}) {
  // Contactor/platform staff can always access tenant workspaces.
//   if (platformRole) return;

  // Never block the billing page itself or you create a redirect loop.
  if (pathname?.includes("/billing")) return;

  const supabase = createAdminClient();

  const { data: billing, error } = await supabase
    .from("tenant_billing")
    .select("subscription_status, trial_ends_at")
    .eq("tenant_slug", tenantSlug)
    .maybeSingle();

  if (error) {
    console.error("Billing access check error:", error.message);
    redirect(`/admin/${tenantSlug}/billing?billing=check_failed`);
  }

  const status = billing?.subscription_status;
  const trialEndsAt = billing?.trial_ends_at
    ? new Date(billing.trial_ends_at)
    : null;

    const trialActive =
    status === "trialing" && trialEndsAt && trialEndsAt.getTime() > Date.now();
  
    const subscriptionActive =
        status === "active" || status === "past_due";
    
    if (trialActive || subscriptionActive) {
        return;
    }

  redirect(`/admin/${tenantSlug}/billing?billing=required`);
}