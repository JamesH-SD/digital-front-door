import { NextRequest, NextResponse } from "next/server";
import { updateLead } from "@/lib/db/leads";

type LeadStatus = "new" | "contacted" | "booked" | "closed";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

/**
 * Update only the lead status.
 *
 * Why this exists:
 * - the general PATCH /api/leads/[leadId] route updates many fields
 * - modal actions like "Move to Follow-up" should only change status
 * - this avoids accidentally overwriting other lead fields with undefined
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { leadId } = await context.params;
    const body = await request.json();

    const status = body?.status as LeadStatus | undefined;

    if (!status || !["new", "contacted", "booked", "closed"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 }
      );
    }

    const updatedLead = await updateLead(leadId, {
      status,
    });

    return NextResponse.json(updatedLead, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/leads/[leadId]/status error:", error);

    return NextResponse.json(
      { error: "Failed to update lead status" },
      { status: 500 }
    );
  }
}