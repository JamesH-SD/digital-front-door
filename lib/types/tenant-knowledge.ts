export type TenantKnowledgeSourceType =
  | "manual_note"
  | "faq"
  | "document"
  | "photo"
  | "website"
  | "service"
  | "policy"
  | "pricing"
  | "unknown";

export type TenantKnowledgeItem = {
  id: string;
  tenantSlug: string;
  sourceType: TenantKnowledgeSourceType;
  title: string;
  content: string;
  tags?: string[];
  confidence?: "low" | "medium" | "high";
  sourceLabel?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RetrieveTenantKnowledgeInput = {
  tenantSlug: string;
  query: string;
  limit?: number;
};

export type RetrieveTenantKnowledgeResult = {
  items: TenantKnowledgeItem[];
};