import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { userHasTenantAccess } from "@/lib/auth/userHasTenantAccess";
import { buildGoogleOAuthUrl } from "@/lib/calendar/googleOAuth";
import {
  defaultCalendarOAuthReturnTo,
  normalizeSafeInternalReturnTo,
} from "@/lib/calendar/safeOAuthReturnTo";
import { getTenantBySlug } from "@/lib/db/tenants";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

function redirectToLogin(request: NextRequest, returnTo: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "returnTo",
    normalizeSafeInternalReturnTo(returnTo, "/")
  );
  return NextResponse.redirect(loginUrl);
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tenantSlug } = await context.params;
    const requestUrl = new URL(request.url);

    const returnTo = normalizeSafeInternalReturnTo(
      requestUrl.searchParams.get("returnTo"),
      defaultCalendarOAuthReturnTo(tenantSlug)
    );

    const tenant = await getTenantBySlug(tenantSlug);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      const oauthStartPath = `${requestUrl.pathname}?returnTo=${encodeURIComponent(returnTo)}`;
      return redirectToLogin(request, oauthStartPath);
    }

    const hasAccess = await userHasTenantAccess(user.id, tenantSlug);

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
