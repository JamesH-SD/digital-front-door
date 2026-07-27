import { getOpenAIClient } from "@/lib/ai/openaiClient";

export type SchedulingIntentType = "none" | "schedule" | "reschedule" | "cancel";
export type SchedulingAppointmentType = "call" | "site_visit" | null;

export type SchedulingIntentResult = {
  hasSchedulingIntent: boolean;
  type: SchedulingIntentType;
  appointmentType?: SchedulingAppointmentType;
  confidence: "low" | "medium" | "high";
};

function looksLikeContactInfoUpdate(normalized: string) {
  const mentionsContactPerson =
    normalized.includes("wife") ||
    normalized.includes("husband") ||
    normalized.includes("spouse") ||
    normalized.includes("partner") ||
    normalized.includes("backup") ||
    normalized.includes("alternate") ||
    normalized.includes("emergency contact");

  const mentionsContactMethod =
    normalized.includes("number") ||
    normalized.includes("phone") ||
    normalized.includes("contact") ||
    normalized.includes("reach");

  return mentionsContactPerson && mentionsContactMethod;
}

function isAppointmentInformationQuestion(message: string) {
  const normalized = message.toLowerCase();

  const informationPatterns = [
    "who will",
    "who's",
    "who is",
    "who am i",
    "who do i",
    "who may",
    "who might",
    "who usually",
    "who handles",
    "who performs",
    "who does",
    "who'll",
    "who will be",
    "who is coming",
    "who is calling",
    "who will be calling",
    "who will be coming",
    "who will i be speaking",
    "who am i speaking",
    "who is assigned",
    "who's assigned",
    "who is my appointment with",
    "who will i meet",
    "who am i meeting"
  ];

  return informationPatterns.some(pattern =>
    normalized.includes(pattern)
  );
}

/**
 * Fast deterministic checks for obvious scheduling language.
 */
function detectSchedulingIntentWithRules(message: string): SchedulingIntentResult {
  const normalized = message.trim().toLowerCase();

  // Appointment information questions are NOT scheduling requests.
  if (isAppointmentInformationQuestion(normalized)) {
    return {
      hasSchedulingIntent: false,
      type: "none",
      appointmentType: null,
      confidence: "high",
    };
  }

  if (looksLikeContactInfoUpdate(normalized)) {
    return {
      hasSchedulingIntent: false,
      type: "none",
      appointmentType: null,
      confidence: "high",
    };
  }

  if (!normalized) {
    return { hasSchedulingIntent: false, type: "none", appointmentType: null, confidence: "low" };
  }

  const isClosingAfterBookedAppointment =
  /\b(see you|see ya|talk to you|talk then|see you then|see you sunday|see you monday|see you tuesday|see you wednesday|see you thursday|see you friday|see you saturday)\b/.test(
    normalized
  ) ||
  /\b(i'll see you|ill see you|we'll see you|see you at)\b/.test(normalized) ||
  /\b(looking forward|thanks|thank you|appreciate it)\b/.test(normalized);

if (isClosingAfterBookedAppointment) {
  return {
    hasSchedulingIntent: false,
    type: "none",
    appointmentType: null,
    confidence: "high",
  };
}

  const isPushingBackOnReschedule =
    normalized.includes("what made you think") ||
    normalized.includes("why did you think") ||
    normalized.includes("i said i will see you") ||
    normalized.includes("i said i'll see you") ||
    normalized.includes("i did not ask to reschedule") ||
    normalized.includes("i didn't ask to reschedule");

  if (isPushingBackOnReschedule) {
    return {
      hasSchedulingIntent: false,
      type: "none",
      appointmentType: null,
      confidence: "high",
    };
  }

  const asksIfSomeoneCanHelp =
  /\b(someone|anyone|you)\s+(available|free)\s+to\s+(help|answer|chat|talk)\b/.test(
    normalized
  ) ||
  /\bavailable\s+to\s+(help|answer|chat)\b/.test(normalized);

if (asksIfSomeoneCanHelp) {
  return {
    hasSchedulingIntent: false,
    type: "none",
    appointmentType: null,
    confidence: "high",
  };
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