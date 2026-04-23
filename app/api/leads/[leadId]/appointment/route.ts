import { NextRequest, NextResponse } from "next/server";
import { getLeadById } from "@/lib/db/leads";
import { getLatestAppointmentByLeadId } from "@/lib/scheduling/appointmentQueries";

/**
 * Get the most recent appointment for a lead.
 *
 * Why this exists:
 * - lets the lead detail screen become appointment-aware
 * - keeps appointment lookup separate from the broader lead payload
 * - allows the UI to switch between Schedule vs View flows
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await context.params;

    const lead = await getLeadById(leadId);

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    const appointment = await getLatestAppointmentByLeadId(leadId);

    return NextResponse.json(
      {
        leadId,
        appointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET lead appointment error:", error);

    return NextResponse.json(
      { error: "Failed to load appointment" },
      { status: 500 }
    );
  }
}