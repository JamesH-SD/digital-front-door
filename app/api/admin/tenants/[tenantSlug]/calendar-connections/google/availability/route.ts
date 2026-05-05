import { NextRequest, NextResponse } from "next/server";
import { getBookableAppointmentSlots } from "@/lib/scheduling/getBookableAppointmentSlots";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

/**
 * Return clean, bookable appointment slots for a tenant.
 *
 * Important:
 * - This route no longer returns raw Google free windows.
 * - Google Calendar is still the source of busy/free truth.
 * - getBookableAppointmentSlots applies tenant business hours, timezone rules,
 *   slot duration, and grouping by local day.
 *
 * This route is now safe for:
 * - admin schedule modal
 * - reschedule modal
 * - future chat scheduling engine
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tenantSlug } = await context.params;
    const url = new URL(request.url);

    const timezone =
      url.searchParams.get("timezone") || "America/Los_Angeles";

    const fromIso = url.searchParams.get("from") || undefined;

    const slotMinutesRaw = url.searchParams.get("slotMinutes");
    const lookaheadDaysRaw = url.searchParams.get("lookaheadDays");
    const maxDaysToReturnRaw = url.searchParams.get("maxDaysToReturn");

    const slotMinutes =
      slotMinutesRaw && !Number.isNaN(Number(slotMinutesRaw))
        ? Number(slotMinutesRaw)
        : 60;

    const lookaheadDays =
      lookaheadDaysRaw && !Number.isNaN(Number(lookaheadDaysRaw))
        ? Number(lookaheadDaysRaw)
        : 14;

    const maxDaysToReturn =
      maxDaysToReturnRaw && !Number.isNaN(Number(maxDaysToReturnRaw))
        ? Number(maxDaysToReturnRaw)
        : 7;

    const availability = await getBookableAppointmentSlots({
      tenantSlug,
      timezone,
      fromIso,
      slotMinutes,
      lookaheadDays,
      maxDaysToReturn,
    });

    return NextResponse.json(
      {
        tenantSlug,
        ...availability,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bookable availability route error:", error);

    return NextResponse.json(
      { error: "Failed to load bookable appointment slots" },
      { status: 500 }
    );
  }
}