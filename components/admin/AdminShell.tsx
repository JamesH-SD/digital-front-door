import type { Tenant } from "@/lib/types/tenant";
import AdminSidebar from "@/components/admin/AdminSidebar";

type AdminShellProps = {
  tenant: Tenant;
  children: React.ReactNode;
};

/**
 * Shared tenant admin shell.
 *
 * Layout goals:
 * - left navigation for module growth
 * - top bar aligned with sidebar header
 * - centered page content area
 * - future-ready utility controls (language / auth)
 */
export default function AdminShell({
  tenant,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <AdminSidebar tenant={tenant} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="h-20 border-b bg-white">
            <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-6">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-gray-900">
                  {tenant.businessName}
                </h1>
                <p className="text-xs text-gray-500">Admin</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Language placeholder */}
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <span aria-hidden="true">🌐</span>
                  <span>EN</span>
                </button>

                {/* Auth placeholder */}
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <span aria-hidden="true">👤</span>
                  <span>Sign In</span>
                </button>
              </div>
            </div>
          </header>

          {/* Centered content area */}
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}