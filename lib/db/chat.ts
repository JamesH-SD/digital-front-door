import { createClient } from "@/lib/supabase/server";
import {
  ChatMessage,
  ChatRole,
  ChatSession,
  IntakeStep,
} from "@/lib/types/chat";
import { getTenantBySlug } from "@/lib/db/tenants";
import { createLead } from "@/lib/db/leads";
import { sendLeadNotification } from "@/lib/notifications/sendLeadNotification";

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

/**
 * Basic email validation for optional email capture after the lead exists.
 * This is intentionally simple and practical for MVP use.
 */
function normalizeEmail(input: string): string | null {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Normalize US phone numbers to E.164 for consistency in the database
 * and compatibility with SMS providers like Twilio.
 *
 * Accepted examples:
 * - 6195551212        -> +16195551212
 * - (619) 555-1212    -> +16195551212
 * - 1-619-555-1212    -> +16195551212
 * - +1 619 555 1212   -> +16195551212
 *
 * Rejected examples:
 * - too short / too long
 * - 1111111111
 * - 1234567890
 */
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
      /**
       * The post-capture conversational flow is owned by the frontend.
       * Returning an empty string prevents duplicate completion bubbles.
       */
      return "";

    default:
      return "How can we help you today?";
  }
}

function applyAnswerToSession(
  session: ChatSession,
  userInput: string
): ChatSession {
  const trimmed = userInput.trim();

  switch (session.currentStep) {
    case "project_type":
      return {
        ...session,
        currentStep: "location",
        intakeData: {
          ...session.intakeData,
          projectType: trimmed,
        },
      };

    case "location":
      return {
        ...session,
        currentStep: "timeline",
        intakeData: {
          ...session.intakeData,
          location: trimmed,
        },
      };

    case "timeline":
      return {
        ...session,
        currentStep: "name",
        intakeData: {
          ...session.intakeData,
          timeline: trimmed,
        },
      };

    case "name":
      return {
        ...session,
        currentStep: "contact",
        intakeData: {
          ...session.intakeData,
          name: trimmed,
        },
      };

    case "contact":
      /**
       * Once a valid phone number is captured, we have the minimum required
       * information needed to create the lead silently in the background.
       *
       * The session remains active so the user can optionally add:
       * - email
       * - photos
       * - extra project details
       */
      return {
        ...session,
        currentStep: "complete",
        leadCaptured: true,
        status: "active",
        intakeData: {
          ...session.intakeData,
          contact: trimmed,
        },
      };

    case "complete":
      return session;

    default:
      return session;
  }
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

/**
 * Append customer follow-up messages to the dedicated customer_updates field.
 *
 * This intentionally does NOT write into leads.notes because notes are reserved
 * for internal/company use in the admin workflow.
 */
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

/**
 * Save or update the optional email address on an existing lead.
 */
async function updateLeadEmail(leadId: string, email: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({
      email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) {
    console.error("Error updating lead email:", error.message);
    throw error;
  }
}

/**
 * Look up minimal lead data needed to decide whether an incoming post-capture
 * message should be treated as email capture or as a normal follow-up update.
 */
async function getLeadContactState(leadId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("email")
    .eq("id", leadId)
    .single();

  if (error) {
    console.error("Error fetching lead contact state:", error.message);
    throw error;
  }

  return {
    email: data?.email ?? null,
  };
}

export async function createChatSessionForTenantSlug(tenantSlug: string) {
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return null;
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const session: ChatSession = {
    id: generateId("sess"),
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    status: "active",
    createdAt: now,
    currentStep: "project_type",
    intakeData: {},
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

  const greeting = createMessageObject(
    session.id,
    "assistant",
    getPromptForStep("project_type", tenant.businessName)
  );

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

  /**
   * Validate and normalize the phone number before we let the chat advance
   * past the required contact step.
   */
  if (session.currentStep === "contact") {
    const normalizedPhone = normalizeUsPhone(trimmedContent);

    if (!normalizedPhone) {
      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        "That doesn’t look like a valid phone number yet. Please send the best number for us to reach you by text or call."
      );

      await insertMessage(assistantReply);

      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      };
    }

    const updatedSession = applyAnswerToSession(session, normalizedPhone);
    await updateSession(updatedSession);

    if (
      updatedSession.currentStep === "complete" &&
      updatedSession.leadCaptured &&
      !updatedSession.leadId
    ) {
      const intake = updatedSession.intakeData;

      const lead = await createLead({
        tenantId: updatedSession.tenantId,
        tenantSlug: updatedSession.tenantSlug,
        sessionId: updatedSession.id,
        customerName: intake.name || "Unknown",
        phone: intake.contact || "Unknown",
        email: undefined,
        address: undefined,
        projectType: intake.projectType || "Unknown",
        location: intake.location || "Unknown",
        timeline: intake.timeline || "Unknown",
        appointment: undefined,
        notes: undefined,
        customerUpdates: undefined,
        images: [],
      });

      await sendLeadNotification(lead);

      updatedSession.leadId = lead.id;
      updatedSession.notificationSentAt = new Date().toISOString();

      await updateSession(updatedSession);
    }

    const prompt = getPromptForStep(
      updatedSession.currentStep,
      tenant.businessName
    );

    if (prompt) {
      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        prompt
      );
      await insertMessage(assistantReply);
    }

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session: updatedSession,
    };
  }

  /**
   * If a lead already exists for this session, keep the conversation alive.
   *
   * Special handling:
   * - if the message looks like an email, store it on the lead
   * - otherwise treat it as a normal follow-up project update
   */
  if (session.currentStep === "complete" && session.leadId) {
    const normalizedEmail = normalizeEmail(trimmedContent);

    if (normalizedEmail) {
      const leadState = await getLeadContactState(session.leadId);

      await updateLeadEmail(session.leadId, normalizedEmail);

      const assistantReply = createMessageObject(
        sessionId,
        "assistant",
        leadState.email
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

    await appendCustomerUpdateToLead(session.leadId, trimmedContent);

    const assistantReply = createMessageObject(
      sessionId,
      "assistant",
      "Got it — we’ve added that to your request. If you’d like, you can also share an email for updates, quotes, or documents."
    );

    await insertMessage(assistantReply);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  /**
   * For the rest of the scripted intake flow, apply the answer normally.
   */
  const updatedSession = applyAnswerToSession(session, trimmedContent);
  await updateSession(updatedSession);

  /**
   * Once the minimum required information has been collected, create the lead
   * silently in the background if it does not already exist for this session.
   */
  if (
    updatedSession.currentStep === "complete" &&
    updatedSession.leadCaptured &&
    !updatedSession.leadId
  ) {
    const intake = updatedSession.intakeData;

    const lead = await createLead({
      tenantId: updatedSession.tenantId,
      tenantSlug: updatedSession.tenantSlug,
      sessionId: updatedSession.id,
      customerName: intake.name || "Unknown",
      phone: intake.contact || "Unknown",
      email: undefined,
      address: undefined,
      projectType: intake.projectType || "Unknown",
      location: intake.location || "Unknown",
      timeline: intake.timeline || "Unknown",
      appointment: undefined,
      notes: undefined,
      customerUpdates: undefined,
      images: [],
    });

    await sendLeadNotification(lead);

    updatedSession.leadId = lead.id;
    updatedSession.notificationSentAt = new Date().toISOString();

    await updateSession(updatedSession);
  }

  const prompt = getPromptForStep(
    updatedSession.currentStep,
    tenant.businessName
  );

  if (prompt) {
    const assistantReply = createMessageObject(sessionId, "assistant", prompt);
    await insertMessage(assistantReply);
  }

  return {
    sessionId,
    messages: await getMessagesForSession(sessionId),
    session: updatedSession,
  };
}