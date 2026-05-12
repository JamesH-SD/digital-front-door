import { createAdminClient } from "@/lib/supabase/admin";
import type {
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

function normalizeTags(tags?: unknown): string[] {
  if (!Array.isArray(tags)) return [];

  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function getTenantKnowledgeItems(
  tenantSlug: string
): Promise<TenantKnowledgeItem[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_knowledge_items")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tenant knowledge items:", error.message);
    return [];
  }

  return (data ?? []).map(mapKnowledgeRow);
}

export async function createTenantKnowledgeItem(input: {
  tenantSlug: string;
  sourceType: TenantKnowledgeSourceType;
  title: string;
  content: string;
  tags?: string[];
  confidence?: "low" | "medium" | "high";
  sourceLabel?: string;
}): Promise<TenantKnowledgeItem> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_knowledge_items")
    .insert({
      tenant_slug: input.tenantSlug,
      source_type: input.sourceType,
      title: input.title.trim(),
      content: input.content.trim(),
      tags: normalizeTags(input.tags),
      confidence: input.confidence || "medium",
      source_label: input.sourceLabel?.trim() || "Manual Entry",
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating tenant knowledge item:", error.message);
    throw error;
  }

  return mapKnowledgeRow(data);
}