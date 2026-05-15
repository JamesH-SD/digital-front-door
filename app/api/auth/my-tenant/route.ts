import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getFirstUserTenantMembership } from "@/lib/auth/tenantAccess";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  const membership = await getFirstUserTenantMembership(user.id);

  if (!membership) {
    return NextResponse.json({
      tenantSlug: null,
      role: null,
    });
  }

  return NextResponse.json({
    tenantSlug: membership.tenantSlug,
    role: membership.role,
  });
}