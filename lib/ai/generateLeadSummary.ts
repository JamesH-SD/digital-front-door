import { getOpenAIClient } from "@/lib/ai/openaiClient";
import type { Lead } from "@/lib/types/lead";

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

/**
 * Build a compact, structured text block from the lead.
 *
 * Why this exists:
 * - keeps the prompt cleaner and more predictable
 * - limits the amount of noisy or missing data passed to the model
 * - makes future prompt tuning easier
 */
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

/**
 * Generate a short contractor-friendly lead summary.
 *
 * Behavior:
 * - returns a concise summary for quick scanning
 * - does not throw for normal AI/provider failures
 * - safely skips when required input is missing
 *
 * Notes for future devs:
 * - this helper is intentionally non-blocking
 * - if AI fails, the rest of the lead workflow should still work
 * - keep summaries brief and practical for busy contractors
 */
export async function generateLeadSummary(
  lead: Lead
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

    const prompt = `
You are an assistant helping a busy small contractor quickly understand a new lead.

Your job:
- write a short, practical summary of the lead
- keep it to 2-3 sentences maximum
- mention the project, location, timeline, and any notable context
- do not make up facts
- do not use bullet points
- do not greet the user
- do not use hype or marketing language
- write clearly for a contractor who wants the key facts fast

Lead Details:
${buildLeadContext(lead)}
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