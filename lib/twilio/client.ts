import twilio from "twilio";

/**
 * Shared Twilio client factory.
 *
 * Why this exists:
 * - keeps Twilio initialization in one place
 * - makes notification code cleaner and easier to reuse later
 * - gives us one place to validate required env vars
 */

let cachedClient: ReturnType<typeof twilio> | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Returns a singleton Twilio client so we do not recreate it for every message.
 */
export function getTwilioClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const accountSid = getRequiredEnv("TWILIO_ACCOUNT_SID");
  const authToken = getRequiredEnv("TWILIO_AUTH_TOKEN");

  cachedClient = twilio(accountSid, authToken);
  return cachedClient;
}

/**
 * The Twilio number used as the sender for outbound SMS.
 */
export function getTwilioFromPhoneNumber() {
  return getRequiredEnv("TWILIO_PHONE_NUMBER");
}