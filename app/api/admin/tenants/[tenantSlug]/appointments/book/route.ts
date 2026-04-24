import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getLeadById, updateLead } from "@/lib/db/leads";
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
 * Book an appointment for a real lead.
 *
 * Current v1 behavior:
 * - requires a real leadId
 * - supports appointment type
 * - requires address for site visits
 * - prefilled title/description can be overridden by UI
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

    const leadId =
      typeof body?.leadId === "string" && body.leadId.trim()
        ? body.leadId.trim()
        : null;

    const appointmentType =
      body?.appointmentType === "site_visit" ? "site_visit" : "call";

    const address =
      typeof body?.address === "string" ? body.address.trim() : "";

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
      appointmentType === "site_visit" && address
        ? address
        : typeof body?.location === "string"
        ? body.location
        : null;

    const attendeeEmail =
      typeof body?.attendeeEmail === "string" ? body.attendeeEmail : null;

    const notes =
      typeof body?.notes === "string" ? body.notes : null;

    if (!leadId) {
      return NextResponse.json(
        { error: "leadId is required" },
        { status: 400 }
      );
    }

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

    if (appointmentType === "site_visit" && !address) {
      return NextResponse.json(
        { error: "address is required for a site visit" },
        { status: 400 }
      );
    }

    const lead = await getLeadById(leadId);

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    if (lead.tenantSlug !== tenantSlug) {
      return NextResponse.json(
        { error: "Lead does not belong to this tenant" },
        { status: 403 }
      );
    }

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

    const appointment = await createAppointment({
      tenantSlug,
      leadId,
      appointmentType,
      address: appointmentType === "site_visit" ? address : null,
      title,
      description,
      notes,
      timezone,
      sourceChannel: "admin",
      createdBy: "admin",
    });

    const confirmedAppointment = await confirmAppointment({
      appointmentId: appointment.id,
      confirmedStartAt: event.startAt,
      confirmedEndAt: event.endAt,
      timezone: event.timezone,
      googleCalendarConnectionId: connection.id,
      googleCalendarId: event.calendarId,
      googleEventId: event.eventId,
    });

    /**
     * Booking an appointment should move the lead into the booked stage.
     *
     * Why:
     * - the appointment is now confirmed in our DB
     * - the Google event exists
     * - the contractor workflow should reflect that this lead is no longer just new/contacted
     */
    const updatedLead = await updateLead(lead.id, {
      status: "booked",
    });

    return NextResponse.json(
      {
        success: true,
        tenantSlug,
        lead: {
          id: updatedLead.id,
          leadNumber: updatedLead.leadNumber,
          customerName: updatedLead.customerName,
          status: updatedLead.status,
        },
        event,
        appointment: confirmedAppointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Book appointment route error:", error);

    return NextResponse.json(
      { error: "Failed to book appointment" },
      { status: 500 }
    );
  }
}