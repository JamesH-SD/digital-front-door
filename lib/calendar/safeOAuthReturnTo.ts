const SAFE_RETURN_BASE = "https://contactor.invalid";

/**
 * Accept only same-origin-style relative paths to prevent open redirects.
 */
export function normalizeSafeInternalReturnTo(
  returnTo: string | null | undefined,
  fallback: string
): string {
  if (typeof returnTo !== "string") {
    return fallback;
  }

  const trimmed = returnTo.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, SAFE_RETURN_BASE);

    if (parsed.origin !== SAFE_RETURN_BASE) {
      return fallback;
    }

    if (!parsed.pathname.startsWith("/")) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}

export function appendQueryParams(
  returnTo: string,
  params: Record<string, string>
): string {
  const parsed = new URL(returnTo, SAFE_RETURN_BASE);

  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, value);
  }

  return `${parsed.pathname}${parsed.search}`;
}

export function defaultCalendarOAuthReturnTo(tenantSlug: string) {
  return `/admin/${tenantSlug}/settings`;
}

export function onboardingCalendarOAuthReturnTo(tenantSlug: string) {
  return `/onboarding/${tenantSlug}?step=calendar`;
}
