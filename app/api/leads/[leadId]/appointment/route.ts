import { NextRequest, NextResponse } from "next/server";
import { requireLeadAccess } from "@/lib/auth/requireLeadAccess";
import { getLatestAppointmentByLeadId } from "@/lib/scheduling/appointmentQueries";

/**
 * Get the most recent appointment for a lead (admin lead detail).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await context.params;

    const access = await requireLeadAccess(leadId);

    if (!access.ok) {
      return access.response;
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
