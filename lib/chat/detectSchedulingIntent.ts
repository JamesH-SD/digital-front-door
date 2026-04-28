export type SchedulingIntentType =
  | "none"
  | "schedule"
  | "reschedule"
  | "cancel";

export type SchedulingIntentResult = {
  hasSchedulingIntent: boolean;
  type: SchedulingIntentType;
  confidence: "low" | "medium" | "high";
};

/**
 * Detects whether a customer is trying to schedule, reschedule,
 * or cancel an appointment.
 *
 * Important:
 * - This does NOT book anything.
 * - This does NOT change chat behavior yet.
 * - This does NOT call OpenAI.
 * - This is intentionally conservative so we avoid disrupting intake.
 */
export function detectSchedulingIntent(
  message: string
): SchedulingIntentResult {
  const normalized = message.trim().toLowerCase();

  if (!normalized) {
    return {
      hasSchedulingIntent: false,
      type: "none",
      confidence: "low",
    };
  }

  const cancelPatterns = [
    /\bcancel\b/,
    /\bcall it off\b/,
    /\bcan't make it\b/,
    /\bcannot make it\b/,
  ];

  const reschedulePatterns = [
    /\breschedule\b/,
    /\bmove (my|the|our)?\s*(appointment|visit|call|meeting)?\b/,
    /\bchange (my|the|our)?\s*(appointment|visit|call|meeting)?\b/,
    /\banother time\b/,
  ];

  const schedulePatterns = [
    /\bschedule\b/,
    /\bbook\b/,
    /\bset up\b/,
    /\bappointment\b/,
    /\bsite visit\b/,
    /\bcome out\b/,
    /\bcome by\b/,
    /\bavailable\b/,
    /\bavailability\b/,
    /\bwhen can\b/,
    /\bwhat times\b/,
    /\bmeet\b/,
    /\bcalendar\b/,
    /\bhow soon can you\b/,
    /\bcome and inspect\b/,
    /\binspect\b/,
    /\binspection\b/,
    /\bdo you have time\b/,
    /\bnext week\b/,
    /\bthis week\b/,
    /\bcome take a look\b/,
    /\bswing by\b/,
  ];

  if (cancelPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      hasSchedulingIntent: true,
      type: "cancel",
      confidence: "high",
    };
  }

  if (reschedulePatterns.some((pattern) => pattern.test(normalized))) {
    return {
      hasSchedulingIntent: true,
      type: "reschedule",
      confidence: "high",
    };
  }

  if (schedulePatterns.some((pattern) => pattern.test(normalized))) {
    return {
      hasSchedulingIntent: true,
      type: "schedule",
      confidence: "medium",
    };
  }

  return {
    hasSchedulingIntent: false,
    type: "none",
    confidence: "low",
  };
}