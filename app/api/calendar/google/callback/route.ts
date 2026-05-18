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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(
        new URL(`/login?calendar=error&reason=${encodeURIComponent(oauthError)}`, request.url)
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
    const tenantSlug = decodedState.tenantSlug;

    const tenant = await getTenantBySlug(tenantSlug);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found from Google OAuth state" },
        { status: 404 }
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

    return NextResponse.redirect(
      new URL(`/admin/${tenantSlug}/settings?calendar=connected`, request.url)
    );
  } catch (error) {
    console.error("Google OAuth static callback error:", error);

    return NextResponse.json(
      { error: "Failed to complete Google OAuth callback" },
      { status: 500 }
    );
  }
}