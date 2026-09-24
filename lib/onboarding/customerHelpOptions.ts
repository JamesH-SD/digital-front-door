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
      "Customers share what they need, then choose an available date and time from your connected calendar for a consultation.",
  },
  {
    value: "phone_call",
    label: "Schedule a phone call",
    description:
      "Customers share their request, then choose an available date and time from your connected calendar for a phone call.",
  },
  {
    value: "estimate",
    label: "Request an estimate or quote",
    description:
      "Customers provide the project details you need for an estimate or quote. Your team reviews the request and follows up with pricing or next steps.",
  },
  {
    value: "lead_capture",
    label: "Send the request to my team",
    description:
      "Customers share their contact information and what they need. Your team receives the request and follows up personally.",
  },
  {
    value: "product_signup",
    label: "Sign up for my product or service",
    description:
      "Your AI receptionist guides customers through your signup process and collects the information needed to get started.",
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
