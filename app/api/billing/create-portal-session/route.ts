import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getFirstUserTenantMembership } from "@/lib/auth/tenantAccess";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getFirstUserTenantMembership(user.id);

  if (!membership?.tenantSlug) {
    return NextResponse.json({ error: "No tenant found" }, { status: 404 });
  }

  const supabase = createAdminClient();

  const { data: billing } = await supabase
    .from("tenant_billing")
    .select("stripe_customer_id")
    .eq("tenant_slug", membership.tenantSlug)
    .maybeSingle();

  if (!billing?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer found" },
      { status: 404 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${siteUrl}/admin/${membership.tenantSlug}`,
  });

  return NextResponse.json({ url: session.url });
}