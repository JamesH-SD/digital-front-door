import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/db/tenants";
import {
  buildGoogleTokenExpiryIso,
  decodeGoogleOAuthState,
  exchangeGoogleCodeForTokens,
  listGoogleCalendars,
  pickPrimaryGoogleCalendar,
} from "@/lib/calendar/googleOAuth";
import { upsertPrimaryCalendarConnection } from "@/lib/calendar/calendarConnectionService";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

/**
 * Google OAuth callback handler.
 *
 * Current v1 behavior:
 * - validates tenant context from the route and Google state
 * - exchanges auth code for tokens
 * - loads the user's Google calendars
 * - chooses the primary Google calendar when available
 * - saves/upserts that calendar as the tenant's primary connection
 *
 * Notes:
 * - we intentionally keep the tenant scoped through both the route
 *   and the OAuth state payload
 * - later we can expand this to show a calendar-picker UI instead of
 *   auto-selecting the primary Google calendar
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tenantSlug } = await context.params;

    const tenant = await getTenantBySlug(tenantSlug);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");

    if (oauthError) {
      return NextResponse.json(
        { error: `Google OAuth failed: ${oauthError}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Missing Google authorization code" },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { error: "Missing Google OAuth state" },
        { status: 400 }
      );
    }

    const decodedState = decodeGoogleOAuthState(state);

    // Extra safety:
    // ensure the callback route tenant matches the state tenant.
    if (decodedState.tenantSlug !== tenantSlug) {
      return NextResponse.json(
        { error: "Tenant mismatch in Google OAuth callback" },
        { status: 400 }
      );
    }

    const tokenResult = await exchangeGoogleCodeForTokens(code);

    const calendars = await listGoogleCalendars(tokenResult.access_token);
    const selectedCalendar = pickPrimaryGoogleCalendar(calendars);

    if (!selectedCalendar) {
      return NextResponse.json(
        { error: "No Google calendars were returned for this account." },
        { status: 400 }
      );
    }

    const connection = await upsertPrimaryCalendarConnection({
      tenantSlug,
      provider: "google",
      calendarId: selectedCalendar.id,
      calendarName: selectedCalendar.summary,
      externalAccountEmail: null,
      accessToken: tokenResult.access_token,
      refreshToken: tokenResult.refresh_token ?? null,
      tokenExpiresAt: buildGoogleTokenExpiryIso(tokenResult.expires_in),
    });

    // For now, keep the callback response simple and explicit for debugging.
    // Later, we can redirect this to an admin settings page.
    return NextResponse.redirect(
      new URL(`/admin/${tenantSlug}/settings?calendar=connected`, request.url)
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);

    return NextResponse.json(
      { error: "Failed to complete Google OAuth callback" },
      { status: 500 }
    );
  }
}