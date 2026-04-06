import { getTenantBySlug } from "@/lib/db/tenants";
import { sendSms, type SendSmsResult } from "@/lib/notifications/sendSms";
import type { Lead } from "@/lib/types/lead";

export type SendLeadNotificationResult =
  | {
      status: "sent";
      channel: "sms";
      to: string;
      sid: string;
    }
  | {
      status: "skipped";
      channel: "sms";
      reason: string;
      to?: string;
    };

/**
 * Format a phone number for human-readable display inside the SMS body.
 *
 * Examples:
 * - +16195490891 -> (619) 549-0891
 * - 6195490891   -> (619) 549-0891
 *
 * Falls back to the original value if it does not match a simple US pattern.
 */
function formatPhoneForDisplay(input?: string | null): string {
  if (!input || !input.trim()) {
    return "Not provided";
  }

  const digits = input.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7, 11);

    return `(${area}) ${prefix}-${line}`;
  }

  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6, 10);

    return `(${area}) ${prefix}-${line}`;
  }

  return input;
}

/**
 * Build the admin link sent inside the SMS notification.
 *
 * We prefer an absolute URL for production because the contractor will be
 * opening the link from their phone. If NEXT_PUBLIC_APP_URL is not configured,
 * we fall back to a relative path so local development still works.
 */
function buildLeadAdminUrl(tenantSlug: string, leadId: string): string {
  const path = `/admin/${tenantSlug}/leads/${leadId}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!appUrl) {
    return `https://yourdomain.com${path}`;
  }

  return `${appUrl.replace(/\/+$/, "")}${path}`;
}

/**
 * Build the lead notification message.
 *
 * The message is intentionally short and easy to scan so the contractor can
 * quickly see who the lead is, how to contact them, what they need, and where
 * to click next.
 */
function buildLeadNotificationMessage(lead: Lead): string {
  const leadLabel = lead.leadNumber?.trim() || lead.id;
  const customerName = lead.customerName?.trim() || "Unknown customer";
  const customerPhone = formatPhoneForDisplay(lead.phone);
  const projectType = lead.projectType?.trim() || "Not provided";
  const location = lead.location?.trim() || "Not provided";
  const timeline = lead.timeline?.trim() || "Not provided";
  const leadUrl = buildLeadAdminUrl(lead.tenantSlug, lead.id);

  return [
    `New lead received (${leadLabel})`,
    `Name: ${customerName}`,
    `Phone: ${customerPhone}`,
    `Project: ${projectType}`,
    `Location: ${location}`,
    `Timeline: ${timeline}`,
    `Open: ${leadUrl}`,
  ].join("\n");
}

/**
 * Send a contractor-facing notification when a new lead is created.
 *
 * Current behavior:
 * - looks up the tenant by slug
 * - uses the tenant's primaryPhone as the SMS destination
 * - sends a concise lead summary through Twilio
 *
 * Notes for future devs:
 * - this function is intentionally SMS-only for now
 * - email can be added later without changing the chat flow contract
 * - callers should treat skipped notifications as non-fatal so lead capture
 *   never fails just because a notification could not be delivered
 */
export async function sendLeadNotification(
  lead: Lead
): Promise<SendLeadNotificationResult> {
  const tenant = await getTenantBySlug(lead.tenantSlug);

  if (!tenant) {
    return {
      status: "skipped",
      channel: "sms",
      reason: `Tenant not found for slug "${lead.tenantSlug}".`,
    };
  }

  if (!tenant.primaryPhone || !tenant.primaryPhone.trim()) {
    return {
      status: "skipped",
      channel: "sms",
      reason: "Tenant primary phone is missing. SMS notification was not sent.",
    };
  }

  const body = buildLeadNotificationMessage(lead);

  const smsResult: SendSmsResult = await sendSms({
    to: tenant.primaryPhone,
    body,
  });

  if (smsResult.status === "sent") {
    return {
      status: "sent",
      channel: "sms",
      to: smsResult.to,
      sid: smsResult.sid,
    };
  }

  return {
    status: "skipped",
    channel: "sms",
    reason: smsResult.reason,
    to: smsResult.to,
  };
}