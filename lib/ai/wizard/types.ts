import type { TenantDeploymentMode } from "@/lib/types/tenant";

export type WizardAiProposeAction = "tagline" | "about";

export type WizardAiTaglineContext = {
  businessName?: string;
  primaryCategory?: string;
  serviceAreaSummary?: string;
  existingTagline?: string;
};

export type WizardAiAboutContext = {
  businessName?: string;
  primaryCategory?: string;
  serviceAreaSummary?: string;
  servicesOffered?: string[];
  /** Current Wizard About field — owner-provided facts and rough copy (unsaved form state). */
  ownerProvidedBusinessDescription?: string;
  deploymentMode?: TenantDeploymentMode | null;
};

export type WizardAiProposeContext = WizardAiTaglineContext | WizardAiAboutContext;

export type WizardAiProposeResult =
  | { status: "generated"; proposal: string }
  | { status: "skipped"; reason: string };
