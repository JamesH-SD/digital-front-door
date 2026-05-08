import { getPrimaryCalendarConnectionByTenantSlug } from "@/lib/calendar/calendarConnectionService";
import { getGoogleCalendarAvailability } from "@/lib/calendar/googleCalendar";
import type { CalendarAvailabilitySlot } from "@/lib/calendar/types";
import { getTenantBySlug } from "@/lib/db/tenants";
import type { Tenant } from "@/lib/types/tenant";
import { getTenantConfig } from "@/lib/config/getTenantConfig";

/**
 * A single customer-bookable appointment slot.
 *
 * Important:
 * - startAt/endAt stay ISO strings for booking/system use
 * - displayTime is for chat/UI presentation only
 * - the AI should NEVER invent or modify these times
 */
export type BookableAppointmentSlot = {
  startAt: string;
  endAt: string;
  timezone: string;
  displayTime: string;
};

/**
 * A grouped day of appointment availability.
 *
 * This is the shape the scheduling engine should consume.
 * The AI response layer can turn this into natural language.
 */
export type BookableAppointmentDay = {
  dateKey: string;
  displayLabel: string;
  slots: BookableAppointmentSlot[];
};

export type GetBookableAppointmentSlotsResult = {
  timezone: string;
  slotMinutes: number;
  days: BookableAppointmentDay[];
};

type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

const DEFAULT_TIMEZONE = "America/Los_Angeles";
const DEFAULT_SLOT_MINUTES = 60;
const DEFAULT_LOOKAHEAD_DAYS = 14;
const DEFAULT_MAX_DAYS_TO_RETURN = 7;

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type DayKey = (typeof DAY_KEYS)[number];

/**
 * Default contractor hours.
 *
 * Why:
 * - keeps scheduling usable even before tenant hours are configured
 * - matches the current product assumption used elsewhere in the app
 */
const DEFAULT_HOURS: Record<DayKey, DayHours> = {
  sunday: { open: "", close: "", closed: true },
  monday: { open: "08:00", close: "17:00", closed: false },
  tuesday: { open: "08:00", close: "17:00", closed: false },
  wednesday: { open: "08:00", close: "17:00", closed: false },
  thursday: { open: "08:00", close: "17:00", closed: false },
  friday: { open: "08:00", close: "17:00", closed: false },
  saturday: { open: "", close: "", closed: true },
};

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

/**
 * Normalize tenant hours into a predictable 7-day object.
 *
 * Tenant hours currently come from SettingsForm as:
 * {
 *   monday: { open: "08:00", close: "17:00", closed: false }
 * }
 */
function normalizeTenantHours(hours?: Tenant["hours"]): Record<DayKey, DayHours> {
  const normalized: Record<DayKey, DayHours> = { ...DEFAULT_HOURS };

  if (!hours || typeof hours !== "object") {
    return normalized;
  }

  for (const day of DAY_KEYS) {
    const raw = hours[day];

    if (!raw || typeof raw !== "object") {
      continue;
    }

    const open = isValidTime(raw.open) ? raw.open : normalized[day].open;
    const close = isValidTime(raw.close) ? raw.close : normalized[day].close;

    normalized[day] = {
      open,
      close,
      closed:
        typeof raw.closed === "boolean" ? raw.closed : normalized[day].closed,
    };
  }

  return normalized;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid dateKey: ${dateKey}`);
  }

  return { year, month, day };
}

function addDaysToDateKey(dateKey: string, days: number) {
  const { year, month, day } = parseDateKey(dateKey);

  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));

  return date.toISOString().slice(0, 10);
}

/**
 * Return YYYY-MM-DD for an instant in a specific timezone.
 *
 * Why:
 * - using date.toISOString().slice(0, 10) gives UTC date, not tenant-local date
 * - scheduling must group by the tenant's local calendar day
 */
function getDateKeyInTimezone(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getWeekdayKey(dateKey: string, timezone: string): DayKey {
  const { year, month, day } = parseDateKey(dateKey);

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  })
    .format(date)
    .toLowerCase() as DayKey;

  return weekday;
}

/**
 * Calculate the timezone offset for a UTC instant.
 *
 * This is the key helper that prevents the 1AM / 2AM bug.
 * We do NOT use setHours() because that uses the server/browser timezone.
 */
function getTimezoneOffsetMs(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  const utcForLocalParts = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second
  );

  return utcForLocalParts - date.getTime();
}

/**
 * Convert tenant-local wall time into a real UTC Date.
 *
 * Example:
 * - dateKey: "2026-05-04"
 * - time: "08:00"
 * - timezone: "America/Los_Angeles"
 *
 * Result:
 * - the real UTC instant for 8:00 AM Pacific on that date
 */
function zonedWallTimeToUtcDate(input: {
  dateKey: string;
  time: string;
  timezone: string;
}) {
  const { year, month, day } = parseDateKey(input.dateKey);
  const [hour, minute] = input.time.split(":").map(Number);

  const wallTimeAsUtc = new Date(
    Date.UTC(year, month - 1, day, hour, minute, 0)
  );

  const offsetMs = getTimezoneOffsetMs(wallTimeAsUtc, input.timezone);

  return new Date(wallTimeAsUtc.getTime() - offsetMs);
}

function formatDayLabel(dateKey: string, timezone: string) {
  const { year, month, day } = parseDateKey(dateKey);

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatSlotTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getSchedulingRange(input: {
  timezone: string;
  fromIso?: string;
  lookaheadDays: number;
}) {
  const now = input.fromIso ? new Date(input.fromIso) : new Date();

  if (Number.isNaN(now.getTime())) {
    throw new Error(`Invalid fromIso: ${input.fromIso}`);
  }

  const fromDateKey = getDateKeyInTimezone(now, input.timezone);
  const toDateKey = addDaysToDateKey(fromDateKey, input.lookaheadDays);

  const from = zonedWallTimeToUtcDate({
    dateKey: fromDateKey,
    time: "00:00",
    timezone: input.timezone,
  });

  const to = zonedWallTimeToUtcDate({
    dateKey: toDateKey,
    time: "23:59",
    timezone: input.timezone,
  });

  return {
    now,
    from,
    to,
    fromDateKey,
    toDateKey,
  };
}

function rangesOverlap(input: {
  firstStart: Date;
  firstEnd: Date;
  secondStart: Date;
  secondEnd: Date;
}) {
  return input.firstStart < input.secondEnd && input.secondStart < input.firstEnd;
}

function maxDate(a: Date, b: Date) {
  return a > b ? a : b;
}

function minDate(a: Date, b: Date) {
  return a < b ? a : b;
}

/**
 * Split Google free windows into tenant-hour appointment slots.
 *
 * Google gives us broad free windows.
 * This function intersects those windows with tenant business hours.
 */
function buildSlotsForDay(input: {
  dateKey: string;
  timezone: string;
  dayHours: DayHours;
  freeWindows: CalendarAvailabilitySlot[];
  slotMinutes: number;
  now: Date;
}): BookableAppointmentSlot[] {
  if (input.dayHours.closed) {
    return [];
  }

  if (!isValidTime(input.dayHours.open) || !isValidTime(input.dayHours.close)) {
    return [];
  }

  const businessStart = zonedWallTimeToUtcDate({
    dateKey: input.dateKey,
    time: input.dayHours.open,
    timezone: input.timezone,
  });

  const businessEnd = zonedWallTimeToUtcDate({
    dateKey: input.dateKey,
    time: input.dayHours.close,
    timezone: input.timezone,
  });

  if (businessEnd <= businessStart) {
    return [];
  }

  const slots: BookableAppointmentSlot[] = [];
  const slotMs = input.slotMinutes * 60_000;

  for (const window of input.freeWindows) {
    const windowStart = new Date(window.startAt);
    const windowEnd = new Date(window.endAt);

    if (
      Number.isNaN(windowStart.getTime()) ||
      Number.isNaN(windowEnd.getTime()) ||
      windowEnd <= windowStart
    ) {
      continue;
    }

    if (
      !rangesOverlap({
        firstStart: businessStart,
        firstEnd: businessEnd,
        secondStart: windowStart,
        secondEnd: windowEnd,
      })
    ) {
      continue;
    }

    const availableStart = maxDate(businessStart, windowStart);
    const availableEnd = minDate(businessEnd, windowEnd);

    /**
     * Align to the next appointment boundary.
     *
     * For now, slots are hourly by default.
     * If a free window starts at 10:17, the first customer-facing slot becomes 11:00.
     */
    let cursor = new Date(availableStart);
    cursor.setUTCMinutes(0, 0, 0);

    if (cursor < availableStart) {
      cursor = new Date(cursor.getTime() + 60 * 60_000);
    }

    while (cursor.getTime() + slotMs <= availableEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + slotMs);

      /**
       * Never offer slots in the past.
       * This matters when the customer is scheduling for "today".
       */
      if (cursor > input.now) {
        slots.push({
          startAt: cursor.toISOString(),
          endAt: slotEnd.toISOString(),
          timezone: input.timezone,
          displayTime: formatSlotTime(cursor, input.timezone),
        });
      }

      cursor = new Date(cursor.getTime() + slotMs);
    }
  }

  return slots;
}

/**
 * Main availability service.
 *
 * This is Step 1 of the scheduling reset.
 *
 * Responsibilities:
 * - fetch tenant
 * - fetch primary calendar connection
 * - fetch Google free windows
 * - apply tenant business hours
 * - split into clean bookable appointment slots
 * - group slots by tenant-local day
 *
 * Non-responsibilities:
 * - no chat messages
 * - no AI wording
 * - no booking
 * - no state-machine decisions
 */
export async function getBookableAppointmentSlots(input: {
  tenantSlug: string;
  timezone?: string;
  fromIso?: string;
  slotMinutes?: number;
  lookaheadDays?: number;
  maxDaysToReturn?: number;
}): Promise<GetBookableAppointmentSlotsResult> {
  const tenant = await getTenantBySlug(input.tenantSlug);

  if (!tenant) {
    throw new Error(`Tenant not found: ${input.tenantSlug}`);
  }

  const tenantConfig = getTenantConfig(tenant);

  const timezone =
    input.timezone || tenantConfig.scheduling.defaultTimezone || DEFAULT_TIMEZONE;

  const slotMinutes =
    input.slotMinutes ||
    tenantConfig.scheduling.slotMinutes ||
    DEFAULT_SLOT_MINUTES;

  const lookaheadDays =
    input.lookaheadDays ||
    tenantConfig.scheduling.lookaheadDays ||
    DEFAULT_LOOKAHEAD_DAYS;

  const maxDaysToReturn =
    input.maxDaysToReturn ||
    tenantConfig.scheduling.maxDaysToReturn ||
    DEFAULT_MAX_DAYS_TO_RETURN;

    const connection = await getPrimaryCalendarConnectionByTenantSlug(
      input.tenantSlug
    );

  if (!connection) {
    return {
      timezone,
      slotMinutes,
      days: [],
    };
  }

  const range = getSchedulingRange({
    timezone,
    fromIso: input.fromIso,
    lookaheadDays,
  });

  const freeWindows = await getGoogleCalendarAvailability({
    connection,
    fromIso: range.from.toISOString(),
    toIso: range.to.toISOString(),
    timezone,
    minSlotMinutes: slotMinutes,
  });

  const tenantHours = normalizeTenantHours(tenant.hours);
  const days: BookableAppointmentDay[] = [];

  let dateKey = range.fromDateKey;

  while (dateKey <= range.toDateKey && days.length < maxDaysToReturn) {
    const weekday = getWeekdayKey(dateKey, timezone);
    const dayHours = tenantHours[weekday];

    const slots = buildSlotsForDay({
      dateKey,
      timezone,
      dayHours,
      freeWindows,
      slotMinutes,
      now: range.now,
    });

    if (slots.length > 0) {
      days.push({
        dateKey,
        displayLabel: formatDayLabel(dateKey, timezone),
        slots,
      });
    }

    dateKey = addDaysToDateKey(dateKey, 1);
  }

  return {
    timezone,
    slotMinutes,
    days,
  };
}