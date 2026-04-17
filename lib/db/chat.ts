import { createClient } from "@/lib/supabase/server";
import {
  ChatMessage,
  ChatRole,
  ChatSession,
  IntakeStep,
} from "@/lib/types/chat";
import { getTenantBySlug } from "@/lib/db/tenants";
import { createLead, getLeadById } from "@/lib/db/leads";
import { sendLeadNotification } from "@/lib/notifications/sendLeadNotification";
import { createLeadActivity } from "@/lib/db/lead-activities";
import { extractStructuredLeadUpdateFromMessage } from "@/lib/chat/extractStructuredLeadUpdate";
import { generateChatTurn } from "@/lib/ai/generateChatTurn";
import { generatePostCaptureTurn } from "@/lib/ai/generatePostCaptureTurn";
import type { Tenant } from "@/lib/types/tenant";

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

  const lead = await createLead({
    tenantId: session.tenantId,
    tenantSlug: session.tenantSlug,
    sessionId: session.id,
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

  session.leadId = lead.id;

  const notificationResult = await safeSendLeadNotification(lead);

  if (notificationResult.status === "sent") {
    session.notificationSentAt = new Date().toISOString();
  } else {
    console.error("Lead notification was skipped:", notificationResult.reason);
  }

  await updateSession(session);

  return session;
}

function getMissingRequiredFields(session: ChatSession, tenant: Tenant) {
  const intake = session.intakeData || {};
  const missing: IntakeStep[] = [];

  if (!intake.projectType?.trim()) {
    missing.push("project_type");
  }

  if (!intake.location?.trim()) {
    missing.push("location");
  }

  if (tenant.askForTimeline !== false && !intake.timeline?.trim()) {
    missing.push("timeline");
  }

  if (!intake.name?.trim()) {
    missing.push("name");
  }

  if (tenant.requirePhoneForLead !== false && !intake.contact?.trim()) {
    missing.push("contact");
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

function finalizeSessionStep(session: ChatSession, tenant: Tenant): ChatSession {
  const missing = getMissingRequiredFields(session, tenant);

  if (missing.length === 0) {
    return {
      ...session,
      currentStep: "complete",
      leadCaptured: true,
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

async function applyPostCaptureStructuredUpdates(input: {
  leadId: string;
  tenantSlug: string;
  previous: Awaited<ReturnType<typeof getLeadFieldState>>;
  updates: Partial<{
    email: string;
    address: string;
    location: string;
    timeline: string;
    appointment: string;
  }>;
}) {
  const { leadId, tenantSlug, previous, updates } = input;

  const safeUpdates: Partial<{
    email: string;
    address: string;
    location: string;
    timeline: string;
    appointment: string;
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

  if (typeof updates.appointment === "string" && updates.appointment.trim()) {
    safeUpdates.appointment = updates.appointment.trim();
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

  if (safeUpdates.appointment && safeUpdates.appointment !== previous.appointment) {
    await logStructuredLeadFieldActivity({
      leadId,
      tenantSlug,
      fieldName: "appointment",
      previousValue: previous.appointment,
      newValue: safeUpdates.appointment,
    });
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

  const greetingContent =
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

    const aiTurn = await generatePostCaptureTurn({
      tenant,
      lead,
      messages,
      latestUserMessage: trimmedContent,
    });

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

      if (summaryText) {
        await appendCustomerUpdateToLead(session.leadId, summaryText);

        await safeCreateLeadActivity({
          leadId: session.leadId,
          tenantSlug,
          eventType: "lead.customer_update_added",
          eventSource: "customer",
          metadata: {
            message: summaryText,
          },
        });
      }

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

  const aiTurn = await generateChatTurn({
    tenant,
    session,
    messages,
  });

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
    !updatedSession.leadId
  ) {
    updatedSession = await createLeadAndNotifyOnce(updatedSession);
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