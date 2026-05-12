import type {
  RetrieveTenantKnowledgeInput,
  RetrieveTenantKnowledgeResult,
} from "@/lib/types/tenant-knowledge";
import { retrieveSupabaseTenantKnowledge } from "@/lib/knowledge/providers/supabaseTenantKnowledgeProvider";

/**
 * Provider-neutral knowledge retrieval entry point.
 *
 * Chat/AI should call this function only.
 * Providers can change later without changing chat code.
 */
export async function retrieveTenantKnowledge(
  input: RetrieveTenantKnowledgeInput
): Promise<RetrieveTenantKnowledgeResult> {
  return retrieveSupabaseTenantKnowledge(input);
}