import { isTenantFacingBookingType } from "@/lib/onboarding/customerHelpOptions";
import { getReadinessAdminPaths } from "@/lib/readiness/adminPaths";
import { computeCategoryResult } from "@/lib/readiness/computeCategoryResult";
import { hasText, itemStatus } from "@/lib/readiness/helpers";
import type {
  ReadinessCategoryResult,
  TenantSetupReadinessInput,
} from "@/lib/readiness/types";

export function evaluateAiReceptionist(
  input: TenantSetupReadinessInput
): ReadinessCategoryResult {
  const { tenant } = input;
  const paths = getReadinessAdminPaths(tenant.slug);

  const items = [
    {
      id: "supported_booking_flow",
      label: "Supported customer workflow selected",
      tier: "required" as const,
      status: itemStatus(isTenantFacingBookingType(tenant.bookingType)),
      adminHref: paths.aiReceptionist,
    },
    {
      id: "greeting_message",
      label: "Custom greeting message",
      tier: "recommended" as const,
      status: itemStatus(hasText(tenant.greetingMessage)),
      adminHref: paths.aiReceptionist,
    },
    {
      id: "next_step_message",
      label: "Custom next-step guidance",
      tier: "recommended" as const,
      status: itemStatus(hasText(tenant.nextStepMessage)),
      adminHref: paths.aiReceptionist,
    },
  ];

  return computeCategoryResult({
    key: "ai_receptionist",
    label: "AI Receptionist",
    applicable: true,
    items,
    adminHref: paths.aiReceptionist,
  });
}
