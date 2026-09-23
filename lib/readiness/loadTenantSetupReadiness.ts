import { loadTenantSetupReadinessDependencies } from "@/lib/readiness/loadTenantSetupReadinessDependencies";
import { getTenantSetupReadiness } from "@/lib/readiness/getTenantSetupReadiness";
import type { TenantSetupReadiness } from "@/lib/readiness/types";
import type { Tenant } from "@/lib/types/tenant";

export async function loadTenantSetupReadiness(
  tenant: Tenant
): Promise<TenantSetupReadiness> {
  const dependencies = await loadTenantSetupReadinessDependencies(tenant.slug);

  return getTenantSetupReadiness({
    tenant,
    ...dependencies,
  });
}
