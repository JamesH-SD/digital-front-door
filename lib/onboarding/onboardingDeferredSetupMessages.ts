import type { OnboardingWizardStepKey } from "@/lib/onboarding/buildOnboardingWizardSteps";
import type { TenantDeploymentMode } from "@/lib/types/tenant";

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

type SkippableOnboardingStepKey = Extract<
  OnboardingWizardStepKey,
  "hours" | "calendar" | "knowledge" | "customerExperience"
>;

export function getOnboardingSkipToastMessage(
  stepKey: SkippableOnboardingStepKey,
  context?: { deploymentMode?: TenantDeploymentMode | null }
) {
  switch (stepKey) {
    case "hours":
      return "Business hours skipped. You can add them anytime under Settings → Business Hours.";
    case "calendar":
      return "You can connect your calendar later under Settings → Calendar. Until a calendar is connected, your receptionist won't offer appointment times.";
    case "knowledge":
      return "Training skipped for now. You can continue training your receptionist anytime from Knowledge Base.";
    case "customerExperience":
      if (context?.deploymentMode === "hosted") {
        return "Website setup skipped for now. You can continue building your website anytime from Website.";
      }
      return "Website installation skipped. You can install your receptionist anytime from AI Receptionist.";
  }
}

export function isSkippableOnboardingStep(
  stepKey: OnboardingWizardStepKey
): stepKey is SkippableOnboardingStepKey {
  return (
    stepKey === "hours" ||
    stepKey === "calendar" ||
    stepKey === "knowledge" ||
    stepKey === "customerExperience"
  );
}
