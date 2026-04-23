import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getCalendarConnectionById } from "@/lib/calendar/calendarConnectionService";
import { cancelGoogleCalendarEvent } from "@/lib/calendar/googleCalendar";
import {
  cancelAppointment,
  getAppointmentById,
} from "@/lib/scheduling/appointmentService";

type RouteContext = {
  params: Promise<{
    tenantSlug: string;
    appointmentId: string;
  }>;
};

/**
 * Cancel an appointment.
 *
 * Flow:
 * 1. Validate tenant + appointment
 * 2. Cancel Google event
 * 3. Mark appointment cancelled in DB
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tenantSlug, appointmentId } = await context.params;

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const appointment = await getAppointmentById(appointmentId);
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.tenantSlug !== tenantSlug) {
      return NextResponse.json(
        { error: "Appointment does not belong to this tenant" },
        { status: 403 }
      );
    }

    // Cancel Google event if linked
    if (
      appointment.googleCalendarConnectionId &&
      appointment.googleCalendarId &&
      appointment.googleEventId
    ) {
      const connection = await getCalendarConnectionById(
        appointment.googleCalendarConnectionId
      );

      if (connection) {
        await cancelGoogleCalendarEvent({
          connection,
          calendarId: appointment.googleCalendarId,
          eventId: appointment.googleEventId,
        });
      }
    }

    const updated = await cancelAppointment(appointment.id);

    return NextResponse.json({
      success: true,
      appointment: updated,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);

    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}