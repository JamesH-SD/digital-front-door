import twilio from "twilio";

type SendSmsInput = {
  to: string;
  body: string;
};

export type SendSmsResult =
  | {
      status: "sent";
      sid: string;
      to: string;
    }
  | {
      status: "skipped";
      reason: string;
      to?: string;
    };

/**
 * Normalize a US phone number into E.164 format.
 *
 * Examples:
 * - 6195490891      -> +16195490891
 * - (619) 549-0891  -> +16195490891
 * - +16195490891    -> +16195490891
 *
 * Returns null if the value cannot be normalized safely.
 */
function normalizeUsPhoneToE164(input: string): string | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  if (/^\+1\d{10}$/.test(trimmed)) {
    return trimmed;
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  if (!digitsOnly) {
    return null;
  }

  let normalizedDigits = digitsOnly;

  if (normalizedDigits.length === 11 && normalizedDigits.startsWith("1")) {
    normalizedDigits = normalizedDigits.slice(1);
  }

  if (normalizedDigits.length !== 10) {
    return null;
  }

  return `+1${normalizedDigits}`;
}

/**
 * Send a single SMS message through Twilio.
 *
 * Behavior:
 * - In development (default): logs SMS instead of sending
 * - In production OR when SMS_ENABLED=true: sends real SMS via Twilio
 *
 * Environment variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 * - SMS_ENABLED (optional, "true" to force sending in dev)
 */
export async function sendSms({
  to,
  body,
}: SendSmsInput): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromPhone = process.env.TWILIO_PHONE_NUMBER?.trim();

  const isDev = process.env.NODE_ENV !== "production";
  const smsEnabled = process.env.SMS_ENABLED === "true";

  /**
   * DEV MODE:
   * If we're not in production and SMS is not explicitly enabled,
   * we DO NOT send real messages. We log instead.
   */
  if (isDev && !smsEnabled) {
    console.log("🚧 DEV MODE SMS (not sent):");
    console.log({
      to,
      body,
    });

    return {
      status: "skipped",
      reason: "SMS disabled in development mode",
      to,
    };
  }

  if (!accountSid || !authToken || !fromPhone) {
    return {
      status: "skipped",
      reason:
        "Twilio environment variables are missing. Expected TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
      to,
    };
  }

  const normalizedTo = normalizeUsPhoneToE164(to);

  if (!normalizedTo) {
    return {
      status: "skipped",
      reason: "Recipient phone number is missing or invalid.",
      to,
    };
  }

  const trimmedBody = body.trim();

  if (!trimmedBody) {
    return {
      status: "skipped",
      reason: "SMS body is empty.",
      to: normalizedTo,
    };
  }

  const client = twilio(accountSid, authToken);

  const message = await client.messages.create({
    from: fromPhone,
    to: normalizedTo,
    body: trimmedBody,
  });

  return {
    status: "sent",
    sid: message.sid,
    to: normalizedTo,
  };
}