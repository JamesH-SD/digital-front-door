"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Tenant } from "@/lib/types/tenant";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  AdminBreadcrumbsProvider,
  BreadcrumbItem,
  useAdminBreadcrumbs,
} from "@/components/admin/AdminBreadcrumbsContext";
import CalendarConnectionStatus from "@/components/admin/CalendarConnectionStatus";
import AdminUserMenu from "@/components/auth/AdminUserMenu";

type AdminUser = {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
};

type AdminShellProps = {
  tenant: Tenant;
  children: React.ReactNode
  user: AdminUser;
};

function formatSegmentLabel(segment: string) {
  if (!segment) return "";

  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildBreadcrumbs(
  pathname: string,
  tenantSlug: string
): BreadcrumbItem[] {
  const normalized = pathname.split("?")[0];
  const parts = normalized.split("/").filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Admin",
    },
  ];

  const tenantIndex = parts.findIndex((part) => part === tenantSlug);

  if (tenantIndex === -1) {
    return breadcrumbs;
  }

  const routeParts = parts.slice(tenantIndex + 1);

  if (routeParts.length === 0) {
    breadcrumbs.push({
      label: "Leads",
    });

    return breadcrumbs;
  }

  const leadsListHref = `/admin/${tenantSlug}`;

  routeParts.forEach((part, index) => {
    const isLast = index === routeParts.length - 1;
    const isLikelyId =
      part.length > 20 ||
      part.startsWith("lead_") ||
      /^[0-9a-f-]{16,}$/i.test(part);

    if (part === "leads") {
      breadcrumbs.push({
        label: "Leads",
        href: isLast ? undefined : leadsListHref,
      });
      return;
    }

    breadcrumbs.push({
      label: isLikelyId ? "Lead" : formatSegmentLabel(part),
      href: isLast ? undefined : `${leadsListHref}/${routeParts
        .slice(0, index + 1)
        .join("/")}`,
    });
  });

  return breadcrumbs;
}

function AdminShellContent({
  tenant,
  children,
  user,
}: AdminShellProps) {
  const pathname = usePathname();
  const { breadcrumbs: overrideBreadcrumbs } = useAdminBreadcrumbs();

  const breadcrumbs =
    overrideBreadcrumbs ?? buildBreadcrumbs(pathname, tenant.slug);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <AdminSidebar tenant={tenant} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="h-20 border-b bg-white">
            <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-6">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-gray-900">
                  {tenant.businessName}
                </h1>
                <p className="text-sm text-gray-500">Admin</p>
              </div>

              <div className="flex items-center gap-4">
                <CalendarConnectionStatus tenantSlug={tenant.slug} />

                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <span aria-hidden="true">🌐</span>
                  <span>EN</span>
                </button>

                <AdminUserMenu
                  email={user.email}
                  role={user.role}
                  tenantSlug={tenant.slug}
                />
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
              <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm">
                {breadcrumbs.map((item, index) => (
                  <span
                    key={`${item.label}-${index}`}
                    className="flex items-center gap-2"
                  >
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="font-medium text-gray-500 transition hover:text-gray-700 hover:underline"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {item.label}
                      </span>
                    )}

                    {index < breadcrumbs.length - 1 ? (
                      <span className="text-gray-400">/</span>
                    ) : null}
                  </span>
                ))}
              </nav>

              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({
  tenant,
  children,
  user,
}: AdminShellProps) {
  return (
    <AdminBreadcrumbsProvider>
      <AdminShellContent tenant={tenant} user={user}>
        {children}
      </AdminShellContent>
    </AdminBreadcrumbsProvider>
  );
}