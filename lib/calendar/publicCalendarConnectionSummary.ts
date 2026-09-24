import type { CalendarConnection } from "@/lib/calendar/types";

export type PublicCalendarConnectionSummary = {
  id: string;
  tenantSlug: string;
  provider: CalendarConnection["provider"];
  calendarId: string;
  calendarName?: string | null;
  externalAccountEmail?: string | null;
  isPrimary: boolean;
  isActive: boolean;
};

export function toPublicCalendarConnectionSummary(
  connection: CalendarConnection
): PublicCalendarConnectionSummary {
  return {
    id: connection.id,
    tenantSlug: connection.tenantSlug,
    provider: connection.provider,
    calendarId: connection.calendarId,
    calendarName: connection.calendarName ?? null,
    externalAccountEmail: connection.externalAccountEmail ?? null,
    isPrimary: connection.isPrimary,
    isActive: connection.isActive,
  };
}
