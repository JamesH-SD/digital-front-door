import { getBookingFlowConfig } from "@/lib/config/getBookingFlowConfig";
import { isTenantFacingBookingType } from "@/lib/onboarding/customerHelpOptions";
import type { Tenant } from "@/lib/types/tenant";
import { getReadinessAdminPaths } from "@/lib/readiness/adminPaths";
import { computeCategoryResult } from "@/lib/readiness/computeCategoryResult";
import { itemStatus } from "@/lib/readiness/helpers";
import type {
  ReadinessCategoryResult,
  TenantSetupReadinessInput,
} from "@/lib/readiness/types";

export function evaluateCalendar(
  input: TenantSetupReadinessInput
): ReadinessCategoryResult {
  const { tenant, hasActivePrimaryCalendar } = input;
  const paths = getReadinessAdminPaths(tenant.slug);

  const supportedBooking = isTenantFacingBookingType(tenant.bookingType);
  const applicable =
    supportedBooking &&
    getBookingFlowConfig(tenant as Tenant).requiresCalendar;

  const items = applicable
    ? [
        {
          id: "primary_calendar_connection",
          label: "Primary calendar connected",
          tier: "required" as const,
          status: itemStatus(hasActivePrimaryCalendar),
          adminHref: paths.calendar,
        },
      ]
    : [];

  return computeCategoryResult({
    key: "calendar",
    label: "Calendar",
    applicable,
    items,
    adminHref: paths.calendar,
  });
}
