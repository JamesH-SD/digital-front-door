import type {
  CalendarAvailabilitySlot,
  CalendarConnection,
  CalendarEventRecord,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "@/lib/calendar/types";
import {
  buildGoogleTokenExpiryIso,
  refreshGoogleAccessToken,
} from "@/lib/calendar/googleOAuth";
import { updateCalendarConnection } from "@/lib/calendar/calendarConnectionService";

/**
 * Parse an ISO datetime safely.
 *
 * Why this exists:
 * - avoids duplicating date validation
 * - gives clearer failures when inputs are malformed
 */
function requireValidIsoDate(value: string, label: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO datetime for ${label}: ${value}`);
  }

  return date;
}

/**
 * Decide whether an access token should be refreshed before use.
 *
 * Current behavior:
 * - refresh if the expiry is missing or already near expiration
 * - uses a small safety buffer so we do not race an imminent expiry
 */
function shouldRefreshToken(tokenExpiresAt?: string | null) {
  if (!tokenExpiresAt) {
    return false;
  }

  const expiresAt = new Date(tokenExpiresAt);

  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }

  const now = Date.now();
  const refreshBufferMs = 5 * 60 * 1000; // 5 minutes

  return expiresAt.getTime() - now <= refreshBufferMs;
}

/**
 * Ensure we have a valid access token for Google Calendar calls.
 *
 * Why this exists:
 * - access tokens expire regularly
 * - refresh-token support should live close to the provider adapter
 * - later calendar actions should not each implement token refresh
 *
 * Behavior:
 * - if token is still valid, use it
 * - if token is near expiry and a refresh token exists, refresh it
 * - if Google later returns 401 anyway, callers may retry once
 */
async function getUsableGoogleAccessToken(
  connection: CalendarConnection
): Promise<{ accessToken: string; connection: CalendarConnection }> {
  if (!connection.accessToken) {
    throw new Error("Google calendar connection is missing an access token.");
  }

  if (!shouldRefreshToken(connection.tokenExpiresAt)) {
    return {
      accessToken: connection.accessToken,
      connection,
    };
  }

  if (!connection.refreshToken) {
    return {
      accessToken: connection.accessToken,
      connection,
    };
  }

  const refreshed = await refreshGoogleAccessToken(connection.refreshToken);

  const updatedConnection = await updateCalendarConnection(connection.id, {
    accessToken: refreshed.access_token,
    tokenExpiresAt: buildGoogleTokenExpiryIso(refreshed.expires_in),
  });

  return {
    accessToken: refreshed.access_token,
    connection: updatedConnection,
  };
}

/**
 * Build a Google Calendar API request with bearer auth.
 *
 * Important:
 * - this helper is provider-specific on purpose
 * - business rules should not live here
 */
async function googleFetch(
  accessToken: string,
  url: string,
  init?: RequestInit
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const raw = await response.text();

  let parsed: any = null;

  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = raw;
  }

  if (!response.ok) {
    const error = new Error(
      typeof parsed?.error?.message === "string"
        ? parsed.error.message
        : `Google Calendar API request failed with status ${response.status}`
    ) as Error & { status?: number };

    error.status = response.status;

    console.error("Google Calendar API error:", parsed);
    throw error;
  }

  return parsed;
}

/**
 * Run a Google API request with automatic token handling.
 *
 * Behavior:
 * - uses current token if valid
 * - refreshes token preemptively when near expiry
 * - retries once on 401 if a refresh token exists
 */
async function googleFetchWithConnection(input: {
  connection: CalendarConnection;
  url: string;
  init?: RequestInit;
}) {
  let usable = await getUsableGoogleAccessToken(input.connection);

  try {
    return await googleFetch(usable.accessToken, input.url, input.init);
  } catch (error: any) {
    const is401 = error?.status === 401;

    if (!is401 || !usable.connection.refreshToken) {
      throw error;
    }

    const refreshed = await refreshGoogleAccessToken(
      usable.connection.refreshToken
    );

    const updatedConnection = await updateCalendarConnection(
      usable.connection.id,
      {
        accessToken: refreshed.access_token,
        tokenExpiresAt: buildGoogleTokenExpiryIso(refreshed.expires_in),
      }
    );

    return googleFetch(refreshed.access_token, input.url, input.init);
  }
}

/**
 * Expand busy periods into free availability slots.
 *
 * Current v1 behavior:
 * - assumes the provided range is the working window we care about
 * - subtracts busy intervals returned by Google
 * - only returns slots that are at least minSlotMinutes long
 *
 * Notes:
 * - this is intentionally simple for now
 * - later we can add office hours, buffers, travel time, etc.
 */
function buildFreeSlotsFromBusyPeriods(input: {
  fromDate: Date;
  toDate: Date;
  busy: Array<{ start: string; end: string }>;
  timezone: string;
  minSlotMinutes?: number;
}): CalendarAvailabilitySlot[] {
  const { fromDate, toDate, busy, timezone, minSlotMinutes = 30 } = input;

  const busyRanges = busy
    .map((range) => ({
      start: new Date(range.start),
      end: new Date(range.end),
    }))
    .filter(
      (range) =>
        !Number.isNaN(range.start.getTime()) &&
        !Number.isNaN(range.end.getTime()) &&
        range.end > range.start
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const mergedBusy: Array<{ start: Date; end: Date }> = [];

  for (const range of busyRanges) {
    const last = mergedBusy[mergedBusy.length - 1];

    if (!last || range.start > last.end) {
      mergedBusy.push({ ...range });
      continue;
    }

    if (range.end > last.end) {
      last.end = range.end;
    }
  }

  const freeSlots: CalendarAvailabilitySlot[] = [];
  let cursor = new Date(fromDate);

  for (const range of mergedBusy) {
    if (range.start > cursor) {
      const diffMinutes =
        (range.start.getTime() - cursor.getTime()) / (1000 * 60);

      if (diffMinutes >= minSlotMinutes) {
        freeSlots.push({
          startAt: cursor.toISOString(),
          endAt: range.start.toISOString(),
          timezone,
        });
      }
    }

    if (range.end > cursor) {
      cursor = new Date(range.end);
    }
  }

  if (toDate > cursor) {
    const diffMinutes = (toDate.getTime() - cursor.getTime()) / (1000 * 60);

    if (diffMinutes >= minSlotMinutes) {
      freeSlots.push({
        startAt: cursor.toISOString(),
        endAt: toDate.toISOString(),
        timezone,
      });
    }
  }

  return freeSlots;
}

/**
 * Get free availability from a connected Google calendar.
 *
 * Current v1 behavior:
 * - uses Google FreeBusy API for the selected calendar
 * - returns free slots within the requested time range
 * - automatically refreshes access token when needed
 */
export async function getGoogleCalendarAvailability(input: {
  connection: CalendarConnection;
  fromIso: string;
  toIso: string;
  timezone: string;
  minSlotMinutes?: number;
}): Promise<CalendarAvailabilitySlot[]> {
  const { connection, fromIso, toIso, timezone, minSlotMinutes = 30 } = input;

  if (!connection.calendarId) {
    throw new Error("Google calendar connection is missing a calendarId.");
  }

  const fromDate = requireValidIsoDate(fromIso, "fromIso");
  const toDate = requireValidIsoDate(toIso, "toIso");

  if (toDate <= fromDate) {
    throw new Error("toIso must be later than fromIso.");
  }

  const result = await googleFetchWithConnection({
    connection,
    url: "https://www.googleapis.com/calendar/v3/freeBusy",
    init: {
      method: "POST",
      body: JSON.stringify({
        timeMin: fromDate.toISOString(),
        timeMax: toDate.toISOString(),
        timeZone: timezone,
        items: [{ id: connection.calendarId }],
      }),
    },
  });

  const busy =
    result?.calendars?.[connection.calendarId]?.busy &&
    Array.isArray(result.calendars[connection.calendarId].busy)
      ? result.calendars[connection.calendarId].busy
      : [];

  return buildFreeSlotsFromBusyPeriods({
    fromDate,
    toDate,
    busy,
    timezone,
    minSlotMinutes,
  });
}

/**
 * Create a Google Calendar event.
 *
 * This is the booking write-path foundation.
 */
export async function createGoogleCalendarEvent(
  input: {
    connection: CalendarConnection;
  } & CreateCalendarEventInput
): Promise<CalendarEventRecord> {
  const { connection, ...eventInput } = input;

  const result = await googleFetchWithConnection({
    connection,
    url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      eventInput.calendarId
    )}/events`,
    init: {
      method: "POST",
      body: JSON.stringify({
        summary: eventInput.title,
        description: eventInput.description ?? undefined,
        location: eventInput.location ?? undefined,
        start: {
          dateTime: eventInput.startAt,
          timeZone: eventInput.timezone,
        },
        end: {
          dateTime: eventInput.endAt,
          timeZone: eventInput.timezone,
        },
        attendees: eventInput.attendeeEmail
          ? [{ email: eventInput.attendeeEmail }]
          : undefined,
      }),
    },
  });

  return {
    provider: "google",
    calendarId: eventInput.calendarId,
    eventId: result.id,
    startAt: result.start?.dateTime ?? eventInput.startAt,
    endAt: result.end?.dateTime ?? eventInput.endAt,
    timezone: result.start?.timeZone ?? eventInput.timezone,
    htmlLink: result.htmlLink ?? null,
  };
}

/**
 * Update an existing Google Calendar event.
 *
 * Later this will power true reschedule flows.
 */
export async function updateGoogleCalendarEvent(
  input: {
    connection: CalendarConnection;
  } & UpdateCalendarEventInput
): Promise<CalendarEventRecord> {
  const { connection, ...eventInput } = input;

  const current = await googleFetchWithConnection({
    connection,
    url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      eventInput.calendarId
    )}/events/${encodeURIComponent(eventInput.eventId)}`,
  });

  const result = await googleFetchWithConnection({
    connection,
    url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      eventInput.calendarId
    )}/events/${encodeURIComponent(eventInput.eventId)}`,
    init: {
      method: "PUT",
      body: JSON.stringify({
        ...current,
        summary: eventInput.title ?? current.summary,
        description:
          eventInput.description !== undefined
            ? eventInput.description
            : current.description,
        location:
          eventInput.location !== undefined
            ? eventInput.location
            : current.location,
        start:
          eventInput.startAt || eventInput.timezone
            ? {
                dateTime: eventInput.startAt ?? current.start?.dateTime,
                timeZone: eventInput.timezone ?? current.start?.timeZone,
              }
            : current.start,
        end:
          eventInput.endAt || eventInput.timezone
            ? {
                dateTime: eventInput.endAt ?? current.end?.dateTime,
                timeZone: eventInput.timezone ?? current.end?.timeZone,
              }
            : current.end,
      }),
    },
  });

  return {
    provider: "google",
    calendarId: eventInput.calendarId,
    eventId: result.id,
    startAt: result.start?.dateTime,
    endAt: result.end?.dateTime,
    timezone: result.start?.timeZone,
    htmlLink: result.htmlLink ?? null,
  };
}

/**
 * Cancel/delete a Google Calendar event.
 *
 * Current v1 behavior:
 * - permanently deletes the event from the target calendar
 * - later we may support softer cancellation semantics if needed
 */
export async function cancelGoogleCalendarEvent(input: {
  connection: CalendarConnection;
  calendarId: string;
  eventId: string;
}): Promise<void> {
  await googleFetchWithConnection({
    connection: input.connection,
    url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      input.calendarId
    )}/events/${encodeURIComponent(input.eventId)}`,
    init: {
      method: "DELETE",
    },
  });
}