import type { BookingFlowType } from "@/lib/config/getBookingFlowConfig";

export type TenantFacingBookingType = Extract<
  BookingFlowType,
  "consultation" | "phone_call" | "estimate" | "lead_capture" | "product_signup"
>;

export const TENANT_FACING_BOOKING_TYPES: TenantFacingBookingType[] = [
  "consultation",
  "phone_call",
  "estimate",
  "lead_capture",
  "product_signup",
];

export const CUSTOMER_HELP_OPTIONS: {
  value: TenantFacingBookingType;
  label: string;
  description: string;
}[] = [
  {
    value: "consultation",
    label: "Schedule a consultation",
    description:
      "Customers can share project details and schedule a consultation when ready.",
  },
  {
    value: "phone_call",
    label: "Schedule a phone call",
    description:
      "After capturing the request, customers can pick a time for a phone call.",
  },
  {
    value: "estimate",
    label: "Request an estimate or quote",
    description:
      "Collect project details and send the request to your team for follow-up.",
  },
  {
    value: "lead_capture",
    label: "Send the request to my team",
    description:
      "Capture contact details and project information for manual follow-up.",
  },
  {
    value: "product_signup",
    label: "Sign up for my product or service",
    description:
      "Guide customers toward creating an account or starting signup.",
  },
];

export function getCustomerHelpLabel(bookingType?: string | null) {
  const match = CUSTOMER_HELP_OPTIONS.find((option) => option.value === bookingType);
  return match?.label ?? null;
}

export function isTenantFacingBookingType(
  value?: string | null
): value is TenantFacingBookingType {
  return TENANT_FACING_BOOKING_TYPES.includes(value as TenantFacingBookingType);
}

export function isLegacyBookingType(value?: string | null) {
  return (
    value === "reservation" ||
    value === "direct_booking" ||
    value === "manual_followup"
  );
}
