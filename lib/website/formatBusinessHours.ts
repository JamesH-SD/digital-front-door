import { tenantHasConfiguredHours } from "@/lib/readiness/helpers";

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayKey = (typeof DAY_ORDER)[number];

type HoursDay = {
  open?: string;
  close?: string;
  closed?: boolean;
};

function formatDayLabel(day: DayKey): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatTime12h(time24: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time24.trim());
  if (!match) {
    return time24;
  }

  let hours = parseInt(match[1]!, 10);
  const minutes = match[2]!;
  const period = hours >= 12 ? "PM" : "AM";

  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  return minutes === "00" ? `${hours} ${period}` : `${hours}:${minutes} ${period}`;
}

export type BusinessHoursRow = {
  day: string;
  hoursText: string;
};

export function getPublicBusinessHoursRows(
  hours?: Record<string, unknown> | null
): BusinessHoursRow[] {
  if (!hours || typeof hours !== "object" || !tenantHasConfiguredHours(hours)) {
    return [];
  }

  const rows: BusinessHoursRow[] = [];

  for (const day of DAY_ORDER) {
    const value = hours[day];
    if (!value || typeof value !== "object") {
      continue;
    }

    const dayHours = value as HoursDay;

    if (dayHours.closed) {
      rows.push({ day: formatDayLabel(day), hoursText: "Closed" });
      continue;
    }

    if (dayHours.open?.trim() && dayHours.close?.trim()) {
      rows.push({
        day: formatDayLabel(day),
        hoursText: `${formatTime12h(dayHours.open)} – ${formatTime12h(dayHours.close)}`,
      });
    }
  }

  return rows;
}
