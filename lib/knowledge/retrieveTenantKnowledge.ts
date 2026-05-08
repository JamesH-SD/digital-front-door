import type {
  RetrieveTenantKnowledgeInput,
  RetrieveTenantKnowledgeResult,
} from "@/lib/types/tenant-knowledge";
import { retrieveStaticTenantKnowledge } from "@/lib/knowledge/providers/staticTenantKnowledgeProvider";

/**
 * Provider-neutral knowledge retrieval entry point.
 *
 * Chat/AI should call this function only.
 * Providers can change later without changing chat code.
 */
export async function retrieveTenantKnowledge(
  input: RetrieveTenantKnowledgeInput
): Promise<RetrieveTenantKnowledgeResult> {
  return retrieveStaticTenantKnowledge(input);
}