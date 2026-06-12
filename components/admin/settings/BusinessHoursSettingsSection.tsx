import SettingsSectionHeader from "./SettingsSectionHeader";

type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

type HoursState = Record<string, DayHours>;

type Props = {
  hours: HoursState;
  isEditing: boolean;
  isSaving: boolean;
  onChangeDay: (day: keyof HoursState, updates: Partial<DayHours>) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
};

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

function formatDayLabel(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatTimeForDisplay(value?: string) {
  if (!value) return "";

  const [hourValue, minuteValue] = value.split(":");
  const hour = Number(hourValue);
  const minute = minuteValue || "00";

  if (Number.isNaN(hour)) return value;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function formatHoursForDisplay(hours: HoursState, day: keyof HoursState) {
  const value = hours[day];

  if (!value || value.closed) return "Closed";
  if (!value.open || !value.close) return "Not provided";

  return `${formatTimeForDisplay(value.open)} - ${formatTimeForDisplay(value.close)}`;
}

export default function BusinessHoursSettingsSection({
  hours,
  isEditing,
  isSaving,
  onChangeDay,
  onEdit,
  onCancel,
  onSave,
}: Props) {
  const mondayHours = hours.monday;

  function applyMondayToWeekdays() {
    if (!mondayHours) return;

    WEEKDAYS.forEach((day) => {
      onChangeDay(day, {
        open: mondayHours.open,
        close: mondayHours.close,
        closed: mondayHours.closed,
      });
    });
  }

  function applyMondayToAllDays() {
    if (!mondayHours) return;

    DAYS.forEach((day) => {
      onChangeDay(day, {
        open: mondayHours.open,
        close: mondayHours.close,
        closed: mondayHours.closed,
      });
    });
  }

  return (
    <section className="rounded-2xl border border-stone-200/50 bg-white/90 p-5 shadow-[0_8px_24px_rgba(17,24,39,0.045)]">
      <SettingsSectionHeader
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={onEdit}
        onCancel={onCancel}
        onSave={onSave}
      />

      {isEditing ? (
        <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-orange-100 bg-orange-50/60 p-3">
          <button
            type="button"
            onClick={applyMondayToWeekdays}
            className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-800 shadow-sm transition hover:bg-orange-100"
          >
            Apply Monday to weekdays
          </button>

          <button
            type="button"
            onClick={applyMondayToAllDays}
            className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-800 shadow-sm transition hover:bg-orange-100"
          >
            Apply Monday to all days
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        {DAYS.map((day) => {
          const value = hours[day];

          return (
            <div
              key={day}
              className="grid gap-3 rounded-xl border border-stone-200 bg-white p-3 md:grid-cols-[140px_auto_1fr_1fr]"
            >
              <div className="flex items-center text-sm font-medium text-gray-800">
                {formatDayLabel(day)}
              </div>

              {isEditing ? (
                <>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={value.closed}
                      onChange={(e) =>
                        onChangeDay(day, { closed: e.target.checked })
                      }
                    />
                    Closed
                  </label>

                  <input
                    type="time"
                    value={value.open}
                    disabled={value.closed}
                    onChange={(e) =>
                      onChangeDay(day, { open: e.target.value })
                    }
                    className="saas-input px-3 py-2 text-sm disabled:bg-stone-100"
                  />

                  <input
                    type="time"
                    value={value.close}
                    disabled={value.closed}
                    onChange={(e) =>
                      onChangeDay(day, { close: e.target.value })
                    }
                    className="saas-input px-3 py-2 text-sm disabled:bg-stone-100"
                  />
                </>
              ) : (
                <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)] md:col-span-3">
                  {formatHoursForDisplay(hours, day)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}