"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Menu,
  Plug,
  Settings,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Tenant } from "@/lib/types/tenant";

type AdminSidebarProps = {
  tenant: Tenant;
};

type NavItem = {
  label: string;
  href?: string;
  description: string;
  icon: React.ElementType;
  isEnabled: boolean;
};

function getLinkClasses(isActive: boolean, isCollapsed: boolean) {
  const base =
    "group relative flex items-center gap-3 rounded-xl transition";

  const size = isCollapsed
    ? "justify-center px-3 py-3"
    : "w-full px-3 py-2.5";

  const color = isActive
    ? "bg-orange-700 text-white shadow-sm"
    : "text-gray-600 hover:bg-orange-50 hover:text-orange-700";

  return `${base} ${size} ${color}`;
}

export default function AdminSidebar({ tenant }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: "Business Settings",
      href: `/admin/${tenant.slug}/settings`,
      description: "Business and chat configuration",
      icon: Settings,
      isEnabled: true,
    },
    {
      label: "Leads",
      href: `/admin/${tenant.slug}`,
      description: "Captured leads",
      icon: Users,
      isEnabled: true,
    },
    {
      label: "Appointments",
      description: "Scheduled calls and visits",
      icon: CalendarDays,
      isEnabled: false,
    },
    {
      label: "Knowledge Base",
      description: "Business knowledge library",
      icon: FileText,
      isEnabled: false,
    },
    {
      label: "Lead Capture",
      description: "QR codes and website embed",
      icon: Sparkles,
      isEnabled: false,
    },
    {
      label: "Analytics",
      description: "Performance and conversion data",
      icon: BarChart3,
      isEnabled: false,
    },
    {
      label: "Automations",
      description: "Rules and follow-up flows",
      icon: Plug,
      isEnabled: false,
    },
    {
      label: "Billing",
      description: "Plan and payment settings",
      icon: WalletCards,
      isEnabled: false,
    },
  ];

  function renderNavItem(item: NavItem) {
    const Icon = item.icon;

    const isActive =
      item.href &&
      (pathname === item.href ||
        (item.href !== `/admin/${tenant.slug}` &&
          pathname.startsWith(item.href)));

    const content = (
      <>
        <Icon className="h-5 w-5 shrink-0" />

        {!isCollapsed ? (
          <span className="min-w-0 truncate text-sm font-semibold">
            {item.label}
          </span>
        ) : null}

        {isCollapsed ? (
          <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-xl bg-gray-950 px-3 py-2 text-xs font-medium text-white shadow-lg group-hover:block">
            {item.label}
          </div>
        ) : null}
      </>
    );

    if (item.isEnabled && item.href) {
      return (
        <Link
          key={item.label}
          href={item.href}
          onClick={() => setIsMobileOpen(false)}
          className={getLinkClasses(Boolean(isActive), isCollapsed)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.label}
        type="button"
        className={`${getLinkClasses(false, isCollapsed)} cursor-default opacity-55`}
      >
        {content}
      </button>
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] items-center justify-between border-b border-stone-200/60 bg-white/70 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-700 text-sm font-bold text-white">
            HG
          </div>

          {!isCollapsed ? (
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Logo Area
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                {tenant.businessName}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        {navItems.map(renderNavItem)}
      </nav>

      <div className="space-y-2 border-t border-stone-200/70 px-3 py-4">
        <button
          type="button"
          className={getLinkClasses(false, isCollapsed)}
        >
          <Home className="h-5 w-5 shrink-0" />

          {!isCollapsed ? (
            <div className="min-w-0 text-left">
              <div className="text-sm font-semibold">Theme</div>
            </div>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={getLinkClasses(false, isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 shrink-0" />
          ) : (
            <ChevronLeft className="h-5 w-5 shrink-0" />
          )}

          {!isCollapsed ? (
            <div className="min-w-0 text-left">
              <div className="text-sm font-semibold">Collapse</div>
            </div>
          ) : null}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex rounded-2xl border bg-white/90 p-3 text-gray-800 shadow-sm backdrop-blur lg:hidden"
        aria-label="Open admin navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsMobileOpen(false)}
          />

          <aside className="relative h-full w-80 max-w-[85vw] border-r border-stone-200/70 bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-xl border bg-white p-2 text-gray-600"
              aria-label="Close admin navigation"
            >
              <X className="h-4 w-4" />
            </button>

            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <aside
        className={`hidden shrink-0 border-r border-stone-200/60 bg-white/90 shadow-[8px_0_30px_rgba(17,24,39,0.035)] backdrop-blur-xl transition-all duration-200 lg:block ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>
    </>
  );
}