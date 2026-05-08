import type { TenantKnowledgeItem } from "@/lib/types/tenant-knowledge";

export function formatTenantKnowledgeForPrompt(items: TenantKnowledgeItem[]) {
  if (!items.length) {
    return "No additional tenant knowledge was retrieved.";
  }

  return items
    .map((item, index) => {
      return [
        `Knowledge Item ${index + 1}`,
        `Title: ${item.title}`,
        `Type: ${item.sourceType}`,
        `Source: ${item.sourceLabel || "Unknown"}`,
        `Content: ${item.content}`,
      ].join("\n");
    })
    .join("\n\n");
}