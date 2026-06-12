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

function formatDayLabel(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatHoursForDisplay(hours: HoursState, day: keyof HoursState) {
  const value = hours[day];

  if (!value || value.closed) return "Closed";
  if (!value.open || !value.close) return "Not provided";

  return `${value.open} - ${value.close}`;
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
  return (
    <section className="rounded-2xl border border-stone-200/50 bg-white/90 p-5 shadow-[0_8px_24px_rgba(17,24,39,0.045)]">
      <SettingsSectionHeader
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={onEdit}
        onCancel={onCancel}
        onSave={onSave}
      />

      <div className="space-y-3">
        {DAYS.map((day) => {
          const value = hours[day];

          return (
            <div
              key={day}
              className="grid gap-3 rounded-xl border border-stone-200 bg-white p-3 md:grid-cols-[140px_1fr_1fr_auto]"
            >
              <div className="flex items-center text-sm font-medium text-gray-800">
                {formatDayLabel(day)}
              </div>

              {isEditing ? (
                <>
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
                </>
              ) : (
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm md:col-span-3">
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