import { ChatMessage, ChatRole, ChatSession } from "@/lib/types/chat";
import { createClient } from "@/lib/supabase/server";
import { getLeadById, updateLead } from "@/lib/db/leads";
import { createLeadActivity } from "@/lib/db/lead-activities";
import {
  getPrimaryCalendarConnectionByTenantSlug,
  markCalendarConnectionInvalid,
} from "@/lib/calendar/calendarConnectionService";
import { createGoogleCalendarEvent } from "@/lib/calendar/googleCalendar";
import {
  createAppointment,
  confirmAppointment,
} from "@/lib/scheduling/appointmentService";
import type { SchedulingIntentResult } from "@/lib/chat/detectSchedulingIntent";
import {
  getBookableAppointmentSlots,
  type BookableAppointmentDay,
  type BookableAppointmentSlot,
} from "@/lib/scheduling/getBookableAppointmentSlots";
import { generateSchedulingResponse } from "@/lib/ai/generateSchedulingResponse";
import type { TenantInteractionTypeId } from "@/lib/types/tenant-config";
import { getTenantBySlug } from "@/lib/db/tenants";
import { getTenantConfig } from "@/lib/config/getTenantConfig";
import { detectInteractionType } from "@/lib/chat/detectInteractionType";
import { getBookingFlowConfig } from "@/lib/config/getBookingFlowConfig";

type RunSchedulingWorkflowInput = {
  session: ChatSession;
  sessionId: string;
  trimmedContent: string;
  schedulingIntent: SchedulingIntentResult;
};

type RunSchedulingWorkflowResult = {
  handled: boolean;
  response?: {
    sessionId: string;
    messages: ChatMessage[];
    session: ChatSession;
  };
};

type AppointmentType = "call" | "site_visit";
type InteractionType = Extract<
  TenantInteractionTypeId,
  "site_visit" | "phone_call"
>;

type OfferedSlot = BookableAppointmentSlot & {
  optionNumber: number;
};

type OfferedDay = Omit<BookableAppointmentDay, "slots"> & {
  optionNumber: number;
  slots: OfferedSlot[];
};

type SchedulingState = {
  active?: boolean;
  step?:
    | "collect_details"
    | "select_day"
    | "select_slot"
    | "collect_email"
    | "confirm"
    | "fallback_followup";
  interactionType?: InteractionType;
  appointmentType?: AppointmentType;
  address?: string;
  preferenceText?: string;
  selectedDay?: OfferedDay;
  availableDays?: OfferedDay[];
  offeredSlots?: OfferedSlot[];
  selectedSlot?: OfferedSlot;
  email?: string;
  dayRetryCount?: number;
  timeRetryCount?: number;
  calendarStatus?: "active" | "invalid" | "missing";
  appointmentPreference?: string;
};

const DEFAULT_TIMEZONE = "America/Los_Angeles";
const MAX_DAY_OPTIONS = 21;
const MAX_TIME_OPTIONS_PER_DAY = 8;
const MAX_RETRY_COUNT = 2;

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
 * Extract and normalize customer email before adding it to the lead or calendar invite.
 */
function normalizeEmail(input: string): string | null {
  if (!input) return null;

  const match = input.match(
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
  );

  return match ? match[0].toLowerCase() : null;
}

/**
 * Let customer skip email because email should help scheduling,
 * but should not block booking.
 */
function detectEmailSkip(message: string) {
  const normalized = message.trim().toLowerCase();

  return (
    normalized === "skip" ||
    normalized === "no" ||
    normalized === "no thanks" ||
    normalized === "not now" ||
    normalized === "i don't have one" ||
    normalized === "i dont have one"
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

async function getMessagesForSession(sessionId: string): Promise<ChatMessage[]> {
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

  return (data ?? []).map((row: any) => ({
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
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

async function updateLeadFields(
  leadId: string,
  updates: Partial<{
    address: string;
    appointment: string;
  }>
) {
  const supabase = await createClient();

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.address !== "undefined") {
    payload.address = updates.address;
  }

  if (typeof updates.appointment !== "undefined") {
    payload.appointment = updates.appointment;
  }

  const { error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", leadId);

  if (error) {
    console.error("Error updating lead scheduling fields:", error.message);
    throw error;
  }
}

async function logLeadFieldActivity(input: {
  leadId: string;
  tenantSlug: string;
  fieldName: "address" | "appointment";
  previousValue?: string | null;
  newValue: string;
}) {
  try {
    await createLeadActivity({
      leadId: input.leadId,
      tenantSlug: input.tenantSlug,
      eventType:
        input.fieldName === "address"
          ? "lead.address_updated"
          : "lead.appointment_updated",
      eventSource: "customer",
      metadata: {
        fieldName: input.fieldName,
        previousValue: input.previousValue ?? null,
        newValue: input.newValue,
      },
    });
  } catch (error) {
    console.error("Non-fatal scheduling activity logging error:", error);
  }
}

function toTitleCase(value?: string | null) {
  if (!value) return "";

  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bCa\b/g, "CA")
    .replace(/\bUsa\b/g, "USA");
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

function buildChatAppointmentTitle(input: {
  projectType?: string;
  customerName?: string;
  appointmentType: AppointmentType;
  interactionType?: InteractionType;
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

function buildChatAppointmentDescription(input: {
  lead?: any | null;
  appointmentType: AppointmentType;
  interactionType?: InteractionType;
  address?: string | null;
}) {
  const lead = input.lead;

  return [
    "Scheduled from: Chat",
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

/**
 * Parse numeric option replies.
 *
 * Examples:
 * - "1"
 * - "option 2"
 * - "the third one"
 *
 * This supports more than 1/2/3 because we now show up to 7 days
 * and up to 8 time options.
 */
function parseSelectedOption(message: string, maxOption: number): number | null {
  const normalized = message.trim().toLowerCase();

  const directNumber = normalized.match(/\b(\d{1,2})\b/);
  if (directNumber?.[1]) {
    const value = Number(directNumber[1]);
    return value >= 1 && value <= maxOption ? value : null;
  }

  const wordMap: Record<string, number> = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    sixth: 6,
    seventh: 7,
    eighth: 8,
  };

  for (const [word, value] of Object.entries(wordMap)) {
    if (normalized.includes(word) && value <= maxOption) {
      return value;
    }
  }

  return null;
}

/**
 * Parse a customer day selection using either:
 * - option number: "6", "option 6"
 * - weekday: "Monday", "Friday"
 * - date language: "May 11", "Monday the 11th"
 *
 * Why:
 * Customers will not always reply with just the number.
 * This keeps the scheduling flow natural while still only allowing
 * selection from system-approved available days.
 */
function parseSelectedDayOption(
  message: string,
  availableDays: OfferedDay[]
): number | null {
  const normalized = message
    .trim()
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\bthe\b/g, "")
    .replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  /**
   * 0. Match exact ISO date keys from the calendar UI.
   *
   * The frontend picker sends dateKey values like "2026-06-12".
   * This is safer than parsing labels like "Friday, June 12".
   */
  for (const day of availableDays) {
    if (normalized === day.dateKey.toLowerCase()) {
      return day.optionNumber;
    }
  }

  /**
   * 1. Match actual date language first.
   *
   * Example:
   * - Customer says: "May 6"
   * - Available option label: "Wednesday, May 6"
   *
   * This must happen before numeric option parsing so "May 6"
   * does not get mistaken for option 6.
   */
  for (const day of availableDays) {
    const label = day.displayLabel.toLowerCase().replace(/,/g, "");
    const monthDayMatch = label.match(/[a-z]+ \d{1,2}/i);
    const monthDay = monthDayMatch?.[0]?.toLowerCase() || "";

    if (monthDay && normalized.includes(monthDay)) {
      return day.optionNumber;
    }
  }

  /**
   * 2. Match weekday + day number combinations.
   *
   * Examples:
   * - "Wednesday 6"
   * - "Wednesday the 6th"
   */
  for (const day of availableDays) {
    const label = day.displayLabel.toLowerCase().replace(/,/g, "");
    const weekday = label.split(" ")[0] || "";
    const dayNumber = day.displayLabel.match(/\d{1,2}$/)?.[0];

    if (
      weekday &&
      dayNumber &&
      normalized.includes(weekday) &&
      normalized.includes(dayNumber)
    ) {
      return day.optionNumber;
    }
  }

  /**
   * 3. Match plain weekday names.
   *
   * This is safe because we only show a short list of available days.
   */
  for (const day of availableDays) {
    const label = day.displayLabel.toLowerCase();
    const weekday = label.split(",")[0]?.toLowerCase() || "";

    if (weekday && normalized.includes(weekday)) {
      return day.optionNumber;
    }
  }

  /**
   * 4. Last resort: treat bare numbers as option numbers.
   *
   * Examples:
   * - "1"
   * - "option 2"
   * - "the third one"
   */
  return parseSelectedOption(message, availableDays.length);
}

function parseSelectedTimeOption(
  message: string,
  offeredSlots: OfferedSlot[]
): number | null {
  const numericOption = parseSelectedOption(message, offeredSlots.length);
  if (numericOption) return numericOption;

  const normalized = message.toLowerCase();

  for (const slot of offeredSlots) {
    const time = slot.displayTime.toLowerCase();

    const simple = time
      .replace(":00", "")
      .replace(" ", "")
      .replace("am", "am")
      .replace("pm", "pm");

    if (
      normalized.includes(time) ||
      normalized.includes(simple) ||
      normalized.includes(time.replace(":00", ""))
    ) {
      return slot.optionNumber;
    }
  }

  return null;
}

function detectAppointmentType(message: string): AppointmentType | null {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("call") ||
    normalized.includes("phone") ||
    normalized.includes("virtual")
  ) {
    return "call";
  }

  if (
    normalized.includes("come look") ||
    normalized.includes("come over") ||
    normalized.includes("come by") ||
    normalized.includes("come out") ||
    normalized.includes("come take a look") ||
    normalized.includes("take a look") ||
    normalized.includes("look at") ||
    normalized.includes("look at my space") ||
    normalized.includes("look at the space") ||
    normalized.includes("look at our space") ||
    normalized.includes("see the space") ||
    normalized.includes("see my space") ||
    normalized.includes("see our space") ||
    normalized.includes("see the area") ||
    normalized.includes("come to my house") ||
    normalized.includes("come to my home") ||
    normalized.includes("my house") ||
    normalized.includes("my home") ||
    normalized.includes("at my house") ||
    normalized.includes("at my home") ||
    normalized.includes("see the home") ||
    normalized.includes("see the house") ||
    normalized.includes("see it") ||
    normalized.includes("look it over") ||
    normalized.includes("walk through") ||
    normalized.includes("walkthrough") ||
    normalized.includes("walk the property") ||
    normalized.includes("site") ||
    normalized.includes("visit") ||
    normalized.includes("site visit") ||
    normalized.includes("in person") ||
    normalized.includes("onsite") ||
    normalized.includes("on-site") ||
    normalized.includes("on site")
  ) {
    return "site_visit";
  }

  return null;
}

function mapAppointmentTypeToInteractionType(
  appointmentType: AppointmentType
): InteractionType {
  return appointmentType === "site_visit" ? "site_visit" : "phone_call";
}

function detectRejectionOrDifferentOption(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("none") ||
    normalized.includes("not work") ||
    normalized.includes("doesn't work") ||
    normalized.includes("dont work") ||
    normalized.includes("don't work") ||
    normalized.includes("another day") ||
    normalized.includes("different day") ||
    normalized.includes("different time") ||
    normalized.includes("other times") ||
    normalized.includes("other days")
  );
}

function detectCancelReschedulePolicyQuestion(message: string) {
  const normalized = message.trim().toLowerCase();

  const mentionsCancelOrReschedule =
    normalized.includes("cancel") ||
    normalized.includes("reschedule") ||
    normalized.includes("move") ||
    normalized.includes("change");

  const soundsHypothetical =
    normalized.includes("what happens if") ||
    normalized.includes("what if") ||
    normalized.includes("if i need to") ||
    normalized.includes("if we need to");

  return mentionsCancelOrReschedule && soundsHypothetical;
}

function detectConversationClose(message: string) {
  const normalized = message.trim().toLowerCase();

  return (
    normalized === "thanks" ||
    normalized === "thank you" ||
    normalized === "thx" ||
    normalized === "sounds good" ||
    normalized === "ok thanks" ||
    normalized === "okay thanks" ||
    normalized === "bye" ||
    normalized === "goodbye"
  );
}

function isCalendarAuthError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return (
    message.includes("expired or revoked") ||
    message.includes("invalid_grant") ||
    message.includes("unauthorized") ||
    message.includes("401")
  );
}

function mapAvailabilityDays(days: BookableAppointmentDay[]): OfferedDay[] {
  return days.slice(0, MAX_DAY_OPTIONS).map((day, dayIndex) => ({
    dateKey: day.dateKey,
    displayLabel: day.displayLabel,
    optionNumber: dayIndex + 1,
    slots: day.slots.slice(0, MAX_TIME_OPTIONS_PER_DAY).map((slot, slotIndex) => ({
      ...slot,
      optionNumber: slotIndex + 1,
    })),
  }));
}

async function getOfferedDaysForTenant(input: {
  tenantSlug: string;
  fromIso?: string;
}) {
  const availability = await getBookableAppointmentSlots({
    tenantSlug: input.tenantSlug,
    timezone: DEFAULT_TIMEZONE,
    fromIso: input.fromIso,
    slotMinutes: 60,
    lookaheadDays: 35,
    maxDaysToReturn: MAX_DAY_OPTIONS,
  });

  return mapAvailabilityDays(availability.days);
}

async function markCalendarInvalidIfNeeded(input: {
  tenantSlug: string;
  error: unknown;
}) {
  if (!isCalendarAuthError(input.error)) {
    return;
  }

  const connection = await getPrimaryCalendarConnectionByTenantSlug(
    input.tenantSlug
  );

  if (!connection) {
    return;
  }

  await markCalendarConnectionInvalid({
    connectionId: connection.id,
    reason:
      input.error instanceof Error
        ? input.error.message
        : "Google calendar authorization failed.",
  });
}

async function fallbackAndCloseScheduling(input: {
  session: ChatSession;
  sessionId: string;
  appointmentPreference: string;
  calendarStatus?: "invalid" | "missing";
}) {
  input.session.intakeData = {
    ...input.session.intakeData,
    schedulingState: {
      ...(input.session.intakeData?.schedulingState || {}),
      active: false,
      step: "fallback_followup",
      appointmentPreference: input.appointmentPreference,
      calendarStatus: input.calendarStatus,
    },
  };

  if (input.session.leadId) {
    const existingLead = await getLeadById(input.session.leadId);
    const existingUpdates = existingLead?.customerUpdates?.trim() || "";
  
    const newUpdate = `[Customer Update - ${new Date().toISOString()}]
  ${input.appointmentPreference}`;
  
    await updateLead(input.session.leadId, {
      customerUpdates: existingUpdates
        ? `${existingUpdates}\n\n${newUpdate}`
        : newUpdate,
    });
  
    await createLeadActivity({
      leadId: input.session.leadId,
      tenantSlug: input.session.tenantSlug,
      eventType: "lead.customer_update_added",
      eventSource: "customer",
      metadata: {
        message: input.appointmentPreference,
        calendarStatus: input.calendarStatus ?? null,
      },
    });
  }

  await updateSession(input.session);

  const assistantMessage = createMessageObject(
    input.sessionId,
    "assistant",
    generateSchedulingResponse({
      type: "fallback_followup",
    })
  );

  await insertMessage(assistantMessage);

  return {
    handled: true,
    response: {
      sessionId: input.sessionId,
      messages: await getMessagesForSession(input.sessionId),
      session: input.session,
    },
  };
}

async function bookSelectedAppointment(input: {
  session: ChatSession;
  sessionId: string;
  schedulingState: SchedulingState;
  selectedSlot: OfferedSlot;
  emailForAppointment?: string | null;
}): Promise<RunSchedulingWorkflowResult> {
  const { session, sessionId, schedulingState, selectedSlot } = input;

  const appointmentType =
    schedulingState.appointmentType === "site_visit" ? "site_visit" : "call";

  const lead = await getLeadById(session.leadId!);

  const connection = await getPrimaryCalendarConnectionByTenantSlug(
    session.tenantSlug
  );

  if (!connection) {
    return fallbackAndCloseScheduling({
      session,
      sessionId,
      appointmentPreference:
        "Customer selected an appointment time, but no calendar connection was available.",
      calendarStatus: "missing",
    });
  }

  const title = buildChatAppointmentTitle({
    projectType: lead?.projectType,
    customerName: lead?.customerName,
    appointmentType,
    interactionType: mapAppointmentTypeToInteractionType(appointmentType),
  });

  const description = buildChatAppointmentDescription({
    lead,
    appointmentType,
    interactionType: mapAppointmentTypeToInteractionType(appointmentType),
    address: schedulingState.address || null,
  });

  const location =
    appointmentType === "site_visit" ? schedulingState.address || null : null;

  const attendeeEmail =
    input.emailForAppointment ?? schedulingState.email ?? lead?.email ?? null;

  try {
    const event = await createGoogleCalendarEvent({
      connection,
      calendarId: connection.calendarId,
      title,
      description,
      location,
      startAt: selectedSlot.startAt,
      endAt: selectedSlot.endAt,
      timezone: selectedSlot.timezone,
      attendeeEmail,
    });

    const appointment = await createAppointment({
      tenantSlug: session.tenantSlug,
      leadId: session.leadId!,
      appointmentType,
      address:
        appointmentType === "site_visit" ? schedulingState.address ?? null : null,
      title,
      description,
      notes: "Appointment scheduled from customer chat.",
      timezone: event.timezone,
      sourceChannel: "chat",
      createdBy: "ai",
    });

    await confirmAppointment({
      appointmentId: appointment.id,
      confirmedStartAt: event.startAt,
      confirmedEndAt: event.endAt,
      timezone: event.timezone,
      googleCalendarConnectionId: connection.id,
      googleCalendarId: event.calendarId,
      googleEventId: event.eventId,
    });

    const appointmentLabel = `${
      schedulingState.selectedDay?.displayLabel || "Selected day"
    } at ${selectedSlot.displayTime}`;

    await updateLead(session.leadId!, {
      status: "booked",
      appointment: appointmentLabel,
      email: attendeeEmail ?? lead?.email ?? undefined,
    });

    await logLeadFieldActivity({
      leadId: session.leadId!,
      tenantSlug: session.tenantSlug,
      fieldName: "appointment",
      previousValue: null,
      newValue: appointmentLabel,
    });

    session.intakeData = {
      ...session.intakeData,
      schedulingState: {
        ...schedulingState,
        active: false,
        step: "confirm",
        selectedSlot,
        email: attendeeEmail ?? undefined,
      },
    };

    await updateSession(session);

    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      generateSchedulingResponse({
        type: "confirmed",
        dayLabel: schedulingState.selectedDay?.displayLabel || "that day",
        timeLabel: selectedSlot.displayTime,
      })
    );

    await insertMessage(assistantMessage);

    return {
      handled: true,
      response: {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      },
    };
  } catch (error) {
    console.error("Chat appointment booking failed:", error);

    await markCalendarInvalidIfNeeded({
      tenantSlug: session.tenantSlug,
      error,
    });

    return fallbackAndCloseScheduling({
      session,
      sessionId,
      appointmentPreference: `${
        schedulingState.selectedDay?.displayLabel || "Selected day"
      } at ${selectedSlot.displayTime}`,
      calendarStatus: isCalendarAuthError(error) ? "invalid" : undefined,
    });
  }
}

export async function runSchedulingWorkflow({
  session,
  sessionId,
  trimmedContent,
  schedulingIntent,
}: RunSchedulingWorkflowInput): Promise<RunSchedulingWorkflowResult> {
  const schedulingState = session.intakeData?.schedulingState as
    | SchedulingState
    | undefined;
  
  const tenant = await getTenantBySlug(session.tenantSlug);
  const tenantConfig = tenant ? getTenantConfig(tenant) : null;
  const bookingFlow = tenant ? getBookingFlowConfig(tenant) : null;

  /**
   * HARD STOP: actual cancel request.
   *
   * This must run before any active scheduling step like address collection.
   * Otherwise the bot can get stuck asking for an address even after the
   * customer clearly says they want to cancel.
   */
  if (
    session.currentStep === "complete" &&
    session.leadCaptured &&
    session.leadId &&
    schedulingIntent.type === "cancel"
  ) {
    session.intakeData = {
      ...session.intakeData,
      schedulingState: {
        ...(schedulingState || {}),
        active: false,
        step: "fallback_followup",
        appointmentPreference:
          schedulingIntent.type === "cancel"
            ? "Customer requested appointment cancellation."
            : "Customer chose not to continue.",
      },
    };

    await updateSession(session);

    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      schedulingIntent.type === "cancel"
        ? "I understand. I’ll make a note that you want to cancel the appointment."
        : "I understand. I’ll make a note that you don’t want to move forward right now."
    );

    await insertMessage(assistantMessage);

    return {
      handled: true,
      response: {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      },
    };
  }  

  function detectPreVisitCallRequest(message: string) {
    const normalized = message.toLowerCase();
  
    return (
      normalized.includes("call before") ||
      normalized.includes("call me before") ||
      normalized.includes("call first") ||
      normalized.includes("before they come") ||
      normalized.includes("before someone comes") ||
      normalized.includes("before you come") ||
      normalized.includes("before showing up") ||
      normalized.includes("before they show up")
    );
  }
  
  if (
    !schedulingState?.active &&
    session.currentStep === "complete" &&
    session.leadCaptured &&
    session.leadId &&
    detectPreVisitCallRequest(trimmedContent)
  ) {
    const existingLead = await getLeadById(session.leadId);
    const existingUpdates = existingLead?.customerUpdates?.trim() || "";
  
    const newUpdate = `[Customer Update - ${new Date().toISOString()}]
    Customer asked for a call before the appointment/visit.`;
  
    await updateLead(session.leadId, {
      customerUpdates: existingUpdates
        ? `${existingUpdates}\n\n${newUpdate}`
        : newUpdate,
    });
  
    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      "Absolutely — I’ll add a note asking someone to call before they come over."
    );
  
    await insertMessage(assistantMessage);
  
    return {
      handled: true,
      response: {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      },
    };
  }
  
  /**
   * HARD STOP: do not start a second appointment if one already exists.
   */
  if (
    !schedulingState?.active &&
    session.currentStep === "complete" &&
    session.leadCaptured &&
    session.leadId &&
    schedulingIntent.type === "schedule"
  ) {
    const existingLead = await getLeadById(session.leadId);
  
    const existingAppointment = existingLead?.appointment?.trim();

  if (
    existingAppointment &&
    existingAppointment.toLowerCase() !== "not provided" &&
    existingAppointment.toLowerCase() !== "unknown"
  ) {
      const normalized = trimmedContent.toLowerCase();
    
      const isAskingForReminder =
        normalized.includes("when") ||
        normalized.includes("what time") ||
        normalized.includes("remind") ||
        normalized.includes("appointment again") ||
        normalized.includes("scheduled appointment") ||
        normalized.includes("what is our appointment");
    
      const wantsToChangeAppointment =
        normalized.includes("reschedule") ||
        normalized.includes("change") ||
        normalized.includes("move") ||
        normalized.includes("different time") ||
        normalized.includes("different day");
    
      const reply = isAskingForReminder && !wantsToChangeAppointment
        ? `You’re scheduled for ${existingAppointment}.`
        : `You’re already scheduled for ${existingAppointment}. Did you want to reschedule that appointment?`;
    
      const assistantMessage = createMessageObject(
        sessionId,
        "assistant",
        reply
      );
  
      await insertMessage(assistantMessage);
  
      return {
        handled: true,
        response: {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        },
      };
    }
  }

  /**
   * If the user is not asking to schedule and is not already inside
   * an active scheduling flow, let normal chat/intake handle the message.
   */
  if (!schedulingState?.active && !schedulingIntent.hasSchedulingIntent) {
    return { handled: false };
  }

  /**
 * START SCHEDULING
 *
 * Important:
 * If the customer already says "on-site visit" or "phone call" in the same
 * message that starts scheduling, do not ask them to repeat it.
 *
 * Example:
 * - Customer: "How about an on site visit. Do you have anytime next week?"
 * - Correct next response: ask for address
 * - Incorrect next response: ask call vs on-site again
 */
  if (
    schedulingIntent.hasSchedulingIntent &&
    session.leadCaptured &&
    session.leadId &&
    !schedulingState?.active
  ) {
    const detectedInteractionType =
      tenantConfig
        ? detectInteractionType(trimmedContent, tenantConfig)
        : null;

    const requestedAppointmentType =
      schedulingIntent.appointmentType ??
      (detectedInteractionType === "site_visit"
        ? "site_visit"
        : detectedInteractionType === "phone_call"
        ? "call"
        : detectAppointmentType(trimmedContent));

    const effectiveRequestedAppointmentType =
      bookingFlow?.defaultAppointmentType ?? requestedAppointmentType;

  /**
   * If the customer already requested an on-site visit, move directly to
   * address collection.
   */
  if (effectiveRequestedAppointmentType === "site_visit") {
    session.intakeData = {
      ...session.intakeData,
      schedulingState: {
        active: true,
        step: "collect_details",
        appointmentType: "site_visit",
        interactionType: "site_visit",
        address: undefined,
        selectedSlot: undefined,
        offeredSlots: undefined,
        availableDays: undefined,
        selectedDay: undefined,
        preferenceText: trimmedContent,
        dayRetryCount: 0,
        timeRetryCount: 0,
      },
    };

    await updateSession(session);

    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      generateSchedulingResponse({ type: "ask_address" })
    );

    await insertMessage(assistantMessage);

    return {
      handled: true,
      response: {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      },
    };
  }

  /**
   * If the customer already requested a phone call, no address is needed.
   * Load available days immediately.
   */
  if (effectiveRequestedAppointmentType === "call") {
    try {
      const availableDays = await getOfferedDaysForTenant({
        tenantSlug: session.tenantSlug,
      });

      if (availableDays.length === 0) {
        return fallbackAndCloseScheduling({
          session,
          sessionId,
          appointmentPreference: "Customer requested a phone call.",
        });
      }

      session.intakeData = {
        ...session.intakeData,
        schedulingState: {
          active: true,
          step: "select_day",
          appointmentType: "call",
          interactionType: "phone_call",
          address: undefined,
          selectedSlot: undefined,
          offeredSlots: undefined,
          availableDays,
          selectedDay: undefined,
          preferenceText: trimmedContent,
          dayRetryCount: 0,
          timeRetryCount: 0,
        },
      };

      await updateSession(session);

      const assistantMessage = createMessageObject(
        sessionId,
        "assistant",
        generateSchedulingResponse({
          type: "offer_days",
          days: availableDays,
        })
      );

      await insertMessage(assistantMessage);

      return {
        handled: true,
        response: {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        },
      };
    } catch (error) {
      console.error("Availability fetch failed:", error);

      await markCalendarInvalidIfNeeded({
        tenantSlug: session.tenantSlug,
        error,
      });

      return fallbackAndCloseScheduling({
        session,
        sessionId,
        appointmentPreference: "Customer requested a phone call.",
        calendarStatus: isCalendarAuthError(error) ? "invalid" : undefined,
      });
    }
  }

  /**
   * If the customer asked to schedule but did not clearly choose call/site visit,
   * ask one clarifying question.
   */
  session.intakeData = {
    ...session.intakeData,
    schedulingState: {
      active: true,
      step: "collect_details",
      appointmentType: undefined,
      interactionType: undefined,
      address: undefined,
      selectedSlot: undefined,
      offeredSlots: undefined,
      availableDays: undefined,
      selectedDay: undefined,
      preferenceText: trimmedContent,
      dayRetryCount: 0,
      timeRetryCount: 0,
    },
  };

  await updateSession(session);

  const assistantMessage = createMessageObject(
    sessionId,
    "assistant",
    generateSchedulingResponse({ type: "ask_appointment_type" })
  );

  await insertMessage(assistantMessage);

  return {
    handled: true,
    response: {
      sessionId,
      messages: await getMessagesForSession(sessionId),
      session,
    },
  };
}

  if (!schedulingState?.active || !session.leadId) {
    return { handled: false };
  }

  /**
   * Let friendly closing messages pass through the scheduling layer
   * without accidentally booking or restarting the flow.
   */
  if (detectConversationClose(trimmedContent)) {
    session.intakeData = {
      ...session.intakeData,
      schedulingState: {
        ...schedulingState,
        active: false,
        step: "fallback_followup",
      },
    };

    await updateSession(session);

    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      "Sounds good — we’ll follow up if anything else is needed."
    );

    await insertMessage(assistantMessage);

    return {
      handled: true,
      response: {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      },
    };
  }

  /**
   * COLLECT APPOINTMENT TYPE
   */
  if (schedulingState.step === "collect_details" && !schedulingState.appointmentType) {
    const appointmentType = detectAppointmentType(trimmedContent);

    if (!appointmentType) {
      const assistantMessage = createMessageObject(
        sessionId,
        "assistant",
        generateSchedulingResponse({ type: "ask_appointment_type" })
      );

      await insertMessage(assistantMessage);

      return {
        handled: true,
        response: {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        },
      };
    }

    if (appointmentType === "site_visit") {
      session.intakeData = {
        ...session.intakeData,
        schedulingState: {
          ...schedulingState,
          appointmentType,
          interactionType: mapAppointmentTypeToInteractionType(appointmentType),
          step: "collect_details",
        },
      };

      await updateSession(session);

      const assistantMessage = createMessageObject(
        sessionId,
        "assistant",
        "Great, what’s the full project address, including city and ZIP code?"
      );

      await insertMessage(assistantMessage);

      return {
        handled: true,
        response: {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        },
      };
    }

    /**
     * Phone call path:
     * No address needed, so load clean bookable days immediately.
     */
    try {
      const availableDays = await getOfferedDaysForTenant({
        tenantSlug: session.tenantSlug,
      });

      if (availableDays.length === 0) {
        return fallbackAndCloseScheduling({
          session,
          sessionId,
          appointmentPreference: "Customer requested a phone call.",
        });
      }

      session.intakeData = {
        ...session.intakeData,
        schedulingState: {
          ...schedulingState,
          appointmentType,
          interactionType: mapAppointmentTypeToInteractionType(appointmentType),
          step: "select_day",
          availableDays,
          selectedDay: undefined,
          offeredSlots: undefined,
          dayRetryCount: 0,
          timeRetryCount: 0,
        },
      };

      await updateSession(session);

      const assistantMessage = createMessageObject(
        sessionId,
        "assistant",
        generateSchedulingResponse({
          type: "offer_days",
          days: availableDays,
        })
      );

      await insertMessage(assistantMessage);

      return {
        handled: true,
        response: {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        },
      };
    } catch (error) {
      console.error("Availability fetch failed:", error);
      await markCalendarInvalidIfNeeded({
        tenantSlug: session.tenantSlug,
        error,
      });

      return fallbackAndCloseScheduling({
        session,
        sessionId,
        appointmentPreference: "Customer requested a phone call.",
        calendarStatus: isCalendarAuthError(error) ? "invalid" : undefined,
      });
    }
  }

  /**
   * COLLECT SITE VISIT ADDRESS
   */
  if (
    schedulingState.step === "collect_details" &&
    schedulingState.appointmentType === "site_visit" &&
    !schedulingState.address
  ) {
    if (looksLikeIncompleteAddress(trimmedContent)) {
      const assistantMessage = createMessageObject(
        sessionId,
        "assistant",
        "Can you send the full project address, including city and ZIP code? That helps us schedule the visit accurately."
      );

      await insertMessage(assistantMessage);

      return {
        handled: true,
        response: {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        },
      };
    }

    const formattedAddress = formatAddressForDisplay(trimmedContent);

    try {
      const availableDays = await getOfferedDaysForTenant({
        tenantSlug: session.tenantSlug,
      });

      await updateLeadFields(session.leadId, {
        address: formattedAddress,
      });

      await logLeadFieldActivity({
        leadId: session.leadId,
        tenantSlug: session.tenantSlug,
        fieldName: "address",
        previousValue: null,
        newValue: formattedAddress,
      });

      if (availableDays.length === 0) {
        return fallbackAndCloseScheduling({
          session,
          sessionId,
          appointmentPreference: `Customer requested an on-site visit at ${formattedAddress}.`,
        });
      }

      session.intakeData = {
        ...session.intakeData,
        schedulingState: {
          ...schedulingState,
          address: formattedAddress,
          interactionType: "site_visit",
          step: "select_day",
          availableDays,
          selectedDay: undefined,
          offeredSlots: undefined,
          dayRetryCount: 0,
          timeRetryCount: 0,
        },
      };

      await updateSession(session);

      const assistantMessage = createMessageObject(
        sessionId,
        "assistant",
        generateSchedulingResponse({
          type: "offer_days",
          days: availableDays,
        })
      );

      await insertMessage(assistantMessage);

      return {
        handled: true,
        response: {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        },
      };
    } catch (error) {
      console.error("Availability fetch failed:", error);
      await markCalendarInvalidIfNeeded({
        tenantSlug: session.tenantSlug,
        error,
      });

      return fallbackAndCloseScheduling({
        session,
        sessionId,
        appointmentPreference: `Customer requested an on-site visit at ${formattedAddress}.`,
        calendarStatus: isCalendarAuthError(error) ? "invalid" : undefined,
      });
    }
  }

  /**
   * SELECT DAY
   */
  if (schedulingState.step === "select_day") {
    const availableDays = Array.isArray(schedulingState.availableDays)
      ? schedulingState.availableDays
      : [];

      const selectedOption = parseSelectedDayOption(
        trimmedContent,
        availableDays
      );

    const selectedDay = availableDays.find(
      (day) => day.optionNumber === selectedOption
    );

    if (!selectedDay) {
      const retryCount = (schedulingState.dayRetryCount ?? 0) + 1;
    
      if (detectRejectionOrDifferentOption(trimmedContent)) {
        const lastAvailableDay = availableDays[availableDays.length - 1];
    
        if (lastAvailableDay?.dateKey) {
          const nextStart = new Date(`${lastAvailableDay.dateKey}T12:00:00`);
          nextStart.setDate(nextStart.getDate() + 1);
    
          try {
            const moreAvailableDays = await getOfferedDaysForTenant({
              tenantSlug: session.tenantSlug,
              fromIso: nextStart.toISOString(),
            });
    
            if (moreAvailableDays.length > 0) {
              session.intakeData = {
                ...session.intakeData,
                schedulingState: {
                  ...schedulingState,
                  step: "select_day",
                  availableDays: moreAvailableDays,
                  selectedDay: undefined,
                  offeredSlots: undefined,
                  dayRetryCount: 0,
                  timeRetryCount: 0,
                },
              };
    
              await updateSession(session);
    
              const assistantMessage = createMessageObject(
                sessionId,
                "assistant",
                "No problem — I found some additional available days. Tap one below, or reply with a day that works best."
              );
    
              await insertMessage(assistantMessage);
    
              return {
                handled: true,
                response: {
                  sessionId,
                  messages: await getMessagesForSession(sessionId),
                  session,
                },
              };
            }
          } catch (error) {
            console.error("Availability fetch for additional days failed:", error);
          }
        }
    
        return fallbackAndCloseScheduling({
          session,
          sessionId,
          appointmentPreference:
            trimmedContent || "Customer asked for other available days.",
        });
      }
    
      if (retryCount >= MAX_RETRY_COUNT) {
        return fallbackAndCloseScheduling({
          session,
          sessionId,
          appointmentPreference:
            trimmedContent || "Customer did not choose one of the available days.",
        });
      }
    
      session.intakeData = {
        ...session.intakeData,
        schedulingState: {
          ...schedulingState,
          dayRetryCount: retryCount,
        },
      };
    
      await updateSession(session);
    
      const assistantMessage = createMessageObject(
        sessionId,
        "assistant",
        generateSchedulingResponse({
          type: "ask_valid_day",
          days: availableDays,
        })
      );
    
      await insertMessage(assistantMessage);
    
      return {
        handled: true,
        response: {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        },
      };
    } 

    session.intakeData = {
      ...session.intakeData,
      schedulingState: {
        ...schedulingState,
        step: "select_slot",
        selectedDay,
        offeredSlots: selectedDay.slots,
        timeRetryCount: 0,
      },
    };

    await updateSession(session);

    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      generateSchedulingResponse({
        type: "offer_times",
        dayLabel: selectedDay.displayLabel,
        slots: selectedDay.slots,
      })
    );

    await insertMessage(assistantMessage);

    return {
      handled: true,
      response: {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      },
    };
  }

  /**
 * OPTIONAL EMAIL COLLECTION BEFORE BOOKING
 *
 * Why:
 * - email is not required to create a lead
 * - but once an appointment is being booked, email becomes useful
 * - if provided, we save it to the lead and send it to Google Calendar
 * - if skipped, booking still continues
 */
if (schedulingState.step === "collect_email") {
  const selectedSlot = schedulingState.selectedSlot;

  if (!selectedSlot) {
    return fallbackAndCloseScheduling({
      session,
      sessionId,
      appointmentPreference:
        "Customer was collecting appointment details, but no selected slot was found.",
    });
  }

  let emailForAppointment = schedulingState.email ?? null;

  if (detectCancelReschedulePolicyQuestion(trimmedContent)) {
    const assistantMessage = createMessageObject(
      sessionId,
      "assistant",
      "No problem — if you need to cancel or reschedule later, just let us know as soon as possible and we’ll help adjust the appointment. What’s the best email for the appointment details? You can also say “skip.”"
    );
  
    await insertMessage(assistantMessage);
  
    return {
      handled: true,
      response: {
        sessionId,
        messages: await getMessagesForSession(sessionId),
        session,
      },
    };
  }

  if (!detectEmailSkip(trimmedContent)) {
    const normalizedEmail = normalizeEmail(trimmedContent);

    if (!normalizedEmail) {
      const assistantMessage = createMessageObject(
        sessionId,
        "assistant",
        "That email doesn’t look complete. Please send the best email for the appointment details, or say “skip.”"
      );

      await insertMessage(assistantMessage);

      return {
        handled: true,
        response: {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        },
      };
    }

    emailForAppointment = normalizedEmail;

    await updateLead(session.leadId, {
      email: normalizedEmail,
    });

    try {
      await createLeadActivity({
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
    } catch (error) {
      console.error("Non-fatal email activity logging error:", error);
    }
  }

  session.intakeData = {
    ...session.intakeData,
    schedulingState: {
      ...schedulingState,
      email: emailForAppointment ?? undefined,
    },
  };

  return bookSelectedAppointment({
    session,
    sessionId,
    schedulingState: {
      ...schedulingState,
      email: emailForAppointment ?? undefined,
    },
    selectedSlot,
    emailForAppointment,
  });
}

  /**
   * SELECT TIME + BOOK APPOINTMENT
   */
  if (schedulingState.step === "select_slot") {
    const offeredSlots = Array.isArray(schedulingState.offeredSlots)
      ? schedulingState.offeredSlots
      : [];

      const selectedOption = parseSelectedTimeOption(
        trimmedContent,
        offeredSlots
      );

    const selectedSlot = offeredSlots.find(
      (slot) => slot.optionNumber === selectedOption
    );

    /**
     * If none of the times work, re-offer the day list once.
     * If the customer rejects again, fall back to human follow-up.
     */
    if (!selectedSlot) {
      const retryCount = (schedulingState.timeRetryCount ?? 0) + 1;

      if (detectRejectionOrDifferentOption(trimmedContent) && retryCount < MAX_RETRY_COUNT) {
        const availableDays = Array.isArray(schedulingState.availableDays)
          ? schedulingState.availableDays
          : [];

        session.intakeData = {
          ...session.intakeData,
          schedulingState: {
            ...schedulingState,
            step: "select_day",
            selectedDay: undefined,
            offeredSlots: undefined,
            timeRetryCount: retryCount,
          },
        };

        await updateSession(session);

        const assistantMessage = createMessageObject(
          sessionId,
          "assistant",
          generateSchedulingResponse({
            type: "reoffer_days",
            days: availableDays,
          })
        );

        await insertMessage(assistantMessage);

        return {
          handled: true,
          response: {
            sessionId,
            messages: await getMessagesForSession(sessionId),
            session,
          },
        };
      }

      if (retryCount >= MAX_RETRY_COUNT || detectRejectionOrDifferentOption(trimmedContent)) {
        return fallbackAndCloseScheduling({
          session,
          sessionId,
          appointmentPreference:
            trimmedContent || "Customer did not choose one of the available times.",
        });
      }

      const assistantMessage = createMessageObject(
        sessionId,
        "assistant",
        `Please reply with one of the time option numbers:\n\n${offeredSlots
          .map((slot) => `${slot.optionNumber}. ${slot.displayTime}`)
          .join("\n")}`
      );

      await insertMessage(assistantMessage);

      return {
        handled: true,
        response: {
          sessionId,
          messages: await getMessagesForSession(sessionId),
          session,
        },
      };
    }

    const existingLead = await getLeadById(session.leadId!);

      /**
       * If the lead does not have an email yet, ask once before booking.
       * This lets Google Calendar send invite/reminder emails when possible.
       */
      if (!existingLead?.email && !schedulingState.email) {
        session.intakeData = {
          ...session.intakeData,
          schedulingState: {
            ...schedulingState,
            step: "collect_email",
            selectedSlot,
          },
        };

        await updateSession(session);

        const assistantMessage = createMessageObject(
          sessionId,
          "assistant",
          `Ok, I can book ${schedulingState.selectedDay?.displayLabel || "that day"} at ${selectedSlot.displayTime}. What’s the best email for the appointment details? You can also say “skip.”`
        );

        await insertMessage(assistantMessage);

        return {
          handled: true,
          response: {
            sessionId,
            messages: await getMessagesForSession(sessionId),
            session,
          },
        };
      }

    return bookSelectedAppointment({
      session,
      sessionId,
      schedulingState,
      selectedSlot,
      emailForAppointment: existingLead?.email ?? schedulingState.email ?? null,
    });
  }

  return { handled: false };
}