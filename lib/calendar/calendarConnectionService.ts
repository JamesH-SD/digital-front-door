import { createAdminClient } from "@/lib/supabase/admin";
import type { CalendarConnection } from "@/lib/calendar/types";

/**
 * Convert a raw DB row into the application-facing CalendarConnection shape.
 *
 * Why this exists:
 * - keeps DB column naming isolated here
 * - gives us one place to normalize nullable fields
 * - makes future provider expansion easier
 */
function mapCalendarConnection(row: any): CalendarConnection {
  return {
    id: row.id,
    tenantSlug: row.tenant_slug,

    provider: row.provider,
    externalAccountEmail: row.external_account_email ?? null,

    calendarId: row.calendar_id,
    calendarName: row.calendar_name ?? null,

    accessToken: row.access_token ?? null,
    refreshToken: row.refresh_token ?? null,
    tokenExpiresAt: row.token_expires_at ?? null,

    isPrimary: row.is_primary ?? false,
    isActive: row.is_active ?? true,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Small helper to avoid storing empty strings in the DB.
 *
 * This keeps later comparisons cleaner and avoids treating ""
 * and null as two different business values.
 */
function normalizeNullableString(value?: string | null) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Get all active calendar connections for a tenant.
 *
 * Notes:
 * - we only support Google today, but this stays provider-agnostic
 * - ordering primary calendars first helps us choose a default later
 *
 * Important:
 * - this uses the admin client because calendar connection management
 *   is currently a trusted server-side admin workflow
 * - later, if you add real tenant auth + RLS policies, we can decide
 *   whether to keep this privileged or narrow it further
 */
export async function getActiveCalendarConnectionsByTenantSlug(
  tenantSlug: string
): Promise<CalendarConnection[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .eq("is_active", true)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching calendar connections:", error.message);
    return [];
  }

  return (data ?? []).map(mapCalendarConnection);
}

/**
 * Get the primary active calendar connection for a tenant.
 *
 * For v1 scheduling, this is the single connection the rest of the
 * system should use by default.
 */
export async function getPrimaryCalendarConnectionByTenantSlug(
  tenantSlug: string
): Promise<CalendarConnection | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("tenant_slug", tenantSlug)
    .eq("is_active", true)
    .eq("is_primary", true)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching primary calendar connection:", error.message);
    }

    return null;
  }

  return data ? mapCalendarConnection(data) : null;
}

/**
 * Get a specific calendar connection by its ID.
 *
 * This is useful later for:
 * - token refresh flows
 * - admin editing
 * - calendar event sync operations
 */
export async function getCalendarConnectionById(
  connectionId: string
): Promise<CalendarConnection | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching calendar connection by ID:", error.message);
    }

    return null;
  }

  return data ? mapCalendarConnection(data) : null;
}

/**
 * Create a calendar connection record.
 *
 * We are intentionally keeping this explicit and small.
 * OAuth/token wiring comes later, but the DB contract is ready now.
 */
export async function createCalendarConnection(input: {
  tenantSlug: string;
  provider: "google";
  calendarId: string;
  calendarName?: string | null;
  externalAccountEmail?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
}): Promise<CalendarConnection> {
  const supabase = createAdminClient();

  const payload = {
    tenant_slug: input.tenantSlug,
    provider: input.provider,

    external_account_email: normalizeNullableString(input.externalAccountEmail),

    calendar_id: input.calendarId,
    calendar_name: normalizeNullableString(input.calendarName),

    access_token: normalizeNullableString(input.accessToken),
    refresh_token: normalizeNullableString(input.refreshToken),
    token_expires_at: input.tokenExpiresAt ?? null,

    is_primary: input.isPrimary ?? false,
    is_active: input.isActive ?? true,

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("calendar_connections")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("Error creating calendar connection:", error.message);
    throw error;
  }

  return mapCalendarConnection(data);
}

/**
 * Update an existing calendar connection.
 *
 * Important:
 * - keep updates narrow and explicit
 * - do not silently change multiple rows here unless the business
 *   rule clearly belongs in this service
 */
export async function updateCalendarConnection(
  connectionId: string,
  input: {
    calendarName?: string | null;
    externalAccountEmail?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    tokenExpiresAt?: string | null;
    isPrimary?: boolean;
    isActive?: boolean;
  }
): Promise<CalendarConnection> {
  const supabase = createAdminClient();

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if ("calendarName" in input) {
    payload.calendar_name = normalizeNullableString(input.calendarName);
  }

  if ("externalAccountEmail" in input) {
    payload.external_account_email = normalizeNullableString(
      input.externalAccountEmail
    );
  }

  if ("accessToken" in input) {
    payload.access_token = normalizeNullableString(input.accessToken);
  }

  if ("refreshToken" in input) {
    payload.refresh_token = normalizeNullableString(input.refreshToken);
  }

  if ("tokenExpiresAt" in input) {
    payload.token_expires_at = input.tokenExpiresAt ?? null;
  }

  if ("isPrimary" in input) {
    payload.is_primary = input.isPrimary;
  }

  if ("isActive" in input) {
    payload.is_active = input.isActive;
  }

  const { data, error } = await supabase
    .from("calendar_connections")
    .update(payload)
    .eq("id", connectionId)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating calendar connection:", error.message);
    throw error;
  }

  return mapCalendarConnection(data);
}

/**
 * Save or replace the primary calendar connection for a tenant.
 *
 * Why this exists:
 * - v1 should behave as "one primary calendar per tenant"
 * - if Hughes General connects a calendar, that connection becomes
 *   the tenant's default scheduling calendar
 *
 * Behavior:
 * - if a matching active connection already exists for the same
 *   tenant/provider/calendarId, we update it and mark it primary
 * - otherwise we create a new active primary connection
 * - all other active connections for the tenant are demoted from
 *   primary so there is only one primary at a time
 */
export async function upsertPrimaryCalendarConnection(input: {
  tenantSlug: string;
  provider: "google";
  calendarId: string;
  calendarName?: string | null;
  externalAccountEmail?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
}): Promise<CalendarConnection> {
  const supabase = createAdminClient();

  // Step 1: demote any existing primary connections for this tenant.
  // We keep them active, but remove primary status so the tenant
  // ends up with one clear default calendar.
  const { error: demoteError } = await supabase
    .from("calendar_connections")
    .update({
      is_primary: false,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_slug", input.tenantSlug)
    .eq("is_primary", true);

  if (demoteError) {
    console.error(
      "Error demoting existing primary calendar connections:",
      demoteError.message
    );
    throw demoteError;
  }

  // Step 2: see if this exact provider/calendar already exists for the tenant.
  const { data: existing, error: existingError } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("tenant_slug", input.tenantSlug)
    .eq("provider", input.provider)
    .eq("calendar_id", input.calendarId)
    .maybeSingle();

  if (existingError) {
    console.error(
      "Error checking existing calendar connection:",
      existingError.message
    );
    throw existingError;
  }

  // Step 3: if it exists, update it and make it the primary connection.
  if (existing) {
    return updateCalendarConnection(existing.id, {
      calendarName: input.calendarName ?? null,
      externalAccountEmail: input.externalAccountEmail ?? null,
      accessToken: input.accessToken ?? null,
      refreshToken: input.refreshToken ?? null,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      isPrimary: true,
      isActive: true,
    });
  }

  // Step 4: otherwise create a brand-new primary connection.
  return createCalendarConnection({
    tenantSlug: input.tenantSlug,
    provider: input.provider,
    calendarId: input.calendarId,
    calendarName: input.calendarName ?? null,
    externalAccountEmail: input.externalAccountEmail ?? null,
    accessToken: input.accessToken ?? null,
    refreshToken: input.refreshToken ?? null,
    tokenExpiresAt: input.tokenExpiresAt ?? null,
    isPrimary: true,
    isActive: true,
  });
}