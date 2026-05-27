import { Tenant } from "@/lib/types/tenant";

type Props = {
  tenant: Tenant;
};

export function ContractorChatLauncher({ tenant }: Props) {
  return (
    <div className="saas-card p-6">
      <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        AI Receptionist
      </div>

      <h2 className="mt-4 text-xl font-semibold text-gray-900">
        Ask a question
      </h2>

      <p className="mt-3 text-sm leading-6 text-gray-600">
        Chat with {tenant.businessName}&apos;s AI receptionist to ask questions,
        check service area, and request a callback.
      </p>

      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
          <p className="text-sm leading-6 text-gray-800">
            Hi! I’m the virtual receptionist for {tenant.businessName}. How can
            I help you today?
          </p>
        </div>

        <button
          type="button"
          className="saas-button-accent mt-4 w-full px-4 py-3 text-sm font-semibold shadow-sm"
        >
          Start Chat
        </button>
      </div>
    </div>
  );
}