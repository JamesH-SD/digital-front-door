import { getOpenAIClient } from "@/lib/ai/openaiClient";
import {
  sanitizeWizardAboutProposal,
  sanitizeWizardServicesProposal,
  sanitizeWizardTaglineProposal,
} from "@/lib/ai/wizard/sanitizeWizardProposal";
import type {
  WizardAiAboutContext,
  WizardAiProposeAction,
  WizardAiProposeResult,
  WizardAiServicesContext,
  WizardAiTaglineContext,
} from "@/lib/ai/wizard/types";

function hasText(value?: string | null) {
  return Boolean(value && value.trim());
}

function formatOptional(label: string, value?: string | null) {
  return hasText(value) ? `${label}: ${value!.trim()}` : null;
}

function buildStructuredFactsBlock(input: {
  businessName?: string;
  primaryCategory?: string;
  serviceAreaSummary?: string;
}) {
  return [
    formatOptional("Business name", input.businessName),
    formatOptional("Business category or type", input.primaryCategory),
    formatOptional("Service area summary", input.serviceAreaSummary),
  ]
    .filter(Boolean)
    .join("\n");
}

const WIZARD_TRUTH_RULES = `
Truth rules (Wizard setup assistance only):
- Treat every fact in the owner-provided material and structured fields as authoritative when relevant.
- You may professionally rewrite and polish supplied facts; do not drop important supplied differentiators (years in business, family-owned, licensed/insured, service areas, specialties, pricing posture, etc.) when they appear in the input.
- Never invent licensing, insurance, certifications, years in business, pricing, guarantees, availability, locations, services, awards, reviews, or other claims that were not supplied.
- Do not use markdown, bullet points, or quotation marks around the entire answer.
- Return only the finished copy with no preamble, explanation, or meta commentary.
`.trim();

function buildTaglinePrompt(context: WizardAiTaglineContext): string {
  const facts = buildStructuredFactsBlock(context);
  const existing = formatOptional(
    "Current tagline draft (optional starting point)",
    context.existingTagline
  );

  return `
You are helping a business owner write customer-facing website marketing copy.

Write one concise tagline the business could publish on its website.

Voice and style:
- Customer-facing marketing language — inviting, professional, and clear.
- Reflect the supplied business name, category, and service area when available.
- A tagline does not need "we/us/our" if that would sound awkward.
- Do not write as an outside consultant describing the company.
- Avoid generic AI-summary phrasing and unsupported superlatives.

${WIZARD_TRUTH_RULES}
- Maximum length: about 120 characters.
- One line only.

Structured business fields:
${facts || "None provided."}
${existing ? `\n${existing}` : ""}
`.trim();
}

function buildAboutPrompt(context: WizardAiAboutContext): string {
  const facts = buildStructuredFactsBlock(context);
  const ownerProvided = hasText(context.ownerProvidedBusinessDescription)
    ? context.ownerProvidedBusinessDescription!.trim()
    : null;
  const services =
    context.servicesOffered && context.servicesOffered.length > 0
      ? context.servicesOffered.join(", ")
      : null;
  const deployment =
    context.deploymentMode === "hosted"
      ? "This copy may appear on the business's Contactor-hosted website."
      : context.deploymentMode === "existing_site"
        ? "This copy may appear on the business's own website."
        : null;

  return `
You are a writing assistant working on behalf of the business — not an outside reviewer.

Write polished, website-ready About Us copy that the business will show to customers.

Voice and style (required):
- Write as the business speaking to customers using natural we / us / our language when appropriate.
- Warm, professional, trustworthy, and inviting — finished customer-facing copy.
- Do NOT describe the business in third person (avoid "[Business Name] provides..." or "the company").
- Do NOT explain what you understood, summarize the owner back to themselves, or use consultant/review language.
- About 2 to 4 sentences; maximum about 800 characters.
- No excessive hype or unsupported superlatives.

${WIZARD_TRUTH_RULES}

Owner-provided business description (primary source — preserve factual details; rewrite for customers):
${ownerProvided || "None provided yet. Use only the structured fields below."}

Structured business fields:
${facts || "None provided."}
${services ? `\nService lines already listed elsewhere in setup: ${services}` : ""}
${deployment ? `\n${deployment}` : ""}
`.trim();
}

function buildServicesPrompt(context: WizardAiServicesContext): string {
  const facts = buildStructuredFactsBlock(context);
  const ownerProvided = hasText(context.ownerProvidedBusinessDescription)
    ? context.ownerProvidedBusinessDescription!.trim()
    : null;
  const existing =
    context.existingServicesOffered && context.existingServicesOffered.length > 0
      ? context.existingServicesOffered.join("\n")
      : null;

  return `
You are helping a business owner list the services their business actually provides for a setup wizard.

Services must answer: "What does this business do?" — offerings a prospective customer would recognize.

Do NOT list workflow actions, booking steps, or receptionist behaviors, such as:
- consultations, estimates, quotes, appointments, scheduling
- "request a quote", "schedule a call", lead capture, maintenance plans
unless the owner explicitly described those as a supplied service line.

Good examples for a painting company when owner facts mention interior/exterior and residential/commercial:
- Interior Painting
- Exterior Painting
- Residential Painting
- Commercial Painting

Bad unless explicitly supported by owner-provided facts:
- Painting Consultations
- Painting Estimates
- Cabinet Refinishing, Epoxy Flooring, Pressure Washing, HOA Painting, Industrial Coatings

Do not turn vague adjectives or qualities into service lines.
Do not invent services, specialties, or capabilities not supported by the input.

${WIZARD_TRUTH_RULES}

Output format:
- One service per line
- Short customer-facing names (about 2 to 6 words each)
- No numbering, bullets, markdown, or preamble
- About 3 to 10 lines when enough facts exist; fewer if input is thin

Owner-provided business description (primary source for offerings):
${ownerProvided || "None provided yet."}

Structured business fields:
${facts || "None provided."}
${existing ? `\nCurrent services draft (replace entirely in your answer — propose a fresh list grounded in facts, not an append):\n${existing}` : ""}
`.trim();
}

function hasMinimumContextForAction(
  action: WizardAiProposeAction,
  context: WizardAiTaglineContext | WizardAiAboutContext | WizardAiServicesContext
) {
  if (action === "tagline") {
    return (
      hasText(context.businessName) || hasText(context.primaryCategory)
    );
  }

  if (action === "services") {
    const servicesContext = context as WizardAiServicesContext;

    return (
      hasText(servicesContext.businessName) ||
      hasText(servicesContext.primaryCategory) ||
      hasText(servicesContext.ownerProvidedBusinessDescription)
    );
  }

  const aboutContext = context as WizardAiAboutContext;

  return (
    hasText(aboutContext.businessName) ||
    hasText(aboutContext.primaryCategory) ||
    hasText(aboutContext.ownerProvidedBusinessDescription)
  );
}

function skipReasonForAction(action: WizardAiProposeAction) {
  if (action === "about" || action === "services") {
    return "Add a business name, category, or About description before requesting a suggestion.";
  }

  return "Add a business name or category before requesting a suggestion.";
}

export async function proposeWizardSetupContent(input: {
  action: WizardAiProposeAction;
  context: WizardAiTaglineContext | WizardAiAboutContext | WizardAiServicesContext;
}): Promise<WizardAiProposeResult> {
  const { action, context } = input;

  if (!hasMinimumContextForAction(action, context)) {
    return {
      status: "skipped",
      reason: skipReasonForAction(action),
    };
  }

  try {
    const client = getOpenAIClient();
    const prompt =
      action === "tagline"
        ? buildTaglinePrompt(context as WizardAiTaglineContext)
        : action === "about"
          ? buildAboutPrompt(context as WizardAiAboutContext)
          : buildServicesPrompt(context as WizardAiServicesContext);

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      return {
        status: "skipped",
        reason: "AI returned an empty suggestion.",
      };
    }

    const proposal =
      action === "tagline"
        ? sanitizeWizardTaglineProposal(raw)
        : action === "about"
          ? sanitizeWizardAboutProposal(raw)
          : sanitizeWizardServicesProposal(raw);

    if (!proposal) {
      return {
        status: "skipped",
        reason: "AI returned an invalid suggestion.",
      };
    }

    return { status: "generated", proposal };
  } catch (error) {
    console.error("proposeWizardSetupContent error:", error);

    return {
      status: "skipped",
      reason: "Could not generate a suggestion right now. You can continue typing manually.",
    };
  }
}
