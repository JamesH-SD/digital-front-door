import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getPrimaryCalendarConnectionByTenantSlug } from "@/lib/calendar/calendarConnectionService";
import { getGoogleCalendarAvailability } from "@/lib/calendar/googleCalendar";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

/**
 * Format an ISO timestamp into a human-friendly local display string.
 *
 * Why this exists:
 * - the raw slot values should remain ISO for system use
 * - humans should not have to mentally convert UTC/Zulu times
 * - this will also help later when AI suggests available time options
 */
function formatDisplayTime(input: {
  iso: string;
  timezone: string;
}) {
  const date = new Date(input.iso);

  if (Number.isNaN(date.getTime())) {
    return input.iso;
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: input.timezone,
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Read availability for the tenant's primary Google calendar.
 *
 * Why this exists:
 * - gives us a practical verification endpoint before we wire AI or booking
 * - keeps calendar-read testing isolated from chat behavior
 *
 * Query params:
 * - from: ISO datetime
 * - to: ISO datetime
 * - timezone: IANA timezone
 * - minSlotMinutes: optional integer, defaults to 30
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

    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const timezone =
      url.searchParams.get("timezone") || "America/Los_Angeles";
    const minSlotMinutesRaw = url.searchParams.get("minSlotMinutes");

    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to query params are required" },
        { status: 400 }
      );
    }

    const minSlotMinutes =
      minSlotMinutesRaw && !Number.isNaN(Number(minSlotMinutesRaw))
        ? Number(minSlotMinutesRaw)
        : 30;

    const connection = await getPrimaryCalendarConnectionByTenantSlug(
      tenantSlug
    );

    if (!connection) {
      return NextResponse.json(
        { error: "No primary Google calendar connection found for this tenant." },
        { status: 404 }
      );
    }

    const slots = await getGoogleCalendarAvailability({
      connection,
      fromIso: from,
      toIso: to,
      timezone,
      minSlotMinutes,
    });

    /**
     * Add human-friendly display fields while preserving the raw ISO values.
     *
     * This keeps the response useful both for:
     * - machines / future workflows
     * - humans debugging and validating availability
     */
    const slotsWithDisplay = slots.map((slot) => ({
      ...slot,
      displayStart: formatDisplayTime({
        iso: slot.startAt,
        timezone: slot.timezone,
      }),
      displayEnd: formatDisplayTime({
        iso: slot.endAt,
        timezone: slot.timezone,
      }),
    }));

    return NextResponse.json(
      {
        tenantSlug,
        calendarId: connection.calendarId,
        timezone,
        slots: slotsWithDisplay,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Google availability route error:", error);

    return NextResponse.json(
      { error: "Failed to load Google calendar availability" },
      { status: 500 }
    );
  }
}