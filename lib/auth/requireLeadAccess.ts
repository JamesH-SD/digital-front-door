import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { userHasTenantAccess } from "@/lib/auth/userHasTenantAccess";

export type LeadAccessResult =
  | { ok: true; userId: string; tenantSlug: string }
  | { ok: false; response: NextResponse };

async function getLeadTenantSlug(leadId: string): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("leads")
    .select("tenant_slug")
    .eq("id", leadId)
    .maybeSingle();

  if (error || !data?.tenant_slug) {
    return null;
  }

  return data.tenant_slug as string;
}

/**
 * Authorize authenticated tenant access to a lead before reads/mutations/AI.
 * Loads only `tenant_slug` from the lead row until access succeeds.
 */
export async function requireLeadAccess(
  leadId: string
): Promise<LeadAccessResult> {
  const trimmedId = leadId.trim();

  if (!trimmedId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "leadId is required" },
        { status: 400 }
      ),
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const tenantSlug = await getLeadTenantSlug(trimmedId);

  if (!tenantSlug) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Lead not found." }, { status: 404 }),
    };
  }

  const hasAccess = await userHasTenantAccess(user.id, tenantSlug);

  if (!hasAccess) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id, tenantSlug };
}

/** @deprecated Use requireLeadAccess */
export const requireLeadAiAccess = requireLeadAccess;

export type LeadAiAccessResult = LeadAccessResult;
