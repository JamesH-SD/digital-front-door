import type { BookingFlowConfig } from "@/lib/config/getBookingFlowConfig";
import type { Lead } from "@/lib/types/lead";
import type { Tenant } from "@/lib/types/tenant";

export type LeadCopilotAppointmentFacts = {
  hasCalendarAppointment: boolean;
  appointmentStart: string | null;
  appointmentType: string | null;
  appointmentStatus: string | null;
};

export type LeadCopilotPromptContext = {
  requiresAppointment: boolean;
  leadFactsText: string;
  customerUpdatesText: string;
  bookingFlowRulesText: string;
  appointmentFactsText: string;
  combinedContextText: string;
};

function displayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Not provided";
}

export function buildLeadCopilotAppointmentFacts(input: {
  lead: Lead;
  calendarAppointment: {
    confirmedStartAt?: string | null;
    proposedStartAt?: string | null;
    appointmentType?: string | null;
    status?: string | null;
  } | null;
}): LeadCopilotAppointmentFacts {
  const { lead, calendarAppointment } = input;

  if (!calendarAppointment) {
    return {
      hasCalendarAppointment: false,
      appointmentStart: lead.appointment?.trim() || null,
      appointmentType: null,
      appointmentStatus: null,
    };
  }

  return {
    hasCalendarAppointment: true,
    appointmentStart:
      calendarAppointment.confirmedStartAt ??
      calendarAppointment.proposedStartAt ??
      lead.appointment?.trim() ??
      null,
    appointmentType: calendarAppointment.appointmentType ?? null,
    appointmentStatus: calendarAppointment.status ?? null,
  };
}

export function buildLeadCopilotPromptContext(input: {
  lead: Lead;
  tenant: Tenant;
  bookingFlow: BookingFlowConfig;
  appointmentFacts: LeadCopilotAppointmentFacts;
}): LeadCopilotPromptContext {
  const { lead, tenant, bookingFlow, appointmentFacts } = input;

  const leadFactsText = [
    "A. Lead facts (structured system data)",
    `Lead Number: ${displayValue(lead.leadNumber)}`,
    `Customer Name: ${displayValue(lead.customerName)}`,
    `Phone: ${displayValue(lead.phone)}`,
    `Email: ${displayValue(lead.email)}`,
    `Address: ${displayValue(lead.address)}`,
    `Project Type: ${displayValue(lead.projectType)}`,
    `Location: ${displayValue(lead.location)}`,
    `Timeline: ${displayValue(lead.timeline)}`,
    `Lead Appointment Preference Field: ${displayValue(lead.appointment)}`,
    `Internal Notes: ${displayValue(lead.notes)}`,
    `Lead Status: ${displayValue(lead.status)}`,
    `Lead Source: ${displayValue(lead.leadSource ?? undefined)}`,
  ].join("\n");

  const customerUpdatesText = [
    "B. Persisted Customer Updates (durable customer-provided context after lead capture)",
    displayValue(lead.customerUpdates),
  ].join("\n");

  const nextStepMessage = tenant.nextStepMessage?.trim();

  const nonSchedulingRules = bookingFlow.requiresAppointment
    ? ""
    : `
- This Booking Flow does NOT require an appointment.
- An empty Lead Appointment Preference Field is NOT a deficiency by itself.
- Do NOT list "appointment time" or similar scheduling fields as missing merely because no appointment exists.
- Do NOT recommend confirming, scheduling, or booking an appointment merely because one does not exist.
- Suggested next steps should align with follow-up, estimate/quote handling, or the tenant's configured next-step guidance.
`.trim();

  const schedulingRules = bookingFlow.requiresAppointment
    ? `
- This Booking Flow supports/requires appointment coordination when appropriate.
- You may identify legitimate appointment or scheduling gaps when they would help the team move the lead forward.
- Distinguish missing calendar appointment records from optional preference text on the lead.
`.trim()
    : "";

  const bookingFlowRulesText = [
    "C. Booking Flow rules (production authority via getBookingFlowConfig)",
    `Booking Type: ${bookingFlow.bookingType}`,
    `Requires Appointment: ${bookingFlow.requiresAppointment ? "yes" : "no"}`,
    `Requires Calendar: ${bookingFlow.requiresCalendar ? "yes" : "no"}`,
    `Offers Scheduling After Lead Created: ${
      bookingFlow.shouldOfferSchedulingAfterLeadCreated ? "yes" : "no"
    }`,
    `Tenant Next Step Guidance: ${nextStepMessage || "Not provided"}`,
    nonSchedulingRules,
    schedulingRules,
    "- Use Customer Updates and structured lead facts as the primary source of customer-confirmed detail.",
    "- Do not invent facts.",
  ]
    .filter(Boolean)
    .join("\n");

  const appointmentFactsText = [
    "D. Actual appointment facts (calendar/system records)",
    `Calendar Appointment Record Exists: ${
      appointmentFacts.hasCalendarAppointment ? "yes" : "no"
    }`,
    `Appointment Start: ${displayValue(appointmentFacts.appointmentStart)}`,
    `Appointment Type: ${displayValue(appointmentFacts.appointmentType)}`,
    `Appointment Status: ${displayValue(appointmentFacts.appointmentStatus)}`,
    appointmentFacts.hasCalendarAppointment
      ? "- You may reference this appointment accurately when relevant."
      : "- No calendar appointment record exists for this lead.",
    bookingFlow.requiresAppointment
      ? "- The workflow may still expect appointment coordination even when no record exists yet."
      : "- Absence of a calendar appointment is expected for this workflow and is not automatically a problem.",
  ].join("\n");

  const combinedContextText = [
    leadFactsText,
    "",
    customerUpdatesText,
    "",
    bookingFlowRulesText,
    "",
    appointmentFactsText,
  ].join("\n");

  return {
    requiresAppointment: bookingFlow.requiresAppointment,
    leadFactsText,
    customerUpdatesText,
    bookingFlowRulesText,
    appointmentFactsText,
    combinedContextText,
  };
}

export function buildLegacyLeadContext(lead: Lead): string {
  return [
    `Lead Number: ${lead.leadNumber || "Unknown"}`,
    `Customer Name: ${lead.customerName || "Unknown"}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `Email: ${lead.email || "Not provided"}`,
    `Project Type: ${lead.projectType || "Not provided"}`,
    `Location: ${lead.location || "Not provided"}`,
    `Timeline: ${lead.timeline || "Not provided"}`,
    `Appointment: ${lead.appointment || "Not provided"}`,
    `Notes: ${lead.notes || "Not provided"}`,
    `Customer Updates: ${lead.customerUpdates || "Not provided"}`,
    `Status: ${lead.status || "new"}`,
  ].join("\n");
}
