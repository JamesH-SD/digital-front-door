import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { userHasTenantAccess } from "@/lib/auth/userHasTenantAccess";

export type TenantAccessResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Tenant-scoped Admin API gate: signed-in user with membership or platform admin.
 * Matches `app/admin/[tenantSlug]/layout.tsx` access rules.
 */
export async function requireTenantAccess(
  tenantSlug: string
): Promise<TenantAccessResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const hasAccess = await userHasTenantAccess(user.id, tenantSlug);

  if (!hasAccess) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id };
}
