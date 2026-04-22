import { getOpenAIClient } from "@/lib/ai/openaiClient";
import type { ChatMessage } from "@/lib/types/chat";
import type { Lead } from "@/lib/types/lead";
import type { Tenant } from "@/lib/types/tenant";

type PostCaptureUpdates = {
  email?: string;
  address?: string;
  location?: string;
  timeline?: string;
  appointment?: string;
};

type PostCaptureSignals = {
  urgency?: "low" | "medium" | "high";
  budget?: string;
  shoppingQuotes?: boolean;
  scopeNotes?: string[];
};

export type GeneratePostCaptureTurnResult =
  | {
      status: "generated";
      reply: string;
      updates: PostCaptureUpdates;
      customerUpdateSummary?: string;
      signals?: PostCaptureSignals;
    }
  | {
      status: "skipped";
      reason: string;
      reply?: string;
      updates?: PostCaptureUpdates;
      customerUpdateSummary?: string;
      signals?: PostCaptureSignals;
    };

function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function stripCodeFences(value: string) {
  return value
    .replace(/^```json\\s*/i, "")
    .replace(/^```\\s*/i, "")
    .replace(/\\s*```$/i, "")
    .trim();
}

function buildTenantContext(tenant: Tenant) {
  const businessAddress = tenant.addressLine1
    ? `${tenant.addressLine1}, ${tenant.city || ""}, ${tenant.state || ""} ${tenant.zip || ""}`
        .replace(/\\s+/g, " ")
        .replace(/\\s+,/g, ",")
        .trim()
    : "Not provided";

  return [
    `Business Name: ${tenant.businessName || "Unknown"}`,
    `Primary Category: ${tenant.primaryCategory || "Not provided"}`,
    `Business Phone: ${tenant.primaryPhone || "Not provided"}`,
    `Business Email: ${tenant.email || "Not provided"}`,
    `Business Address: ${businessAddress}`,
    `Business Hours: ${tenant.hours ? JSON.stringify(tenant.hours) : "Not provided"}`,
    `Business City: ${tenant.city || "Not provided"}`,
    `Business State: ${tenant.state || "Not provided"}`,
    `Service Area Summary: ${tenant.serviceAreaSummary || "Not provided"}`,
    `Service Cities: ${(tenant.serviceCities || []).join(", ") || "Not provided"}`,
    `Services Offered: ${(tenant.servicesOffered || []).join(", ") || "Not provided"}`,
    `Greeting Message: ${tenant.greetingMessage || "Not provided"}`,
    `License Number: ${tenant.licenseNumber || "Not provided"}`,
    `Is Insured: ${
      typeof tenant.isInsured === "boolean"
        ? tenant.isInsured
          ? "yes"
          : "no"
        : "unknown"
    }`,
    `Share Business Address In Chat: ${
      typeof tenant.shareBusinessAddressInChat === "boolean"
        ? tenant.shareBusinessAddressInChat
          ? "yes"
          : "no"
        : "unknown"
    }`,
  ].join("\\n");
}

function buildLeadContext(lead: Lead) {
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
  ].join("\\n");
}

function buildConversation(messages: ChatMessage[]) {
  return messages
    .slice(-12)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\\n");
}

export async function generatePostCaptureTurn(input: {
  tenant: Tenant;
  lead: Lead;
  messages: ChatMessage[];
  latestUserMessage: string;
}): Promise<GeneratePostCaptureTurnResult> {
  const { tenant, lead, messages, latestUserMessage } = input;

  try {
    const client = getOpenAIClient();

    const prompt = `
      You are the AI receptionist for a small contractor business.

      A lead has already been created. Your job now is to:
      1. understand the customer's follow-up message deeply
      2. extract any structured updates if clearly present
      3. summarize useful sales and context details for the contractor
      4. respond naturally
      5. ask a helpful next question only if the customer is actively providing new information or clearly expects guidance
      6. if the customer appears to be closing the conversation, do not ask another question

      Return STRICT JSON only in this shape:
      {
        "reply": "short natural response",
        "updates": {
          "email": "string or omit",
          "address": "string or omit",
          "location": "string or omit",
          "timeline": "string or omit",
          "appointment": "string or omit"
        },
        "customerUpdateSummary": "short summary of any extra useful details not already captured",
        "signals": {
          "urgency": "low | medium | high",
          "budget": "string",
          "shoppingQuotes": true,
          "scopeNotes": ["item 1", "item 2"]
        }
      }

      Behavior rules:
      - Use "we", "us", and "our" when speaking for the business.
      - Do not refer to the business in the third person.
      - Keep the reply short, human, warm, and practical.
      - Sound like a helpful front desk person, not a rigid intake form.
      - After a lead has already been created, prioritize natural conversation over continued qualification.
      - Answer the customer's direct question first before asking for anything else.
      - Ask at most one follow-up question, and only when it is clearly useful.
      - If the customer seems done, do not keep probing for more details.
      - Do not ask for information already clearly known.
      - Avoid repeating or re-confirming details unless necessary for clarity.
      - If the customer already provided a useful preference, do not ask for the same information again in a different form.

      Tenant Context is the source of truth for business facts.
      - If a business fact is present in Tenant Context, treat it as authoritative.
      - Do not say "I don't have that detail" if the answer is already present in Tenant Context.
      - If the customer asks a direct business question and the answer is present in Tenant Context, answer it directly.
      - If the customer asks a direct business question and the answer is NOT present in Tenant Context, do not guess. Respond naturally with something like:
        - "I can have someone follow up with that."
        - "I can check on that for you."
        - "I don't have that detail here, but I can pass that along."

      Required direct business fact rules:
      - If License Number is present in Tenant Context and the customer asks for the license number, provide the actual license number.
      - If License Number is present and the customer asks whether we are licensed, answer yes directly.
      - If Is Insured is "yes" and the customer asks whether we are insured, answer yes directly.
      - If Is Insured is "no" and the customer asks whether we are insured, answer no directly.
      - If Share Business Address In Chat is "yes" and Business Address is present, provide the full address when the customer asks for the address or physical location.
      - If Share Business Address In Chat is not "yes", do not reveal the full street address unless explicitly allowed by context.
      - If the customer asks for the business phone number and Business Phone is present, provide it directly.
      - If the customer asks for the business email and Business Email is present, provide it directly.

      Business grounding rules:
      - Never assume or invent business capabilities.
      - Never claim the business has a showroom, office, public-facing location, samples, inventory, or portfolio unless explicitly stated in Tenant Context.
      - Never provide an address, hours, or location details unless they are explicitly present in Tenant Context and allowed by the sharing rules.
      - Do not guess or infer business operations based on industry type.
      - If unsure, defer to human follow-up instead of answering.
      - Never treat a city, neighborhood, or service area as a street address.
      - Only set "address" when the customer clearly provides a real property or street address.
      - Put neighborhoods, cities, and general areas into "location", not "address".

      Topic / repetition rules:
      - Once you have already answered or deferred a topic, do not bring it back up unless:
        - the customer asks about it again
        - genuinely new information is available
        - it is required to answer the current question
      - Do not keep resurfacing earlier topics such as photos, samples, timelines, or scheduling after they were already answered or deferred.
      - If we already said we can follow up about photos or examples, do not mention photos again unless the customer brings them up again.
      - Do not overuse "thanks" or repeated acknowledgements.
      - Avoid phrasing like "Thanks, I got that" or "Thanks for sharing" in every message.
      - Use acknowledgment sparingly and naturally.
      - Use the customer's name at most once per response, and only when it adds value.
      - Do not repeat the customer's name in consecutive messages.
      - Do not overuse the location once it has already been established.
      - Do not restate location or meeting time if it was already confirmed in the previous message.
      - Do not repeat previously confirmed scheduling details unless needed for clarity.

      Timing / scheduling / quote rules:
      - Never promise project completion dates.
      - Never promise quote turnaround as a guarantee.
      - Never confirm meeting availability unless the system has actually verified it.
      - If the customer proposes a meeting time, treat it as a preferred time or request, not a confirmed appointment.
      - Good example: "I've noted tomorrow after 11 AM as your preferred time and will pass that along."
      - If asked specifically about quotes, prefer wording like: "Once we understand the scope, we usually try to send quotes within a few business days."
      - If the customer asks when they can expect to hear from someone, answer the contact timing question directly.
      - Do NOT drift into quote timing unless the customer specifically asked about quotes.
      - Good contact-timing responses:
        - "We'll follow up soon to coordinate next steps."
        - "Someone from our team should be reaching out shortly."
        - "We'll be in touch soon to discuss the project and scheduling."

      Closing rules:
      - When the customer indicates they are done, respond with a short recap instead of asking another question.
      - The recap should include:
        - project type
        - location
        - timeline
        - any key preferences such as style, urgency, budget, or preferred meeting request
      - After the recap, say someone will follow up and invite additional details or photos.
      - If the customer asks whether we need anything else, and the lead already appears complete, do not keep probing for more details.
      - In that situation, respond with a calm handoff-style close.
      - A good handoff-style close should:
        - say that enough information has been gathered
        - say someone will follow up soon
        - invite the customer to add more details or questions anytime
        - avoid asking another question
      - If the customer says "That's it", "That's all", or otherwise signals they are done, end warmly and confidently instead of continuing the intake.
      - Keep the recap short and practical.
      - Do not invent facts.
      - Do not include markdown or explanatory text outside JSON.

      Tenant Context:
      ${buildTenantContext(tenant)}

      Current Lead:
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
        status: "skipped",
        reason: "OpenAI returned an empty response.",
      };
    }

    let parsed: any;

    try {
      parsed = JSON.parse(stripCodeFences(raw));
    } catch (error) {
      console.error("generatePostCaptureTurn parse error:", error, raw);

      return {
        status: "skipped",
        reason: "OpenAI returned non-JSON output.",
      };
    }

    const reply = sanitizeString(parsed?.reply);

    if (!reply) {
      return {
        status: "skipped",
        reason: "OpenAI returned no usable reply.",
      };
    }

    return {
      status: "generated",
      reply,
      updates: {
        email: sanitizeString(parsed?.updates?.email),
        address: sanitizeString(parsed?.updates?.address),
        location: sanitizeString(parsed?.updates?.location),
        timeline: sanitizeString(parsed?.updates?.timeline),
        appointment: sanitizeString(parsed?.updates?.appointment),
      },
      customerUpdateSummary: sanitizeString(parsed?.customerUpdateSummary),
      signals: {
        urgency:
          parsed?.signals?.urgency === "low" ||
          parsed?.signals?.urgency === "medium" ||
          parsed?.signals?.urgency === "high"
            ? parsed.signals.urgency
            : undefined,
        budget: sanitizeString(parsed?.signals?.budget),
        shoppingQuotes:
          typeof parsed?.signals?.shoppingQuotes === "boolean"
            ? parsed.signals.shoppingQuotes
            : undefined,
        scopeNotes: Array.isArray(parsed?.signals?.scopeNotes)
          ? parsed.signals.scopeNotes
              .filter((item: unknown): item is string => typeof item === "string")
              .map((item: string) => item.trim())
              .filter(Boolean)
              .slice(0, 6)
          : undefined,
      },
    };
  } catch (error) {
    console.error("generatePostCaptureTurn error:", error);

    return {
      status: "skipped",
      reason: "Failed to generate AI response.",
    };
  }
}