import { getTenantBySlug } from "@/lib/db/tenants";
import { getTenantBillingBySlug } from "@/lib/db/tenant-billing";
import { getTenantUsers } from "@/lib/db/tenant-users";

export type PlatformCustomerDetail = {
  tenant: NonNullable<Awaited<ReturnType<typeof getTenantBySlug>>>;
  billing: Awaited<ReturnType<typeof getTenantBillingBySlug>>;
  users: Awaited<ReturnType<typeof getTenantUsers>>;
  readiness: {
    label: string;
    complete: boolean;
  }[];
  healthScore: number;
};

export async function getPlatformCustomerDetail(
  tenantSlug: string
): Promise<PlatformCustomerDetail | null> {
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) return null;

  const billing = await getTenantBillingBySlug(tenantSlug);
  const users = await getTenantUsers(tenantSlug);

  const settings = tenant.websiteSettings || {};

  const readiness = [
    {
      label: "Billing started",
      complete:
        billing?.subscriptionStatus === "trialing" ||
        billing?.subscriptionStatus === "active",
    },
    {
      label: "Website published",
      complete: tenant.websiteStatus === "published",
    },
    {
      label: "Logo uploaded",
      complete: Boolean(settings.logoUrl),
    },
    {
      label: "Services added",
      complete: Boolean(
        settings.services?.length || tenant.servicesOffered?.length
      ),
    },
    {
      label: "FAQs added",
      complete: Boolean(settings.faqs?.length),
    },
    {
      label: "Business contact complete",
      complete: Boolean(tenant.primaryPhone && tenant.email),
    },
    {
      label: "User account active",
      complete: users.length > 0,
    },
  ];

  const completeCount = readiness.filter((item) => item.complete).length;
  const healthScore = Math.round((completeCount / readiness.length) * 100);

  return {
    tenant,
    billing,
    users,
    readiness,
    healthScore,
  };
}