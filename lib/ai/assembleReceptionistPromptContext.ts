import type { ChatSession } from "@/lib/types/chat";
import type { Tenant } from "@/lib/types/tenant";
import type { TenantKnowledgeItem } from "@/lib/types/tenant-knowledge";
import { formatTenantKnowledgeForPrompt } from "@/lib/knowledge/formatTenantKnowledgeForPrompt";
import { buildKnownContext } from "@/lib/ai/generateChatTurn";
import { receptionistContextIncludesPrivateStreet } from "@/lib/ai/buildReceptionistTenantContext";

/**
 * Same tenant + knowledge assembly used before generateChatTurn builds the full prompt.
 * Structured address privacy applies to tenantContextBlock only (Business Identity).
 */
export function assembleReceptionistPromptContext(input: {
  tenant: Tenant;
  session: ChatSession;
  tenantKnowledge?: TenantKnowledgeItem[];
}): {
  tenantContextBlock: string;
  knowledgeContextBlock: string;
} {
  const tenantContextBlock = buildKnownContext(input.session, input.tenant);
  const knowledgeContextBlock = formatTenantKnowledgeForPrompt(
    input.tenantKnowledge ?? []
  );

  return {
    tenantContextBlock,
    knowledgeContextBlock,
  };
}

export function receptionistTenantContextIncludesPrivateStreet(
  tenant: Tenant,
  tenantContextBlock: string
): boolean {
  return receptionistContextIncludesPrivateStreet(tenant, tenantContextBlock);
}
