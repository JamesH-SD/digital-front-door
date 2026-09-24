import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { userHasTenantAccess } from "@/lib/auth/userHasTenantAccess";
import { upsertPrimaryCalendarConnection } from "@/lib/calendar/calendarConnectionService";
import {
  appendQueryParams,
  defaultCalendarOAuthReturnTo,
  normalizeSafeInternalReturnTo,
} from "@/lib/calendar/safeOAuthReturnTo";
import {
  buildGoogleTokenExpiryIso,
  decodeGoogleOAuthState,
  exchangeGoogleCodeForTokens,
  listGoogleCalendars,
  pickPrimaryGoogleCalendar,
} from "@/lib/calendar/googleOAuth";
import { getTenantBySlug } from "@/lib/db/tenants";

export type GoogleOAuthCallbackContext = {
  /** When set, OAuth state tenantSlug must match this route tenant. */
  routeTenantSlug?: string;
};

const PUBLIC_OAUTH_ERROR_REASONS = new Set(["cancelled", "failed", "session"]);

function mapGoogleOAuthErrorToPublicReason(oauthError: string): string {
  if (oauthError === "access_denied") {
    return "cancelled";
  }

  return "failed";
}

function buildLoginRedirect(request: NextRequest, returnTo: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "returnTo",
    normalizeSafeInternalReturnTo(returnTo, "/")
  );
  return NextResponse.redirect(loginUrl);
}

function redirectWithCalendarStatus(
  request: NextRequest,
  safeReturnTo: string,
  status: "connected" | "error",
  reason?: string
) {
  const params: Record<string, string> = { calendar: status };

  if (status === "error" && reason && PUBLIC_OAUTH_ERROR_REASONS.has(reason)) {
    params.reason = reason;
  } else if (status === "error") {
    params.reason = "failed";
  }

  const destination = appendQueryParams(safeReturnTo, params);
  return NextResponse.redirect(new URL(destination, request.url));
}

function decodeStateOrNull(state: string | null) {
  if (!state) {
    return null;
  }

  try {
    return decodeGoogleOAuthState(state);
  } catch {
    return null;
  }
}

/**
 * Shared Google OAuth callback for static and tenant-scoped redirect URIs.
 *
 * Production should prefer `GET /api/calendar/google/callback` as
 * GOOGLE_OAUTH_REDIRECT_URI; the tenant-scoped route delegates here.
 */
export async function handleGoogleOAuthCallbackRequest(
  request: NextRequest,
  context: GoogleOAuthCallbackContext = {}
): Promise<NextResponse> {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  const decodedState = decodeStateOrNull(stateParam);
  let tenantSlug = decodedState?.tenantSlug ?? context.routeTenantSlug;

  if (context.routeTenantSlug && decodedState) {
    if (decodedState.tenantSlug !== context.routeTenantSlug) {
      const fallback = defaultCalendarOAuthReturnTo(context.routeTenantSlug);
      const safeReturnTo = normalizeSafeInternalReturnTo(
        decodedState.returnTo,
        fallback
      );
      return redirectWithCalendarStatus(
        request,
        safeReturnTo,
        "error",
        "failed"
      );
    }
    tenantSlug = context.routeTenantSlug;
  }

  if (!tenantSlug) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found from Google OAuth state" },
      { status: 404 }
    );
  }

  const fallbackReturn = defaultCalendarOAuthReturnTo(tenantSlug);
  const safeReturnTo = normalizeSafeInternalReturnTo(
    decodedState?.returnTo,
    fallbackReturn
  );

  if (oauthError) {
    return redirectWithCalendarStatus(
      request,
      safeReturnTo,
      "error",
      mapGoogleOAuthErrorToPublicReason(oauthError)
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "Missing Google authorization code" },
      { status: 400 }
    );
  }

  if (!stateParam || !decodedState) {
    return redirectWithCalendarStatus(
      request,
      safeReturnTo,
      "error",
      "failed"
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    const loginReturn = appendQueryParams(safeReturnTo, {
      calendar: "error",
      reason: "session",
    });
    return buildLoginRedirect(request, loginReturn);
  }

  const hasAccess = await userHasTenantAccess(user.id, tenantSlug);

  if (!hasAccess) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  try {
    const tokenResult = await exchangeGoogleCodeForTokens(code);

    const calendars = await listGoogleCalendars(tokenResult.access_token);
    const selectedCalendar = pickPrimaryGoogleCalendar(calendars);

    if (!selectedCalendar) {
      return redirectWithCalendarStatus(
        request,
        safeReturnTo,
        "error",
        "failed"
      );
    }

    await upsertPrimaryCalendarConnection({
      tenantSlug,
      provider: "google",
      calendarId: selectedCalendar.id,
      calendarName: selectedCalendar.summary,
      externalAccountEmail: null,
      accessToken: tokenResult.access_token,
      refreshToken: tokenResult.refresh_token ?? null,
      tokenExpiresAt: buildGoogleTokenExpiryIso(tokenResult.expires_in),
    });

    return redirectWithCalendarStatus(request, safeReturnTo, "connected");
  } catch (error) {
    console.error("Google OAuth callback error:", error);

    return redirectWithCalendarStatus(
      request,
      safeReturnTo,
      "error",
      "failed"
    );
  }
}
