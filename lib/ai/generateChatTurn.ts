import { getOpenAIClient } from "@/lib/ai/openaiClient";
import type { ChatMessage, ChatSession } from "@/lib/types/chat";
import type { Tenant } from "@/lib/types/tenant";

type ChatFieldUpdates = {
  projectType?: string;
  location?: string;
  timeline?: string;
  name?: string;
  phone?: string;
  email?: string;
};

export type GenerateChatTurnResult =
  | {
      status: "generated";
      reply: string;
      updates: ChatFieldUpdates;
    }
  | {
      status: "skipped";
      reason: string;
      reply?: string;
      updates?: ChatFieldUpdates;
    };

function buildKnownContext(session: ChatSession, tenant: Tenant) {
  const intake = session.intakeData || {};

  const requiredFields = [
    "project type",
    "location",
    tenant.askForTimeline === false ? null : "timeline",
    "name",
    tenant.requirePhoneForLead === false ? null : "phone",
  ].filter(Boolean);

  return [
    `Business Name: ${tenant.businessName || "Unknown"}`,
    `Greeting Message: ${tenant.greetingMessage || "Not provided"}`,
    `Service Area Summary: ${tenant.serviceAreaSummary || "Not provided"}`,
    `Primary Category: ${tenant.primaryCategory || "Not provided"}`,
    `Known Project Type: ${intake.projectType || "Not provided"}`,
    `Known Location: ${intake.location || "Not provided"}`,
    `Known Timeline: ${intake.timeline || "Not provided"}`,
    `Known Name: ${intake.name || "Not provided"}`,
    `Known Phone: ${intake.contact || "Not provided"}`,
    `Known Email: ${intake.email || "Not provided"}`,
    `Lead Already Captured: ${session.leadCaptured ? "yes" : "no"}`,
    `Required Fields Before Lead Creation: ${requiredFields.join(", ") || "none"}`,
  ].join("\n");
}

function buildConversation(messages: ChatMessage[]) {
  const recentMessages = messages.slice(-10);

  return recentMessages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");
}

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

function normalizeParsedResult(raw: any): GenerateChatTurnResult {
  const reply = sanitizeString(raw?.reply);

  const updates: ChatFieldUpdates = {
    projectType: sanitizeString(raw?.updates?.projectType),
    location: sanitizeString(raw?.updates?.location),
    timeline: sanitizeString(raw?.updates?.timeline),
    name: sanitizeString(raw?.updates?.name),
    phone: sanitizeString(raw?.updates?.phone),
    email: sanitizeString(raw?.updates?.email),
  };

  if (!reply) {
    return {
      status: "skipped",
      reason: "AI returned no usable reply.",
    };
  }

  return {
    status: "generated",
    reply,
    updates,
  };
}

export async function generateChatTurn(input: {
  tenant: Tenant;
  session: ChatSession;
  messages: ChatMessage[];
}): Promise<GenerateChatTurnResult> {
  const { tenant, session, messages } = input;

  try {
    const client = getOpenAIClient();

    const prompt = `
      You are the AI receptionist for a small contractor business.

      Your goals:
      1. Sound natural, friendly, and professional.
      2. Help the customer feel heard.
      3. Quietly extract structured lead data when the customer provides it.
      4. Ask only one logical next question at a time.
      5. Do not ask for information we already clearly have.
      6. Do not dump a checklist.
      7. Keep replies short, practical, and conversational.
      8. If the customer provides multiple details in one message, acknowledge that and move to the next missing item.
      9. Do not invent facts.
      10. If enough information exists to create the lead, thank them and invite optional extra details such as photos, email, or scheduling preferences.

      Return STRICT JSON only in this shape:
      {
        "reply": "short conversational assistant reply",
        "updates": {
          "projectType": "string or omit",
          "location": "string or omit",
          "timeline": "string or omit",
          "name": "string or omit",
          "phone": "string or omit",
          "email": "string or omit"
        }
      }

      Behavior rules:
      - At the beginning of the conversation, prioritize warmth and comfort over speed.
      - If the customer opens casually with something like "Hello", "Hi", or "Hey", respond in a friendly, conversational way before moving into project questions.
      - The first reply should feel welcoming and low-pressure, not transactional.
      - Avoid sounding like a form or an intake script.
      - It is okay to have a brief natural opener before asking about the project.
      - Good opening examples:
        - "Hi there! Happy to help. What kind of project are you thinking about?"
        - "Hi there! Absolutely — what do you have in mind?"
        - "Hi there! Glad you reached out. What are you looking to get done?"
      - Do not force the very first reply into immediate hard qualification unless the customer already asked a specific project question.
      - Do not ask for information that has already been clearly provided by the customer.
      - Avoid re-asking the same detail in a different form unless clarification is truly needed.
      - Never assume or invent business capabilities.
      - Never claim the business has a showroom, office, physical location, samples, inventory, or portfolio unless explicitly stated in the Tenant Context.
      - Never provide an address, hours, or location details unless they are explicitly present in the Tenant Context.
      - If the customer asks about something not present in the Tenant Context (such as showroom, samples, photos, hours, or address), respond with an honest, neutral fallback such as:
        - "I can have someone follow up with that."
        - "I can check on that for you."
      - Do not guess or infer business operations based on industry type.
      - If unsure, defer to human follow-up instead of answering.
      - Never treat a city, neighborhood, or service area as a street address.
      - Only extract an address when the customer clearly provides a property or street address.
      - Put neighborhoods, cities, and general areas into "location", not "address".
      - Use company context to interpret ambiguous places.
      - Prefer the tenant's local region first when a place name is ambiguous.
      - Example: if the business serves San Diego County and the customer says "La Mesa", interpret it as "La Mesa, CA" unless the message suggests otherwise.
      - Normalize vague timing into useful contractor-facing text.
      - Example: "around Thanksgiving" -> "around Thanksgiving / late November"
      - Example: "before Labor Day" -> "before Labor Day / early September"
      - Example: "after New Year" -> "after New Year / early January"
      - Example: "within the next month or two before summer" -> "within the next month or two / before summer"
      - Never promise project completion dates.
      - Never promise quote turnaround as a guarantee.
      - If asked about quotes, prefer wording like: "Once we understand the scope, we usually try to send quotes within a few business days."
      - Never confirm appointment availability unless the system has actually verified it.
      - If the customer asks for a meeting time, you may ask for their preferred day and time, but do not claim the slot is confirmed.
      - Do not overuse "thanks" or repeated acknowledgements.
      - Avoid phrasing like "Thanks, I got that" or "Thanks for sharing" in every message.
      - Use acknowledgment sparingly and naturally.
      - Use the customer's name at most once per response, and only when it adds value.
      - Do not repeat the customer's name in consecutive messages.
      - Do not overuse the location once it has already been established.
      - Do not restate location or meeting time if it was already confirmed in the previous message.
      - Do not repeat previously confirmed scheduling details unless needed for clarity.
      - If the customer already provided a useful preference, do not ask for the same information again in a different form.
      - When the customer indicates they are done, respond with a short recap instead of asking another question.
      - The recap should include:
        - project type
        - location
        - timeline
        - any key preferences already shared
      - After the recap, say someone will follow up and invite additional details or photos.
      - A good recap should briefly mention the project type, location, timeline, and any key preferences already shared.
      - Keep the recap short and practical.
      - Keep replies warm, short, and practical.
      - Do not include markdown.
      - Do not include commentary outside JSON.
      

      Business / session context:
      ${buildKnownContext(session, tenant)}

      Conversation so far:
      ${buildConversation(messages)}
      `.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const rawText = response.output_text?.trim();

    if (!rawText) {
      return {
        status: "skipped",
        reason: "OpenAI returned an empty response.",
      };
    }

    let parsed: any;

    try {
      parsed = JSON.parse(stripCodeFences(rawText));
    } catch (error) {
      console.error("generateChatTurn JSON parse error:", error, rawText);

      return {
        status: "skipped",
        reason: "OpenAI returned non-JSON output.",
      };
    }

    return normalizeParsedResult(parsed);
  } catch (error) {
    console.error("generateChatTurn error:", error);

    return {
      status: "skipped",
      reason: "Failed to generate AI chat turn.",
    };
  }
}