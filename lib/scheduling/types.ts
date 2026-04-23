/**
 * Appointment lifecycle status values.
 *
 * These states support:
 * - initial requests
 * - confirmation
 * - reschedule flows
 * - cancellations
 * - completion tracking
 */
export type AppointmentStatus =
  | "requested"
  | "pending_confirmation"
  | "confirmed"
  | "reschedule_requested"
  | "cancel_requested"
  | "cancelled"
  | "completed"
  | "no_show";

export type AppointmentSourceChannel = "chat" | "sms" | "email" | "admin";

export type AppointmentActor = "customer" | "ai" | "admin" | "system";

/**
 * Type of appointment being scheduled.
 *
 * call:
 * - remote / phone-only coordination
 * - no physical address required
 *
 * site_visit:
 * - in-person visit
 * - should include a physical address
 */
export type AppointmentType = "call" | "site_visit";

export type Appointment = {
  id: string;
  tenantSlug: string;
  leadId: string;

  status: AppointmentStatus;

  /**
   * Natural-language scheduling preference captured from chat/SMS/email.
   * Examples:
   * - "tomorrow after 11"
   * - "next Thursday morning"
   * - "before June 15"
   */
  appointmentPreference?: string | null;

  /**
   * Structured appointment context.
   *
   * These fields support:
   * - prefilled scheduling UI
   * - Google Calendar event generation
   * - future reminders / confirmations / notifications
   */
  appointmentType?: AppointmentType | null;
  address?: string | null;
  title?: string | null;
  description?: string | null;
  notes?: string | null;

  /**
   * Proposed time window (not yet fully confirmed).
   */
  proposedStartAt?: string | null;
  proposedEndAt?: string | null;

  /**
   * Confirmed appointment window.
   */
  confirmedStartAt?: string | null;
  confirmedEndAt?: string | null;

  /**
   * IANA timezone, ex: America/Los_Angeles
   */
  timezone?: string | null;

  sourceChannel?: AppointmentSourceChannel | null;
  createdBy?: AppointmentActor | null;

  /**
   * Calendar sync metadata.
   */
  googleCalendarConnectionId?: string | null;
  googleCalendarId?: string | null;
  googleEventId?: string | null;

  lastCustomerMessageAt?: string | null;
  lastReminderSentAt?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type CreateAppointmentInput = {
  tenantSlug: string;
  leadId: string;
  appointmentPreference?: string | null;
  appointmentType?: AppointmentType | null;
  address?: string | null;
  title?: string | null;
  description?: string | null;
  notes?: string | null;
  sourceChannel?: AppointmentSourceChannel;
  createdBy?: AppointmentActor;
  timezone?: string | null;
};

export type UpdateAppointmentInput = {
  status?: AppointmentStatus;
  appointmentPreference?: string | null;
  appointmentType?: AppointmentType | null;
  address?: string | null;
  title?: string | null;
  description?: string | null;
  notes?: string | null;
  proposedStartAt?: string | null;
  proposedEndAt?: string | null;
  confirmedStartAt?: string | null;
  confirmedEndAt?: string | null;
  timezone?: string | null;
  googleCalendarConnectionId?: string | null;
  googleCalendarId?: string | null;
  googleEventId?: string | null;
  lastCustomerMessageAt?: string | null;
  lastReminderSentAt?: string | null;
};

export type AppointmentTransition =
  | "request"
  | "propose"
  | "confirm"
  | "request_reschedule"
  | "request_cancel"
  | "cancel"
  | "complete"
  | "mark_no_show";

export function isTerminalAppointmentStatus(status: AppointmentStatus) {
  return status === "cancelled" || status === "completed" || status === "no_show";
}