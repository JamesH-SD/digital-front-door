import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireLeadAccess } from "@/lib/auth/requireLeadAccess";
import { generateLeadSummary } from "@/lib/ai/generateLeadSummary";
import { mapLead } from "@/lib/db/leads";

/**
 * Lead summary endpoint with DB caching.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const forceRegenerate = body?.forceRegenerate === true;

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

    const { data: existingLead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadIdFromBody)
      .single();

    if (fetchError || !existingLead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const lead = mapLead(existingLead);

    if (
      !forceRegenerate &&
      existingLead.ai_summary &&
      String(existingLead.ai_summary).trim()
    ) {
      return NextResponse.json(
        {
          status: "generated",
          summary: existingLead.ai_summary,
          cached: true,
          updatedAt: existingLead.ai_summary_updated_at,
        },
        { status: 200 }
      );
    }

    const result = await generateLeadSummary(lead);

    if (result.status === "generated" && result.summary) {
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          ai_summary: result.summary,
          ai_summary_updated_at: new Date().toISOString(),
        })
        .eq("id", leadIdFromBody);

      if (updateError) {
        console.error("Error saving AI summary:", updateError.message);
      }

      return NextResponse.json(
        {
          ...result,
          cached: false,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST /api/ai/lead-summary error:", error);

    return NextResponse.json(
      { error: "Failed to generate lead summary" },
      { status: 500 }
    );
  }
}
