import { createClient } from "@/lib/supabase/server";
import {
  ChatMessage,
  ChatRole,
  ChatSession,
  IntakeStep,
} from "@/lib/types/chat";
import { getTenantBySlug } from "@/lib/db/tenants";
import { createLead, getLeadById, updateLead } from "@/lib/db/leads";
import { sendLeadNotification } from "@/lib/notifications/sendLeadNotification";
import { createLeadActivity } from "@/lib/db/lead-activities";
import { extractStructuredLeadUpdateFromMessage } from "@/lib/chat/extractStructuredLeadUpdate";
import { generateChatTurn } from "@/lib/ai/generateChatTurn";
import {
  generatePostCaptureTurn,
  generatePostCaptureReplyOnly,
} from "@/lib/ai/generatePostCaptureTurn";
import type { Tenant } from "@/lib/types/tenant";
import { detectSchedulingIntent } from "@/lib/chat/detectSchedulingIntent";
import { runSchedulingWorkflow } from "@/lib/scheduling/chat/runSchedulingWorkflow";
import { interpretMessageIntent } from "@/lib/ai/interpretMessageIntent";
import type { MessageIntentResult } from "@/lib/types/message-intent";
import { decideNextAction } from "@/lib/workflow/decideNextAction";
import { retrieveTenantKnowledge } from "@/lib/knowledge/retrieveTenantKnowledge";
import type { SchedulingIntentResult } from "@/lib/chat/detectSchedulingIntent";
import { getBookingFlowConfig } from "@/lib/config/getBookingFlowConfig";
import { getTenantConfig } from "@/lib/config/getTenantConfig";
import { getCampaignById } from "@/lib/db/campaigns";
import { runLeadCopilot } from "@/lib/ai/runLeadCopilot";
import { getCampaignAssetById } from "@/lib/db/campaign-asset";

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createMessageObject(
  sessionId: string,
  role: ChatRole,
  content: string
): ChatMessage {
  return {
    id: generateId("msg"),
    sessionId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function normalizeEmail(input: string): string | null {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function normalizeUsPhone(input: string): string | null {
  const digitsOnly = input.replace(/\D/g, "");

  if (!digitsOnly) {
    return null;
  }

  let normalizedDigits = digitsOnly;

  if (normalizedDigits.length === 11 && normalizedDigits.startsWith("1")) {
    normalizedDigits = normalizedDigits.slice(1);
  }

  if (normalizedDigits.length !== 10) {
    return null;
  }

  const invalidPatterns = new Set([
    "0000000000",
    "1111111111",
    "2222222222",
    "3333333333",
    "4444444444",
    "5555555555",
    "6666666666",
    "7777777777",
    "8888888888",
    "9999999999",
    "1234567890",
    "0123456789",
  ]);

  if (invalidPatterns.has(normalizedDigits)) {
    return null;
  }

  return `+1${normalizedDigits}`;
}

function isAskingAboutUsingSomeoneElsesPhone(message: string) {
  const normalized = message.toLowerCase();

  const mentionsOtherPerson =
    normalized.includes("wife") ||
    normalized.includes("husband") ||
    normalized.includes("spouse") ||
    normalized.includes("partner") ||
    normalized.includes("girlfriend") ||
    normalized.includes("boyfriend") ||
    normalized.includes("mom") ||
    normalized.includes("dad");

  const mentionsPhone =
    normalized.includes("number") || normalized.includes("phone");

  const asksPermission =
    normalized.includes("is that ok") ||
    normalized.includes("is that okay") ||
    normalized.includes("would that work") ||
    normalized.includes("can i") ||
    normalized.includes("ill give you") ||
    normalized.includes("i'll give you");

  return mentionsOtherPerson && mentionsPhone && asksPermission;
}

function getPromptForStep(step: IntakeStep, businessName: string): string {
  switch (step) {
    case "project_type":
      return `Hi! Welcome to ${businessName}. How can we help you today?`;

    case "location":
      return "Got it. What city is the project in?";

    case "timeline":
      return "Thanks. When are you hoping to get this work done?";

    case "name":
      return "Great. What’s your first and last name?";

    case "contact":
      return "What’s the best phone number for us to reach you by text or call?";

    case "complete":
      return "";

    default:
      return "How can we help you today?";
  }
}

function buildSignupReply() {
  return "You’re almost there. Click Get Started to create your account. After that, we’ll walk you through adding your business details, services, FAQs, photos, and website preferences so Contactor can build your digital front door. It’s $49.99/month, month-to-month, with no hidden fees.";
}

function isSignupQuestion(message: string) {
  const normalized = message.toLowerCase().trim();

  const isSoftClose =
    normalized.includes("sign up soon") ||
    normalized.includes("i'll sign up") ||
    normalized.includes("ill sign up") ||
    normalized.includes("i will sign up") ||
    normalized.includes("we'll sign up") ||
    normalized.includes("we will sign up") ||
    normalized.includes("thanks for the info") ||
    normalized.includes("thanks for all") ||
    normalized.includes("thank you for") ||
    normalized.includes("got what i need");

  if (isSoftClose) {
    return false;
  }

  return (
    normalized.includes("how do i sign up") ||
    normalized.includes("where do i sign up") ||
    normalized.includes("how can i sign up") ||
    normalized.includes("where can i sign up") ||
    normalized.includes("how do i get started") ||
    normalized.includes("where do i get started") ||
    normalized.includes("create account") ||
    normalized.includes("create an account")
  );
}

function buildConversationCloseReply(
  tenant: Tenant,
  previousAssistantMessage?: string | null
) {
  const bookingFlow = getBookingFlowConfig(tenant);

  const previousReply = previousAssistantMessage?.trim().toLowerCase() || "";

  /**
   * If the receptionist already gave a full conversational close,
   * don't repeat the entire goodbye when the customer responds with
   * "you too", "you as well", "thanks again", etc.
   */
  const alreadyClosed =
    previousReply.includes("have a great day") ||
    previousReply.includes("have a good day") ||
    previousReply.includes("talk soon") ||
    previousReply.includes("take care");

  if (alreadyClosed) {
    return "You too!";
  }

  if (bookingFlow.showSignupLink) {
    return "Sounds great. Whenever you’re ready, just hit Get Started and we’ll walk you through everything. If you have questions along the way, I’m here to help.";
  }

  if (!bookingFlow.requiresAppointment) {
    return "You’re very welcome! If anything else comes up, just send us a message here. Have a great day!";
  }

  return "You’re very welcome! If anything else comes up before your appointment, just send us a message here. Have a great day!";
}

function mapSession(row: any): ChatSession {
  return {
    id: row.id,
    tenantId: row.tenant_id ?? undefined,
    tenantSlug: row.tenant_slug,
    status: row.status ?? "active",
    createdAt: row.created_at,
    currentStep: row.current_step,
    intakeData: row.intake_data ?? {},
    leadCaptured: row.lead_captured ?? false,
    leadId: row.lead_id ?? null,
    notificationSentAt: row.notification_sent_at ?? null,
  };
}

function mapMessage(row: any): ChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

function isReservationLikeTenant(tenant: Tenant) {
  const bookingFlow = getBookingFlowConfig(tenant);

  return (
    bookingFlow.bookingType === "reservation" ||
    bookingFlow.bookingType === "direct_booking"
  );
}

function shouldOfferSchedulingAfterLeadCreated(tenant: Tenant) {
  return getBookingFlowConfig(tenant).shouldOfferSchedulingAfterLeadCreated;
}

function buildLeadCreatedNextStepReply(tenant: Tenant) {
  return getBookingFlowConfig(tenant).leadCreatedReply;
}

function removeLeadCompletionLanguage(reply?: string) {
  if (!reply?.trim()) return "";

  const sentences = reply
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const filtered = sentences.filter((sentence) => {
    const normalized = sentence.toLowerCase();

    return !(
      normalized.includes("i have enough information") ||
      normalized.includes("we have enough information") ||
      normalized.includes("get your request started") ||
      normalized.includes("start your request") ||
      (
        normalized.includes("i have your") &&
        (
          normalized.includes("name") ||
          normalized.includes("phone") ||
          normalized.includes("location") ||
          normalized.includes("timeline") ||
          normalized.includes("details")
        )
      )
    );
  });

  return filtered.join(" ").trim();
}

function buildLeadCompletionAssistantReply(input: {
  tenant: Tenant;
  latestUserMessage: string;
  generatedReply?: string;
}) {
  const bookingFlow = getBookingFlowConfig(input.tenant);
  const nextStepReply = buildLeadCreatedNextStepReply(input.tenant);

  /**
   * Lead Capture Only / Manual Follow-up:
   *
   * These flows do not have a deterministic scheduling action.
   * Let the AI provide the natural conversational transition when
   * possible. The tenant's Next Step Message is already available
   * to the AI as guidance and should not be forced verbatim into
   * the conversation.
   */
  if (
    bookingFlow.bookingType === "lead_capture" ||
    bookingFlow.bookingType === "manual_followup"
  ) {
    const naturalReply = removeLeadCompletionLanguage(input.generatedReply);

    if (naturalReply) {
      return naturalReply;
    }

    return nextStepReply;
  }

  /**
   * Scheduling-enabled flows remain deterministic.
   *
   * Booking Flow owns the operational next step so consultation,
   * estimate, reservation, direct booking, and phone-call tenants
   * continue into the correct workflow.
   */
  if (!containsDirectBusinessQuestion(input.latestUserMessage)) {
    return nextStepReply;
  }

  const directAnswer = removeLeadCompletionLanguage(input.generatedReply);

  if (!directAnswer) {
    return nextStepReply;
  }

  if (
    directAnswer.includes(nextStepReply) ||
    nextStepReply.includes(directAnswer)
  ) {
    return directAnswer;
  }

  return `${directAnswer}\n\n${nextStepReply}`;
}

function getDefaultSchedulingAppointmentType(tenant: Tenant) {
  return getBookingFlowConfig(tenant).defaultAppointmentType;
}

function detectConversationClose(message: string) {
  const normalized = message
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");

  const exactClosings = new Set([
    "thanks",
    "thank you",
    "thx",
    "that's it",
    "thats it",
    "that is it",
    "ok thanks",
    "okay thanks",
    "sounds good",
    "good night",
    "goodnight",
    "talk soon",
    "talk later",
    "ttyl",
    "bye",
    "goodbye",
    "have a great day",
    "have a good day",
    "see ya",
    "see you then",
    "i am good",
    "i'm good",
    "no i am good",
    "no i'm good",
    "good for now",
    "all good",
  ]);

  return exactClosings.has(normalized);
}

function detectNoChangeCorrection(message: string) {
  const normalized = message.trim().toLowerCase();

  const saysDisregard =
    normalized.includes("disregard") ||
    normalized.includes("never mind") ||
    normalized.includes("nevermind") ||
    normalized.includes("ignore that") ||
    normalized.includes("forget that");

  const acknowledgesExistingAppointment =
    normalized.includes("already scheduled") ||
    normalized.includes("forgot we scheduled") ||
    normalized.includes("forgot it was") ||
    normalized.includes("appointment is a phone call") ||
    normalized.includes("scheduled a phone call");

  return saysDisregard && acknowledgesExistingAppointment;
}

function isAffirmativeSchedulingReply(message: string) {
  const normalized = message.trim().toLowerCase();

  return (
    normalized === "yes" ||
    normalized === "yep" ||
    normalized === "yeah" ||
    normalized === "sure" ||
    normalized === "ok" ||
    normalized === "okay" ||
    normalized.includes("yes") ||
    normalized.includes("let's") ||
    normalized.includes("lets") ||
    normalized.includes("book") ||
    normalized.includes("reserve") ||
    normalized.includes("schedule") ||
    normalized.includes("confirm") ||
    normalized.includes("do that") ||
    normalized.includes("sounds good")
  );
}

function detectStrongSchedulingRequest(message: string): {
  hasSchedulingIntent: boolean;
  appointmentType: "call" | "site_visit" | null;
} {
  const normalized = message.toLowerCase();

  const mentionsScheduling =
    normalized.includes("schedule") ||
    normalized.includes("book") ||
    normalized.includes("availability") ||
    normalized.includes("available") ||
    normalized.includes("this week") ||
    normalized.includes("next week") ||
    normalized.includes("what days") ||
    normalized.includes("what times") ||
    normalized.includes("appointment");

    const mentionsSiteVisit =
    normalized.includes("site visit") ||
    normalized.includes("on-site") ||
    normalized.includes("on site") ||
    normalized.includes("onsite") ||
    normalized.includes("come by") ||
    normalized.includes("come over") ||
    normalized.includes("come out") ||
    normalized.includes("come take a look") ||
    normalized.includes("take a look") ||
    normalized.includes("see the scope") ||
    normalized.includes("see the work") ||
    normalized.includes("see the property") ||
    normalized.includes("see the house") ||
    normalized.includes("see the home") ||
    normalized.includes("in person");

  const mentionsCall =
    normalized.includes("phone call") ||
    normalized.includes("quick call") ||
    normalized.includes("call me") ||
    normalized.includes("call would work");

  if (mentionsSiteVisit && (mentionsScheduling || normalized.includes("let's do"))) {
    return {
      hasSchedulingIntent: true,
      appointmentType: "site_visit",
    };
  }

  if (mentionsCall && (mentionsScheduling || normalized.includes("let's do"))) {
    return {
      hasSchedulingIntent: true,
      appointmentType: "call",
    };
  }

  return {
    hasSchedulingIntent: false,
    appointmentType: null,
  };
}

async function insertMessage(message: ChatMessage) {
  const supabase = await createClient();

  const { error } = await supabase.from("chat_messages").insert({
    id: message.id,
    session_id: message.sessionId,
    role: message.role,
    content: message.content,
    created_at: message.createdAt,
  });

  if (error) {
    console.error("Error inserting chat message:", error.message);
    throw error;
  }
}

async function updateSession(session: ChatSession) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("chat_sessions")
    .update({
      status: session.status,
      current_step: session.currentStep,
      intake_data: session.intakeData,
      lead_captured: session.leadCaptured,
      lead_id: session.leadId ?? null,
      notification_sent_at: session.notificationSentAt ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (error) {
    console.error("Error updating chat session:", error.message);
    throw error;
  }
}

async function safeCreateLeadActivity(input: {
  leadId: string;
  tenantSlug: string;
  eventType:
    | "lead.customer_update_added"
    | "lead.email_added"
    | "lead.email_updated"
    | "lead.address_updated"
    | "lead.location_updated"
    | "lead.timeline_updated"
    | "lead.appointment_updated";
  eventSource: "customer" | "system" | "admin";
  metadata?: Record<string, any>;
}) {
  try {
    await createLeadActivity(input);
  } catch (error) {
    console.error("Non-fatal lead activity logging error:", error);
  }
}

async function safeSendLeadNotification(
  lead: Awaited<ReturnType<typeof createLead>>
) {
  try {
    return await sendLeadNotification(lead);
  } catch (error) {
    console.error("Non-fatal lead notification error:", error);

    return {
      status: "skipped" as const,
      channel: "sms" as const,
      reason: "Unexpected error while sending lead notification.",
    };
  }
}

/**
 * Generate Lead Copilot without allowing an AI failure
 * to break lead creation or the customer conversation.
 */
async function safeRunLeadCopilot(
  lead: Awaited<ReturnType<typeof createLead>>
) {
  try {
    const startedAt = Date.now();

    const result = await runLeadCopilot(lead);

    console.log("⏱️ runLeadCopilot ms:", Date.now() - startedAt);
    console.log("🧠 Lead Copilot result:", {
      leadId: lead.id,
      cached: result.cached,
      generated: result.status === "generated",
    });

    return result;
  } catch (error) {
    console.error(
      "Non-fatal Lead Copilot generation error:",
      error
    );

    return null;
  }
}

function shouldAskForEmailAfterPhone(
  session: ChatSession,
  tenant: Tenant
) {
  return (
    tenant.askForEmailAfterPhone === true &&
    Boolean(session.intakeData?.contact?.trim()) &&
    !session.intakeData?.email?.trim() &&
    !session.intakeData?.emailAfterPhoneAsked
  );
}

function buildIntentCustomerUpdate(intent: MessageIntentResult) {
  const data = intent.extractedData || {};

  if (intent.intent === "contact_update") {
    const label =
      data.contactRelationship || data.contactName
        ? "Backup contact"
        : "Contact update";
  
    const name = data.contactName ? data.contactName.trim() : "";
    const phone = data.phone ? data.phone.trim() : "";
    const email = data.email ? data.email.trim() : "";
  
    const parts = [
      name,
      phone,
      email,
    ].filter(Boolean);
  
    if (parts.length > 0) {
      return `${label}: ${parts.join(" — ")}`;
    }
  
    return "Customer asked to provide backup contact information.";
  }

  if (intent.intent === "appointment_note") {
    return (
      data.appointmentNote ||
      data.customerUpdate ||
      "Customer added an appointment note or preference."
    );
  }

  if (intent.intent === "provide_extra_detail") {
    return data.customerUpdate || "Customer provided additional project details.";
  }

  return data.customerUpdate || null;
}

function shouldStartBackupContactPendingAction(intent: MessageIntentResult) {
  if (intent.intent !== "contact_update") {
    return false;
  }

  const data = intent.extractedData || {};

  const hasContactValue = Boolean(data.phone || data.email);
  const mentionsBackupContact =
    Boolean(data.contactRelationship || data.contactName) ||
    intent.reason?.toLowerCase().includes("backup") ||
    intent.reason?.toLowerCase().includes("wife") ||
    intent.reason?.toLowerCase().includes("husband") ||
    intent.reason?.toLowerCase().includes("spouse");

  return mentionsBackupContact && !hasContactValue;
}

function buildIntentAssistantReply(intent: MessageIntentResult) {
  const data = intent.extractedData || {};

  if (intent.intent === "contact_update") {
    const hasContactValue = Boolean(data.phone || data.email);
    const hasContactName = Boolean(data.contactName);
  
    if (!hasContactValue && !hasContactName) {
      return "Absolutely — please send the backup contact’s name and phone number.";
    }
  
    if (data.email && !data.phone && !data.contactRelationship) {
      return "Thanks, I’ll keep that email on your request.";
    }
  
    if (data.phone && data.contactName) {
      return `Got it — I’ll add ${data.contactName} as a backup contact.`;
    }
  
    if (data.phone) {
      return "Got it — I’ll add that backup number to your request.";
    }
  
    if (data.contactName && !data.phone) {
      return `Got it — what’s the best phone number for ${data.contactName}?`;
    }
  
    return "Got it — I’ll add that contact information to your request.";
  }

  if (intent.intent === "appointment_note") {
    return "Absolutely — I’ll add that note to your appointment.";
  }

  if (intent.intent === "provide_extra_detail") {
    return "Got it — I’ll add that detail to your request.";
  }

  return "Got it — I’ll make a note of that.";
}

function buildKnowledgeRetrievalQuery(
  messages: ChatMessage[],
  latestUserMessage: string
) {
  const recentContext = messages
    .slice(-12)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  return [
    "Recent conversation context:",
    recentContext,
    "",
    "Latest customer message:",
    latestUserMessage,
  ].join("\n");
}

/**
 * Decide whether this customer message is likely to benefit from tenant
 * knowledge retrieval.
 *
 * Why this exists:
 * - Today, knowledge retrieval loads tenant knowledge records and scores them
 *   before sending context into the AI prompt.
 * - Doing that for every message adds latency, especially for simple replies
 *   like "yes", "thanks", phone numbers, emails, dates, and time selections.
 * - This helper is intentionally platform-neutral. Do NOT add contractor-only
 *   keywords here such as "permit", "subcontractor", or "roofing" because
 *   Digital Front Door must support many business types later.
 *
 * Future note:
 * - RAG/vector search with embeddings will make retrieval faster and more
 *   semantically accurate. Once pgvector/RAG is added, this gating can become
 *   less important or be replaced by smarter retrieval scoring.
 */
function shouldRetrieveKnowledge(message: string) {
  const normalized = message.trim().toLowerCase();

  if (!normalized) return false;

  const obviousSkips = new Set([
    "yes",
    "no",
    "ok",
    "okay",
    "thanks",
    "thank you",
    "skip",
    "sounds good",
  ]);

  if (obviousSkips.has(normalized)) return false;

  const looksLikePhone = /^\D*(?:\d\D*){10,11}$/.test(normalized);
  if (looksLikePhone) return false;

  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  if (looksLikeEmail) return false;

  const looksLikeIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(normalized);
  if (looksLikeIsoDate) return false;

  const looksLikeTime = /^\d{1,2}(:\d{2})?\s?(am|pm)$/i.test(normalized);
  if (looksLikeTime) return false;

  if (normalized.includes("?")) return true;

  return normalized.length >= 18;
}

function containsDirectBusinessQuestion(message: string) {
  const normalized = message.trim().toLowerCase();

  if (!normalized) return false;

  if (normalized.includes("?")) {
    return true;
  }

  const questionPatterns = [
    /\bdo you\b/,
    /\bdoes the business\b/,
    /\bare you\b/,
    /\bis there\b/,
    /\bcan you\b/,
    /\bcould you\b/,
    /\bwill you\b/,
    /\bwould you\b/,
    /\bwhat\b/,
    /\bwhen\b/,
    /\bwhere\b/,
    /\bwhy\b/,
    /\bhow\b/,
  ];

  return questionPatterns.some((pattern) => pattern.test(normalized));
}

async function appendCustomerUpdateToLead(leadId: string, content: string) {
  const supabase = await createClient();

  const { data: existingLead, error: fetchError } = await supabase
    .from("leads")
    .select("customer_updates")
    .eq("id", leadId)
    .single();

  if (fetchError) {
    console.error("Error fetching customer updates:", fetchError.message);
    throw fetchError;
  }

  const timestamp = new Date().toISOString();
  const existingCustomerUpdates =
    existingLead?.customer_updates?.trim() || "";

  const appendedBlock = `[Customer Update - ${timestamp}]
${content}`.trim();

  const newCustomerUpdates = existingCustomerUpdates
    ? `${existingCustomerUpdates}

${appendedBlock}`
    : appendedBlock;

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      customer_updates: newCustomerUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (updateError) {
    console.error("Error updating customer updates:", updateError.message);
    throw updateError;
  }
}

async function getLeadFieldState(leadId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("email, address, location, timeline, appointment, tenant_slug")
    .eq("id", leadId)
    .single();

  if (error) {
    console.error("Error fetching lead field state:", error.message);
    throw error;
  }

  return {
    email: data?.email ?? null,
    address: data?.address ?? null,
    location: data?.location ?? null,
    timeline: data?.timeline ?? null,
    appointment: data?.appointment ?? null,
    tenantSlug: data?.tenant_slug ?? null,
  };
}

async function updateLeadFields(
  leadId: string,
  updates: Partial<{
    email: string;
    address: string;
    location: string;
    timeline: string;
    appointment: string;
  }>
) {
  const supabase = await createClient();

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.email !== "undefined") payload.email = updates.email;
  if (typeof updates.address !== "undefined") payload.address = updates.address;
  if (typeof updates.location !== "undefined") payload.location = updates.location;
  if (typeof updates.timeline !== "undefined") payload.timeline = updates.timeline;
  if (typeof updates.appointment !== "undefined") payload.appointment = updates.appointment;

  const { error } = await supabase.from("leads").update(payload).eq("id", leadId);

  if (error) {
    console.error("Error updating structured lead fields:", error.message);
    throw error;
  }
}

async function logStructuredLeadFieldActivity(input: {
  leadId: string;
  tenantSlug: string;
  fieldName: "email" | "address" | "location" | "timeline" | "appointment";
  previousValue?: string | null;
  newValue: string;
}) {
  const eventTypeMap = {
    email: input.previousValue ? "lead.email_updated" : "lead.email_added",
    address: "lead.address_updated",
    location: "lead.location_updated",
    timeline: "lead.timeline_updated",
    appointment: "lead.appointment_updated",
  } as const;

  await safeCreateLeadActivity({
    leadId: input.leadId,
    tenantSlug: input.tenantSlug,
    eventType: eventTypeMap[input.fieldName],
    eventSource: "customer",
    metadata: {
      fieldName: input.fieldName,
      previousValue: input.previousValue ?? null,
      newValue: input.newValue,
    },
  });
}

async function createLeadAndNotifyOnce(session: ChatSession) {
  if (session.leadId) {
    return session;
  }

  const intake = session.intakeData;

  const campaign = intake.campaignId
    ? await getCampaignById({
        tenantSlug: session.tenantSlug,
        campaignId: intake.campaignId,
      })
    : null;

  const createLeadStart = Date.now();

  const lead = await createLead({
    tenantId: session.tenantId,
    tenantSlug: session.tenantSlug,
    sessionId: session.id,

    leadSource: intake.leadSource || "website",
    campaignId: campaign?.id ?? null,
    campaignAssetId: intake.campaignAssetId ?? null,
    campaignName: campaign?.name ?? null,

    customerName: intake.name || "Unknown",
    phone: intake.contact || "Unknown",
    email: intake.email || undefined,
    address: undefined,
    projectType: intake.projectType || "Unknown",
    location: intake.location || "Unknown",
    timeline: intake.timeline || "Unknown",
    appointment: undefined,
    notes: undefined,
    customerUpdates: undefined,
    images: [],
  });

  console.log("⏱️ createLead db insert ms:", Date.now() - createLeadStart);

  session.leadId = lead.id;

  const notificationStart = Date.now();

  const notificationResult = await safeSendLeadNotification(lead);

  console.log("⏱️ safeSendLeadNotification ms:", Date.now() - notificationStart);

  if (notificationResult.status === "sent") {
    session.notificationSentAt = new Date().toISOString();
  } else {
    console.error("Lead notification was skipped:", notificationResult.reason);
  }

  const sessionUpdateStart = Date.now();

  await updateSession(session);

  console.log(
    "⏱️ updateSession after lead create ms:",
    Date.now() - sessionUpdateStart
  );

  /**
   * Generate Lead Copilot once after the lead and session are safely stored.
   *
   * Important:
   * - failures are non-fatal
   * - runLeadCopilot checks the database cache first
   * - this does not regenerate an already-complete Copilot result
   */
  // await safeRunLeadCopilot(lead); // commenting out to stop Lead AI Summary from generating to early

  return session;
}

function getMissingRequiredFields(session: ChatSession, tenant: Tenant) {
  const intake = session.intakeData || {};
  const tenantConfig = getTenantConfig(tenant);
  const missing: IntakeStep[] = [];

  for (const field of tenantConfig.requiredFields) {
    if (!field.required || field.phase !== "pre_lead") continue;

    if (field.id === "preferred_service" && !intake.projectType?.trim()) {
      missing.push("project_type");
    }

    if (field.id === "project_type" && !intake.projectType?.trim()) {
      missing.push("project_type");
    }

    if (field.id === "location" && !intake.location?.trim()) {
      missing.push("location");
    }

    if (field.id === "timeline" && !intake.timeline?.trim()) {
      missing.push("timeline");
    }

    if (field.id === "name" && !intake.name?.trim()) {
      missing.push("name");
    }

    if (field.id === "phone" && !intake.contact?.trim()) {
      missing.push("contact");
    }
  }

  return missing;
}

function applyAiUpdatesToSession(
  session: ChatSession,
  updates: Partial<{
    projectType: string;
    location: string;
    timeline: string;
    name: string;
    phone: string;
    email: string;
  }>
): ChatSession {
  const nextSession: ChatSession = {
    ...session,
    intakeData: {
      ...session.intakeData,
    },
  };

  if (typeof updates.projectType === "string" && updates.projectType.trim()) {
    nextSession.intakeData.projectType = updates.projectType.trim();
  }

  if (typeof updates.location === "string" && updates.location.trim()) {
    nextSession.intakeData.location = updates.location.trim();
  }

  if (typeof updates.timeline === "string" && updates.timeline.trim()) {
    nextSession.intakeData.timeline = updates.timeline.trim();
  }

  if (typeof updates.name === "string" && updates.name.trim()) {
    nextSession.intakeData.name = updates.name.trim();
  }

  if (typeof updates.email === "string" && updates.email.trim()) {
    const normalizedEmail = normalizeEmail(updates.email);
    if (normalizedEmail) {
      nextSession.intakeData.email = normalizedEmail;
    }
  }

  if (typeof updates.phone === "string" && updates.phone.trim()) {
    const normalizedPhone = normalizeUsPhone(updates.phone);
    if (normalizedPhone) {
      nextSession.intakeData.contact = normalizedPhone;
    }
  }

  return nextSession;
}

type RequestedLeadField =
  | "project_type"
  | "location"
  | "timeline"
  | "name"
  | "contact"
  | null;

function detectRequestedField(message?: string | null): RequestedLeadField {
  const normalized = message?.toLowerCase().trim() || "";

  if (!normalized) return null;

  if (
    normalized.includes("what kind of") ||
    normalized.includes("what type of") ||
    normalized.includes("how can we help") ||
    normalized.includes("what are you looking")
  ) {
    return "project_type";
  }

  if (
    normalized.includes("what city") ||
    normalized.includes("what area") ||
    normalized.includes("where are you") ||
    normalized.includes("where will") ||
    normalized.includes("location")
  ) {
    return "location";
  }

  if (
    normalized.includes("when") ||
    normalized.includes("what day") ||
    normalized.includes("what date") ||
    normalized.includes("timeline")
  ) {
    return "timeline";
  }

  if (
    normalized.includes("your name") ||
    normalized.includes("can i get your name") ||
    normalized.includes("may i have your name")
  ) {
    return "name";
  }

  if (
    normalized.includes("phone") ||
    normalized.includes("number") ||
    normalized.includes("reach you")
  ) {
    return "contact";
  }

  return null;
}

function applyFallbackStepCapture(input: {
  session: ChatSession;
  trimmedContent: string;
  requestedField: RequestedLeadField;
}): ChatSession {
  const { session, trimmedContent, requestedField } = input;
  const intake = session.intakeData || {};

  if (
    requestedField === "project_type" &&
    session.currentStep === "project_type" &&
    !intake.projectType?.trim()
  ) {
    return applyAiUpdatesToSession(session, { projectType: trimmedContent });
  }

  if (
    requestedField === "location" &&
    session.currentStep === "location" &&
    !intake.location?.trim()
  ) {
    return applyAiUpdatesToSession(session, { location: trimmedContent });
  }

  if (
    requestedField === "timeline" &&
    session.currentStep === "timeline" &&
    !intake.timeline?.trim()
  ) {
    return applyAiUpdatesToSession(session, { timeline: trimmedContent });
  }

  if (
    requestedField === "name" &&
    session.currentStep === "name" &&
    !intake.name?.trim()
  ) {
    return applyAiUpdatesToSession(session, { name: trimmedContent });
  }

  if (
    requestedField === "contact" &&
    session.currentStep === "contact" &&
    !intake.contact?.trim()
  ) {
    const normalizedPhone = normalizeUsPhone(trimmedContent);

    if (normalizedPhone) {
      return applyAiUpdatesToSession(session, { phone: normalizedPhone });
    }
  }

  return session;
}

function finalizeSessionStep(session: ChatSession, tenant: Tenant): ChatSession {
  const missing = getMissingRequiredFields(session, tenant);

  if (missing.length === 0) {
    const bookingFlow = getBookingFlowConfig(tenant);
  
    return {
      ...session,
      currentStep: "complete",
      leadCaptured: bookingFlow.shouldCreateLeadAutomatically,
      status: "active",
    };
  }

  return {
    ...session,
    currentStep: missing[0],
    leadCaptured: false,
    status: "active",
  };
}

function isPostBookingClosingMessage(message: string) {
  const normalized = message.trim().toLowerCase();

  return (
    normalized.includes("see you") ||
    normalized.includes("talk to you then") ||
    normalized.includes("talk then") ||
    normalized.includes("looking forward") ||
    normalized.includes("thanks for your time") ||
    normalized.includes("thank you for your time") ||
    normalized.includes("appreciate your time")
  );
}


async function applyPostCaptureStructuredUpdates(input: {
  leadId: string;
  tenantSlug: string;
  previous: Awaited<ReturnType<typeof getLeadFieldState>>;
  updates: Partial<{
    email: string;
    address: string;
    location: string;
    timeline: string;
  }>;
}) {
  const { leadId, tenantSlug, previous, updates } = input;

  const safeUpdates: Partial<{
    email: string;
    address: string;
    location: string;
    timeline: string;
  }> = {};

  if (typeof updates.email === "string" && updates.email.trim()) {
    const normalized = normalizeEmail(updates.email);

    if (normalized) {
      safeUpdates.email = normalized;
    }
  }

  if (typeof updates.address === "string" && updates.address.trim()) {
    safeUpdates.address = updates.address.trim();
  }

  if (typeof updates.location === "string" && updates.location.trim()) {
    safeUpdates.location = updates.location.trim();
  }

  if (typeof updates.timeline === "string" && updates.timeline.trim()) {
    safeUpdates.timeline = updates.timeline.trim();
  }

  if (Object.keys(safeUpdates).length === 0) {
    return;
  }

  await updateLeadFields(leadId, safeUpdates);

  if (safeUpdates.email && safeUpdates.email !== previous.email) {
    await logStructuredLeadFieldActivity({
      leadId,
      tenantSlug,
      fieldName: "email",
      previousValue: previous.email,
      newValue: safeUpdates.email,
    });
  }

  if (safeUpdates.address && safeUpdates.address !== previous.address) {
    await logStructuredLeadFieldActivity({
      leadId,
      tenantSlug,
      fieldName: "address",
      previousValue: previous.address,
      newValue: safeUpdates.address,
    });
  }

  if (safeUpdates.location && safeUpdates.location !== previous.location) {
    await logStructuredLeadFieldActivity({
      leadId,
      tenantSlug,
      fieldName: "location",
      previousValue: previous.location,
      newValue: safeUpdates.location,
    });
  }

  if (safeUpdates.timeline && safeUpdates.timeline !== previous.timeline) {
    await logStructuredLeadFieldActivity({
      leadId,
      tenantSlug,
      fieldName: "timeline",
      previousValue: previous.timeline,
      newValue: safeUpdates.timeline,
    });
  }

  // if (safeUpdates.appointment && safeUpdates.appointment !== previous.appointment) {
  //   await logStructuredLeadFieldActivity({
  //     leadId,
  //     tenantSlug,
  //     fieldName: "appointment",
  //     previousValue: previous.appointment,
  //     newValue: safeUpdates.appointment,
  //   });
  // }
}

export async function createChatSessionForTenantSlug(
  tenantSlug: string,
  options?: {
    leadSource?: string;
    campaignId?: string;
    campaignAssetId?: string;
  }
) {
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return null;
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  let campaign = null;
  let campaignAsset = null;

  if (options?.campaignId) {
    campaign = await getCampaignById({
      tenantSlug,
      campaignId: options.campaignId,
    });
  }

  if (campaign && options?.campaignAssetId) {
    const possibleAsset = await getCampaignAssetById({
      tenantSlug,
      campaignAssetId: options.campaignAssetId,
    });

    if (possibleAsset?.campaignId === campaign.id) {
      campaignAsset = possibleAsset;
    }
  }

  const session: ChatSession = {
    id: generateId("sess"),
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    status: "active",
    createdAt: now,
    currentStep: "project_type",
    intakeData: {
      leadSource:
        campaignAsset?.source ||
        (campaign ? "campaign" : options?.leadSource || "website"),
    
      campaignId: campaign?.id ?? null,
    
      campaignAssetId: campaignAsset?.id ?? null,
    },
    leadCaptured: false,
    leadId: null,
    notificationSentAt: null,
  };

  const { error: sessionError } = await supabase.from("chat_sessions").insert({
    id: session.id,
    tenant_id: tenant.id ?? null,
    tenant_slug: tenant.slug,
    status: session.status,
    current_step: session.currentStep,
    intake_data: session.intakeData,
    lead_captured: session.leadCaptured,
    lead_id: session.leadId,
    notification_sent_at: session.notificationSentAt,
    created_at: session.createdAt,
    updated_at: session.createdAt,
  });

  if (sessionError) {
    console.error("Error creating chat session:", sessionError.message);
    throw sessionError;
  }

  const greetingContent =
    campaign?.greetingMessage?.trim() ||
    tenant.greetingMessage?.trim() ||
    getPromptForStep("project_type", tenant.businessName);

  const greeting = createMessageObject(session.id, "assistant", greetingContent);

  await insertMessage(greeting);

  return {
    session,
    messages: [greeting],
  };
}

export async function getChatSession(sessionId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching chat session:", error.message);
    }
    return null;
  }

  return mapSession(data);
}

export async function getMessagesForSession(sessionId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chat messages:", error.message);
    return [];
  }

  return data.map(mapMessage);
}

export async function addUserMessage(sessionId: string, content: string) {
  const session = await getChatSession(sessionId);

  if (!session) {
    return null;
  }

  const tenant = await getTenantBySlug(session.tenantSlug);

  if (!tenant) {
    return null;
  }

  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  const userMessage = createMessageObject(sessionId, "user", trimmedContent);
  await insertMessage(userMessage);

  const currentBookingFlow = getBookingFlowConfig(tenant);

  if (currentBookingFlow.showSignupLink && isSignupQuestion(trimmedContent)) {
    const assistantReply = createMessageObject(
      sessionId,
      "assistant",
      buildSignupReply()
    );

    await insertMessage(assistantReply);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  /**
 * Validate phone only when the assistant actually asked for a phone/contact.
 *
 * Why:
 * - currentStep represents the next missing required field.
 * - It does NOT guarantee the assistant's most recent question asked for that field.
 * - The AI may still be answering or discussing the customer's active objective.
 *
 * Example:
 * currentStep may already be "contact", while the assistant asks:
 * "How much coffee would you like each month?"
 *
 * The customer's answer must not be treated as an invalid phone number.
 */
  if (
    session.currentStep === "contact" &&
    tenant.requirePhoneForLead !== false
  ) {
    const validationMessages = await getMessagesForSession(sessionId);
  
    const lastAssistantMessage = [...validationMessages]
      .reverse()
      .find((message) => message.role === "assistant");
  
    const requestedField = detectRequestedField(lastAssistantMessage?.content);
  
    if (requestedField === "contact") {
      const normalizedPhone = normalizeUsPhone(trimmedContent);
  
      if (!normalizedPhone) {
        const assistantReply = createMessageObject(
          sessionId,
          "assistant",
          isAskingAboutUsingSomeoneElsesPhone(trimmedContent)
            ? "Yes, that’s totally fine. What’s the best phone number to reach them?"
            : "That phone number doesn’t look complete. Please send a 10-digit phone number, including the area code."
        );
  
        await insertMessage(assistantReply);
  
        return {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        };
      }
    }
  }
  
  /**
   * Handle the optional "Ask for Email after Phone" follow-up.
   *
   * Important:
   * - The lead already exists at this point.
   * - Email is not required to create the lead.
   * - This handler only runs after we explicitly asked for email.
   * - Scheduling/non-scheduling continuation is handled separately below.
   */
  /**
 * Handle the optional "Ask for Email after Phone" follow-up.
 *
 * Important:
 * - The lead already exists at this point.
 * - Email is optional and is not required to create the lead.
 * - This is a temporary sub-step inside the tenant's Booking Flow.
 * - Once email is supplied or skipped, resume the Booking Flow explicitly.
 */
if (
  session.currentStep === "complete" &&
  session.leadCaptured &&
  session.leadId &&
  session.intakeData?.awaitingEmailAfterPhone
) {
  const normalizedEmailResponse = trimmedContent.trim().toLowerCase();

  const wantsToSkipEmail =
    normalizedEmailResponse === "skip" ||
    normalizedEmailResponse === "no" ||
    normalizedEmailResponse === "no thanks" ||
    normalizedEmailResponse === "no thank you" ||
    normalizedEmailResponse === "rather not" ||
    normalizedEmailResponse === "prefer not to";

  if (!wantsToSkipEmail) {
    const normalizedEmail = normalizeEmail(trimmedContent);

    if (!normalizedEmail) {
      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        "That doesn’t look like a complete email address. Please send the email you’d like us to use, or say “skip.”"
      );

      await insertMessage(assistantReply);

      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      };
    }

    session.intakeData = {
      ...session.intakeData,
      email: normalizedEmail,
      awaitingEmailAfterPhone: false,
    };

    await updateSession(session);

    await updateLead(session.leadId, {
      email: normalizedEmail,
    });

    await safeCreateLeadActivity({
      leadId: session.leadId,
      tenantSlug: session.tenantSlug,
      eventType: "lead.email_added",
      eventSource: "customer",
      metadata: {
        fieldName: "email",
        previousValue: null,
        newValue: normalizedEmail,
      },
    });
  } else {
    session.intakeData = {
      ...session.intakeData,
      awaitingEmailAfterPhone: false,
    };

    await updateSession(session);
  }

  /**
   * Email collection is complete.
   *
   * Resume the tenant's Booking Flow here instead of allowing the email
   * response ("skip" or an email address) to fall through as a new
   * conversational message.
   */
  const bookingFlow = getBookingFlowConfig(tenant);

  if (bookingFlow.shouldOfferSchedulingAfterLeadCreated) {
    session.intakeData = {
      ...session.intakeData,
      awaitingSchedulingConfirmation: true,
    };

    await updateSession(session);

    const assistantReply = createMessageObject(
      sessionId,
      "assistant",
      buildLeadCreatedNextStepReply(tenant)
    );

    await insertMessage(assistantReply);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  /**
   * Non-scheduling flows such as Lead Capture Only and Manual Follow-up
   * should complete their handoff without entering scheduling.
   */
  const assistantReply = createMessageObject(
    sessionId,
    "assistant",
    buildLeadCreatedNextStepReply(tenant)
  );

  await insertMessage(assistantReply);

  return {
    sessionId,
    messages: await getMessagesForSession(sessionId),
    session,
  };
}
  
  /**
   * Handle hypothetical cancel/reschedule questions before scheduling intent.
   *
   * These are policy/process questions, not actual requests to cancel or reschedule.
   * This prevents the scheduler from incorrectly restarting or canceling appointments.
   */
  const normalizedForPolicy = trimmedContent.trim().toLowerCase();
  
  const isCancelReschedulePolicyQuestion =
    (
      normalizedForPolicy.includes("what happens if") ||
      normalizedForPolicy.includes("what if") ||
      normalizedForPolicy.includes("if i need to") ||
      normalizedForPolicy.includes("if we need to")
    ) &&
    (
      normalizedForPolicy.includes("cancel") ||
      normalizedForPolicy.includes("reschedule") ||
      normalizedForPolicy.includes("move") ||
      normalizedForPolicy.includes("change")
    );
  
  if (
    session.currentStep === "complete" &&
    session.leadCaptured &&
    session.leadId &&
    isCancelReschedulePolicyQuestion
  ) {
    const assistantReply = createMessageObject(
      sessionId,
      "assistant",
      "No problem — if you need to cancel or reschedule, just let us know as soon as possible and we’ll help adjust the appointment."
    );
  
    await insertMessage(assistantReply);
  
    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }
  
  const pendingAction = session.intakeData?.pendingAction;

if (
  session.currentStep === "complete" &&
  session.leadCaptured &&
  session.leadId &&
  pendingAction?.type === "backup_contact" &&
  pendingAction?.state === "awaiting_contact"
) {
  const normalizedPhone = normalizeUsPhone(trimmedContent);
  const normalizedEmail = normalizeEmail(trimmedContent);

  if (normalizedPhone || normalizedEmail) {
    const label =
      pendingAction.contactName || pendingAction.contactRelationship
        ? [pendingAction.contactName, pendingAction.contactRelationship]
            .filter(Boolean)
            .join(" — ")
        : "Backup contact";

    const updateText = [
      label,
      normalizedPhone ? `Phone: ${normalizedPhone}` : null,
      normalizedEmail ? `Email: ${normalizedEmail}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    await appendCustomerUpdateToLead(session.leadId, updateText);

    await safeCreateLeadActivity({
      leadId: session.leadId,
      tenantSlug: session.tenantSlug,
      eventType: "lead.customer_update_added",
      eventSource: "customer",
      metadata: {
        message: updateText,
        intent: "backup_contact_pending_action",
      },
    });

    session.intakeData = {
      ...session.intakeData,
      pendingAction: null,
    };

    await updateSession(session);

    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      "Got it — I’ll add that backup contact to your request."
    );

    await insertMessage(assistantMessage);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  const assistantMessage = createMessageObject(
    sessionId,
    "assistant",
    "No problem — please send the backup contact’s phone number or email."
  );

  await insertMessage(assistantMessage);

  return {
    sessionId,
    messages: await getMessagesForSession(sessionId),
    session,
  };
}

if (
  session.currentStep === "complete" &&
  session.leadCaptured &&
  session.leadId &&
  detectNoChangeCorrection(trimmedContent)
) {
  const assistantMessage = createMessageObject(
    sessionId,
    "assistant",
    "No problem — I’ll leave the appointment exactly as scheduled."
  );

  await insertMessage(assistantMessage);

  return {
    sessionId,
    messages: await getMessagesForSession(sessionId),
    session,
  };
}

const strongSchedulingRequest = detectStrongSchedulingRequest(trimmedContent);
const existingSchedulingState = session.intakeData?.schedulingState;

if (
  session.currentStep === "complete" &&
  session.leadCaptured &&
  session.leadId &&
  !existingSchedulingState?.active &&
  strongSchedulingRequest.hasSchedulingIntent
) {
  const schedulingResult = await runSchedulingWorkflow({
    session,
    sessionId,
    trimmedContent,
    schedulingIntent: {
      hasSchedulingIntent: true,
      type: "schedule",
      appointmentType: strongSchedulingRequest.appointmentType,
      confidence: "high",
    },
  });

  if (schedulingResult.handled && schedulingResult.response) {
    return schedulingResult.response;
  }
}

if (
  session.currentStep === "complete" &&
  session.leadCaptured &&
  session.leadId &&
  detectConversationClose(trimmedContent)
) {
  const closeMessages = await getMessagesForSession(sessionId);

  const previousAssistantMessage = [...closeMessages]
    .reverse()
    .find((message) => message.role === "assistant");

  const assistantMessage = createMessageObject(
    sessionId,
    "assistant",
    buildConversationCloseReply(
      tenant,
      previousAssistantMessage?.content
    )
  );

  await insertMessage(assistantMessage);

  return {
    sessionId,
    messages: await getMessagesForSession(sessionId),
    session,
  };
}

  /**
 * AI INTENT INTERPRETER — post-capture only.
 *
 * This runs before scheduling detection so business questions,
 * contact updates, and appointment notes do not get hijacked
 * by scheduling keywords like "available", "call", or "contact".
 */
let messageIntent: MessageIntentResult | null = null;

let workflowDecision: ReturnType<typeof decideNextAction> | null = null;

const activeSchedulingState = session.intakeData?.schedulingState;

if (
  session.currentStep === "complete" &&
  session.leadCaptured &&
  session.leadId &&
  !activeSchedulingState?.active
) {
  if (canFastPathPostCaptureBusinessQuestion(trimmedContent)) {
    const lead = await getLeadById(session.leadId);
    const messages = await getMessagesForSession(sessionId);
  
    if (lead) {
      const tenantKnowledgeResult = shouldRetrieveKnowledge(trimmedContent)
        ? await retrieveTenantKnowledge({
            tenantSlug: session.tenantSlug,
            campaignId: session.intakeData?.campaignId ?? null,
            query: buildKnowledgeRetrievalQuery(messages, trimmedContent),
            limit: 5,
          })
        : { items: [] };
  
      const replyOnlyStart = Date.now();
  
      const replyOnlyTurn = await generatePostCaptureReplyOnly({
        tenant,
        lead,
        messages,
        latestUserMessage: trimmedContent,
        tenantKnowledge: tenantKnowledgeResult.items,
      });
  
      console.log(
        "⏱️ fast-path generatePostCaptureReplyOnly ms:",
        Date.now() - replyOnlyStart
      );
  
      if (replyOnlyTurn.status === "generated") {
        const assistantReply = createMessageObject(
          sessionId,
          "assistant",
          replyOnlyTurn.reply
        );
  
        await insertMessage(assistantReply);
  
        return {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        };
      }
    }
  }

  const lead = await getLeadById(session.leadId);
  const messages = await getMessagesForSession(sessionId);

  const intentStart = Date.now();

  messageIntent = await interpretMessageIntent({
    tenant,
    lead,
    messages,
    latestUserMessage: trimmedContent,
  });

  console.log("⏱️ interpretMessageIntent ms:", Date.now() - intentStart);

  workflowDecision = decideNextAction(messageIntent, trimmedContent);

  /**
 * Fast-path simple conversation closings.
 *
 * Why:
 * - If the customer is clearly wrapping up, we do not need another AI reply-generation call.
 * - Logs showed "Thanks" / closing messages still falling through into
 *   generatePostCaptureTurn(), adding several seconds of avoidable latency.
 * - This keeps the receptionist fast and prevents over-processing simple closes.
 *
 * Future:
 * - RAG/vector search will improve knowledge retrieval speed and accuracy,
 *   but simple closing messages should still bypass expensive AI/retrieval work.
 */
  if (
    messageIntent.confidence === "high" &&
    workflowDecision.action === "handle_conversation_close"
  ) {
    const previousAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
  
    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      buildConversationCloseReply(
        tenant,
        previousAssistantMessage?.content
      )
    );

  await insertMessage(assistantMessage);

  return {
    sessionId,
    messages: await getMessagesForSession(sessionId),
    session,
  };
}

  console.log("🧭 Workflow decision:", {
    sessionId,
    leadId: session.leadId,
    action: workflowDecision.action,
    reason: workflowDecision.reason,
  });

  console.log("🧠 Message intent interpreted:", {
    sessionId,
    leadId: session.leadId,
    intent: messageIntent.intent,
    confidence: messageIntent.confidence,
    reason: messageIntent.reason,
  });

  if (
    messageIntent.confidence === "high" &&
    workflowDecision.action === "start_signup"
  ) {
    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      buildSignupReply()
    );
  
    await insertMessage(assistantMessage);
  
    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  if (
    messageIntent.confidence === "high" &&
    workflowDecision.action === "start_scheduling"
  ) {
    const schedulingResult = await runSchedulingWorkflow({
      session,
      sessionId,
      trimmedContent,
      schedulingIntent: {
        hasSchedulingIntent: true,
        type: "schedule",
        appointmentType: getDefaultSchedulingAppointmentType(tenant),
        confidence: "high",
      },
    });
  
    if (schedulingResult.handled && schedulingResult.response) {
      return schedulingResult.response;
    }
  }

  if (
    messageIntent.confidence === "high" &&
    [
      "update_contact_info",
      "add_appointment_note",
    ].includes(workflowDecision.action)
  ) {
    const customerUpdate = buildIntentCustomerUpdate(messageIntent);

    if (
      workflowDecision.action === "update_contact_info" &&
      messageIntent.extractedData?.email &&
      session.leadId
    ) {
      await updateLead(session.leadId, {
        email: messageIntent.extractedData.email,
      });
    }

    if (customerUpdate) {
      await appendCustomerUpdateToLead(session.leadId, customerUpdate);

      await safeCreateLeadActivity({
        leadId: session.leadId,
        tenantSlug: session.tenantSlug,
        eventType: "lead.customer_update_added",
        eventSource: "customer",
        metadata: {
          message: customerUpdate,
          intent: messageIntent.intent,
          reason: messageIntent.reason,
        },
      });
    }

    if (
      workflowDecision.action === "update_contact_info" &&
      shouldStartBackupContactPendingAction(messageIntent)
    ) {
      session.intakeData = {
        ...session.intakeData,
        pendingAction: {
          type: "backup_contact",
          state: "awaiting_contact",
          contactName: messageIntent.extractedData?.contactName ?? null,
          contactRelationship:
            messageIntent.extractedData?.contactRelationship ?? null,
          startedAt: new Date().toISOString(),
        },
      };
    
      await updateSession(session);
    }

    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      buildIntentAssistantReply(messageIntent)
    );

    await insertMessage(assistantMessage);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }
}

  if (
    session.currentStep === "complete" &&
    session.leadId &&
    session.intakeData?.awaitingSchedulingConfirmation &&
    (
      isAffirmativeSchedulingReply(trimmedContent) ||
      strongSchedulingRequest.hasSchedulingIntent
    )
  ) {
    session.intakeData = {
      ...session.intakeData,
      awaitingSchedulingConfirmation: false,
    };

    await updateSession(session);

    const inferredSchedulingIntent = await detectSchedulingIntent(trimmedContent);

    const schedulingResult = await runSchedulingWorkflow({
      session,
      sessionId,
      trimmedContent,
      schedulingIntent: {
        hasSchedulingIntent: true,
        type: "schedule",
        appointmentType:
          strongSchedulingRequest.appointmentType ??
          inferredSchedulingIntent.appointmentType ??
          getDefaultSchedulingAppointmentType(tenant) ??
          undefined,
        confidence: "high",
      },
    });

    if (schedulingResult.handled && schedulingResult.response) {
      return schedulingResult.response;
    }
  }

  if (
    session.currentStep === "complete" &&
    session.leadId &&
    isPostBookingClosingMessage(trimmedContent)
  ) {
    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      "Sounds good, we’ll see you then."
    );
  
    await insertMessage(assistantMessage);
  
    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }
  
  const schedulingIntent =
  session.currentStep === "timeline" && !session.leadCaptured
    ? ({
        hasSchedulingIntent: false,
        type: "schedule",
        appointmentType: null,
        confidence: "low",
      } as SchedulingIntentResult)
    : await detectSchedulingIntent(trimmedContent);

  if (schedulingIntent.hasSchedulingIntent) {
    console.log("📅 Scheduling intent detected:", {
      sessionId,
      tenantSlug: session.tenantSlug,
      leadId: session.leadId ?? null,
      currentStep: session.currentStep,
      leadCaptured: session.leadCaptured,
      message: trimmedContent,
      intent: schedulingIntent,
    });
  }

  const bookingFlowForScheduling = getBookingFlowConfig(tenant);

  const schedulingResult = bookingFlowForScheduling.requiresAppointment
    ? await runSchedulingWorkflow({
        session,
        sessionId,
        trimmedContent,
        schedulingIntent,
      })
    : { handled: false };
  
  console.log("📅 Scheduling workflow result:", {
    handled: schedulingResult.handled,
    hasResponse: Boolean(schedulingResult.response),
  });
  
  if (schedulingResult.handled && schedulingResult.response) {
    return schedulingResult.response;
  }
  
  /**
   * If the customer asks about scheduling before the lead exists,
   * remember that intent so we can resume scheduling immediately
   * after required intake is complete and the lead is created.
   */
  const bookingFlowForPendingScheduling = getBookingFlowConfig(tenant);

  if (
    bookingFlowForPendingScheduling.requiresAppointment &&
    schedulingIntent.hasSchedulingIntent &&
    schedulingIntent.type === "schedule" &&
    !session.leadCaptured
  ) {
    session.intakeData = {
      ...session.intakeData,
      pendingSchedulingRequest: true,
      pendingSchedulingPreference: trimmedContent,
      pendingSchedulingAppointmentType:
        schedulingIntent.appointmentType ?? undefined,
    };
  
    await updateSession(session);
  }

  /**
   * CLOSE POST-CAPTURE CONVERSATION CLEANLY
   */
  if (
    session.currentStep === "complete" &&
    session.leadId &&
    detectConversationClose(trimmedContent)
  ) {
    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      buildConversationCloseReply(tenant)
    );

    await insertMessage(assistantMessage);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  /**
   * POST-CAPTURE AI MODE:
   * Once a lead exists, use AI to interpret richer follow-up messages,
   * update structured fields when possible, append narrative context,
   * and ask the next helpful scope question.
   */
  if (session.currentStep === "complete" && session.leadId) {
    const lead = await getLeadById(session.leadId);
    const messages = await getMessagesForSession(sessionId);

    if (!lead) {
      return {
        sessionId,
        messages,
        session,
      };
    }

    const previousLeadState = await getLeadFieldState(session.leadId);
    const tenantSlug = previousLeadState.tenantSlug || session.tenantSlug;

    const tenantKnowledgeResult = shouldRetrieveKnowledge(trimmedContent)
      ? await retrieveTenantKnowledge({
          tenantSlug: session.tenantSlug,
          campaignId: session.intakeData?.campaignId ?? null,
          query: buildKnowledgeRetrievalQuery(messages, trimmedContent),
          limit: 5,
        })
      : { items: [] };

    const aiStart = Date.now();

    /**
     * Fast path for post-capture business questions.
     *
     * Why:
     * - After a lead is created, many customer messages are simple business questions:
     *   "Do you subcontract?", "Do you pull permits?", "Do you charge for quotes?"
     * - Those do NOT need the heavier post-capture AI call that also extracts lead
     *   updates, urgency, budget, shopping status, scope notes, and summaries.
     * - This keeps the receptionist faster without losing quality.
     *
     * Future:
     * - RAG/vector search will improve the retrieval side by finding smaller,
     *   more relevant knowledge chunks. Even with RAG, simple answer-only turns
     *   should stay lightweight.
     */
    if (
      messageIntent?.confidence === "high" &&
      workflowDecision?.action === "answer_business_question"
    ) {
      const replyOnlyStart = Date.now();

      const replyOnlyTurn = await generatePostCaptureReplyOnly({
        tenant,
        lead,
        messages,
        latestUserMessage: trimmedContent,
        tenantKnowledge: tenantKnowledgeResult.items,
      });

      console.log("⏱️ generatePostCaptureReplyOnly ms:", Date.now() - replyOnlyStart);

      if (replyOnlyTurn.status === "generated") {
        const assistantReply = createMessageObject(
          sessionId,
          "assistant",
          replyOnlyTurn.reply
        );

        await insertMessage(assistantReply);

        return {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        };
      }
    }

    

    const aiTurn = await generatePostCaptureTurn({
      tenant,
      lead,
      messages,
      latestUserMessage: trimmedContent,
      tenantKnowledge: tenantKnowledgeResult.items,
    });

    console.log("⏱️ generatePostCaptureTurn ms:", Date.now() - aiStart);

    if (aiTurn.status === "generated") {
      await applyPostCaptureStructuredUpdates({
        leadId: session.leadId,
        tenantSlug,
        previous: previousLeadState,
        updates: aiTurn.updates || {},
      });

      const summaryParts: string[] = [];

      if (aiTurn.customerUpdateSummary) {
        summaryParts.push(aiTurn.customerUpdateSummary);
      }

      if (aiTurn.signals?.budget) {
        summaryParts.push(`Budget: ${aiTurn.signals.budget}`);
      }

      if (aiTurn.signals?.urgency) {
        summaryParts.push(`Urgency: ${aiTurn.signals.urgency}`);
      }

      if (aiTurn.signals?.shoppingQuotes) {
        summaryParts.push("Customer is gathering quotes.");
      }

      if (aiTurn.signals?.scopeNotes?.length) {
        summaryParts.push(`Scope notes: ${aiTurn.signals.scopeNotes.join("; ")}`);
      }

      const summaryText = summaryParts
        .map((item) => item.trim())
        .filter(Boolean)
        .join(" ");

        /**
         * We intentionally do NOT append every post-capture AI summary to
         * customer_updates anymore.
         *
         * Why:
         * - it created repetitive Customer Updates on the Lead page
         * - it polluted Activity Timeline with low-value "customer added details" events
         * - AI Summary / Lead Copilot now provides the cleaner decision-ready summary
         *
         * Structured field changes are still saved above through
         * applyPostCaptureStructuredUpdates(), so we are not losing important updates.
         */

      // if (summaryText) {
      //   await appendCustomerUpdateToLead(session.leadId, summaryText);

      //   await safeCreateLeadActivity({
      //     leadId: session.leadId,
      //     tenantSlug,
      //     eventType: "lead.customer_update_added",
      //     eventSource: "customer",
      //     metadata: {
      //       message: summaryText,
      //     },
      //   });
      // }

      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        aiTurn.reply
      );

      await insertMessage(assistantReply);

      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      };
    }

    /**
     * Fallback if post-capture AI fails:
     * preserve the previous extractor behavior.
     */
    const extracted = extractStructuredLeadUpdateFromMessage(trimmedContent);

    if (extracted.invalidEmailAttempt) {
      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        "Ooops! That email doesn’t look complete yet. Please send the best email address for updates, quotes, or documents."
      );

      await insertMessage(assistantReply);

      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      };
    }

    if (extracted.email) {
      await updateLeadFields(session.leadId, { email: extracted.email });

      await logStructuredLeadFieldActivity({
        leadId: session.leadId,
        tenantSlug,
        fieldName: "email",
        previousValue: previousLeadState.email,
        newValue: extracted.email,
      });

      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        previousLeadState.email
          ? "Thanks — we’ve updated the email on your request."
          : "Thanks — we’ve added your email to your request."
      );

      await insertMessage(assistantReply);

      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      };
    }

    if (extracted.address) {
      await updateLeadFields(session.leadId, { address: extracted.address });

      await logStructuredLeadFieldActivity({
        leadId: session.leadId,
        tenantSlug,
        fieldName: "address",
        previousValue: previousLeadState.address,
        newValue: extracted.address,
      });

      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        "Thanks — we’ve added the project address to your request."
      );

      await insertMessage(assistantReply);

      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      };
    }

    if (extracted.location) {
      await updateLeadFields(session.leadId, { location: extracted.location });

      await logStructuredLeadFieldActivity({
        leadId: session.leadId,
        tenantSlug,
        fieldName: "location",
        previousValue: previousLeadState.location,
        newValue: extracted.location,
      });

      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        "Thanks — we’ve updated the project location on your request."
      );

      await insertMessage(assistantReply);

      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      };
    }

    if (extracted.timeline) {
      await updateLeadFields(session.leadId, { timeline: extracted.timeline });

      await logStructuredLeadFieldActivity({
        leadId: session.leadId,
        tenantSlug,
        fieldName: "timeline",
        previousValue: previousLeadState.timeline,
        newValue: extracted.timeline,
      });

      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        "Thanks — we’ve updated the requested timeline."
      );

      await insertMessage(assistantReply);

      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      };
    }

    if (extracted.appointment) {
      await updateLeadFields(session.leadId, {
        appointment: extracted.appointment,
      });

      await logStructuredLeadFieldActivity({
        leadId: session.leadId,
        tenantSlug,
        fieldName: "appointment",
        previousValue: previousLeadState.appointment,
        newValue: extracted.appointment,
      });

      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        "Thanks — we’ve added your scheduling preference to the request."
      );

      await insertMessage(assistantReply);

      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      };
    }

    await appendCustomerUpdateToLead(
      session.leadId,
      extracted.customerUpdateFallback || trimmedContent
    );

    await safeCreateLeadActivity({
      leadId: session.leadId,
      tenantSlug,
      eventType: "lead.customer_update_added",
      eventSource: "customer",
      metadata: {
        message: extracted.customerUpdateFallback || trimmedContent,
      },
    });

    const assistantReply = createMessageObject(
      sessionId,
      "assistant",
      "Got it — we’ve added that to your request. You can also share an email, address, timeline, or scheduling preference here."
    );

    await insertMessage(assistantReply);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  /**
   * PRE-CAPTURE AI MODE
   */
  const messages = await getMessagesForSession(sessionId);

  /**
   * Conservative fast-path detector for obvious business/FAQ questions.
   *
   * Why:
   * - Post-capture business questions were doing two AI calls:
   *   1) interpretMessageIntent()
   *   2) generatePostCaptureReplyOnly()
   * - For clear FAQ-style questions, the intent call adds latency without much value.
   *
   * Safety:
   * - This does NOT bypass AI answering.
   * - This does NOT bypass knowledge retrieval.
   * - It only bypasses the separate intent-classification AI call.
   * - Anything that could affect scheduling, contact info, appointment changes,
   *   cancellation, address, email, phone, or timing still goes through the normal
   *   intent/workflow layer.
   *
   * Future:
   * - RAG/vector search will improve the knowledge retrieval side by returning
   *   smaller, more accurate context. This helper is still useful because workflow
   *   classification and FAQ answering are separate jobs.
   */
  function canFastPathPostCaptureBusinessQuestion(message: string) {
    const normalized = message.trim().toLowerCase();
  
    if (!normalized) return false;

    const containsPhoneNumber = /(?:\D*\d){10,11}/.test(normalized);

    if (containsPhoneNumber) {
      return false;
    }
  
    /**
     * Do not fast-path anything that may change workflow/state.
     * These should keep going through the intent layer.
     */
    const riskyTerms = [
      "schedule",
      "book",
      "appointment",
      "reschedule",
      "cancel",
      "move",
      "change",
      "call me",
      "phone number",
      "email",
      "address",
      "today",
      "tomorrow",
      "next week",
      "wife",
      "husband",
      "spouse",
      "partner",
      "backup number",
      "back up number",
      "alternate number",
      "alternative number",
      "secondary number",
      "contact number",
      "backup contact",
      "back up contact",
    ];
  
    if (riskyTerms.some((term) => normalized.includes(term))) {
      return false;
    }
  
    /**
     * Safe FAQ-style business questions.
     *
     * Important:
     * - We check whether these appear anywhere in the message because customers
     *   often add polite lead-ins like:
     *   "A few more questions. Do you..."
     *   "Ok, do you..."
     * - This still does NOT bypass the AI answer.
     * - It only bypasses the separate intent-classification AI call.
     */
    const safeQuestionPatterns = [
      /\bdo you\b/,
      /\bare you\b/,
      /\bcan you\b/,
      /\bwill you\b/,
      /\bwould you\b/,
      /\bwhat do you\b/,
      /\bwhat services\b/,
      /\bhow much\b/,
      /\bdo i have to\b/,
    ];
  
    return safeQuestionPatterns.some((pattern) => pattern.test(normalized));
  }

  const tenantKnowledgeResult = shouldRetrieveKnowledge(trimmedContent)
    ? await retrieveTenantKnowledge({
        tenantSlug: session.tenantSlug,
        campaignId: session.intakeData?.campaignId ?? null,
        query: buildKnowledgeRetrievalQuery(messages, trimmedContent),
        limit: 5,
      })
    : { items: [] };

  console.log("📚 Pre-capture knowledge retrieval:", {
    requested: shouldRetrieveKnowledge(trimmedContent),
    itemCount: tenantKnowledgeResult.items.length,
    titles: tenantKnowledgeResult.items.map((item) => item.title),
  });

  const aiStart = Date.now();

  const aiTurn = await generateChatTurn({
    tenant,
    session,
    messages,
    tenantKnowledge: tenantKnowledgeResult.items,
  });

  console.log("⏱️ generateChatTurn ms:", Date.now() - aiStart);

  let updatedSession = session;

  if (aiTurn.status === "generated" && aiTurn.updates) {
    updatedSession = applyAiUpdatesToSession(updatedSession, aiTurn.updates);
  } else {
    switch (updatedSession.currentStep) {
      case "project_type":
        updatedSession = applyAiUpdatesToSession(updatedSession, {
          projectType: trimmedContent,
        });
        break;
      case "location":
        updatedSession = applyAiUpdatesToSession(updatedSession, {
          location: trimmedContent,
        });
        break;
      case "timeline":
        updatedSession = applyAiUpdatesToSession(updatedSession, {
          timeline: trimmedContent,
        });
        break;
      case "name":
        updatedSession = applyAiUpdatesToSession(updatedSession, {
          name: trimmedContent,
        });
        break;
      case "contact": {
        const normalizedPhone = normalizeUsPhone(trimmedContent);

        if (normalizedPhone) {
          updatedSession = applyAiUpdatesToSession(updatedSession, {
            phone: normalizedPhone,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  const lastAssistantMessage = [...messages]
  .reverse()
  .find((message) => message.role === "assistant");

const requestedField = detectRequestedField(lastAssistantMessage?.content);

updatedSession = applyFallbackStepCapture({
  session: updatedSession,
  trimmedContent,
  requestedField,
});

  if (!updatedSession.intakeData.contact) {
    const normalizedPhone = normalizeUsPhone(trimmedContent);
    if (normalizedPhone) {
      updatedSession.intakeData.contact = normalizedPhone;
    }
  }

  updatedSession = finalizeSessionStep(updatedSession, tenant);
  await updateSession(updatedSession);

  if (
    updatedSession.currentStep === "complete" &&
    updatedSession.leadCaptured &&
    !updatedSession.leadId &&
    getBookingFlowConfig(tenant).shouldCreateLeadAutomatically
  ) {
    const leadCreateStart = Date.now();

    updatedSession = await createLeadAndNotifyOnce(updatedSession);

    if (shouldAskForEmailAfterPhone(updatedSession, tenant)) {
      updatedSession.intakeData = {
        ...updatedSession.intakeData,
        emailAfterPhoneAsked: true,
        awaitingEmailAfterPhone: true,
      };
    
      await updateSession(updatedSession);
    
      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        "Thanks. What’s the best email address for follow-up? You can also say “skip.”"
      );
    
      await insertMessage(assistantReply);
    
      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session: updatedSession,
      };
    }

    console.log("⏱️ createLeadAndNotifyOnce ms:", Date.now() - leadCreateStart);
  
  /**
   * If the customer previously asked to schedule before the lead existed,
   * decide whether to resume scheduling or first ask for the next-step type.
   *
   * Important:
   * - Reservation/direct-booking tenants default to a confirmation call.
   * - Consultation/estimate tenants should NOT auto-resume into site visit
   *   unless the customer clearly chose call/site visit.
 */
  const bookingFlowAfterLeadCreated = getBookingFlowConfig(tenant);

  if (
    bookingFlowAfterLeadCreated.requiresAppointment &&
    updatedSession.intakeData?.pendingSchedulingRequest
  ) {
    const bookingFlow = bookingFlowAfterLeadCreated;

    if (bookingFlow.allowCustomerToChooseAppointmentType) {
      updatedSession.intakeData = {
        ...updatedSession.intakeData,
        pendingSchedulingRequest: false,
        pendingSchedulingPreference: undefined,
        pendingSchedulingAppointmentType: undefined,
        awaitingSchedulingConfirmation: true,
      };

      await updateSession(updatedSession);

      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        buildLeadCompletionAssistantReply({
          tenant,
          latestUserMessage: trimmedContent,
          generatedReply:
            aiTurn.status === "generated" ? aiTurn.reply : undefined,
        })
      );

      await insertMessage(assistantReply);

      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session: updatedSession,
      };
    }

    /**
     * Reservation/direct-booking tenants should not auto-resume into a fake
     * reservation or site visit. They should schedule a confirmation call.
     */
    if (isReservationLikeTenant(tenant)) {
      updatedSession.intakeData = {
        ...updatedSession.intakeData,
        pendingSchedulingRequest: false,
        pendingSchedulingPreference: undefined,
        pendingSchedulingAppointmentType: undefined,
        awaitingSchedulingConfirmation: true,
      };

    await updateSession(updatedSession);

    const assistantReply = createMessageObject(
      sessionId,
      "assistant",
      buildLeadCompletionAssistantReply({
        tenant,
        latestUserMessage: trimmedContent,
        generatedReply:
          aiTurn.status === "generated" ? aiTurn.reply : undefined,
      })
    );

    await insertMessage(assistantReply);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session: updatedSession,
    };
  }

  const pendingSchedulingPreference =
    updatedSession.intakeData.pendingSchedulingPreference ||
    "Customer wants to schedule.";

  const resumedSchedulingIntent: SchedulingIntentResult = {
    hasSchedulingIntent: true,
    type: "schedule",
    appointmentType:
      getDefaultSchedulingAppointmentType(tenant) ??
      updatedSession.intakeData.pendingSchedulingAppointmentType ??
      null,
    confidence: "high",
  };

  updatedSession.intakeData = {
    ...updatedSession.intakeData,
    pendingSchedulingRequest: false,
    pendingSchedulingPreference: undefined,
    pendingSchedulingAppointmentType: undefined,
  };

  await updateSession(updatedSession);

  const schedulingResult = await runSchedulingWorkflow({
    session: updatedSession,
    sessionId,
    trimmedContent: pendingSchedulingPreference,
    schedulingIntent: resumedSchedulingIntent,
  });

  if (schedulingResult.handled && schedulingResult.response) {
    return schedulingResult.response;
  }
}

  if (shouldOfferSchedulingAfterLeadCreated(tenant)) {
    updatedSession.intakeData = {
      ...updatedSession.intakeData,
      awaitingSchedulingConfirmation: true,
    };

    await updateSession(updatedSession);

    const assistantReply = createMessageObject(
      sessionId,
      "assistant",
      buildLeadCompletionAssistantReply({
        tenant,
        latestUserMessage: trimmedContent,
        generatedReply:
          aiTurn.status === "generated" ? aiTurn.reply : undefined,
      })
    );

    await insertMessage(assistantReply);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session: updatedSession,
    };
  }
}

  const assistantReplyContent =
    aiTurn.status === "generated" && aiTurn.reply
      ? aiTurn.reply
      : updatedSession.currentStep === "complete"
      ? "Thanks, I have enough information to get us started."
      : getPromptForStep(updatedSession.currentStep, tenant.businessName);

  const assistantReply = createMessageObject(
    sessionId,
    "assistant",
    assistantReplyContent
  );

  await insertMessage(assistantReply);

  return {
    sessionId,
    messages: await getMessagesForSession(sessionId),
    session: updatedSession,
  };
}
