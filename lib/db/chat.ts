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

function getPromptForStep(step: IntakeStep, businessName: string): string {
  switch (step) {
    case "project_type":
      return `Hi! I'm the virtual receptionist for ${businessName}. What kind of project can I help you with today?`;

    case "location":
      return "Got it. What city is the job located in?";

    case "timeline":
      return "Thanks. What is your timeline for getting this work done?";

    case "name":
      return "Understood. What is your name?";

    case "contact":
      return "Great. What is the best phone number or email for the contractor to reach you?";

    case "complete":
      return "Thanks, that helps a lot. Is there anything else you'd like the contractor to know?";

    default:
      return "How can I help you today?";
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
 * Append post-capture customer follow-up messages to the dedicated
 * customer_updates field on the lead.
 *
 * This intentionally does NOT write into leads.notes because notes are
 * reserved for contractor/internal use in the admin workflow.
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
   * If the session has already produced a lead, keep the chat active and
   * treat future customer messages as follow-up updates for that same lead.
   *
   * These updates go into leads.customer_updates, not leads.notes.
   */
  if (session.currentStep === "complete" && session.leadId) {
    await appendCustomerUpdateToLead(session.leadId, trimmedContent);

    const assistantReply = createMessageObject(
      sessionId,
      "assistant",
      "Got it — I’ve added that to your request. Anything else you'd like the contractor to know?"
    );

    await insertMessage(assistantReply);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  const updatedSession = applyAnswerToSession(session, trimmedContent);
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

    const systemMessage = createMessageObject(
      sessionId,
      "system",
      `LEAD_CREATED:${new Date().toISOString()}`
    );

    await insertMessage(systemMessage);
  }

  const assistantReply = createMessageObject(
    sessionId,
    "assistant",
    getPromptForStep(updatedSession.currentStep, tenant.businessName)
  );

  await insertMessage(assistantReply);

  return {
    sessionId,
    messages: await getMessagesForSession(sessionId),
    session: updatedSession,
  };
}