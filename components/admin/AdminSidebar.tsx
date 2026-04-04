"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Tenant } from "@/lib/types/tenant";

type AdminSidebarProps = {
  tenant: Tenant;
};

type NavItem = {
  label: string;
  href: string;
  description: string;
};

function getLinkClasses(isActive: boolean) {
  return isActive
    ? "border-gray-900 bg-gray-900 text-white"
    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50";
}

/**
 * Tenant-scoped admin sidebar.
 *
 * Notes:
 * - top section is intentionally aligned to the same height as the top bar
 * - this top area can later hold the tenant logo
 * - nav is kept simple for now: Leads + Settings
 */
export default function AdminSidebar({ tenant }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Leads",
      href: `/admin/${tenant.slug}`,
      description: "Review and manage captured leads",
    },
    {
      label: "Settings",
      href: `/admin/${tenant.slug}/settings`,
      description: "Business profile and chat configuration",
    },
  ];

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-gray-50 lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        {/* Sidebar header aligned with top bar height */}
        <div className="flex h-20 items-center border-b bg-white px-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Logo Area
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-gray-900">
              {tenant.businessName}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== `/admin/${tenant.slug}` &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-2xl border px-4 py-3 transition ${getLinkClasses(
                  isActive
                )}`}
              >
                <div className="text-sm font-semibold">{item.label}</div>
                <div
                  className={`mt-1 text-xs ${
                    isActive ? "text-gray-200" : "text-gray-500"
                  }`}
                >
                  {item.description}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Coming Next
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>Dashboard</li>
            <li>Customers</li>
            <li>Scheduling</li>
            <li>Messages</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}