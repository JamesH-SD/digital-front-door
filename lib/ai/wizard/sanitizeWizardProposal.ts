const TAGLINE_MAX = 120;
const ABOUT_MAX = 800;

export function sanitizeWizardTaglineProposal(value: string): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (collapsed.length <= TAGLINE_MAX) {
    return collapsed;
  }

  return collapsed.slice(0, TAGLINE_MAX).trim();
}

export function sanitizeWizardAboutProposal(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= ABOUT_MAX) {
    return trimmed;
  }

  return trimmed.slice(0, ABOUT_MAX).trim();
}
