import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformAdminRole } from "@/lib/auth/platformAccess";
import { requireTenantAccess } from "@/lib/auth/requireTenantAccess";
import { getUserTenantMembership } from "@/lib/auth/tenantAccess";

type RouteParams = {
  params: Promise<{
    tenantSlug: string;
    userId: string;
  }>;
};

export async function DELETE(_: Request, { params }: RouteParams) {
  const { tenantSlug, userId } = await params;

  const access = await requireTenantAccess(tenantSlug);

  if (!access.ok) {
    return access.response;
  }

  const membership = await getUserTenantMembership({
    userId: access.userId,
    tenantSlug,
  });

  const platformRole = await getPlatformAdminRole(access.userId);

  if ((!membership || membership.role !== "owner") && !platformRole) {
    return NextResponse.json(
      { error: "Only owners can remove users." },
      { status: 403 }
    );
  }

  if (access.userId === userId) {
    return NextResponse.json(
      { error: "You cannot remove yourself from this account." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("tenant_memberships")
    .delete()
    .eq("tenant_slug", tenantSlug)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
