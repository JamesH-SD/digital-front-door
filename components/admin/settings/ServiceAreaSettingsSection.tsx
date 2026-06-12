import SettingsSectionHeader from "./SettingsSectionHeader";

type Props = {
  form: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    serviceAreaSummary: string;
    serviceRadiusMiles: number;
    serviceCities: string;
    excludedServiceCities: string;
    outOfAreaMessage: string;
    shareBusinessAddressInChat: boolean;
  };
  isEditing: boolean;
  isSaving: boolean;
  onChange: (updates: Partial<Props["form"]>) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
};

function displayValue(value?: string | number | null) {
  if (value === 0) return "0";
  return value?.toString().trim() ? value.toString() : "Not provided";
}

export default function ServiceAreaSettingsSection({
  form,
  isEditing,
  isSaving,
  onChange,
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

      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-950">
                Business Address
              </h3>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                This is the business location used as the center point for the service area.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Address Line 1"
                value={form.addressLine1}
                isEditing={isEditing}
                placeholder="Street address"
                className="md:col-span-2"
                onChange={(value) => onChange({ addressLine1: value })}
              />

              <Field
                label="Address Line 2"
                value={form.addressLine2}
                isEditing={isEditing}
                placeholder="Suite, unit, building, etc."
                className="md:col-span-2"
                onChange={(value) => onChange({ addressLine2: value })}
              />

              <Field
                label="City"
                value={form.city}
                isEditing={isEditing}
                placeholder="City"
                onChange={(value) => onChange({ city: value })}
              />

              <Field
                label="State"
                value={form.state}
                isEditing={isEditing}
                placeholder="State"
                onChange={(value) => onChange({ state: value })}
              />

              <Field
                label="ZIP"
                value={form.zip}
                isEditing={isEditing}
                placeholder="ZIP code"
                onChange={(value) => onChange({ zip: value })}
              />

              <Field
                label="Country"
                value={form.country}
                isEditing={isEditing}
                placeholder="United States"
                onChange={(value) => onChange({ country: value })}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-950">
                Service Radius
                </h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                Internal rule used by the AI receptionist and future address validation. The public website still uses the service area summary and included cities below.
                </p>
            </div>

            {isEditing ? (
              <div className="mt-4 space-y-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {[10, 25, 50, 75, 100].map((radius) => (
                  <button
                    key={radius}
                    type="button"
                    disabled={!isEditing}
                    onClick={() =>
                      onChange({
                        serviceRadiusMiles: radius,
                      })
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      Number(form.serviceRadiusMiles) === radius
                        ? "border-orange-700 bg-orange-700 text-white"
                        : "border-stone-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50"
                    }`}
                  >
                    {radius} mi
                  </button>
                ))}
              </div>
            
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Current Service Radius
                  </span>
            
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                    {form.serviceRadiusMiles || 25} miles
                  </span>
                </div>
            
                <div className="mt-4 h-4 rounded-full bg-stone-200">
                  <div
                    className="h-4 rounded-full bg-orange-700 transition-all"
                    style={{
                      width: `${Math.min(
                        ((form.serviceRadiusMiles || 25) / 100) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
            
                <p className="mt-3 text-xs text-gray-500">
                  Future enhancement: interactive map and radius drawing.
                </p>
              </div>
            </div>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
                {form.serviceRadiusMiles || 25} miles from business address
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <h3 className="text-sm font-semibold text-gray-950">
              Service Area Summary
            </h3>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              This is the plain-language version shown to customers and used by the AI receptionist.
            </p>

            <div className="mt-4">
              <Field
                label="Summary"
                value={form.serviceAreaSummary}
                isEditing={isEditing}
                placeholder="Serving North County San Diego and nearby communities"
                onChange={(value) => onChange({ serviceAreaSummary: value })}
              />
            </div>

            <div className="mt-4">
              {isEditing ? (
                <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.shareBusinessAddressInChat}
                    onChange={(e) =>
                      onChange({
                        shareBusinessAddressInChat: e.target.checked,
                      })
                    }
                  />
                  Share business address in chat
                </label>
              ) : (
                <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
                  <span className="font-medium text-gray-700">
                    Share address in chat:
                  </span>{" "}
                  {form.shareBusinessAddressInChat ? "Yes" : "No"}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-950">
              Advanced Area Rules
            </h3>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Optional. Use these only when the radius needs manual exceptions.
            </p>

            <div className="mt-4 space-y-4">
              <TextAreaField
                label="Public Website Cities"
                value={form.serviceCities}
                isEditing={isEditing}
                placeholder="One city per line. These cities appear on the public website."
                onChange={(value) => onChange({ serviceCities: value })}
              />

              <TextAreaField
                label="Excluded Cities"
                value={form.excludedServiceCities}
                isEditing={isEditing}
                placeholder="One city per line. These cities are AI Excluded Cities"
                onChange={(value) =>
                  onChange({ excludedServiceCities: value })
                }
              />

              <TextAreaField
                label="Out of Area Message"
                value={form.outOfAreaMessage}
                isEditing={isEditing}
                rows={3}
                placeholder="Message to use when a request is outside the normal service area"
                onChange={(value) => onChange({ outOfAreaMessage: value })}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  isEditing,
  placeholder,
  className = "",
  onChange,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">{label}</label>

      {isEditing ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="saas-input mt-1 w-full px-3 py-2 text-sm"
          placeholder={placeholder}
        />
      ) : (
        <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
          {displayValue(value)}
        </div>
      )}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  isEditing,
  placeholder,
  rows = 4,
  onChange,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  placeholder?: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>

      {isEditing ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="saas-input mt-1 w-full px-3 py-2 text-sm"
          placeholder={placeholder}
        />
      ) : (
        <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm whitespace-pre-wrap">
          {displayValue(value)}
        </div>
      )}
    </div>
  );
}