import { createClient } from "@/lib/supabase/server";
import type { Appointment } from "@/lib/scheduling/types";

/**
 * Convert a raw DB row into the application-facing Appointment shape.
 *
 * Why this exists:
 * - isolates DB column naming here
 * - keeps the rest of the app working with consistent field names
 * - reduces repeated mapping logic across scheduling files
 */
function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    tenantSlug: row.tenant_slug,
    leadId: row.lead_id,

    status: row.status,

    appointmentPreference: row.appointment_preference ?? null,
    notes: row.notes ?? null,

    proposedStartAt: row.proposed_start_at ?? null,
    proposedEndAt: row.proposed_end_at ?? null,

    confirmedStartAt: row.confirmed_start_at ?? null,
    confirmedEndAt: row.confirmed_end_at ?? null,

    timezone: row.timezone ?? null,

    sourceChannel: row.source_channel ?? null,
    createdBy: row.created_by ?? null,

    googleCalendarConnectionId: row.google_calendar_connection_id ?? null,
    googleCalendarId: row.google_calendar_id ?? null,
    googleEventId: row.google_event_id ?? null,

    lastCustomerMessageAt: row.last_customer_message_at ?? null,
    lastReminderSentAt: row.last_reminder_sent_at ?? null,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get the most recent appointment for a lead.
 *
 * This is useful because the current product flow will usually care
 * about the "active" appointment tied to the lead, not the full
 * appointment history every time.
 */
export async function getLatestAppointmentByLeadId(
  leadId: string
): Promise<Appointment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching latest appointment:", error.message);
    return null;
  }

  return data ? mapAppointment(data) : null;
}

/**
 * Get all appointments for a tenant.
 *
 * This is primarily for future admin views, reporting, reminder
 * workflows, and operational dashboards.
 */
export async function getAppointmentsByTenantSlug(
  tenantSlug: string
): Promise<Appointment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tenant appointments:", error.message);
    return [];
  }

  return (data ?? []).map(mapAppointment);
}

/**
 * Get appointments that need reminder processing.
 *
 * We are not wiring reminder jobs yet, but this query gives us a clean
 * place to start later without mixing reminder logic into unrelated files.
 */
export async function getConfirmedAppointmentsWithoutRecentReminder(input: {
  tenantSlug: string;
  reminderCutoffIso: string;
}): Promise<Appointment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("tenant_slug", input.tenantSlug)
    .eq("status", "confirmed")
    .or(
      `last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${input.reminderCutoffIso}`
    )
    .order("confirmed_start_at", { ascending: true });

  if (error) {
    console.error("Error fetching reminder candidates:", error.message);
    return [];
  }

  return (data ?? []).map(mapAppointment);
}