import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserTenantMembership } from "@/lib/auth/tenantAccess";

type RouteParams = {
  params: Promise<{ tenantSlug: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { tenantSlug } = await params;
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
      { error: "Only owners can invite users." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const role = body.role as "admin" | "member";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("tenant_user_invites").upsert(
    {
      tenant_slug: tenantSlug,
      email,
      role,
      status: "pending",
      invited_by: currentUser.id,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "tenant_slug,email",
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}