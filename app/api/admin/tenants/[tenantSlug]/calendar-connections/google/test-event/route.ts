import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getPrimaryCalendarConnectionByTenantSlug } from "@/lib/calendar/calendarConnectionService";
import { createGoogleCalendarEvent } from "@/lib/calendar/googleCalendar";
import {
  createAppointment,
  confirmAppointment,
} from "@/lib/scheduling/appointmentService";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

/**
 * Test-only route for creating a real Google Calendar event
 * and linking it to an appointment record in our DB.
 *
 * Why this exists:
 * - validates Google Calendar write access
 * - validates appointment persistence in our system
 * - keeps this test isolated from chat/scheduling UX flows
 *
 * Important:
 * - this is still an admin/test route
 * - later, real booking will come from the actual lead + scheduling workflow
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

    const connection = await getPrimaryCalendarConnectionByTenantSlug(
      tenantSlug
    );

    if (!connection) {
      return NextResponse.json(
        { error: "No primary Google calendar connection found for this tenant." },
        { status: 404 }
      );
    }

    const body = await request.json();

        /**
     * TEMP leadId for testing.
     *
     * Why:
     * - we are not yet wiring real lead → scheduling flow
     * - this allows us to validate Google + DB integration safely
     *
     * Later:
     * - this will come from actual lead context
     */
    const leadId =
    typeof body?.leadId === "string" && body.leadId.trim()
    ? body.leadId.trim()
    : "00000000-0000-0000-0000-000000000001";

    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim()
        : null;

    const startAt =
      typeof body?.startAt === "string" && body.startAt.trim()
        ? body.startAt.trim()
        : null;

    const endAt =
      typeof body?.endAt === "string" && body.endAt.trim()
        ? body.endAt.trim()
        : null;

    const timezone =
      typeof body?.timezone === "string" && body.timezone.trim()
        ? body.timezone.trim()
        : "America/Los_Angeles";

    const description =
      typeof body?.description === "string" ? body.description : null;

    const location =
      typeof body?.location === "string" ? body.location : null;

    const attendeeEmail =
      typeof body?.attendeeEmail === "string" ? body.attendeeEmail : null;

    /**
     * TEMPORARY:
     * We are still testing calendar + appointment persistence independently
     * from the live lead workflow, so this route uses a test lead ID.
     *
     * Later:
     * - this will come from the real lead context
     * - event creation will be triggered by actual scheduling flows
     */

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    if (!startAt || !endAt) {
      return NextResponse.json(
        { error: "startAt and endAt are required" },
        { status: 400 }
      );
    }

    /**
 * Step 1:
 * Create the real Google Calendar event first.
 *
 * Why:
 * - if the Google token is invalid, we want to fail before touching our DB
 * - this keeps the current test flow easier to debug
 */
    const event = await createGoogleCalendarEvent({
        connection,
        calendarId: connection.calendarId,
        title,
        description,
        location,
        startAt,
        endAt,
        timezone,
        attendeeEmail,
        });
    
        /**
         * TEMPORARY:
         * We are still testing calendar + appointment persistence independently
         * from the live lead workflow, so this route uses a test lead ID.
         *
         * Later:
         * - this will come from the real lead context
         * - event creation will be triggered by actual scheduling flows
         */
    
        /**
         * Step 2:
         * Create the appointment in our DB as "requested".
         */
        const appointment = await createAppointment({
        tenantSlug,
        leadId,
        appointmentPreference: null,
        notes: "Test appointment created from Google Calendar test route",
        timezone,
        sourceChannel: "admin",
        createdBy: "admin",
        });
    
        /**
         * Step 3:
         * Confirm the appointment in our DB and attach Google event metadata.
         */
        const confirmedAppointment = await confirmAppointment({
        appointmentId: appointment.id,
        confirmedStartAt: event.startAt,
        confirmedEndAt: event.endAt,
        timezone: event.timezone,
        googleCalendarConnectionId: connection.id,
        googleCalendarId: event.calendarId,
        googleEventId: event.eventId,
        });
    return NextResponse.json(
      {
        success: true,
        tenantSlug,
        calendarConnectionId: connection.id,
        event,
        appointment: confirmedAppointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Google test event route error:", error);

    return NextResponse.json(
      { error: "Failed to create Google Calendar test event" },
      { status: 500 }
    );
  }
}