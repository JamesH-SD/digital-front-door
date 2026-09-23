import { getBookingFlowConfig } from "@/lib/config/getBookingFlowConfig";
import type { Tenant } from "@/lib/types/tenant";

export type OnboardingWizardStepKey =
  | "business"
  | "serviceArea"
  | "services"
  | "customerHelp"
  | "hours"
  | "calendar"
  | "knowledge"
  | "finish";

export type OnboardingWizardStep = {
  key: OnboardingWizardStepKey;
  label: string;
  required: boolean;
};

const BASE_STEPS: OnboardingWizardStep[] = [
  { key: "business", label: "Business", required: true },
  { key: "serviceArea", label: "Service Area", required: true },
  { key: "services", label: "Services", required: true },
  { key: "customerHelp", label: "How We Help", required: true },
  { key: "hours", label: "Hours", required: false },
];

const KNOWLEDGE_STEP: OnboardingWizardStep = {
  key: "knowledge",
  label: "Training",
  required: false,
};

const FINISH_STEP: OnboardingWizardStep = {
  key: "finish",
  label: "Review",
  required: false,
};

const CALENDAR_STEP: OnboardingWizardStep = {
  key: "calendar",
  label: "Calendar",
  required: false,
};

export function buildOnboardingWizardSteps(
  bookingType: string | null | undefined
): OnboardingWizardStep[] {
  const flow = getBookingFlowConfig({
    bookingType: bookingType ?? undefined,
  } as Tenant);

  const steps = [...BASE_STEPS];

  if (flow.requiresCalendar) {
    steps.push(CALENDAR_STEP);
  }

  steps.push(KNOWLEDGE_STEP, FINISH_STEP);

  return steps;
}

export function getCalendarStepExplanation(bookingType: string | null | undefined) {
  switch (bookingType) {
    case "phone_call":
      return "You chose to let customers schedule a phone call. Contactor needs access to your calendar so your AI receptionist can offer available times and avoid double-booking.";
    case "consultation":
    default:
      return "You chose to let customers schedule consultations. Contactor needs access to your calendar so your AI receptionist can offer available times and avoid scheduling conflicts.";
  }
}
