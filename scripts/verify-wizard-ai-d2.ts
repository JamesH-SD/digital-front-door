/**
 * D2 Services AI checks (no OpenAI). Run: npx tsx scripts/verify-wizard-ai-d2.ts
 */
import { buildWizardAiServicesContext } from "../lib/onboarding/buildWizardAiRequestContext";
import { sanitizeWizardServicesProposal } from "../lib/ai/wizard/sanitizeWizardProposal";

const paulsForm = {
  businessName: "Pauls Painting",
  primaryCategory: "Painting contractor",
  serviceAreaSummary: "San Diego and surrounding counties",
  tagline: "",
  aboutUs:
    "We are a small family owned painting business that has been in business for 18 years. We focus on interior and exterior painting for both residential and commercial clients.",
  servicesOffered: "Painting Services consultations\nPainting Services estimates",
  deploymentMode: "hosted" as const,
};

const context = buildWizardAiServicesContext(paulsForm);

if (!context.ownerProvidedBusinessDescription?.includes("interior")) {
  throw new Error("Services context should include owner About facts");
}

if (!context.existingServicesOffered?.[0]?.includes("consultations")) {
  throw new Error("Services context should include unsaved services draft");
}

const sanitized = sanitizeWizardServicesProposal(
  "- Interior Painting\nInterior Painting\n\nExterior Painting\n\n"
);

if (sanitized.split("\n").length !== 2) {
  throw new Error("Services sanitizer should dedupe lines");
}

console.log("D2 wizard Services AI helper checks passed.");
