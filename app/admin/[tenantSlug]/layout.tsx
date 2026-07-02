import { notFound, redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserTenantMembership } from "@/lib/auth/tenantAccess";
import { getPlatformAdminRole } from "@/lib/auth/platformAccess";
import { getSubscriptionState } from "@/lib/billing/getSubscriptionState";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    tenantSlug: string;
  }>;
  searchParams?: Promise<{
    supportMode?: string;
  }>;
};

export default async function AdminTenantLayout({
  children,
  params,
  searchParams,
}: LayoutProps) {

  const query = searchParams ? await searchParams : {};

  const supportMode = query.supportMode === "1";

  const { tenantSlug } = await params;

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getUserTenantMembership({
    userId: user.id,
    tenantSlug,
  });

  const platformRole = await getPlatformAdminRole(user.id);
  
  if (!membership && !platformRole) {
    redirect("/unauthorized");
  }

  const subscriptionState = await getSubscriptionState(tenantSlug);

  return (
    <AdminShell
      tenant={tenant}
      supportMode={supportMode}
      subscriptionState={subscriptionState}
      user={{
        id: user.id,
        email: user.email || "User",
        role: membership?.role || "admin",
        platformRole,
      }}
    >
      {children}
    </AdminShell>
  );
}