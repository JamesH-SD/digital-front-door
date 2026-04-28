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
import { detectSchedulingIntent } from "@/lib/chat/detectSchedulingIntent";
import { getPrimaryCalendarConnectionByTenantSlug } from "@/lib/calendar/calendarConnectionService";
import { getGoogleCalendarAvailability } from "@/lib/calendar/googleCalendar";
import type { CalendarAvailabilitySlot } from "@/lib/calendar/types";

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

type ChatSchedulingSlot = CalendarAvailabilitySlot & {
  optionNumber: number;
  displayLabel: string;
};

function formatChatSlotLabel(slot: CalendarAvailabilitySlot) {
  const date = new Date(slot.startAt);

  if (Number.isNaN(date.getTime())) {
    return slot.startAt;
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: slot.timezone || "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function splitAvailabilityIntoHourlySlots(
  windows: CalendarAvailabilitySlot[],
  maxSlots = 3
): ChatSchedulingSlot[] {
  const results: ChatSchedulingSlot[] = [];
  const slotMinutes = 60;

  for (const window of windows) {
    const windowStart = new Date(window.startAt);
    const windowEnd = new Date(window.endAt);

    if (
      Number.isNaN(windowStart.getTime()) ||
      Number.isNaN(windowEnd.getTime())
    ) {
      continue;
    }

    const cursor = new Date(windowStart);
    cursor.setMinutes(0, 0, 0);

    if (cursor.getTime() < windowStart.getTime()) {
      cursor.setHours(cursor.getHours() + 1);
    }

    while (
      cursor.getTime() + slotMinutes * 60_000 <= windowEnd.getTime() &&
      results.length < maxSlots
    ) {
      const slotEnd = new Date(cursor.getTime() + slotMinutes * 60_000);

      const slot: CalendarAvailabilitySlot = {
        startAt: cursor.toISOString(),
        endAt: slotEnd.toISOString(),
        timezone: window.timezone || "America/Los_Angeles",
      };

      results.push({
        ...slot,
        optionNumber: results.length + 1,
        displayLabel: formatChatSlotLabel(slot),
      });

      cursor.setHours(cursor.getHours() + 1);
    }

    if (results.length >= maxSlots) break;
  }

  return results;
}

function parseSelectedSlotOption(message: string): number | null {
  const normalized = message.trim().toLowerCase();

  const directNumber = normalized.match(/\b([1-3])\b/);
  if (directNumber?.[1]) {
    return Number(directNumber[1]);
  }

  if (normalized.includes("first")) return 1;
  if (normalized.includes("second")) return 2;
  if (normalized.includes("third")) return 3;

  return null;
}

function getSchedulingWindowFromPreference(preferenceText?: string | null) {
  const normalized = (preferenceText || "").toLowerCase();
  const now = new Date();

  const from = new Date(now);

  if (normalized.includes("next week")) {
    const day = from.getDay(); // Sunday = 0
    const daysUntilNextMonday = ((8 - day) % 7) || 7;

    from.setDate(from.getDate() + daysUntilNextMonday);
    from.setHours(9, 0, 0, 0);

    const to = new Date(from);
    to.setDate(from.getDate() + 5);
    to.setHours(17, 0, 0, 0);

    return { from, to };
  }

  if (normalized.includes("this week")) {
    from.setDate(from.getDate() + 1);
    from.setHours(9, 0, 0, 0);

    const to = new Date(from);
    const day = to.getDay();
    const daysUntilFriday = Math.max(1, 5 - day);

    to.setDate(to.getDate() + daysUntilFriday);
    to.setHours(17, 0, 0, 0);

    return { from, to };
  }

  if (normalized.includes("tomorrow")) {
    from.setDate(from.getDate() + 1);
    from.setHours(9, 0, 0, 0);

    const to = new Date(from);
    to.setHours(17, 0, 0, 0);

    return { from, to };
  }

  from.setDate(from.getDate() + 1);
  from.setHours(9, 0, 0, 0);

  const to = new Date(from);
  to.setDate(from.getDate() + 7);
  to.setHours(17, 0, 0, 0);

  return { from, to };
}

function detectSchedulingFollowUpQuestion(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("reschedule") ||
    normalized.includes("change") ||
    normalized.includes("something comes up") ||
    normalized.includes("can't make it") ||
    normalized.includes("cannot make it") ||
    normalized.includes("cancel")
  );
}

async function getChatSchedulingSlots(input: {
  tenantSlug: string;
  preferenceText?: string | null;
}): Promise<ChatSchedulingSlot[]> {
  const timezone = "America/Los_Angeles";

  const connection = await getPrimaryCalendarConnectionByTenantSlug(
    input.tenantSlug
  );

  if (!connection) {
    return [];
  }

  const { from, to } = getSchedulingWindowFromPreference(input.preferenceText);

  const windows = await getGoogleCalendarAvailability({
    connection,
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
    timezone,
    minSlotMinutes: 60,
  });

  return splitAvailabilityIntoHourlySlots(windows, 3);
}

function buildSlotOfferMessage(slots: ChatSchedulingSlot[]) {
  if (slots.length === 0) {
    return "I’m not seeing any openings in the next few days. We’ll follow up directly to coordinate a time.";
  }

  const options = slots
    .map((slot) => `${slot.optionNumber}. ${slot.displayLabel}`)
    .join("\n");

    return `I found a few openings over the next couple of days:\n\n${options}\n\nWhich one works best for you? You can reply with 1, 2, or 3.\n\nIf you had a different timeframe in mind, just let me know.`;
}

function detectSlotRejectionOrPreference(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("none") ||
    normalized.includes("not work") ||
    normalized.includes("doesn't work") ||
    normalized.includes("dont work") ||
    normalized.includes("don't work") ||
    normalized.includes("later in the week") ||
    normalized.includes("after wednesday") ||
    normalized.includes("after thursday") ||
    normalized.includes("another day") ||
    normalized.includes("different day") ||
    normalized.includes("different time")
  );
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

function toTitleCase(value?: string | null) {
  if (!value) return "";

  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bCA\b/i, "CA");
}

function buildChatAppointmentTitle(input: {
  projectType?: string;
  customerName?: string;
  appointmentType: "call" | "site_visit";
}) {
  const project = input.projectType?.trim()
    ? toTitleCase(input.projectType)
    : "Project";

  const suffix =
    input.appointmentType === "site_visit" ? "Appointment" : "Call";

  return input.customerName?.trim()
    ? `${project} ${suffix} – ${toTitleCase(input.customerName)}`
    : `${project} ${suffix}`;
}

function formatPhoneForCalendar(value?: string | null) {
  if (!value) return "Not provided";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return value;
}

function buildChatAppointmentDescription(input: {
  lead?: any | null;
  appointmentType: "call" | "site_visit";
  address?: string | null;
}) {
  const lead = input.lead;

  return [
    `Scheduled from: Chat`,
    lead?.leadNumber ? `Lead: ${lead.leadNumber}` : null,
    lead?.customerName ? `Customer: ${toTitleCase(lead.customerName)}` : null,
    lead?.phone ? `Phone: ${formatPhoneForCalendar(lead.phone)}` : null,
    lead?.email ? `Email: ${lead.email}` : null,
    lead?.projectType ? `Project: ${toTitleCase(lead.projectType)}` : null,
    lead?.location ? `Location: ${toTitleCase(lead.location)}` : null,
    lead?.timeline ? `Timeline: ${toTitleCase(lead.timeline)}` : null,
    `Appointment Type: ${
      input.appointmentType === "site_visit" ? "On-site Visit" : "Phone Call"
    }`,
    input.address ? `Address: ${formatAddressForDisplay(input.address)}` : null,
    lead?.notes ? `Notes: ${lead.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function looksLikeIncompleteAddress(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) return true;

  const hasNumber = /\d+/.test(normalized);

  const hasStreetWord =
    /\b(st|street|ave|avenue|rd|road|dr|drive|ct|court|ln|lane|blvd|boulevard|way|pl|place|terrace|ter|circle|cir)\b/.test(
      normalized
    );

  const hasCityStateOrZip =
    /\bca\b/.test(normalized) ||
    /\bcalifornia\b/.test(normalized) ||
    /\b\d{5}(?:-\d{4})?\b/.test(normalized) ||
    normalized.split(",").length >= 2;

  return !(hasNumber && hasStreetWord && hasCityStateOrZip);
}

function formatAddressForDisplay(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bCa\b/g, "CA")
    .replace(/\bUsa\b/g, "USA");
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

  const schedulingIntent = detectSchedulingIntent(trimmedContent);

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

const schedulingState = session.intakeData?.schedulingState;

/**
 * START SCHEDULING
 */
if (
  schedulingIntent.type === "schedule" &&
  session.currentStep === "complete" &&
  session.leadCaptured &&
  session.leadId &&
  !schedulingState?.active
) {
  session.intakeData = {
    ...session.intakeData,
    schedulingState: {
      active: true,
      step: "collect_details",
      appointmentType: undefined,
      address: undefined,
      selectedSlot: undefined,
      offeredSlots: undefined,
      preferenceText: trimmedContent,
    },
  };

  await updateSession(session);

  const assistantMessage = createMessageObject(
    sessionId,
    "assistant",
    "Absolutely — we can help get that scheduled. Would you prefer a phone call or an on-site visit?"
  );

  await insertMessage(assistantMessage);

  return {
    sessionId,
    messages: await getMessagesForSession(sessionId),
    session,
  };
}

/**
 * CAPTURE SITE VISIT ADDRESS + OFFER REAL SLOTS
 */
if (
  schedulingState?.active &&
  schedulingState.step === "collect_details" &&
  schedulingState.appointmentType === "site_visit" &&
  !schedulingState.address
) {
  if (looksLikeIncompleteAddress(trimmedContent)) {
    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      "Thanks — can you send the full project address, including city and ZIP code? That helps us make sure the appointment details and map link are accurate."
    );

    await insertMessage(assistantMessage);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  const formattedAddress = formatAddressForDisplay(trimmedContent);

  let slots: ChatSchedulingSlot[] = [];

  try {
    slots = await getChatSchedulingSlots({
      tenantSlug: session.tenantSlug,
      preferenceText: schedulingState.preferenceText,
    });

    console.log("📅 Chat scheduling slots:", slots);
  } catch (error) {
    console.error("❌ Availability fetch failed:", error);
  }

  session.intakeData = {
    ...session.intakeData,
    schedulingState: {
      ...schedulingState,
      address: formattedAddress,
      step: "select_slot",
      offeredSlots: slots,
    },
  };

  await updateLeadFields(session.leadId!, {
    address: formattedAddress,
  });

  await logStructuredLeadFieldActivity({
    leadId: session.leadId!,
    tenantSlug: session.tenantSlug,
    fieldName: "address",
    previousValue: null,
    newValue: formattedAddress,
  });

  await updateSession(session);

  const assistantMessage = createMessageObject(
    sessionId,
    "assistant",
    buildSlotOfferMessage(slots)
  );

  await insertMessage(assistantMessage);

  return {
    sessionId,
    messages: await getMessagesForSession(sessionId),
    session,
  };
}

/**
 * CAPTURE APPOINTMENT TYPE
 */
if (
  schedulingState?.active &&
  schedulingState.step === "collect_details"
) {
  const normalized = trimmedContent.toLowerCase();

  let appointmentType: "call" | "site_visit" | null = null;

  if (normalized.includes("call") || normalized.includes("phone")) {
    appointmentType = "call";
  }

  if (
    normalized.includes("site") ||
    normalized.includes("visit") ||
    normalized.includes("come out") ||
    normalized.includes("in person")
  ) {
    appointmentType = "site_visit";
  }

  if (appointmentType) {
    if (appointmentType === "call") {
      let slots: ChatSchedulingSlot[] = [];

      try {
        slots = await getChatSchedulingSlots({
          tenantSlug: session.tenantSlug,
          preferenceText: schedulingState.preferenceText,
        });;

        console.log("📅 Chat scheduling slots:", slots);
      } catch (error) {
        console.error("❌ Availability fetch failed:", error);
      }

      session.intakeData = {
        ...session.intakeData,
        schedulingState: {
          ...schedulingState,
          appointmentType,
          step: "select_slot",
          offeredSlots: slots,
        },
      };

      await updateSession(session);

      const assistantMessage = createMessageObject(
        sessionId,
        "assistant",
        buildSlotOfferMessage(slots)
      );

      await insertMessage(assistantMessage);

      return {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      };
    }

    session.intakeData = {
      ...session.intakeData,
      schedulingState: {
        ...schedulingState,
        appointmentType,
        step: "collect_details",
      },
    };

    await updateSession(session);

    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      "Great — we’ll set up an on-site visit. What’s the address for the project?"
    );

    await insertMessage(assistantMessage);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }
}

/**
 * BOOK SELECTED CHAT APPOINTMENT
 */
if (
  schedulingState?.active &&
  schedulingState.step === "select_slot" &&
  session.leadId
) {
  const selectedOption = parseSelectedSlotOption(trimmedContent);
  const offeredSlots = Array.isArray(schedulingState.offeredSlots)
    ? schedulingState.offeredSlots
    : [];

  const selectedSlot = offeredSlots.find(
    (slot: any) => slot.optionNumber === selectedOption
  );

  /**
   * If the customer rejects the offered times or gives a different
   * scheduling preference, do not keep forcing 1/2/3.
   */
  if (!selectedSlot && detectSlotRejectionOrPreference(trimmedContent)) {
    await updateLeadFields(session.leadId, {
      appointment: trimmedContent,
    });

    await logStructuredLeadFieldActivity({
      leadId: session.leadId,
      tenantSlug: session.tenantSlug,
      fieldName: "appointment",
      previousValue: null,
      newValue: trimmedContent,
    });

    session.intakeData = {
      ...session.intakeData,
      schedulingState: {
        ...schedulingState,
        active: false,
        step: "confirm",
        appointmentPreference: trimmedContent,
      },
    };

    await updateSession(session);

    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      "No problem — I’ve noted that those times do not work and that you prefer a different day or timeframe. We’ll follow up with better options."
    );

    await insertMessage(assistantMessage);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  if (!selectedSlot) {
    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      "Please reply with 1, 2, or 3 so I can book one of the available times."
    );

    await insertMessage(assistantMessage);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  const appointmentType =
    schedulingState.appointmentType === "site_visit" ? "site_visit" : "call";

  const lead = await getLeadById(session.leadId);

  const title = buildChatAppointmentTitle({
    projectType: lead?.projectType,
    customerName: lead?.customerName,
    appointmentType,
  });

  const description = buildChatAppointmentDescription({
    lead,
    appointmentType,
    address: schedulingState.address || null,
  });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/admin/tenants/${session.tenantSlug}/appointments/book`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leadId: session.leadId,
        appointmentType,
        address:
          appointmentType === "site_visit"
            ? schedulingState.address || null
            : null,
        title,
        description,
        location:
          appointmentType === "site_visit"
            ? schedulingState.address || null
            : null,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
        timezone: selectedSlot.timezone || "America/Los_Angeles",
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error("❌ Chat appointment booking failed:", result);

    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      "I had trouble booking that time automatically. We’ll follow up shortly to get the appointment confirmed."
    );

    await insertMessage(assistantMessage);

    return {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    };
  }

  await updateLeadFields(session.leadId, {
    appointment: selectedSlot.displayLabel,
  });

  await logStructuredLeadFieldActivity({
    leadId: session.leadId,
    tenantSlug: session.tenantSlug,
    fieldName: "appointment",
    previousValue: null,
    newValue: selectedSlot.displayLabel,
  });

  session.intakeData = {
    ...session.intakeData,
    schedulingState: {
      ...schedulingState,
      active: false,
      step: "confirm",
      selectedSlot,
      bookedAppointmentId: result.appointment?.id ?? null,
    },
  };

  await updateSession(session);

  const followUpText = detectSchedulingFollowUpQuestion(trimmedContent)
    ? "\n\nIf something comes up, just reply here and we can help reschedule or cancel the appointment."
    : "";

  const assistantMessage = createMessageObject(
    sessionId,
    "assistant",
    `Great — you’re booked for ${selectedSlot.displayLabel}.${followUpText}`
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