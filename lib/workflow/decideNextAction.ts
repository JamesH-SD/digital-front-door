import type { MessageIntentResult } from "@/lib/types/message-intent";
import type { WorkflowDecision } from "@/lib/types/workflow";

function normalize(value?: string | null) {
  return value?.toLowerCase().trim() || "";
}

function isSignupOrGetStartedIntent(message: string) {
  const text = normalize(message);

  const isSoftClose =
    /\b(i'?ll|i will|we'?ll|we will)\s+sign up soon\b/.test(text) ||
    /\bsign up soon\b/.test(text) ||
    /\bthanks?\b/.test(text) ||
    /\bthank you\b/.test(text);

  if (isSoftClose) {
    return false;
  }

  return (
    /\bhow\s+do\s+i\s+sign\s+up\b/.test(text) ||
    /\bhow\s+can\s+i\s+sign\s+up\b/.test(text) ||
    /\bwhere\s+do\s+i\s+sign\s+up\b/.test(text) ||
    /\bwhere\s+can\s+i\s+sign\s+up\b/.test(text) ||
    /\bhow\s+do\s+i\s+get\s+started\b/.test(text) ||
    /\bwhere\s+do\s+i\s+get\s+started\b/.test(text) ||
    /\bcreate\s+(an\s+)?account\b/.test(text) ||
    /\bstart\s+my\s+account\b/.test(text)
  );
}

export function decideNextAction(
  intent: MessageIntentResult,
  latestUserMessage = ""
): WorkflowDecision {
  if (isSignupOrGetStartedIntent(latestUserMessage)) {
    return {
      action: "start_signup",
      reason: "Customer is asking how to sign up or create an account.",
      intent,
    };
  }

  switch (intent.intent) {
    case "business_question":
      return {
        action: "answer_business_question",
        reason: "Customer asked a business-specific question.",
        intent,
      };

    case "schedule_request":
    case "reschedule_request":
    case "cancel_request":
      return {
        action: "start_scheduling",
        reason: "Customer expressed scheduling-related intent.",
        intent,
      };

    case "contact_update":
      return {
        action: "update_contact_info",
        reason: "Customer provided or wants to provide contact information.",
        intent,
      };

    case "appointment_note":
      return {
        action: "add_appointment_note",
        reason: "Customer added a preference or note for the appointment.",
        intent,
      };

    case "provide_extra_detail":
      return {
        action: "add_customer_detail",
        reason: "Customer provided additional project details.",
        intent,
      };

    case "conversation_close":
      return {
        action: "handle_conversation_close",
        reason: "Customer appears to be wrapping up.",
        intent,
      };

    default:
      return {
        action: "continue_normal_chat",
        reason: "No confident workflow action selected.",
        intent,
      };
  }
}