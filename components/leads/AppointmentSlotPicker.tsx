"use client";

import { useEffect, useMemo, useState } from "react";

type Slot = {
  startAt: string;
  endAt: string;
  timezone: string;
  displayTime?: string;
};

type DayGroup = {
  dateKey: string;
  displayLabel: string;
  slots: Slot[];
};

type AvailabilityResponse = {
  tenantSlug: string;
  timezone: string;
  slotMinutes: number;
  days: DayGroup[];
};

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(slot: Slot) {
  if (slot.displayTime) {
    return slot.displayTime;
  }

  return new Intl.DateTimeFormat(undefined, {
    timeZone: slot.timezone || "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(slot.startAt));
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
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadAvailability();
    // tenantSlug is included so the picker reloads if reused for another tenant.
  }, [tenantSlug]);

  async function loadAvailability() {
    try {
      setIsLoading(true);
      setError("");

      /**
       * The backend now handles:
       * - Google availability lookup
       * - tenant business hours
       * - timezone-safe slot generation
       * - grouping slots by day
       *
       * The frontend should only display the returned slots.
       */
      const params = new URLSearchParams({
        timezone: "America/Los_Angeles",
        slotMinutes: "60",
        lookaheadDays: "14",
        maxDaysToReturn: "7",
      });

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/calendar-connections/google/availability?${params.toString()}`
      );

      const result: AvailabilityResponse | { error?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "Failed to load availability"
        );
      }

      const days = Array.isArray((result as AvailabilityResponse).days)
        ? (result as AvailabilityResponse).days
        : [];

      setDayGroups(days);

      /**
       * Automatically select the first day with availability.
       * This keeps the modal useful immediately after loading.
       */
      if (days.length > 0) {
        setSelectedDate((current) => current ?? days[0].dateKey);
      }
    } catch (err) {
      console.error("Availability load error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load availability"
      );
    } finally {
      setIsLoading(false);
    }
  }

  const availableDateKeys = useMemo(
    () => new Set(dayGroups.map((group) => group.dateKey)),
    [dayGroups]
  );

  const selectedGroup = dayGroups.find(
    (group) => group.dateKey === selectedDate
  );

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
      ) : dayGroups.length === 0 ? (
        <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
          No available appointment times were found. A team member can follow up
          directly to coordinate.
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

              <p className="text-sm font-semibold text-gray-900">
                {monthLabel}
              </p>

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
                const isCurrentMonth =
                  day.getMonth() === currentMonth.getMonth();
                const hasAvailability = availableDateKeys.has(key);
                const isSelected = selectedDate === key;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!hasAvailability}
                    onClick={() => setSelectedDate(key)}
                    className={`rounded-lg px-2 py-2 text-sm transition ${
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

          <div className="rounded-xl border bg-white p-3">
            <p className="text-sm font-semibold text-gray-900">
              {selectedGroup
                ? `Available times for ${selectedGroup.displayLabel}`
                : "Select a day"}
            </p>

            {selectedGroup ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {selectedGroup.slots.map((slot) => {
                  const isSelected = selectedSlot?.startAt === slot.startAt;

                  return (
                    <button
                      key={`${slot.startAt}-${slot.endAt}`}
                      type="button"
                      onClick={() => onSelectSlot(slot)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {formatTime(slot)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                Choose a highlighted day to see available times.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}