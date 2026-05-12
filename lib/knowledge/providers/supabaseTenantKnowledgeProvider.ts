import { createAdminClient } from "@/lib/supabase/admin";
import type {
  RetrieveTenantKnowledgeInput,
  RetrieveTenantKnowledgeResult,
  TenantKnowledgeItem,
  TenantKnowledgeSourceType,
} from "@/lib/types/tenant-knowledge";

function mapKnowledgeRow(row: any): TenantKnowledgeItem {
  return {
    id: row.id,
    tenantSlug: row.tenant_slug,
    sourceType: row.source_type as TenantKnowledgeSourceType,
    title: row.title,
    content: row.content,
    tags: Array.isArray(row.tags) ? row.tags : [],
    confidence: row.confidence || "medium",
    sourceLabel: row.source_label || undefined,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
  };
}

function scoreKnowledgeItem(item: TenantKnowledgeItem, query: string) {
  const normalizedQuery = query.toLowerCase();
  const searchable = [item.title, item.content, ...(item.tags || [])]
    .join(" ")
    .toLowerCase();

  let score = 0;

  for (const token of normalizedQuery.split(/\s+/).filter(Boolean)) {
    if (searchable.includes(token)) score += 1;
  }

  return score;
}

export async function retrieveSupabaseTenantKnowledge(
  input: RetrieveTenantKnowledgeInput
): Promise<RetrieveTenantKnowledgeResult> {
  const supabase = createAdminClient();
  const limit = input.limit ?? 5;

  const { data, error } = await supabase
    .from("tenant_knowledge_items")
    .select("*")
    .eq("tenant_slug", input.tenantSlug)
    .eq("is_active", true)
    .limit(50);

  if (error) {
    console.error("Error retrieving tenant knowledge:", error.message);
    return { items: [] };
  }

  const items = (data ?? [])
    .map(mapKnowledgeRow)
    .map((item) => ({
      item,
      score: scoreKnowledgeItem(item, input.query),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.item)
    .slice(0, limit);

  return { items };
}