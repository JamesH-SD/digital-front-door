import type { Tenant } from "@/lib/types/tenant";

export type BookingFlowType =
  | "consultation"
  | "reservation"
  | "direct_booking"
  | "phone_call"
  | "estimate";

export type BookingFlowAppointmentType = "call" | "site_visit";

export type BookingFlowConfig = {
  bookingType: BookingFlowType;
  shouldOfferSchedulingAfterLeadCreated: boolean;
  defaultAppointmentType: BookingFlowAppointmentType | null;
  allowCustomerToChooseAppointmentType: boolean;
  requiresAddressBeforeScheduling: boolean;
  leadCreatedReply: string;
};

/**
 * Central source of truth for how each tenant booking flow behaves.
 *
 * Product rule:
 * We are not trying to truly reserve inventory/assets yet.
 * We are filling the tenant calendar with qualified potential business.
 *
 * Therefore every flow ultimately becomes either:
 * - phone call
 * - site visit
 */
export function getBookingFlowConfig(tenant: Tenant): BookingFlowConfig {
  const bookingType = normalizeBookingType(tenant.bookingType);
  const nextStepMessage =
    tenant.nextStepMessage?.trim() ||
    "The next step is usually confirming the details and coordinating the best time.";

  switch (bookingType) {
    case "reservation":
      return {
        bookingType,
        shouldOfferSchedulingAfterLeadCreated: true,
        defaultAppointmentType: "call",
        allowCustomerToChooseAppointmentType: false,
        requiresAddressBeforeScheduling: false,
        leadCreatedReply: `Great, I have enough information to get your rental request started. ${nextStepMessage} Would you like to schedule a quick confirmation call?`,
      };

    case "direct_booking":
      return {
        bookingType,
        shouldOfferSchedulingAfterLeadCreated: true,
        defaultAppointmentType: "call",
        allowCustomerToChooseAppointmentType: false,
        requiresAddressBeforeScheduling: false,
        leadCreatedReply: `Great, I have enough information to get your request started. ${nextStepMessage} Would you like to schedule a quick confirmation call?`,
      };

    case "phone_call":
      return {
        bookingType,
        shouldOfferSchedulingAfterLeadCreated: true,
        defaultAppointmentType: "call",
        allowCustomerToChooseAppointmentType: false,
        requiresAddressBeforeScheduling: false,
        leadCreatedReply: `Great, I have enough information to get your request started. ${nextStepMessage} Would you like to schedule a quick call now?`,
      };

    case "estimate":
      return {
        bookingType,
        shouldOfferSchedulingAfterLeadCreated: true,
        defaultAppointmentType: null,
        allowCustomerToChooseAppointmentType: true,
        requiresAddressBeforeScheduling: false,
        leadCreatedReply: `Great, I have enough information to get your estimate request started. ${nextStepMessage} Would you like to schedule a quick call or an on-site visit?`,
      };

    case "consultation":
    default:
      return {
        bookingType: "consultation",
        shouldOfferSchedulingAfterLeadCreated: true,
        defaultAppointmentType: null,
        allowCustomerToChooseAppointmentType: true,
        requiresAddressBeforeScheduling: false,
        leadCreatedReply: `Great, I have enough information to get your request started. ${nextStepMessage} Would you prefer a quick call, or would you like us to come out for an on-site visit?`,
      };
  }
}

function normalizeBookingType(value?: string | null): BookingFlowType {
  if (
    value === "reservation" ||
    value === "direct_booking" ||
    value === "phone_call" ||
    value === "estimate" ||
    value === "consultation"
  ) {
    return value;
  }

  return "consultation";
}