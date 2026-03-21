import { Tenant } from "@/lib/types/tenant";

type Props = {
  tenant: Tenant;
};

export function ContractorChatLauncher({ tenant }: Props) {
  return (
    <div className="rounded-2xl border p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Ask a question</h2>
      <p className="mt-3 text-sm text-gray-600">
        Chat with {tenant.businessName}'s AI receptionist to ask questions,
        check service area, and request a callback.
      </p>

      <div className="mt-6 rounded-xl border bg-gray-50 p-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-800">
            Hi! I’m the virtual receptionist for {tenant.businessName}. How can
            I help you today?
          </p>
        </div>

        <button
          className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-medium text-white"
          style={{ backgroundColor: tenant.primaryColor || "#111827" }}
        >
          Start Chat
        </button>
      </div>
    </div>
  );
}