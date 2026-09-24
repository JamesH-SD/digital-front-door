import { getPlatformAdminRole } from "@/lib/auth/platformAccess";
import { getUserTenantMembership } from "@/lib/auth/tenantAccess";

/**
 * Matches admin tenant layout access: tenant membership or platform admin.
 */
export async function userHasTenantAccess(
  userId: string,
  tenantSlug: string
): Promise<boolean> {
  const membership = await getUserTenantMembership({
    userId,
    tenantSlug,
  });

  if (membership) {
    return true;
  }

  const platformRole = await getPlatformAdminRole(userId);
  return Boolean(platformRole);
}
