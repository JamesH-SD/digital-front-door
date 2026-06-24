import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserTenantMembership } from "@/lib/auth/tenantAccess";

type RouteParams = {
  params: Promise<{
    tenantSlug: string;
    userId: string;
  }>;
};

export async function DELETE(_: Request, { params }: RouteParams) {
  const { tenantSlug, userId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getUserTenantMembership({
    userId: currentUser.id,
    tenantSlug,
  });

  if (!membership || membership.role !== "owner") {
    return NextResponse.json(
      { error: "Only owners can remove users." },
      { status: 403 }
    );
  }

  if (currentUser.id === userId) {
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