import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireLeadAccess } from "@/lib/auth/requireLeadAccess";
import { generateSuggestedReply } from "@/lib/ai/generateSuggestedReply";
import { mapLead } from "@/lib/db/leads";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const leadIdFromBody =
      typeof body?.lead?.id === "string" ? body.lead.id.trim() : "";

    if (!leadIdFromBody) {
      return NextResponse.json(
        { error: "lead.id is required" },
        { status: 400 }
      );
    }

    const access = await requireLeadAccess(leadIdFromBody);

    if (!access.ok) {
      return access.response;
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadIdFromBody)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const lead = mapLead(data);
    const result = await generateSuggestedReply(lead);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST /api/ai/suggested-reply error:", error);

    return NextResponse.json(
      { error: "Failed to generate suggested reply" },
      { status: 500 }
    );
  }
}
