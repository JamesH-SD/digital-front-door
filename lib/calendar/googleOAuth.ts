/**
 * Google OAuth helpers for server-side calendar connection flows.
 *
 * Why this file exists:
 * - keeps Google-specific OAuth logic out of route handlers
 * - makes later provider expansion cleaner
 * - gives us one place to manage token exchange and token refresh
 *
 * Important:
 * - this file is intentionally provider-specific
 * - business logic (tenant rules / primary connection rules) should
 *   remain in services/routes, not in these helpers
 */

type GoogleTokenExchangeResult = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
};

type GoogleRefreshTokenResult = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export type GoogleCalendarListItem = {
  id: string;
  summary: string;
  primary?: boolean;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Build the tenant-scoped OAuth start URL.
 *
 * Notes:
 * - state carries the tenant context through the Google redirect
 * - prompt=consent helps ensure refresh token issuance during dev
 * - access_type=offline is required when we want refresh tokens
 */
export function buildGoogleOAuthUrl(input: {
  tenantSlug: string;
  returnTo?: string;
}) {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const redirectUri = getRequiredEnv("GOOGLE_OAUTH_REDIRECT_URI");

  const statePayload = {
    tenantSlug: input.tenantSlug,
    returnTo: input.returnTo || `/admin/${input.tenantSlug}/settings`,
  };

  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/calendar",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Decode the tenant-scoped state returned from Google.
 *
 * We keep this small for now:
 * - tenantSlug is all we need in v1
 * - later we can add stronger CSRF/session protections if needed
 */
export function decodeGoogleOAuthState(state: string): {
    tenantSlug: string;
    returnTo?: string;
  } {
  try {
    const raw = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(raw);

    if (!parsed?.tenantSlug || typeof parsed.tenantSlug !== "string") {
      throw new Error("Invalid Google OAuth state payload.");
    }

    return {
      tenantSlug: parsed.tenantSlug,
      returnTo:
        typeof parsed.returnTo === "string" ? parsed.returnTo : undefined,
    };
  } catch (error) {
    console.error("Failed to decode Google OAuth state:", error);
    throw new Error("Invalid Google OAuth state.");
  }
}

/**
 * Exchange the Google authorization code for tokens.
 *
 * Returns:
 * - access token
 * - refresh token (when granted)
 * - expiry information
 */
export async function exchangeGoogleCodeForTokens(
  code: string
): Promise<GoogleTokenExchangeResult> {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = getRequiredEnv("GOOGLE_OAUTH_REDIRECT_URI");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const raw = await response.text();

  let parsed: any;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Google token exchange returned non-JSON output.");
  }

  if (!response.ok) {
    console.error("Google token exchange failed:", parsed);
    throw new Error(
      parsed?.error_description || parsed?.error || "Failed to exchange Google auth code."
    );
  }

  return parsed as GoogleTokenExchangeResult;
}

/**
 * Refresh an expired Google access token using the stored refresh token.
 *
 * Why this exists:
 * - access tokens are short-lived
 * - refresh tokens let us keep the calendar connection usable
 * - this is required for a real long-running scheduling system
 */
export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<GoogleRefreshTokenResult> {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const raw = await response.text();

  let parsed: any;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Google token refresh returned non-JSON output.");
  }

  if (!response.ok) {
    console.error("Google token refresh failed:", parsed);
    throw new Error(
      parsed?.error_description || parsed?.error || "Failed to refresh Google access token."
    );
  }

  return parsed as GoogleRefreshTokenResult;
}

/**
 * Convert expires_in seconds into an ISO timestamp.
 *
 * This keeps token expiry easy to store and compare later.
 */
export function buildGoogleTokenExpiryIso(expiresInSeconds: number) {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}

/**
 * Fetch available calendars from Google using the current access token.
 *
 * We use this immediately after OAuth so we can choose the best default
 * calendar to store for the tenant.
 */
export async function listGoogleCalendars(
  accessToken: string
): Promise<GoogleCalendarListItem[]> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const raw = await response.text();

  let parsed: any;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Google calendar list returned non-JSON output.");
  }

  if (!response.ok) {
    console.error("Google calendar list failed:", parsed);
    throw new Error(parsed?.error?.message || "Failed to load Google calendars.");
  }

  return Array.isArray(parsed?.items)
    ? parsed.items.map((item: any) => ({
        id: item.id,
        summary: item.summary ?? item.id,
        primary: item.primary ?? false,
      }))
    : [];
}

/**
 * Select the best default calendar from Google's calendar list.
 *
 * Current v1 behavior:
 * - prefer the explicitly marked primary Google calendar
 * - otherwise fall back to the first available calendar
 */
export function pickPrimaryGoogleCalendar(
  calendars: GoogleCalendarListItem[]
): GoogleCalendarListItem | null {
  if (!calendars.length) {
    return null;
  }

  const primary = calendars.find((calendar) => calendar.primary);

  return primary ?? calendars[0];
}