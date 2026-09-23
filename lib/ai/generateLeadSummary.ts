import { getOpenAIClient } from "@/lib/ai/openaiClient";
import type { Lead } from "@/lib/types/lead";
import {
  buildLegacyLeadContext,
  type LeadCopilotPromptContext,
} from "@/lib/ai/buildLeadCopilotContext";

export type GenerateLeadSummaryResult =
  | {
      status: "generated";
      summary: string;
    }
  | {
      status: "skipped";
      reason: string;
      summary?: string;
    };

export async function generateLeadSummary(
  lead: Lead,
  copilotContext?: LeadCopilotPromptContext
): Promise<GenerateLeadSummaryResult> {
  if (!lead) {
    return {
      status: "skipped",
      reason: "Lead is required.",
    };
  }

  if (!lead.projectType && !lead.customerUpdates && !lead.notes) {
    return {
      status: "skipped",
      reason: "Not enough lead detail to generate a useful summary.",
    };
  }

  try {
    const client = getOpenAIClient();

    const leadDetails = copilotContext
      ? copilotContext.combinedContextText
      : buildLegacyLeadContext(lead);

    const workflowGuidance = copilotContext
      ? `
- Respect the Booking Flow rules in the context below.
- Summarize persisted Customer Updates when they add important detail.
- If the workflow does not require an appointment, do not describe missing appointment time as a key fact unless an actual calendar appointment exists or the customer explicitly requested scheduling in persisted updates.
`.trim()
      : "";

    const prompt = `
You are an assistant helping a business team quickly understand a lead.

Your job:
- write a short, practical summary of the lead
- keep it to 2-3 sentences maximum
- mention the project/request, location, timeline, and any notable persisted customer updates
- do not make up facts
- do not use bullet points
- do not greet the user
- do not use hype or marketing language
- write clearly for an operator who wants the key facts fast
${workflowGuidance ? `\n${workflowGuidance}` : ""}

Lead Context:
${leadDetails}
`.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const summary = response.output_text?.trim();

    if (!summary) {
      return {
        status: "skipped",
        reason: "OpenAI returned an empty summary.",
      };
    }

    return {
      status: "generated",
      summary,
    };
  } catch (error) {
    console.error("generateLeadSummary error:", error);

    return {
      status: "skipped",
      reason: "Failed to generate AI summary.",
    };
  }
}
