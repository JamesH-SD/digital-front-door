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
import SupportModeBanner from "@/components/admin/SupportModeBanner";
import type { SubscriptionState } from "@/lib/billing/getSubscriptionState";

type AdminUser = {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  platformRole?: "owner" | "support" | null;
};

type AdminShellProps = {
  tenant: Tenant;
  children: React.ReactNode;
  user: AdminUser;
  supportMode?: boolean;
  subscriptionState?: SubscriptionState;
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
  supportMode = false,
  subscriptionState,
}: AdminShellProps) {
  const pathname = usePathname();
  const { breadcrumbs: overrideBreadcrumbs } = useAdminBreadcrumbs();

  const breadcrumbs =
    overrideBreadcrumbs ?? buildBreadcrumbs(pathname, tenant.slug);

  return (
    <div className="saas-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <AdminSidebar tenant={tenant} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 h-[72px] border-b border-stone-200/60 bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(17,24,39,0.045)]">
            <div className="flex h-full w-full items-center justify-between pl-20 pr-5 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                Admin Workspace
              </p>
              <h1 className="mt-1 truncate text-lg font-semibold text-gray-950">
                {tenant.businessName}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden md:block">
              <CalendarConnectionStatus tenantSlug={tenant.slug} />
            </div>

            <div className="md:hidden">
              <CalendarConnectionStatus tenantSlug={tenant.slug} compact />
            </div>

              <button
                type="button"
                className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 shadow-sm transition hover:bg-stone-50 sm:gap-2 sm:px-3"
              >
                <span aria-hidden="true">🌐</span>
                <span>EN</span>
              </button>

              <AdminUserMenu
                email={user.email}
                role={user.role}
                tenantSlug={tenant.slug}
                platformRole={user.platformRole}
              />
            </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="w-full px-5 py-4 sm:px-6 lg:px-8">
            {subscriptionState?.isExpired ? (
              <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
                <p className="text-sm font-bold text-orange-900">
                  Your free trial has ended.
                </p>
                <p className="mt-1 text-sm text-orange-800">
                  Subscribe to continue using Contactor features.
                </p>
                <Link
                  href={`/admin/${tenant.slug}/billing`}
                  className="mt-3 inline-flex rounded-xl bg-orange-700 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-800"
                >
                  View Billing
                </Link>
              </div>
            ) : subscriptionState?.isTrialing ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">
                Free trial active — {subscriptionState.daysRemaining} day(s) remaining.
              </div>
            ) : null}
              <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs">
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

              <SupportModeBanner />

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
  supportMode = false,
  subscriptionState,
}: AdminShellProps) {
  return (
    <AdminBreadcrumbsProvider>
      <AdminShellContent
        tenant={tenant}
        user={user}
        supportMode={supportMode}
        subscriptionState={subscriptionState}
      >
        <>
          {supportMode && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    Support View
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    You are viewing this tenant workspace as a Contactor platform administrator.
                  </p>
                </div>

                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  Read Only
                </span>
              </div>
            </div>
          )}

          {children}
        </>
      </AdminShellContent>
    </AdminBreadcrumbsProvider>
  );
}