import { createAdminClient } from "@/lib/supabase/admin";

export type ContactorCustomer = {
  id: string;
  slug: string;
  businessName: string;
  email: string | null;
  phone: string | null;
  websiteStatus: string;
  createdAt: string | null;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
};

export async function getContactorCustomers(): Promise<ContactorCustomer[]> {
  const supabase = createAdminClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, slug, business_name, email, primary_phone, website_status, created_at")
    .order("created_at", { ascending: false });

  const { data: billing } = await supabase
    .from("tenant_billing")
    .select("tenant_slug, subscription_status, trial_ends_at");

  const billingBySlug = new Map(
    (billing || []).map((item) => [item.tenant_slug, item])
  );

  return (tenants || []).map((tenant) => {
    const billingRow = billingBySlug.get(tenant.slug);

    return {
      id: tenant.id,
      slug: tenant.slug,
      businessName: tenant.business_name,
      email: tenant.email,
      phone: tenant.primary_phone,
      websiteStatus: tenant.website_status || "draft",
      createdAt: tenant.created_at,
      subscriptionStatus: billingRow?.subscription_status || null,
      trialEndsAt: billingRow?.trial_ends_at || null,
    };
  });
}