import { NextRequest } from "next/server";
import { handleGoogleOAuthCallbackRequest } from "@/lib/calendar/googleOAuthCallbackHandler";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

/**
 * Legacy/alternate redirect URI scoped by tenant slug in the path.
 * Delegates to the shared callback handler (same redirects and auth as static callback).
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { tenantSlug } = await context.params;

  return handleGoogleOAuthCallbackRequest(request, {
    routeTenantSlug: tenantSlug,
  });
}
