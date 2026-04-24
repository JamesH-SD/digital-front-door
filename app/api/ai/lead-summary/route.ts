import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLeadSummary } from "@/lib/ai/generateLeadSummary";

/**
 * Lead summary endpoint with DB caching.
 *
 * Why this exists:
 * - avoids calling OpenAI every time a contractor opens a lead
 * - stores the generated summary for reuse
 * - still allows regeneration later if we add a "Regenerate Summary" button
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lead = body?.lead;
    const forceRegenerate = body?.forceRegenerate === true;

    if (!lead || typeof lead !== "object") {
      return NextResponse.json(
        { error: "lead is required" },
        { status: 400 }
      );
    }

    const leadId = lead?.id;

    if (!leadId || typeof leadId !== "string") {
      return NextResponse.json(
        { error: "lead.id is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    /**
     * First check whether this lead already has a cached AI summary.
     */
    const { data: existingLead, error: fetchError } = await supabase
      .from("leads")
      .select("id, ai_summary, ai_summary_updated_at")
      .eq("id", leadId)
      .single();

    if (fetchError) {
      console.error("Error fetching cached lead summary:", fetchError.message);
      throw fetchError;
    }

    if (
      !forceRegenerate &&
      existingLead?.ai_summary &&
      existingLead.ai_summary.trim()
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

    /**
     * Only call OpenAI if we do not already have a cached summary.
     */
    const result = await generateLeadSummary(lead);

    if (result.status === "generated" && result.summary) {
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          ai_summary: result.summary,
          ai_summary_updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);

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