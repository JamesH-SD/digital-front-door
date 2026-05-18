"use client";

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

export default function ChatSchedulingPicker({
  schedulingState,
  isSending,
  onSelectOption,
}: Props) {
  if (!schedulingState?.active) return null;

  if (schedulingState.step === "select_day") {
    const days = schedulingState.availableDays || [];

    if (!days.length) return null;

    return (
      <div className="mt-3 max-w-[92%] rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-900">
          Choose an available day
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Tap a day below, or keep chatting if you have questions.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {days.map((day) => (
            <button
              key={day.optionNumber}
              type="button"
              disabled={isSending}
              onClick={() => onSelectOption(String(day.optionNumber))}
              className="rounded-xl border bg-gray-50 px-3 py-3 text-left text-sm transition hover:border-gray-900 hover:bg-white disabled:opacity-60"
            >
              <span className="block font-semibold text-gray-900">
                {day.displayLabel}
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                View times
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (schedulingState.step === "select_slot") {
    const slots = schedulingState.offeredSlots || [];

    if (!slots.length) return null;

    return (
      <div className="mt-3 max-w-[92%] rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-900">
          {schedulingState.selectedDay?.displayLabel
            ? `Choose a time for ${schedulingState.selectedDay.displayLabel}`
            : "Choose an available time"}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Tap a time below, or reply with a different preference.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {slots.map((slot) => (
            <button
              key={slot.optionNumber}
              type="button"
              disabled={isSending}
              onClick={() => onSelectOption(String(slot.optionNumber))}
              className="rounded-xl border bg-gray-50 px-3 py-3 text-center text-sm font-semibold text-gray-900 transition hover:border-gray-900 hover:bg-white disabled:opacity-60"
            >
              {slot.displayTime}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}