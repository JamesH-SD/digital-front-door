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
    serviceRadiusMiles: number | null;
    serviceCities: string;
    excludedServiceCities: string;
    outOfAreaMessage: string;
    shareBusinessAddressInChat: boolean;
    showBusinessAddressPublicly: boolean;
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
  const radiusPresets = [10, 25, 50, 75, 100];

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
                Your business location on file. It is not shown on the public
                website unless you enable that below.
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

            <div className="mt-4 space-y-3">
              {isEditing ? (
                <>
                  <label className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={form.showBusinessAddressPublicly}
                      onChange={(e) =>
                        onChange({
                          showBusinessAddressPublicly: e.target.checked,
                        })
                      }
                    />
                    <span>
                      <span className="font-medium text-gray-900">
                        Show this business address on my public website
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-gray-500">
                        Enable only if customers can visit this location or you
                        want this address displayed publicly on your hosted
                        website.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={form.shareBusinessAddressInChat}
                      onChange={(e) =>
                        onChange({
                          shareBusinessAddressInChat: e.target.checked,
                        })
                      }
                    />
                    <span>
                      <span className="font-medium text-gray-900">
                        Share this address in AI chat when customers ask
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-gray-500">
                        Controls the AI receptionist only. Independent from the
                        public website setting above.
                      </span>
                    </span>
                  </label>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-gray-700">
                      Show on public website:
                    </span>{" "}
                    {form.showBusinessAddressPublicly ? "Yes" : "No"}
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-gray-700">
                      Share in AI chat when asked:
                    </span>{" "}
                    {form.shareBusinessAddressInChat ? "Yes" : "No"}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-950">
                Service Radius
              </h3>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Optional note for your records. Contactor does not validate
                customer locations against this radius today, and it is not shown
                on the public website.
              </p>
            </div>

            {isEditing ? (
              <div className="mt-4 space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {radiusPresets.map((radius) => (
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
                        form.serviceRadiusMiles === radius
                          ? "border-orange-700 bg-orange-700 text-white"
                          : "border-stone-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50"
                      }`}
                    >
                      {radius} mi
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onChange({ serviceRadiusMiles: null })}
                  className="text-sm font-semibold text-gray-600 underline-offset-2 hover:text-orange-700 hover:underline"
                >
                  Clear service radius
                </button>

                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Selected service radius
                    </span>

                    <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                      {form.serviceRadiusMiles != null
                        ? `${form.serviceRadiusMiles} miles`
                        : "Not set"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
                {form.serviceRadiusMiles != null
                  ? `${form.serviceRadiusMiles} miles (internal reference only)`
                  : "Not set"}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-950">
              Service Area Summary
            </h3>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Plain-language service area shown on the public website and used by
              the AI receptionist.
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
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-950">
              Advanced Area Rules
            </h3>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Optional lists stored for future use. They are not used by the AI
              receptionist or public website today.
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
                placeholder="One city per line (stored for future use)"
                onChange={(value) =>
                  onChange({ excludedServiceCities: value })
                }
              />

              <TextAreaField
                label="Out of Area Message"
                value={form.outOfAreaMessage}
                isEditing={isEditing}
                rows={3}
                placeholder="Message for future out-of-area handling (not used yet)"
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
        <div className="mt-1 whitespace-pre-wrap rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
          {displayValue(value)}
        </div>
      )}
    </div>
  );
}
