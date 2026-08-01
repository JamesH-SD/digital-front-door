import { createAdminClient } from "@/lib/supabase/admin";
import { generateLeadSummary } from "@/lib/ai/generateLeadSummary";
import { generateLeadInsights } from "@/lib/ai/generateLeadInsights";
import { generateSuggestedReply } from "@/lib/ai/generateSuggestedReply";
import type { Lead } from "@/lib/types/lead";
import { getAppointmentsByLeadId } from "@/lib/scheduling/appointmentService";

export type LeadCopilotResult = {
  status: "generated";
  cached: boolean;
  summary: string | null;
  missingInfo: string[];
  nextStep: string | null;
  suggestedReply: string | null;
  updatedAt: string | null;
};

/**
 * Generate and persist Lead Copilot intelligence.
 *
 * Behavior:
 * - returns stored values when a complete cache already exists
 * - generates only when the cache is missing or regeneration is forced
 * - runs the three existing AI helpers concurrently
 * - persists all Copilot fields in one database update
 */
export async function runLeadCopilot(
  lead: Lead,
  forceRegenerate = false
): Promise<LeadCopilotResult> {
  if (!lead?.id) {
    throw new Error("lead.id is required");
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
    console.error(
      "Error fetching cached Lead Copilot data:",
      fetchError.message
    );
    throw fetchError;
  }

  const hasCachedCopilot =
    typeof existingLead?.ai_summary === "string" &&
    existingLead.ai_summary.trim().length > 0 &&
    typeof existingLead?.ai_next_step === "string" &&
    existingLead.ai_next_step.trim().length > 0 &&
    typeof existingLead?.ai_suggested_reply === "string" &&
    existingLead.ai_suggested_reply.trim().length > 0 &&
    Array.isArray(existingLead?.ai_missing_info);

  if (!forceRegenerate && hasCachedCopilot) {
    return {
      status: "generated",
      cached: true,
      summary: existingLead.ai_summary,
      missingInfo: existingLead.ai_missing_info,
      nextStep: existingLead.ai_next_step,
      suggestedReply: existingLead.ai_suggested_reply,
      updatedAt: existingLead.ai_copilot_updated_at ?? null,
    };
  }

  const appointments = await getAppointmentsByLeadId(lead.id);

  const currentAppointment = appointments[0] ?? null;

  const leadForAI: Lead = {
    ...lead,

    appointment:
      currentAppointment?.confirmedStartAt ??
      currentAppointment?.proposedStartAt ??
      lead.appointment,

    notes: [
      lead.notes,
      currentAppointment?.appointmentType
        ? `Appointment Type: ${currentAppointment.appointmentType}`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
  };

  /*
   * These remain three OpenAI requests for now, but they execute concurrently.
   * Later, we can replace them with one structured AI request.
   */
  const [summaryResult, insightsResult, replyResult] = await Promise.all([
    generateLeadSummary(leadForAI),
    generateLeadInsights(leadForAI),
    generateSuggestedReply(leadForAI),
  ]);

  const summary =
    summaryResult.status === "generated"
      ? summaryResult.summary ?? null
      : null;

  const missingInfo =
    insightsResult.status === "generated" &&
    Array.isArray(insightsResult.missingInfo)
      ? insightsResult.missingInfo
      : [];

  const nextStep =
    insightsResult.status === "generated"
      ? insightsResult.nextStep ?? null
      : null;

  const suggestedReply =
    replyResult.status === "generated"
      ? replyResult.reply ?? null
      : null;

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
    console.error(
      "Error saving Lead Copilot data:",
      updateError.message
    );
    throw updateError;
  }

  return {
    status: "generated",
    cached: false,
    summary,
    missingInfo,
    nextStep,
    suggestedReply,
    updatedAt,
  };
}