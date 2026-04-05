type StructuredLeadUpdate = {
  email?: string;
  invalidEmailAttempt?: boolean;
  address?: string;
  location?: string;
  timeline?: string;
  appointment?: string;
  customerUpdateFallback?: string;
};

function normalizeEmail(input: string): string | null {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function extractEmail(input: string): string | null {
  const match = input.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? normalizeEmail(match[0]) : null;
}

function looksLikeEmailAttempt(input: string): boolean {
  const normalized = input.trim().toLowerCase();

  if (normalized.includes("@")) {
    return true;
  }

  const emailIntentPatterns = [
    /^my email is\b/i,
    /^email is\b/i,
    /^email:\b/i,
    /^use email\b/i,
    /^you can email me at\b/i,
    /^send it to\b/i,
  ];

  return emailIntentPatterns.some((pattern) => pattern.test(normalized));
}

function extractValueWithPrefix(
  input: string,
  prefixes: string[]
): string | null {
  const normalized = input.trim();

  for (const prefix of prefixes) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escaped}\\s*(.+)$`, "i");
    const match = normalized.match(regex);

    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return null;
}

function looksLikeTimelineIntent(input: string): boolean {
  const normalized = input.trim().toLowerCase();

  const timelinePatterns = [
    /\bwant\s+to\s+get\s+it\s+done\b/,
    /\bwant\s+this\s+done\b/,
    /\bwould\s+like\s+it\s+done\b/,
    /\bwould\s+like\s+this\s+done\b/,
    /\bwant\s+to\s+start\b/,
    /\bwant\s+it\s+done\b/,
    /\bhoping\s+to\s+start\b/,
    /\bhoping\s+to\s+get\s+it\s+done\b/,
    /\bneed\s+this\s+done\b/,
    /\bneed\s+it\s+done\b/,
    /\blooking\s+to\s+start\b/,
    /\blooking\s+to\s+get\s+this\s+done\b/,
    /\bby\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/,
    /\baround\s+the\s+\d{1,2}(st|nd|rd|th)?\b/,
    /\bmid[- ]?(january|february|march|april|may|june|july|august|september|october|november|december)\b/,
    /\bearly[- ]?(january|february|march|april|may|june|july|august|september|october|november|december)\b/,
    /\blate[- ]?(january|february|march|april|may|june|july|august|september|october|november|december)\b/,
  ];

  return timelinePatterns.some((pattern) => pattern.test(normalized));
}

export function extractStructuredLeadUpdateFromMessage(
  message: string
): StructuredLeadUpdate {
  const trimmed = message.trim();

  if (!trimmed) {
    return {};
  }

  const rawEmailCandidate =
    extractValueWithPrefix(trimmed, [
      "my email is",
      "email is",
      "email:",
      "use email",
      "you can email me at",
      "send it to",
    ]) || trimmed;

  const normalizedEmail = extractEmail(trimmed) || normalizeEmail(rawEmailCandidate);

  if (normalizedEmail) {
    return { email: normalizedEmail };
  }

  if (looksLikeEmailAttempt(trimmed)) {
    return { invalidEmailAttempt: true };
  }

  const appointment = extractValueWithPrefix(trimmed, [
    "appointment is",
    "schedule me for",
    "you can come by",
    "come by",
    "available at",
    "available on",
    "set appointment for",
  ]);

  if (appointment) {
    return { appointment };
  }

  const address = extractValueWithPrefix(trimmed, [
    "my address is",
    "address is",
    "the address is",
    "job address is",
    "property address is",
  ]);

  if (address) {
    return { address };
  }

  const location = extractValueWithPrefix(trimmed, [
    "the project is in",
    "job is in",
    "located in",
    "we are in",
    "i am in",
    "city is",
  ]);

  if (location) {
    return { location };
  }

  const timeline = extractValueWithPrefix(trimmed, [
    "timeline is",
    "we want to start",
    "want to start",
    "hoping to start",
    "start date is",
    "we need this done",
    "need this done",
    "i want to get it done",
    "i want this done",
    "we'd like it done",
    "we would like it done",
    "looking to start",
  ]);

  if (timeline) {
    return { timeline };
  }

  if (looksLikeTimelineIntent(trimmed)) {
    return { timeline: trimmed };
  }

  return {
    customerUpdateFallback: trimmed,
  };
}