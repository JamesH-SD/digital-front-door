import { getOpenAIClient } from "@/lib/ai/openaiClient";
import type { Lead } from "@/lib/types/lead";

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

export async function generateSuggestedReply(
  lead: Lead
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

    const prompt = `
You are helping a small contractor respond to a new lead.

Write a short, professional, friendly reply the contractor could send back.
Requirements:
- keep it brief and practical
- sound human, not robotic
- acknowledge the project request
- do not make up facts
- do not overpromise
- do not use bullet points
- do not include placeholders like [Name]

Lead Details:
${buildLeadContext(lead)}
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