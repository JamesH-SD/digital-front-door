import { getPrimaryCalendarConnectionByTenantSlug } from "@/lib/calendar/calendarConnectionService";
import { countGlobalKnowledgeItemsByTenantSlug } from "@/lib/db/tenant-knowledge-count";
import type { TenantSetupReadinessInput } from "@/lib/readiness/types";

export type TenantSetupReadinessDependencies = Pick<
  TenantSetupReadinessInput,
  "globalKnowledgeItemCount" | "hasActivePrimaryCalendar"
>;

/**
 * Shared server-side inputs for getTenantSetupReadiness().
 * Reuse from Dashboard, Wizard, and other admin surfaces in later phases.
 */
export async function loadTenantSetupReadinessDependencies(
  tenantSlug: string
): Promise<TenantSetupReadinessDependencies> {
  const [globalKnowledgeItemCount, primaryConnection] = await Promise.all([
    countGlobalKnowledgeItemsByTenantSlug(tenantSlug),
    getPrimaryCalendarConnectionByTenantSlug(tenantSlug),
  ]);

  return {
    globalKnowledgeItemCount,
    hasActivePrimaryCalendar: primaryConnection !== null,
  };
}
