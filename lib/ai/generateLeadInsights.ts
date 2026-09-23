import { getOpenAIClient } from "@/lib/ai/openaiClient";
import type { Lead } from "@/lib/types/lead";
import {
  buildLegacyLeadContext,
  type LeadCopilotPromptContext,
} from "@/lib/ai/buildLeadCopilotContext";

export type GenerateLeadInsightsResult =
  | {
      status: "generated";
      missingInfo: string[];
      nextStep: string;
    }
  | {
      status: "skipped";
      reason: string;
      missingInfo?: string[];
      nextStep?: string;
    };

export async function generateLeadInsights(
  lead: Lead,
  copilotContext?: LeadCopilotPromptContext
): Promise<GenerateLeadInsightsResult> {
  if (!lead) {
    return {
      status: "skipped",
      reason: "Lead is required.",
    };
  }

  if (!lead.projectType && !lead.customerUpdates && !lead.notes) {
    return {
      status: "skipped",
      reason: "Not enough lead detail to generate insights.",
    };
  }

  try {
    const client = getOpenAIClient();

    const leadDetails = copilotContext
      ? copilotContext.combinedContextText
      : buildLegacyLeadContext(lead);

    const workflowGuidance = copilotContext
      ? `
- Follow the Booking Flow rules in the context below exactly.
- Only list information that is genuinely missing from structured lead data and persisted Customer Updates.
- If Requires Appointment is "no", never list appointment time or scheduling confirmation as missing merely because no appointment exists.
- If Requires Appointment is "no", the next step must not tell staff to confirm, schedule, or book an appointment unless an actual calendar appointment exists or persisted customer updates clearly show the customer requested scheduling.
- When Requires Appointment is "no", prefer practical follow-up, clarification, or tenant next-step guidance aligned with the booking type.
- When Requires Appointment is "yes", appointment/scheduling gaps may be included when genuinely helpful.
`.trim()
      : "";

    const prompt = `
      You are helping a business understand what is still missing from a lead and what the team should do next.

      Return strict JSON in this shape:
      {
        "missingInfo": ["item 1", "item 2"],
        "nextStep": "one short practical sentence"
      }

      Rules:
      - missingInfo should contain 0 to 4 short phrases
      - only include information that is genuinely missing or would reasonably help qualify or fulfill the request
      - nextStep should be practical and specific for the business operator
      - do not invent facts
      - do not include markdown
      - do not include any text outside the JSON
      ${workflowGuidance ? `\n${workflowGuidance}` : ""}

      Lead Context:
      ${leadDetails}
      `.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      return {
        status: "skipped",
        reason: "OpenAI returned empty insights.",
      };
    }

    const parsed = JSON.parse(raw) as {
      missingInfo?: unknown;
      nextStep?: unknown;
    };

    const missingInfo = Array.isArray(parsed.missingInfo)
      ? parsed.missingInfo
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 4)
      : [];

    const nextStep =
      typeof parsed.nextStep === "string" ? parsed.nextStep.trim() : "";

    if (!nextStep) {
      return {
        status: "skipped",
        reason: "OpenAI returned invalid next-step content.",
      };
    }

    return {
      status: "generated",
      missingInfo,
      nextStep,
    };
  } catch (error) {
    console.error("generateLeadInsights error:", error);

    return {
      status: "skipped",
      reason: "Failed to generate lead insights.",
    };
  }
}
