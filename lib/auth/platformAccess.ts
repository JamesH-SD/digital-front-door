import { createAdminClient } from "@/lib/supabase/admin";

export type PlatformRole = "owner" | "support";

export async function getPlatformAdminRole(
  userId: string
): Promise<PlatformRole | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("platform_admins")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking platform admin role:", error.message);
    return null;
  }

  return data?.role ? (data.role as PlatformRole) : null;
}