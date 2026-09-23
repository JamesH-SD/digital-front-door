import { getReadinessAdminPaths } from "@/lib/readiness/adminPaths";
import { computeCategoryResult } from "@/lib/readiness/computeCategoryResult";
import { itemStatus } from "@/lib/readiness/helpers";
import type {
  ReadinessCategoryResult,
  TenantSetupReadinessInput,
} from "@/lib/readiness/types";

export function evaluateKnowledgeBase(
  input: TenantSetupReadinessInput
): ReadinessCategoryResult {
  const paths = getReadinessAdminPaths(input.tenant.slug);

  const items = [
    {
      id: "global_knowledge",
      label: "Tenant-wide training content",
      tier: "recommended" as const,
      status: itemStatus(input.globalKnowledgeItemCount > 0),
      adminHref: paths.knowledgeBase,
    },
  ];

  return computeCategoryResult({
    key: "knowledge_base",
    label: "Knowledge Base",
    applicable: true,
    contributesToOverall: false,
    items,
    adminHref: paths.knowledgeBase,
  });
}
