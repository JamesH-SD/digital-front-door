"use client";

type WizardAiProposalPanelProps = {
  label: string;
  loading: boolean;
  proposal: string | null;
  error: string | null;
  onUseThis: () => void;
  onEdit: () => void;
  onTryAgain: () => void;
  onCancel: () => void;
};

export default function WizardAiProposalPanel({
  label,
  loading,
  proposal,
  error,
  onUseThis,
  onEdit,
  onTryAgain,
  onCancel,
}: WizardAiProposalPanelProps) {
  if (!loading && !proposal && !error) {
    return null;
  }

  return (
    <div className="mt-2 rounded-2xl border border-orange-200 bg-orange-50/40 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-orange-800">
        AI suggestion — {label}
      </p>

      {loading ? (
        <p className="mt-2 text-sm text-gray-700">Generating suggestion…</p>
      ) : null}

      {error ? (
        <p className="mt-2 text-sm text-red-700">{error}</p>
      ) : null}

      {proposal && !loading ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-900">
          {proposal}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onUseThis}
          disabled={loading || !proposal}
          className="saas-button-accent px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Use This
        </button>

        <button
          type="button"
          onClick={onEdit}
          disabled={loading || !proposal}
          className="saas-button-secondary px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={onTryAgain}
          disabled={loading}
          className="saas-button-secondary px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Try Again
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-2 py-1.5 text-xs font-semibold text-gray-600 underline-offset-2 hover:text-orange-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
