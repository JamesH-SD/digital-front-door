import { notFound, redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserTenantMembership } from "@/lib/auth/tenantAccess";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    tenantSlug: string;
  }>;
};

export default async function AdminTenantLayout({
  children,
  params,
}: LayoutProps) {
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
  
  if (!membership) {
    redirect("/unauthorized");
  }

  return (
    <AdminShell
      tenant={tenant}
      user={{
        id: user.id,
        email: user.email || "User",
        role: membership.role,
      }}
    >
      {children}
    </AdminShell>
  );
}