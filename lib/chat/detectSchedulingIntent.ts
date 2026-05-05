import { getOpenAIClient } from "@/lib/ai/openaiClient";

export type SchedulingIntentType = "none" | "schedule" | "reschedule" | "cancel";
export type SchedulingAppointmentType = "call" | "site_visit" | null;

export type SchedulingIntentResult = {
  hasSchedulingIntent: boolean;
  type: SchedulingIntentType;
  appointmentType?: SchedulingAppointmentType;
  confidence: "low" | "medium" | "high";
};

/**
 * Fast deterministic checks for obvious scheduling language.
 */
function detectSchedulingIntentWithRules(message: string): SchedulingIntentResult {
  const normalized = message.trim().toLowerCase();

  if (!normalized) {
    return { hasSchedulingIntent: false, type: "none", confidence: "low" };
  }

  /**
   * Policy / hypothetical questions should NOT trigger cancel or reschedule.
   *
   * Example:
   * - "What happens if I need to cancel or reschedule?"
   * - "What if I need to move the appointment?"
   *
   * These are questions about process, not an actual request to change the appointment.
   */
  const isHypotheticalSchedulingQuestion =
  /\bwhat happens if\b/.test(normalized) ||
  /\bwhat if\b/.test(normalized) ||
  /\bif i need to\b/.test(normalized) ||
  /\bif we need to\b/.test(normalized);

  if (
  isHypotheticalSchedulingQuestion &&
  (normalized.includes("cancel") || normalized.includes("reschedule"))
  ) {
  return {
    hasSchedulingIntent: false,
    type: "none",
    appointmentType: null,
    confidence: "high",
  };
  }

  const isCancelReschedulePolicyQuestion =
    (
      normalized.includes("what happens if") ||
      normalized.includes("what if") ||
      normalized.includes("if i need to") ||
      normalized.includes("if we need to")
    ) &&
    (
      normalized.includes("cancel") ||
      normalized.includes("reschedule") ||
      normalized.includes("move") ||
      normalized.includes("change")
    );

  if (isCancelReschedulePolicyQuestion) {
    return {
      hasSchedulingIntent: false,
      type: "none",
      appointmentType: null,
      confidence: "high",
    };
  }

  const cancelPatterns = [/\bcancel\b/, /\bcall it off\b/, /\bcan't make it\b/];
  const reschedulePatterns = [/\breschedule\b/, /\banother time\b/, /\bmove\b/, /\bchange\b/];

  const schedulePatterns = [
    /\bschedule\b/,
    /\bbook\b/,
    /\bappointment\b/,
    /\bavailability\b/,
    /\bavailable\b/,
    /\bnext week\b/,
    /\bthis week\b/,
    /\bcome out\b/,
    /\bcome by\b/,
    /\bon site\b/,
    /\bonsite\b/,
    /\bsite visit\b/,
    /\bin person\b/,
  ];

  if (cancelPatterns.some((p) => p.test(normalized))) {
    return { hasSchedulingIntent: true, type: "cancel", confidence: "high" };
  }

  if (reschedulePatterns.some((p) => p.test(normalized))) {
    return { hasSchedulingIntent: true, type: "reschedule", confidence: "high" };
  }

  if (schedulePatterns.some((p) => p.test(normalized))) {
    return {
      hasSchedulingIntent: true,
      type: "schedule",
      appointmentType:
        normalized.includes("call") || normalized.includes("phone")
          ? "call"
          : normalized.includes("site") ||
            normalized.includes("come") ||
            normalized.includes("look") ||
            normalized.includes("visit") ||
            normalized.includes("space")
          ? "site_visit"
          : null,
      confidence: "high",
    };
  }

  return { hasSchedulingIntent: false, type: "none", confidence: "low" };
}

/**
 * AI fallback for natural language scheduling intent.
 *
 * Why:
 * - customers ask scheduling questions many different ways
 * - regex will not scale across industries
 * - AI only classifies intent; it does NOT choose availability or book anything
 */
async function detectSchedulingIntentWithAI(
  message: string
): Promise<SchedulingIntentResult> {
  try {
    const client = getOpenAIClient();

    const prompt = `
Classify whether this customer message is trying to schedule, reschedule, or cancel an appointment/visit/call/consultation.

Return STRICT JSON only:
{
  "hasSchedulingIntent": true,
  "type": "schedule | reschedule | cancel | none",
  "appointmentType": "call | site_visit | null",
  "confidence": "low | medium | high"
}

Rules:
- "schedule" includes asking someone to come look, visit, inspect, review the space, give an estimate, quote, consultation, appointment, meeting, or asking about availability.
- "site_visit" means in-person, come out, come over, look at the space, review the project, inspect, estimate visit.
- "call" means phone call, quick call, virtual call, remote discussion.
- If the customer is only asking a general business question, return none.
- Do not include markdown.

- If the customer asks a hypothetical/process question such as "What happens if I need to cancel or reschedule?", return type "none". They are asking about policy, not requesting cancellation.
- Only return "cancel" when the customer clearly wants to cancel now.
- Only return "reschedule" when the customer clearly wants to change the appointment now.

Customer message:
${message}
`.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const raw = response.output_text?.trim();
    if (!raw) {
      return { hasSchedulingIntent: false, type: "none", confidence: "low" };
    }

    const parsed = JSON.parse(raw) as Partial<SchedulingIntentResult>;

    const type =
      parsed.type === "schedule" ||
      parsed.type === "reschedule" ||
      parsed.type === "cancel"
        ? parsed.type
        : "none";

    const appointmentType =
      parsed.appointmentType === "call" || parsed.appointmentType === "site_visit"
        ? parsed.appointmentType
        : null;

    const confidence =
      parsed.confidence === "high" ||
      parsed.confidence === "medium" ||
      parsed.confidence === "low"
        ? parsed.confidence
        : "low";

    return {
      hasSchedulingIntent: type !== "none",
      type,
      appointmentType,
      confidence,
    };
  } catch (error) {
    console.error("AI scheduling intent detection failed:", error);
    return { hasSchedulingIntent: false, type: "none", confidence: "low" };
  }
}

export async function detectSchedulingIntent(
  message: string
): Promise<SchedulingIntentResult> {
  const ruleResult = detectSchedulingIntentWithRules(message);

  if (
    ruleResult.hasSchedulingIntent ||
    ruleResult.confidence === "high"
  ) {
    return ruleResult;
  }

  return detectSchedulingIntentWithAI(message);
}