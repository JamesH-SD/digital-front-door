"use client";

import { useEffect, useMemo, useState } from "react";

type Slot = {
  startAt: string;
  endAt: string;
  timezone: string;
};

type DayGroup = {
  dateKey: string;
  label: string;
  slots: Slot[];
};

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

/**
 * Splits raw Google free windows into clean bookable appointment slots.
 *
 * Product rule for now:
 * - 60-minute appointments
 * - only show 8 AM–5 PM local working hours
 * - do not show overnight / giant multi-day free ranges
 */
function buildBookableSlots(rawWindows: any[], slotMinutes = 60): Slot[] {
  const slots: Slot[] = [];

  for (const window of rawWindows) {
    const windowStart = new Date(window.startAt);
    const windowEnd = new Date(window.endAt);

    if (Number.isNaN(windowStart.getTime()) || Number.isNaN(windowEnd.getTime())) {
      continue;
    }

    const cursorDay = new Date(windowStart);
    cursorDay.setHours(0, 0, 0, 0);

    const finalDay = new Date(windowEnd);
    finalDay.setHours(0, 0, 0, 0);

    while (cursorDay <= finalDay) {
      const workStart = new Date(cursorDay);
      workStart.setHours(8, 0, 0, 0);

      const workEnd = new Date(cursorDay);
      workEnd.setHours(17, 0, 0, 0);

      let cursor = new Date(Math.max(windowStart.getTime(), workStart.getTime()));
      const end = new Date(Math.min(windowEnd.getTime(), workEnd.getTime()));

      while (cursor.getTime() + slotMinutes * 60000 <= end.getTime()) {
        const slotEnd = new Date(cursor.getTime() + slotMinutes * 60000);

        slots.push({
          startAt: cursor.toISOString(),
          endAt: slotEnd.toISOString(),
          timezone: window.timezone || "America/Los_Angeles",
        });

        cursor = slotEnd;
      }

      cursorDay.setDate(cursorDay.getDate() + 1);
    }
  }

  return slots;
}

export default function AppointmentSlotPicker({
  tenantSlug,
  selectedSlot,
  onSelectSlot,
}: {
  tenantSlug: string;
  selectedSlot: Slot | null;
  onSelectSlot: (slot: Slot) => void;
}) {
  const [rawWindows, setRawWindows] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadAvailability();
  }, []);

  async function loadAvailability() {
    try {
      setIsLoading(true);
      setError("");

      const now = new Date();
      const future = new Date(now);
      future.setDate(now.getDate() + 30);

      const params = new URLSearchParams({
        from: now.toISOString(),
        to: future.toISOString(),
        timezone: "America/Los_Angeles",
        minSlotMinutes: "30",
      });

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/calendar-connections/google/availability?${params.toString()}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load availability");
      }

      setRawWindows(Array.isArray(result.slots) ? result.slots : []);
    } catch (err) {
      console.error("Availability load error:", err);
      setError(err instanceof Error ? err.message : "Failed to load availability");
    } finally {
      setIsLoading(false);
    }
  }

  const dayGroups = useMemo<DayGroup[]>(() => {
    const slots = buildBookableSlots(rawWindows, 60);
    const grouped: Record<string, Slot[]> = {};

    for (const slot of slots) {
      const key = formatDateKey(new Date(slot.startAt));
      grouped[key] = grouped[key] || [];
      grouped[key].push(slot);
    }

    return Object.keys(grouped)
      .sort()
      .map((dateKey) => ({
        dateKey,
        label: formatDayLabel(dateKey),
        slots: grouped[dateKey],
      }));
  }, [rawWindows]);

  useEffect(() => {
    if (!selectedDate && dayGroups.length > 0) {
      setSelectedDate(dayGroups[0].dateKey);
    }
  }, [dayGroups, selectedDate]);

  const availableDateKeys = new Set(dayGroups.map((group) => group.dateKey));
  const selectedGroup = dayGroups.find((group) => group.dateKey === selectedDate);

  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());

    const days: Date[] = [];

    for (let i = 0; i < 42; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }

    return days;
  }, [currentMonth]);

  function moveMonth(direction: "prev" | "next") {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading available times...</p>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-gray-50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => moveMonth("prev")}
                className="rounded-lg border bg-white px-2 py-1 text-sm hover:bg-gray-100"
              >
                ←
              </button>

              <p className="text-sm font-semibold text-gray-900">{monthLabel}</p>

              <button
                type="button"
                onClick={() => moveMonth("next")}
                className="rounded-lg border bg-white px-2 py-1 text-sm hover:bg-gray-100"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const key = formatDateKey(day);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const hasAvailability = availableDateKeys.has(key);
                const isSelected = selectedDate === key;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!hasAvailability}
                    onClick={() => setSelectedDate(key)}
                    className={`rounded-lg px-2 py-2 text-sm ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : hasAvailability
                        ? "bg-white text-gray-900 hover:bg-blue-50"
                        : "text-gray-300"
                    } ${!isCurrentMonth ? "opacity-40" : ""}`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">
              {selectedGroup ? selectedGroup.label : "Available Times"}
            </p>

            {selectedGroup ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {selectedGroup.slots.map((slot) => {
                  const isSelected = selectedSlot?.startAt === slot.startAt;

                  return (
                    <button
                      key={slot.startAt}
                      type="button"
                      onClick={() => onSelectSlot(slot)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "bg-white text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {formatTime(slot.startAt)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500">
                Select a date with availability.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}