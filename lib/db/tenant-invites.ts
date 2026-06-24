import { createAdminClient } from "@/lib/supabase/admin";

export type TenantInvite = {
  id: string;
  email: string;
  role: "admin" | "member";
  status: string;
  expiresAt: string | null;
  createdAt: string | null;
};

export async function getTenantInvites(
  tenantSlug: string
): Promise<TenantInvite[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_user_invites")
    .select("id, email, role, status, expires_at, created_at")
    .eq("tenant_slug", tenantSlug)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tenant invites:", error.message);
    return [];
  }

  return (data || []).map((invite) => ({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at,
  }));
}