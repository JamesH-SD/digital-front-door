import { NextRequest, NextResponse } from "next/server";
import { updateLead } from "@/lib/db/leads";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { leadId } = await context.params;
    const body = await request.json();

    const updatedLead = await updateLead(leadId, {
      phone: body.phone,
      email: body.email,
      address: body.address,
      projectType: body.projectType,
      location: body.location,
      timeline: body.timeline,
      appointment: body.appointment,
      notes: body.notes,
      customerUpdates: body.customerUpdates,
      status: body.status,
      images: body.images,
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("PATCH /api/leads/[leadId] error:", error);

    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}