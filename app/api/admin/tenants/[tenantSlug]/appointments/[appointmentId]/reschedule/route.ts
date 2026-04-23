import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getCalendarConnectionById } from "@/lib/calendar/calendarConnectionService";
import { updateGoogleCalendarEvent } from "@/lib/calendar/googleCalendar";
import {
  confirmAppointment,
  getAppointmentById,
} from "@/lib/scheduling/appointmentService";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
    appointmentId: string;
  }>;
};

/**
 * Reschedule an existing confirmed appointment.
 *
 * Why this route exists:
 * - proves that our scheduling lifecycle can update, not just create
 * - keeps Google Calendar and our DB in sync
 * - gives us a reusable admin workflow that can later be called by
 *   chat, SMS, email, or UI actions
 *
 * Current v1 behavior:
 * - requires an existing appointment
 * - requires that the appointment already be linked to Google metadata
 * - updates the Google event first
 * - then updates the DB appointment to the new confirmed time
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tenantSlug, appointmentId } = await context.params;

    const tenant = await getTenantBySlug(tenantSlug);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const appointment = await getAppointmentById(appointmentId);

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    /**
     * Multi-tenant safety:
     * ensure the appointment belongs to the tenant in the route.
     */
    if (appointment.tenantSlug !== tenantSlug) {
      return NextResponse.json(
        { error: "Appointment does not belong to this tenant" },
        { status: 403 }
      );
    }

    /**
     * We require existing Google linkage for rescheduling because
     * the first job is to move the already-booked Google event.
     */
    if (
      !appointment.googleCalendarConnectionId ||
      !appointment.googleCalendarId ||
      !appointment.googleEventId
    ) {
      return NextResponse.json(
        { error: "Appointment is not linked to a Google Calendar event" },
        { status: 400 }
      );
    }

    const connection = await getCalendarConnectionById(
      appointment.googleCalendarConnectionId
    );

    if (!connection) {
      return NextResponse.json(
        { error: "Calendar connection not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

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
        : appointment.timezone || "America/Los_Angeles";

    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim()
        : undefined;

    const description =
      typeof body?.description === "string" ? body.description : undefined;

    const location =
      typeof body?.location === "string" ? body.location : undefined;

    if (!startAt || !endAt) {
      return NextResponse.json(
        { error: "startAt and endAt are required" },
        { status: 400 }
      );
    }

    /**
     * Step 1:
     * Update the real Google Calendar event first.
     *
     * Why:
     * - if Google fails, we do not want the DB to pretend the appointment moved
     * - this keeps external system state and DB state aligned
     */
    const updatedEvent = await updateGoogleCalendarEvent({
      connection,
      calendarId: appointment.googleCalendarId,
      eventId: appointment.googleEventId,
      title,
      description,
      location,
      startAt,
      endAt,
      timezone,
    });

    /**
     * Step 2:
     * Re-confirm the appointment in our DB with the updated times.
     *
     * Why:
     * - for an admin-driven reschedule, the appointment is still confirmed
     * - we preserve the same Google linkage and simply update the timing
     */
    const updatedAppointment = await confirmAppointment({
      appointmentId: appointment.id,
      confirmedStartAt: updatedEvent.startAt,
      confirmedEndAt: updatedEvent.endAt,
      timezone: updatedEvent.timezone,
      googleCalendarConnectionId: appointment.googleCalendarConnectionId,
      googleCalendarId: appointment.googleCalendarId,
      googleEventId: appointment.googleEventId,
    });

    return NextResponse.json(
      {
        success: true,
        tenantSlug,
        event: updatedEvent,
        appointment: updatedAppointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reschedule appointment route error:", error);

    return NextResponse.json(
      { error: "Failed to reschedule appointment" },
      { status: 500 }
    );
  }
}