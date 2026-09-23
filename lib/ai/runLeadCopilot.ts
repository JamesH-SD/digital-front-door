import { createAdminClient } from "@/lib/supabase/admin";
import { generateLeadSummary } from "@/lib/ai/generateLeadSummary";
import { generateLeadInsights } from "@/lib/ai/generateLeadInsights";
import { generateSuggestedReply } from "@/lib/ai/generateSuggestedReply";
import type { Lead } from "@/lib/types/lead";
import { getAppointmentsByLeadId } from "@/lib/scheduling/appointmentService";
import { mapLead } from "@/lib/db/leads";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getBookingFlowConfig } from "@/lib/config/getBookingFlowConfig";
import {
  buildLeadCopilotAppointmentFacts,
  buildLeadCopilotPromptContext,
} from "@/lib/ai/buildLeadCopilotContext";

export type LeadCopilotResult = {
  status: "generated";
  cached: boolean;
  summary: string | null;
  missingInfo: string[];
  nextStep: string | null;
  suggestedReply: string | null;
  updatedAt: string | null;
};

function resolveLeadId(input: Lead | { id: string } | string): string {
  if (typeof input === "string") {
    return input;
  }

  return input.id;
}

async function fetchFreshLeadById(leadId: string): Promise<Lead | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (error) {
    console.error("Error fetching fresh lead for Lead Copilot:", error.message);
    return null;
  }

  return data ? mapLead(data) : null;
}

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
  leadOrLeadId: Lead | { id: string } | string,
  forceRegenerate = false
): Promise<LeadCopilotResult> {
  const leadId = resolveLeadId(leadOrLeadId);

  if (!leadId) {
    throw new Error("lead.id is required");
  }

  const supabase = createAdminClient();

  const { data: existingLead, error: fetchError } = await supabase
    .from("leads")
    .select(
      "id, ai_summary, ai_missing_info, ai_next_step, ai_suggested_reply, ai_copilot_updated_at"
    )
    .eq("id", leadId)
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

  const freshLead = await fetchFreshLeadById(leadId);

  if (!freshLead) {
    throw new Error("Lead not found for Lead Copilot generation.");
  }

  const tenant = await getTenantBySlug(freshLead.tenantSlug);

  if (!tenant) {
    throw new Error("Tenant not found for Lead Copilot generation.");
  }

  const bookingFlow = getBookingFlowConfig(tenant);
  const appointments = await getAppointmentsByLeadId(freshLead.id);
  const currentAppointment = appointments[0] ?? null;

  const appointmentFacts = buildLeadCopilotAppointmentFacts({
    lead: freshLead,
    calendarAppointment: currentAppointment,
  });

  const leadForAI: Lead = {
    ...freshLead,
    appointment: appointmentFacts.appointmentStart ?? freshLead.appointment,
    notes: [
      freshLead.notes,
      appointmentFacts.hasCalendarAppointment && appointmentFacts.appointmentType
        ? `Appointment Type: ${appointmentFacts.appointmentType}`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
  };

  const copilotContext = buildLeadCopilotPromptContext({
    lead: leadForAI,
    tenant,
    bookingFlow,
    appointmentFacts,
  });

  const [summaryResult, insightsResult, replyResult] = await Promise.all([
    generateLeadSummary(leadForAI, copilotContext),
    generateLeadInsights(leadForAI, copilotContext),
    generateSuggestedReply(leadForAI, copilotContext),
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
    .eq("id", leadId);

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
