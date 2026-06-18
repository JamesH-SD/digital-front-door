import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getFirstUserTenantMembership } from "@/lib/auth/tenantAccess";

export async function POST() {
  const user = await getCurrentUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getFirstUserTenantMembership(user.id);

  if (!membership?.tenantSlug) {
    return NextResponse.json({ error: "No tenant found" }, { status: 404 });
  }

  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug,business_name")
    .eq("slug", membership.tenantSlug)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { data: billing } = await supabase
    .from("tenant_billing")
    .select("stripe_customer_id")
    .eq("tenant_slug", tenant.slug)
    .maybeSingle();

  let customerId = billing?.stripe_customer_id || null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: tenant.business_name || tenant.slug,
      metadata: {
        tenantSlug: tenant.slug,
        userId: user.id,
      },
    });

    customerId = customer.id;

    await supabase.from("tenant_billing").upsert(
      {
        tenant_slug: tenant.slug,
        stripe_customer_id: customerId,
        subscription_status: "inactive",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_slug" }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    return NextResponse.json(
      { error: "Missing STRIPE_PRICE_ID" },
      { status: 500 }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: tenant.slug,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        tenantSlug: tenant.slug,
        userId: user.id,
      },
    },
    metadata: {
      tenantSlug: tenant.slug,
      userId: user.id,
    },
    success_url: `${siteUrl}/admin/${tenant.slug}/billing?billing=success`,
    cancel_url: `${siteUrl}/admin/${tenant.slug}/billing?billing=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}