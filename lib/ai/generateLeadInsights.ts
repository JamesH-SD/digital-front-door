import { getOpenAIClient } from "@/lib/ai/openaiClient";
import type { Lead } from "@/lib/types/lead";

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

function buildLeadContext(lead: Lead): string {
  const sections = [
    `Lead Number: ${lead.leadNumber || "Unknown"}`,
    `Customer Name: ${lead.customerName || "Unknown"}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `Email: ${lead.email || "Not provided"}`,
    `Project Type: ${lead.projectType || "Not provided"}`,
    `Location: ${lead.location || "Not provided"}`,
    `Timeline: ${lead.timeline || "Not provided"}`,
    `Appointment: ${lead.appointment || "Not provided"}`,
    `Notes: ${lead.notes || "Not provided"}`,
    `Customer Updates: ${lead.customerUpdates || "Not provided"}`,
    `Status: ${lead.status || "new"}`,
  ];

  return sections.join("\n");
}

export async function generateLeadInsights(
  lead: Lead
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

    const prompt = `
      You are helping a small contractor understand what is still missing from a lead and what they should do next.

      Return strict JSON in this shape:
      {
        "missingInfo": ["item 1", "item 2"],
        "nextStep": "one short practical sentence"
      }

      Rules:
      - missingInfo should contain 0 to 4 short phrases
      - only include information that is genuinely missing or would reasonably help qualify the job
      - nextStep should be practical and specific
      - do not invent facts
      - do not include markdown
      - do not include any text outside the JSON

      Lead Details:
      ${buildLeadContext(lead)}
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