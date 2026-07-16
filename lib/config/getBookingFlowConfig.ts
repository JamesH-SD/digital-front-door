import type { Tenant } from "@/lib/types/tenant";

export type BookingFlowType =
  | "consultation"
  | "reservation"
  | "direct_booking"
  | "phone_call"
  | "estimate"
  | "lead_capture"
  | "manual_followup"
  | "product_signup";

export type BookingFlowAppointmentType = "call" | "site_visit";

export type BookingFlowConfig = {
  bookingType: BookingFlowType;
  shouldOfferSchedulingAfterLeadCreated: boolean;
  defaultAppointmentType: BookingFlowAppointmentType | null;
  allowCustomerToChooseAppointmentType: boolean;
  requiresAddressBeforeScheduling: boolean;
  requiresCalendar: boolean;
  requiresAppointment: boolean;
  allowConversationAfterLead: boolean;
  showSignupLink: boolean;
  leadCreatedReply: string;
  shouldCreateLeadAutomatically: boolean;
  followUpLanguageAllowed: boolean;
};

function joinReply(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

export function getBookingFlowConfig(tenant: Tenant): BookingFlowConfig {
  const bookingType = normalizeBookingType(tenant.bookingType);
  const nextStepMessage = tenant.nextStepMessage?.trim();

  switch (bookingType) {
    case "product_signup":
      return {
        bookingType,
        shouldOfferSchedulingAfterLeadCreated: false,
        defaultAppointmentType: null,
        allowCustomerToChooseAppointmentType: false,
        requiresAddressBeforeScheduling: false,
        requiresCalendar: false,
        requiresAppointment: false,
        allowConversationAfterLead: true,
        showSignupLink: true,
        shouldCreateLeadAutomatically: false,
        followUpLanguageAllowed: false,
        leadCreatedReply:
          "You can create your account by clicking Get Started or visiting /signup. I’m here if you have questions before getting started.",
      };

    case "lead_capture":
      return {
        bookingType,
        shouldOfferSchedulingAfterLeadCreated: false,
        defaultAppointmentType: null,
        allowCustomerToChooseAppointmentType: false,
        requiresAddressBeforeScheduling: false,
        requiresCalendar: false,
        requiresAppointment: false,
        allowConversationAfterLead: true,
        shouldCreateLeadAutomatically: true,
        followUpLanguageAllowed: true,
        showSignupLink: false,
        leadCreatedReply: joinReply([
          "Great, I have enough information for now.",
          nextStepMessage,
        ]),
      };

    case "manual_followup":
      return {
        bookingType,
        shouldOfferSchedulingAfterLeadCreated: false,
        defaultAppointmentType: null,
        allowCustomerToChooseAppointmentType: false,
        requiresAddressBeforeScheduling: false,
        requiresCalendar: false,
        requiresAppointment: false,
        allowConversationAfterLead: true,
        shouldCreateLeadAutomatically: true,
        followUpLanguageAllowed: true,
        showSignupLink: false,
        leadCreatedReply: joinReply([
          "Great, I have enough information for now.",
          nextStepMessage,
        ]),
      };

    case "reservation":
      return {
        bookingType,
        shouldOfferSchedulingAfterLeadCreated: true,
        defaultAppointmentType: "call",
        allowCustomerToChooseAppointmentType: false,
        requiresAddressBeforeScheduling: false,
        requiresCalendar: true,
        requiresAppointment: true,
        allowConversationAfterLead: true,
        shouldCreateLeadAutomatically: true,
        followUpLanguageAllowed: true,
        showSignupLink: false,
        leadCreatedReply: joinReply([
          "Great, I have enough information to get your request started.",
          nextStepMessage,
          "Would you like to schedule a quick confirmation call?",
        ]),
      };

    case "direct_booking":
      return {
        bookingType,
        shouldOfferSchedulingAfterLeadCreated: true,
        defaultAppointmentType: "call",
        allowCustomerToChooseAppointmentType: false,
        requiresAddressBeforeScheduling: false,
        requiresCalendar: true,
        requiresAppointment: true,
        allowConversationAfterLead: true,
        shouldCreateLeadAutomatically: true,
        followUpLanguageAllowed: true,
        showSignupLink: false,
        leadCreatedReply: joinReply([
          "Great, I have enough information to get your request started.",
          nextStepMessage,
          "Would you like to schedule a quick confirmation call?",
        ]),
      };

    case "phone_call":
      return {
        bookingType,
        shouldOfferSchedulingAfterLeadCreated: true,
        defaultAppointmentType: "call",
        allowCustomerToChooseAppointmentType: false,
        requiresAddressBeforeScheduling: false,
        requiresCalendar: true,
        requiresAppointment: true,
        allowConversationAfterLead: true,
        shouldCreateLeadAutomatically: true,
        followUpLanguageAllowed: true,
        showSignupLink: false,
        leadCreatedReply: joinReply([
          "Great, I have enough information to get your request started.",
          nextStepMessage,
          "Would you like to schedule a quick call now?",
        ]),
      };

    case "estimate":
      return {
        bookingType,
        shouldOfferSchedulingAfterLeadCreated: true,
        defaultAppointmentType: null,
        allowCustomerToChooseAppointmentType: true,
        requiresAddressBeforeScheduling: false,
        requiresCalendar: true,
        requiresAppointment: true,
        allowConversationAfterLead: true,
        shouldCreateLeadAutomatically: true,
        followUpLanguageAllowed: true,
        showSignupLink: false,
        leadCreatedReply: joinReply([
          "Great, I have enough information to get your estimate request started.",
          nextStepMessage,
          "The next step is usually scheduling a quick call or an on-site visit so we can better understand what you need. Is that something you’d be interested in?",
        ]),
      };

    case "consultation":
    default:
      return {
        bookingType: "consultation",
        shouldOfferSchedulingAfterLeadCreated: true,
        defaultAppointmentType: null,
        allowCustomerToChooseAppointmentType: true,
        requiresAddressBeforeScheduling: false,
        requiresCalendar: true,
        requiresAppointment: true,
        allowConversationAfterLead: true,
        shouldCreateLeadAutomatically: true,
        followUpLanguageAllowed: true,
        showSignupLink: false,
        leadCreatedReply: joinReply([
          "I have what I need to get your request started.",
          nextStepMessage,
          "From here, the next step is usually a quick call or an on-site visit so we can better understand what you need. Would either of those work for you?",
        ]),
      };
  }
}

function normalizeBookingType(value?: string | null): BookingFlowType {
  if (
    value === "reservation" ||
    value === "direct_booking" ||
    value === "phone_call" ||
    value === "estimate" ||
    value === "consultation" ||
    value === "lead_capture" ||
    value === "manual_followup" ||
    value === "product_signup"
  ) {
    return value;
  }

  return "consultation";
}