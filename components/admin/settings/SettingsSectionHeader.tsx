type Props = {
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
  };
  
  export default function SettingsSectionHeader({
    isEditing,
    isSaving,
    onEdit,
    onCancel,
    onSave,
  }: Props) {
    return (
      <div className="mb-3 flex justify-end">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="saas-button-secondary px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
  
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="saas-button-accent px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="saas-button-accent px-4 py-2 text-sm font-semibold"
          >
            Edit
          </button>
        )}
      </div>
    );
  }