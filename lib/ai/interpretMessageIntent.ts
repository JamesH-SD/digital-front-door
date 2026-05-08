import { getOpenAIClient } from "@/lib/ai/openaiClient";
import type { ChatMessage } from "@/lib/types/chat";
import type { Lead } from "@/lib/types/lead";
import type {
  MessageIntentResult,
  MessageIntentType,
} from "@/lib/types/message-intent";
import type { Tenant } from "@/lib/types/tenant";

function stripCodeFences(value: string) {
  return value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeIntent(value: unknown): MessageIntentType {
  const allowed: MessageIntentType[] = [
    "schedule_request",
    "reschedule_request",
    "cancel_request",
    "appointment_note",
    "contact_update",
    "business_question",
    "provide_extra_detail",
    "conversation_close",
    "unknown",
  ];

  return typeof value === "string" && allowed.includes(value as MessageIntentType)
    ? (value as MessageIntentType)
    : "unknown";
}

function buildLeadContext(lead: Lead | null) {
  if (!lead) return "No lead exists yet.";

  return [
    `Lead Number: ${lead.leadNumber || "Unknown"}`,
    `Customer Name: ${lead.customerName || "Unknown"}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `Email: ${lead.email || "Not provided"}`,
    `Address: ${lead.address || "Not provided"}`,
    `Project Type: ${lead.projectType || "Not provided"}`,
    `Location: ${lead.location || "Not provided"}`,
    `Timeline: ${lead.timeline || "Not provided"}`,
    `Appointment: ${lead.appointment || "Not provided"}`,
    `Customer Updates: ${lead.customerUpdates || "Not provided"}`,
    `Status: ${lead.status || "new"}`,
  ].join("\n");
}

function buildTenantContext(tenant: Tenant) {
  return [
    `Business Name: ${tenant.businessName || "Unknown"}`,
    `Primary Category: ${tenant.primaryCategory || "Not provided"}`,
    `Phone: ${tenant.primaryPhone || "Not provided"}`,
    `Email: ${tenant.email || "Not provided"}`,
    `Service Area: ${tenant.serviceAreaSummary || "Not provided"}`,
    `Services Offered: ${(tenant.servicesOffered || []).join(", ") || "Not provided"}`,
  ].join("\n");
}

function buildConversation(messages: ChatMessage[]) {
  return messages
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");
}

export async function interpretMessageIntent(input: {
  tenant: Tenant;
  lead: Lead | null;
  messages: ChatMessage[];
  latestUserMessage: string;
}): Promise<MessageIntentResult> {
  const { tenant, lead, messages, latestUserMessage } = input;

  try {
    const client = getOpenAIClient();

    const prompt = `
You classify the customer's latest message for an AI receptionist system.

Return STRICT JSON only:
{
  "intent": "schedule_request | reschedule_request | cancel_request | appointment_note | contact_update | business_question | provide_extra_detail | conversation_close | unknown",
  "confidence": "low | medium | high",
  "reason": "short reason",
  "extractedData": {
    "email": "optional",
    "phone": "optional",
    "contactName": "optional",
    "contactRelationship": "optional",
    "appointmentNote": "optional",
    "customerUpdate": "optional",
    "question": "optional"
  }
}

Intent definitions:
- schedule_request: customer clearly wants to book a new call, visit, consultation, showing, appointment, or meeting.
- reschedule_request: customer clearly wants to change an already-booked appointment time/date/type.
- cancel_request: customer clearly wants to cancel an appointment or stop moving forward.
- appointment_note: customer wants to add an instruction/preference to an existing appointment, such as "call before arriving" or "bring samples".
- contact_update: customer provides or asks to provide contact info, backup contact info, spouse/partner phone, email, or alternate contact details.
- business_question: customer asks about services, pricing, location, licensing, samples, process, availability to answer questions, contact number, or business facts.
- provide_extra_detail: customer adds project/context details that should be saved to the lead.
- conversation_close: customer is wrapping up politely.
- unknown: unclear.

Critical rules:
- Do not classify contact info or backup contact messages as schedule_request.
- Do not classify "available to answer questions" as schedule_request.
- Do not classify "call before you come over" as reschedule_request. That is appointment_note.
- If the customer says they prefer a phone call instead of a booked visit, classify as reschedule_request.
- If the customer asks whether they can provide backup contact information but has not provided the actual phone/email/name yet, classify as contact_update with no phone/email extracted.
- If the customer asks for the phone number to call, classify as business_question.
- If the customer is still asking questions, classify as business_question.

Tenant Context:
${buildTenantContext(tenant)}

Lead Context:
${buildLeadContext(lead)}

Recent Conversation:
${buildConversation(messages)}

Latest Customer Message:
${latestUserMessage}
`.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      return {
        intent: "unknown",
        confidence: "low",
        reason: "OpenAI returned empty output.",
      };
    }

    const parsed = JSON.parse(stripCodeFences(raw));

    return {
      intent: normalizeIntent(parsed?.intent),
      confidence:
        parsed?.confidence === "high" ||
        parsed?.confidence === "medium" ||
        parsed?.confidence === "low"
          ? parsed.confidence
          : "low",
      reason: sanitizeString(parsed?.reason) || "No reason provided.",
      extractedData: {
        email: sanitizeString(parsed?.extractedData?.email),
        phone: sanitizeString(parsed?.extractedData?.phone),
        contactName: sanitizeString(parsed?.extractedData?.contactName),
        contactRelationship: sanitizeString(
          parsed?.extractedData?.contactRelationship
        ),
        appointmentNote: sanitizeString(parsed?.extractedData?.appointmentNote),
        customerUpdate: sanitizeString(parsed?.extractedData?.customerUpdate),
        question: sanitizeString(parsed?.extractedData?.question),
      },
    };
  } catch (error) {
    console.error("interpretMessageIntent error:", error);

    return {
      intent: "unknown",
      confidence: "low",
      reason: "Failed to interpret message intent.",
    };
  }
}