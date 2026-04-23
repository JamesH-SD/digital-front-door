export type CalendarProvider = "google";

export type CalendarConnection = {
  id: string;
  tenantSlug: string;

  provider: CalendarProvider;

  /**
   * The Google account email that owns the calendar connection.
   */
  externalAccountEmail?: string | null;

  /**
   * Calendar-specific identifiers.
   */
  calendarId: string;
  calendarName?: string | null;

  /**
   * OAuth token data.
   * These can stay nullable for now while we scaffold the architecture.
   */
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;

  isPrimary: boolean;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
};

export type CalendarAvailabilitySlot = {
  startAt: string;
  endAt: string;
  timezone: string;
};

export type CalendarEventRecord = {
  provider: CalendarProvider;
  calendarId: string;
  eventId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  htmlLink?: string | null;
};

export type CreateCalendarEventInput = {
  calendarId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  attendeeEmail?: string | null;
};

export type UpdateCalendarEventInput = {
  calendarId: string;
  eventId: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  startAt?: string;
  endAt?: string;
  timezone?: string;
};