import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "@/lib/scheduling/types";

/**
 * Convert a raw DB row into the application-facing Appointment shape.
 *
 * Why this exists:
 * - isolates DB column names here
 * - keeps the rest of the app working with consistent field names
 * - gives us one place to normalize future appointment changes
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
 * Normalize optional strings so we store null instead of empty strings.
 */
function normalizeNullableString(value?: string | null) {
  if (typeof value !== "string") return value ?? null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function getAppointmentById(
  appointmentId: string
): Promise<Appointment | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .single();

  if (error) {
    console.error("Error fetching appointment:", error.message);
    return null;
  }

  return data ? mapAppointment(data) : null;
}

export async function getAppointmentsByLeadId(
  leadId: string
): Promise<Appointment[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching lead appointments:", error.message);
    return [];
  }

  return (data ?? []).map(mapAppointment);
}

/**
 * Create a new appointment record.
 *
 * Current behavior:
 * - creates appointments in "requested" state first
 * - later workflows can confirm/reschedule/cancel them
 */
export async function createAppointment(
  input: CreateAppointmentInput
): Promise<Appointment> {
  const supabase = createAdminClient();

  const payload = {
    tenant_slug: input.tenantSlug,
    lead_id: input.leadId,
    status: "requested" satisfies AppointmentStatus,

    appointment_preference: normalizeNullableString(input.appointmentPreference),
    appointment_type: input.appointmentType ?? null,
    address: normalizeNullableString(input.address),
    title: normalizeNullableString(input.title),
    description: normalizeNullableString(input.description),
    notes: normalizeNullableString(input.notes),

    timezone: normalizeNullableString(input.timezone),

    source_channel: input.sourceChannel ?? "chat",
    created_by: input.createdBy ?? "system",

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("Error creating appointment:", error.message);
    throw error;
  }

  return mapAppointment(data);
}

/**
 * Update an appointment record.
 *
 * This is the central write path for status and scheduling changes.
 */
export async function updateAppointment(
  appointmentId: string,
  input: UpdateAppointmentInput
): Promise<Appointment> {
  const supabase = createAdminClient();

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if ("status" in input) payload.status = input.status;

  if ("appointmentPreference" in input) {
    payload.appointment_preference = normalizeNullableString(
      input.appointmentPreference
    );
  }

  if ("appointmentType" in input) {
    payload.appointment_type = input.appointmentType ?? null;
  }

  if ("address" in input) {
    payload.address = normalizeNullableString(input.address);
  }

  if ("title" in input) {
    payload.title = normalizeNullableString(input.title);
  }

  if ("description" in input) {
    payload.description = normalizeNullableString(input.description);
  }

  if ("notes" in input) {
    payload.notes = normalizeNullableString(input.notes);
  }

  if ("proposedStartAt" in input) {
    payload.proposed_start_at = input.proposedStartAt ?? null;
  }

  if ("proposedEndAt" in input) {
    payload.proposed_end_at = input.proposedEndAt ?? null;
  }

  if ("confirmedStartAt" in input) {
    payload.confirmed_start_at = input.confirmedStartAt ?? null;
  }

  if ("confirmedEndAt" in input) {
    payload.confirmed_end_at = input.confirmedEndAt ?? null;
  }

  if ("timezone" in input) {
    payload.timezone = normalizeNullableString(input.timezone);
  }

  if ("googleCalendarConnectionId" in input) {
    payload.google_calendar_connection_id =
      input.googleCalendarConnectionId ?? null;
  }

  if ("googleCalendarId" in input) {
    payload.google_calendar_id = normalizeNullableString(input.googleCalendarId);
  }

  if ("googleEventId" in input) {
    payload.google_event_id = normalizeNullableString(input.googleEventId);
  }

  if ("lastCustomerMessageAt" in input) {
    payload.last_customer_message_at = input.lastCustomerMessageAt ?? null;
  }

  if ("lastReminderSentAt" in input) {
    payload.last_reminder_sent_at = input.lastReminderSentAt ?? null;
  }

  const { data, error } = await supabase
    .from("appointments")
    .update(payload)
    .eq("id", appointmentId)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating appointment:", error.message);
    throw error;
  }

  return mapAppointment(data);
}

export async function requestAppointmentReschedule(
  appointmentId: string,
  appointmentPreference?: string | null
) {
  return updateAppointment(appointmentId, {
    status: "reschedule_requested",
    appointmentPreference: appointmentPreference ?? null,
    lastCustomerMessageAt: new Date().toISOString(),
  });
}

export async function requestAppointmentCancellation(appointmentId: string) {
  return updateAppointment(appointmentId, {
    status: "cancel_requested",
    lastCustomerMessageAt: new Date().toISOString(),
  });
}

export async function confirmAppointment(input: {
  appointmentId: string;
  confirmedStartAt: string;
  confirmedEndAt: string;
  timezone: string;
  googleCalendarConnectionId?: string | null;
  googleCalendarId?: string | null;
  googleEventId?: string | null;
}) {
  return updateAppointment(input.appointmentId, {
    status: "confirmed",
    confirmedStartAt: input.confirmedStartAt,
    confirmedEndAt: input.confirmedEndAt,
    timezone: input.timezone,
    googleCalendarConnectionId: input.googleCalendarConnectionId ?? null,
    googleCalendarId: input.googleCalendarId ?? null,
    googleEventId: input.googleEventId ?? null,
  });
}

export async function cancelAppointment(appointmentId: string) {
  return updateAppointment(appointmentId, {
    status: "cancelled",
  });
}