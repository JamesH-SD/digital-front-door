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
  knowledgeScope?: "global" | "campaign";
  campaignId?: string | null;
  summary?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
};

export type RetrieveTenantKnowledgeInput = {
  tenantSlug: string;
  query: string;
  limit?: number;
  campaignId?: string | null;
};

export type RetrieveTenantKnowledgeResult = {
  items: TenantKnowledgeItem[];
};