import { evaluateHostedWebsite } from "@/lib/readiness/evaluateHostedWebsite";
import { buildTenantSetupReadinessInput } from "@/lib/readiness/getTenantSetupReadiness";
import type { ReadinessCategoryResult } from "@/lib/readiness/types";
import type { Tenant } from "@/lib/types/tenant";

/**
 * Operational hosted-website readiness only (C1a Website category).
 * Does not load knowledge or calendar dependencies — unused by this evaluator.
 */
export function getHostedWebsiteOperationalReadiness(
  tenant: Tenant
): ReadinessCategoryResult {
  return evaluateHostedWebsite(
    buildTenantSetupReadinessInput({
      tenant,
      globalKnowledgeItemCount: 0,
      hasActivePrimaryCalendar: false,
    })
  );
}
