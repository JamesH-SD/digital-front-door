import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLeadSummary } from "@/lib/ai/generateLeadSummary";
import { generateLeadInsights } from "@/lib/ai/generateLeadInsights";
import { generateSuggestedReply } from "@/lib/ai/generateSuggestedReply";

/**
 * Lead Copilot endpoint.
 *
 * Purpose:
 * - consolidate multiple AI calls behind one route
 * - cache/persist generated AI outputs in the leads table
 * - avoid spending OpenAI tokens every time the Lead page loads
 *
 * Behavior:
 * - returns cached AI data by default
 * - regenerates only when forceRegenerate=true or cached data is missing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lead = body?.lead;
    const forceRegenerate = body?.forceRegenerate === true;

    if (!lead || typeof lead !== "object") {
      return NextResponse.json({ error: "lead is required" }, { status: 400 });
    }

    if (!lead.id || typeof lead.id !== "string") {
      return NextResponse.json({ error: "lead.id is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existingLead, error: fetchError } = await supabase
      .from("leads")
      .select(
        "id, ai_summary, ai_missing_info, ai_next_step, ai_suggested_reply, ai_copilot_updated_at"
      )
      .eq("id", lead.id)
      .single();

    if (fetchError) {
      console.error("Error fetching cached lead copilot data:", fetchError.message);
      throw fetchError;
    }

    const hasCachedCopilot =
      existingLead?.ai_summary &&
      existingLead?.ai_next_step &&
      existingLead?.ai_suggested_reply &&
      Array.isArray(existingLead?.ai_missing_info);

    if (!forceRegenerate && hasCachedCopilot) {
      return NextResponse.json(
        {
          status: "generated",
          cached: true,
          summary: existingLead.ai_summary,
          missingInfo: existingLead.ai_missing_info ?? [],
          nextStep: existingLead.ai_next_step,
          suggestedReply: existingLead.ai_suggested_reply,
          updatedAt: existingLead.ai_copilot_updated_at,
        },
        { status: 200 }
      );
    }

    /**
     * Current implementation:
     * - still uses existing AI helper functions
     * - but centralizes the trigger and persistence
     *
     * Later:
     * - we can combine these into one OpenAI prompt/function call for even better cost control.
     */
    const [summaryResult, insightsResult, replyResult] = await Promise.all([
      generateLeadSummary(lead),
      generateLeadInsights(lead),
      generateSuggestedReply(lead),
    ]);

    const summary =
      summaryResult.status === "generated" ? summaryResult.summary : null;

    const missingInfo =
      insightsResult.status === "generated" &&
      Array.isArray(insightsResult.missingInfo)
        ? insightsResult.missingInfo
        : [];

    const nextStep =
      insightsResult.status === "generated" ? insightsResult.nextStep ?? null : null;

    const suggestedReply =
      replyResult.status === "generated" ? replyResult.reply ?? null : null;

    const updatedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("leads")
      .update({
        ai_summary: summary,
        ai_summary_updated_at: updatedAt,
        ai_missing_info: missingInfo,
        ai_next_step: nextStep,
        ai_suggested_reply: suggestedReply,
        ai_copilot_updated_at: updatedAt,
      })
      .eq("id", lead.id);

    if (updateError) {
      console.error("Error saving lead copilot data:", updateError.message);
      throw updateError;
    }

    return NextResponse.json(
      {
        status: "generated",
        cached: false,
        summary,
        missingInfo,
        nextStep,
        suggestedReply,
        updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/ai/lead-copilot error:", error);

    return NextResponse.json(
      { error: "Failed to generate lead copilot data" },
      { status: 500 }
    );
  }
}