import { requireTenantAccess, type TenantAccessResult } from "@/lib/auth/requireTenantAccess";

export type TenantCalendarAccessResult = TenantAccessResult;

/**
 * Calendar Admin routes use the same tenant access gate as other tenant APIs.
 */
export async function requireTenantCalendarAccess(
  tenantSlug: string
): Promise<TenantCalendarAccessResult> {
  return requireTenantAccess(tenantSlug);
}
