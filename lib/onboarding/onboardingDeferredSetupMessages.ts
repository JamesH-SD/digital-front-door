import type { OnboardingWizardStepKey } from "@/lib/onboarding/buildOnboardingWizardSteps";

export function getAdminDeferredSetupPath(
  tenantSlug: string,
  stepKey: Extract<OnboardingWizardStepKey, "hours" | "calendar" | "knowledge">
) {
  switch (stepKey) {
    case "hours":
      return `/admin/${tenantSlug}/settings/hours`;
    case "calendar":
      return `/admin/${tenantSlug}/settings/calendar`;
    case "knowledge":
      return `/admin/${tenantSlug}/knowledge`;
  }
}

export function getOnboardingSkipToastMessage(
  stepKey: Extract<OnboardingWizardStepKey, "hours" | "calendar" | "knowledge">
) {
  switch (stepKey) {
    case "hours":
      return "Business hours skipped. You can add them anytime under Settings → Business Hours.";
    case "calendar":
      return "You can connect your calendar later under Settings → Calendar. Until a calendar is connected, your receptionist won't offer appointment times.";
    case "knowledge":
      return "Training skipped for now. You can continue training your receptionist anytime from Knowledge Base.";
  }
}

export function isSkippableOnboardingStep(stepKey: OnboardingWizardStepKey) {
  return stepKey === "hours" || stepKey === "calendar" || stepKey === "knowledge";
}
