import { createAdminClient } from "@/lib/supabase/admin";
import type { TenantMembership, TenantRole } from "@/lib/auth/types";

function mapMembershipRow(row: any): TenantMembership {
  return {
    id: row.id,
    tenantSlug: row.tenant_slug,
    userId: row.user_id,
    role: row.role as TenantRole,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

export async function getUserTenantMembership(input: {
  userId: string;
  tenantSlug: string;
}): Promise<TenantMembership | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_memberships")
    .select("*")
    .eq("user_id", input.userId)
    .eq("tenant_slug", input.tenantSlug)
    .single();

  if (error || !data) {
    return null;
  }

  return mapMembershipRow(data);
}

export async function userCanAccessTenant(input: {
  userId: string;
  tenantSlug: string;
}) {
  const membership = await getUserTenantMembership(input);
  return Boolean(membership);
}