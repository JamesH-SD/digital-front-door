"use client";

import { useMemo, useState } from "react";

type OfferedSlot = {
  optionNumber: number;
  displayTime: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
};

type OfferedDay = {
  optionNumber: number;
  dateKey: string;
  displayLabel: string;
  slots?: OfferedSlot[];
};

type SchedulingState = {
  active?: boolean;
  step?: string;
  availableDays?: OfferedDay[];
  offeredSlots?: OfferedSlot[];
  selectedDay?: OfferedDay;
};

type Props = {
  schedulingState: SchedulingState | null;
  isSending: boolean;
  onSelectOption: (value: string) => void;
};

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function ChatSchedulingPicker({
  schedulingState,
  isSending,
  onSelectOption,
}: Props) {
  const days = schedulingState?.availableDays || [];
  const slots = schedulingState?.offeredSlots || [];

  const initialMonth = useMemo(() => {
    if (schedulingState?.selectedDay?.dateKey) {
      return parseDateKey(schedulingState.selectedDay.dateKey);
    }

    if (days[0]?.dateKey) {
      return parseDateKey(days[0].dateKey);
    }

    return new Date();
  }, [days, schedulingState?.selectedDay?.dateKey]);

  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  const availableByDate = useMemo(() => {
    return new Map(days.map((day) => [day.dateKey, day]));
  }, [days]);

  const selectedDateKey =
    schedulingState?.selectedDay?.dateKey || days[0]?.dateKey || null;

  const selectedDay =
    schedulingState?.selectedDay ||
    (selectedDateKey ? availableByDate.get(selectedDateKey) : undefined);

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

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [currentMonth]);

  function moveMonth(direction: "prev" | "next") {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return next;
    });
  }

  if (!schedulingState?.active) return null;

  if (schedulingState.step !== "select_day" && schedulingState.step !== "select_slot") {
    return null;
  }

  if (schedulingState.step === "select_day" && !days.length) {
    return null;
  }
  
  if (schedulingState.step === "select_slot" && !slots.length) {
    return null;
  }

  return (
    <div className="mt-3 max-w-[96%] rounded-2xl border bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Calendar */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveMonth("prev")}
              className="rounded-lg border bg-gray-50 px-2 py-1 text-sm hover:bg-gray-100"
            >
              ←
            </button>

            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">
                Select a date
              </p>
              <p className="text-xs text-gray-500">{monthLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => moveMonth("next")}
              className="rounded-lg border bg-gray-50 px-2 py-1 text-sm hover:bg-gray-100"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div key={`${day}-${index}`}>{day}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const key = formatDateKey(day);
              const availableDay = availableByDate.get(key);
              const isAvailable = Boolean(availableDay);
              const isSelected = selectedDateKey === key;
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!isAvailable || isSending}
                  onClick={() => {
                    if (availableDay) {
                      onSelectOption(availableDay.displayLabel);
                    }
                  }}
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                    isSelected
                      ? "bg-gray-900 font-semibold text-white"
                      : isAvailable
                        ? "bg-gray-100 font-medium text-gray-900 hover:bg-gray-200"
                        : "text-gray-300",
                    !isCurrentMonth ? "opacity-40" : "",
                    isSending ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Available dates are highlighted. Tap a date to view available times.
          </p>
        </div>

        {/* Times */}
        <div className="rounded-xl border bg-gray-50 p-3">
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-900">
              {schedulingState.step === "select_slot"
                ? "Select an available time"
                : "Select an available day"}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {schedulingState.step === "select_slot"
                ? selectedDay?.displayLabel
                  ? `Available times for ${selectedDay.displayLabel}`
                  : "Choose one of the available times below."
                : "Choose a day below to load available times."}
            </p>
          </div>

          {schedulingState.step === "select_day" ? (
            <div className="mt-4 rounded-xl border border-dashed bg-white p-4 text-sm text-gray-600">
              Select a date to load times.
            </div>
          ) : slots.length ? (
            <div className="mt-4 grid gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.optionNumber}
                  type="button"
                  disabled={isSending}
                  onClick={() => onSelectOption(slot.displayTime)}
                  className="flex items-center justify-between rounded-xl border bg-white px-3 py-3 text-sm font-medium text-gray-900 transition hover:border-gray-900 hover:bg-gray-50 disabled:opacity-60"
                >
                  <span>{slot.displayTime}</span>

                  <span className="text-xs text-gray-400">
                    Tap to select
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed bg-white p-4 text-sm text-gray-600">
              No times loaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}