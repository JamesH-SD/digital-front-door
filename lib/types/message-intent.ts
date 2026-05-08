export type MessageIntentType =
  | "schedule_request"
  | "reschedule_request"
  | "cancel_request"
  | "appointment_note"
  | "contact_update"
  | "business_question"
  | "provide_extra_detail"
  | "conversation_close"
  | "unknown";

export type MessageIntentConfidence = "low" | "medium" | "high";

export type MessageIntentResult = {
  intent: MessageIntentType;
  confidence: MessageIntentConfidence;
  reason: string;

  extractedData?: {
    email?: string;
    phone?: string;
    contactName?: string;
    contactRelationship?: string;
    appointmentNote?: string;
    customerUpdate?: string;
    question?: string;
  };
};