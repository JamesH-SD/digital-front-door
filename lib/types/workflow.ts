import type { MessageIntentResult } from "@/lib/types/message-intent";

export type WorkflowActionType =
  | "answer_business_question"
  | "start_scheduling"
  | "start_signup"
  | "manual_followup"
  | "lead_capture_complete"
  | "update_contact_info"
  | "add_appointment_note"
  | "add_customer_detail"
  | "handle_conversation_close"
  | "continue_normal_chat";

export type WorkflowDecision = {
  action: WorkflowActionType;
  reason: string;
  intent: MessageIntentResult;
};