import type {
  WizardAiAboutContext,
  WizardAiTaglineContext,
} from "@/lib/ai/wizard/types";
import type { TenantDeploymentMode } from "@/lib/types/tenant";

type WizardFormSlice = {
  businessName: string;
  primaryCategory: string;
  serviceAreaSummary: string;
  tagline: string;
  aboutUs: string;
  servicesOffered: string;
  deploymentMode: TenantDeploymentMode | null;
};

function parseListInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildWizardAiTaglineContext(
  form: WizardFormSlice
): WizardAiTaglineContext {
  return {
    businessName: form.businessName.trim() || undefined,
    primaryCategory: form.primaryCategory.trim() || undefined,
    serviceAreaSummary: form.serviceAreaSummary.trim() || undefined,
    existingTagline: form.tagline.trim() || undefined,
  };
}

export function buildWizardAiAboutContext(
  form: WizardFormSlice
): WizardAiAboutContext {
  const services = parseListInput(form.servicesOffered);

  return {
    businessName: form.businessName.trim() || undefined,
    primaryCategory: form.primaryCategory.trim() || undefined,
    serviceAreaSummary: form.serviceAreaSummary.trim() || undefined,
    servicesOffered: services.length > 0 ? services : undefined,
    ownerProvidedBusinessDescription: form.aboutUs.trim() || undefined,
    deploymentMode: form.deploymentMode,
  };
}
