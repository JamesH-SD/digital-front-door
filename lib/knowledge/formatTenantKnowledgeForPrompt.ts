import type { TenantKnowledgeItem } from "@/lib/types/tenant-knowledge";

export function formatTenantKnowledgeForPrompt(
  items: TenantKnowledgeItem[]
) {
  if (!items.length) {
    return "No additional tenant knowledge was retrieved.";
  }

  return items
    .map((item, index) => {
      return [
        `Knowledge Item ${index + 1}`,
        `Title: ${item.title}`,
        `Type: ${item.sourceType}`,
        `Scope: ${item.knowledgeScope || "global"}`,
        `Campaign: ${item.campaignId || "none"}`,
        `Source: ${item.sourceLabel || "Unknown"}`,
        `Summary: ${item.summary || "Not provided"}`,
        `Tags: ${(item.tags || []).join(", ") || "none"}`,
        item.fileName ? `File: ${item.fileName}` : null,
        `Content: ${item.content}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}