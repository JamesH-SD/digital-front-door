import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/db/tenants";
import {
  getActiveCalendarConnectionsByTenantSlug,
  getPrimaryCalendarConnectionByTenantSlug,
  upsertPrimaryCalendarConnection,
  disconnectPrimaryCalendarConnectionByTenantSlug,
} from "@/lib/calendar/calendarConnectionService";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

/**
 * GET calendar connections for a tenant.
 *
 * Current v1 behavior:
 * - returns all active connections
 * - returns the current primary connection separately
 *
 * Why:
 * - makes admin UI work easier later
 * - gives us a clean API contract from the beginning
 */
export async function GET(
  _request: NextRequest,
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

    const [connections, primaryConnection] = await Promise.all([
      getActiveCalendarConnectionsByTenantSlug(tenantSlug),
      getPrimaryCalendarConnectionByTenantSlug(tenantSlug),
    ]);

    return NextResponse.json(
      {
        connections,
        primaryConnection,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET calendar connections error:", error);

    return NextResponse.json(
      { error: "Failed to load calendar connections" },
      { status: 500 }
    );
  }
}

/**
 * POST save/update the tenant's primary calendar connection.
 *
 * This route is intentionally simple for v1:
 * - one tenant
 * - one primary Google calendar
 * - later we can expand to multiple calendar management actions
 */
export async function POST(
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

    const body = await request.json();

    const provider = body?.provider;
    const calendarId = body?.calendarId;
    const calendarName = body?.calendarName;
    const externalAccountEmail = body?.externalAccountEmail;
    const accessToken = body?.accessToken;
    const refreshToken = body?.refreshToken;
    const tokenExpiresAt = body?.tokenExpiresAt;

    if (provider !== "google") {
      return NextResponse.json(
        { error: "Only google calendar connections are supported right now." },
        { status: 400 }
      );
    }

    if (!calendarId || typeof calendarId !== "string") {
      return NextResponse.json(
        { error: "calendarId is required" },
        { status: 400 }
      );
    }

    const connection = await upsertPrimaryCalendarConnection({
      tenantSlug,
      provider,
      calendarId,
      calendarName:
        typeof calendarName === "string" ? calendarName : null,
      externalAccountEmail:
        typeof externalAccountEmail === "string"
          ? externalAccountEmail
          : null,
      accessToken:
        typeof accessToken === "string" ? accessToken : null,
      refreshToken:
        typeof refreshToken === "string" ? refreshToken : null,
      tokenExpiresAt:
        typeof tokenExpiresAt === "string" ? tokenExpiresAt : null,
    });

    return NextResponse.json(
      {
        connection,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST calendar connection error:", error);

    return NextResponse.json(
      { error: "Failed to save calendar connection" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    await disconnectPrimaryCalendarConnectionByTenantSlug(tenantSlug);

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE calendar connection error:", error);

    return NextResponse.json(
      { error: "Failed to disconnect calendar connection" },
      { status: 500 }
    );
  }
}