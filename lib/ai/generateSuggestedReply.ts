import { getOpenAIClient } from "@/lib/ai/openaiClient";
import type { Lead } from "@/lib/types/lead";
import {
  buildLegacyLeadContext,
  type LeadCopilotPromptContext,
} from "@/lib/ai/buildLeadCopilotContext";

export type GenerateSuggestedReplyResult =
  | {
      status: "generated";
      reply: string;
    }
  | {
      status: "skipped";
      reason: string;
      reply?: string;
    };

export async function generateSuggestedReply(
  lead: Lead,
  copilotContext?: LeadCopilotPromptContext
): Promise<GenerateSuggestedReplyResult> {
  if (!lead) {
    return {
      status: "skipped",
      reason: "Lead is required.",
    };
  }

  if (!lead.projectType && !lead.customerUpdates && !lead.notes) {
    return {
      status: "skipped",
      reason: "Not enough lead detail to generate a useful reply.",
    };
  }

  try {
    const client = getOpenAIClient();

    const leadDetails = copilotContext
      ? copilotContext.combinedContextText
      : buildLegacyLeadContext(lead);

    const workflowGuidance = copilotContext
      ? `
- Follow the Booking Flow rules in the context below.
- Use persisted Customer Updates and structured lead facts accurately.
- If Requires Appointment is "no", do not imply that scheduling or confirming an appointment is required.
- If an actual calendar appointment exists, you may reference it accurately.
- Do not invent facts or overpromise.
`.trim()
      : "";

    const prompt = `
You are helping a business respond to a lead.

Write a short, professional, friendly reply the team could send back.
Requirements:
- keep it brief and practical
- sound human, not robotic
- acknowledge the request using known lead facts and persisted Customer Updates
- do not make up facts
- do not overpromise
- do not use bullet points
- do not include placeholders like [Name]
${workflowGuidance ? `\n${workflowGuidance}` : ""}

Lead Context:
${leadDetails}
`.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const reply = response.output_text?.trim();

    if (!reply) {
      return {
        status: "skipped",
        reason: "OpenAI returned an empty reply.",
      };
    }

    return {
      status: "generated",
      reply,
    };
  } catch (error) {
    console.error("generateSuggestedReply error:", error);

    return {
      status: "skipped",
      reason: "Failed to generate suggested reply.",
    };
  }
}
