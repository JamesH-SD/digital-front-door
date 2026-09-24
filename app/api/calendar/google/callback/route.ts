import { NextRequest } from "next/server";
import { handleGoogleOAuthCallbackRequest } from "@/lib/calendar/googleOAuthCallbackHandler";

/**
 * Canonical Google OAuth redirect target.
 *
 * Set GOOGLE_OAUTH_REDIRECT_URI to this path in each environment
 * (for example `/api/calendar/google/callback` on your app origin).
 */
export async function GET(request: NextRequest) {
  return handleGoogleOAuthCallbackRequest(request);
}
