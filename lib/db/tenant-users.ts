import { createAdminClient } from "@/lib/supabase/admin";

export type TenantUser = {
  userId: string;
  email: string;
  role: "owner" | "admin" | "member";
  createdAt: string | null;
};

export async function getTenantUsers(tenantSlug: string): Promise<TenantUser[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_memberships")
    .select("user_id, role, created_at")
    .eq("tenant_slug", tenantSlug)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching tenant users:", error.message);
    return [];
  }

  const users = await Promise.all(
    (data || []).map(async (membership) => {
      const { data: userData } = await supabase.auth.admin.getUserById(
        membership.user_id
      );

      return {
        userId: membership.user_id,
        email: userData.user?.email || "Unknown user",
        role: membership.role,
        createdAt: membership.created_at,
      };
    })
  );

  return users;
}