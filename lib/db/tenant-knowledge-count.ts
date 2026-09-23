import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tenant-wide knowledge items used for Setup Readiness (excludes campaign-only training).
 */
export async function countGlobalKnowledgeItemsByTenantSlug(
  tenantSlug: string
): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("tenant_knowledge_items")
    .select("*", { count: "exact", head: true })
    .eq("tenant_slug", tenantSlug)
    .eq("is_active", true)
    .eq("knowledge_scope", "global");

  if (error) {
    console.error("Error counting global knowledge items:", error.message);
    return 0;
  }

  return count ?? 0;
}
