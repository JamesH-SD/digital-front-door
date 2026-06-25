import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/db/tenants";
import { buildGoogleOAuthUrl } from "@/lib/calendar/googleOAuth";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

/**
 * Start the Google OAuth flow for a tenant.
 *
 * Why this exists:
 * - keeps the OAuth initiation server-side
 * - makes the tenant context explicit in the redirect flow
 * - avoids hardcoding Hughes General into the OAuth logic itself
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tenantSlug } = await context.params;
    const requestUrl = new URL(request.url);

    const returnTo =
      requestUrl.searchParams.get("returnTo") ??
      `/admin/${tenantSlug}/settings`;

    const tenant = await getTenantBySlug(tenantSlug);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const url = buildGoogleOAuthUrl({
      tenantSlug,
      returnTo,
    });

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Google OAuth start error:", error);

    return NextResponse.json(
      { error: "Failed to start Google OAuth flow" },
      { status: 500 }
    );
  }
}