import { createAdminClient } from "@/lib/supabase/admin";
import type { Appointment } from "@/lib/scheduling/types";

/**
 * Maps DB appointment rows into app-friendly appointment objects.
 */
function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    tenantSlug: row.tenant_slug,
    leadId: row.lead_id,
    status: row.status,

    appointmentPreference: row.appointment_preference ?? null,
    appointmentType: row.appointment_type ?? null,
    address: row.address ?? null,
    title: row.title ?? null,
    description: row.description ?? null,
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
 * Get the latest active appointment for a lead.
 *
 * Important:
 * - cancelled/completed/no_show appointments should not drive the lead page UI
 * - this fixes the issue where cancelled appointment times still appeared
 */
export async function getLatestAppointmentByLeadId(
  leadId: string
): Promise<Appointment | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("lead_id", leadId)
    .in("status", [
      "requested",
      "pending_confirmation",
      "confirmed",
      "reschedule_requested",
      "cancel_requested",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching latest active appointment:", error.message);
    return null;
  }

  return data ? mapAppointment(data) : null;
}