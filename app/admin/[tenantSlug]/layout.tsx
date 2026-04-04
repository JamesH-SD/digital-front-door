import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/tenants";
import AdminShell from "@/components/admin/AdminShell";

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

  return (
    <AdminShell tenant={tenant}>
      {children}
    </AdminShell>
  );
}