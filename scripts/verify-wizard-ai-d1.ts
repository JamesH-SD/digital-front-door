/**
 * D1 checks (no OpenAI). Run: node node_modules/tsx/dist/cli.mjs scripts/verify-wizard-ai-d1.ts
 */
import {
  buildWizardAiAboutContext,
  buildWizardAiTaglineContext,
} from "../lib/onboarding/buildWizardAiRequestContext";
import {
  sanitizeWizardAboutProposal,
  sanitizeWizardTaglineProposal,
} from "../lib/ai/wizard/sanitizeWizardProposal";

const form = {
  businessName: "Acme Plumbing",
  primaryCategory: "Plumber",
  serviceAreaSummary: "North County",
  tagline: "Old tagline",
  aboutUs: "Old about",
  servicesOffered: "Drain cleaning\nWater heaters",
  deploymentMode: "hosted" as const,
};

const taglineContext = buildWizardAiTaglineContext(form);
if (taglineContext.businessName !== "Acme Plumbing") {
  throw new Error("tagline context should include current business name");
}

const aboutContext = buildWizardAiAboutContext(form);
if (!aboutContext.servicesOffered?.includes("Drain cleaning")) {
  throw new Error("about context should include unsaved services list");
}
if (aboutContext.ownerProvidedBusinessDescription !== "Old about") {
  throw new Error("about context should include owner About textarea");
}

const paulsForm = {
  ...form,
  businessName: "Pauls Painting",
  primaryCategory: "Painting contractor",
  serviceAreaSummary: "San Diego and surrounding counties",
  aboutUs:
    "We are a small family owned painting business that has been in business for 18 years. We focus on interior and exterior painting for both residential and commercial clients. We are honest, trustworthy, and fair on pricing. We are licensed and insured. We serve San Diego and surrounding counties.",
  servicesOffered: "",
};

const paulsContext = buildWizardAiAboutContext(paulsForm);
if (!paulsContext.ownerProvidedBusinessDescription?.includes("18 years")) {
  throw new Error("Pauls Painting fixture should pass owner facts in context");
}

const longTagline = "x".repeat(200);
if (sanitizeWizardTaglineProposal(longTagline).length !== 120) {
  throw new Error("tagline sanitize max length");
}

const longAbout = "y".repeat(900);
if (sanitizeWizardAboutProposal(longAbout).length !== 800) {
  throw new Error("about sanitize max length");
}

console.log("D1 wizard AI helper checks passed.");
