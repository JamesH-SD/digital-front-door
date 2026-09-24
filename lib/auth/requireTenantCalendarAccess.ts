import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { userHasTenantAccess } from "@/lib/auth/userHasTenantAccess";

export type TenantCalendarAccessResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Auth gate for tenant calendar management routes (OAuth start, connections CRUD).
 */
export async function requireTenantCalendarAccess(
  tenantSlug: string
): Promise<TenantCalendarAccessResult> {
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
      response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id };
}
