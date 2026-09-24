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

const SERVICE_LINE_MAX = 120;
const SERVICES_MAX_LINES = 15;

export function sanitizeWizardServicesProposal(value: string): string {
  const seen = new Set<string>();

  const lines = value
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-*•]+/, "").trim())
    .filter(Boolean)
    .map((line) =>
      line.length <= SERVICE_LINE_MAX
        ? line
        : line.slice(0, SERVICE_LINE_MAX).trim()
    )
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, SERVICES_MAX_LINES);

  return lines.join("\n");
}
