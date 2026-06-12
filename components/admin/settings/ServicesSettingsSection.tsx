import SettingsSectionHeader from "./SettingsSectionHeader";

type Props = {
  value: string;
  isEditing: boolean;
  isSaving: boolean;
  onChange: (value: string) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
};

function displayValue(value?: string | null) {
  return value && value.trim() ? value : "Not provided";
}

export default function ServicesSettingsSection({
  value,
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

      {isEditing ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          className="saas-input w-full px-3 py-2 text-sm"
          placeholder="One service per line"
        />
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 whitespace-pre-wrap text-sm">
          {displayValue(value)}
        </div>
      )}
    </section>
  );
}