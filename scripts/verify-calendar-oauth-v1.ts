import {
  appendQueryParams,
  normalizeSafeInternalReturnTo,
  onboardingCalendarOAuthReturnTo,
} from "../lib/calendar/safeOAuthReturnTo";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const fallback = "/admin/pauls/settings";

assert(
  normalizeSafeInternalReturnTo(
    onboardingCalendarOAuthReturnTo("pauls"),
    fallback
  ) === "/onboarding/pauls?step=calendar",
  "onboarding return path should pass validation"
);

assert(
  normalizeSafeInternalReturnTo("https://evil.com/phish", fallback) === fallback,
  "external absolute URLs must be rejected"
);

assert(
  normalizeSafeInternalReturnTo("//evil.com", fallback) === fallback,
  "protocol-relative URLs must be rejected"
);

assert(
  appendQueryParams("/onboarding/pauls?step=calendar", {
    calendar: "connected",
  }) === "/onboarding/pauls?step=calendar&calendar=connected",
  "appendQueryParams should preserve existing query"
);

console.log("verify-calendar-oauth-v1: OK");
