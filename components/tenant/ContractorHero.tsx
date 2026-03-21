import { Tenant } from "@/lib/types/tenant";

type Props = {
  tenant: Tenant;
};

export function ContractorHero({ tenant }: Props) {
  const accent = tenant.primaryColor || "#111827";

  return (
    <section className="border-b bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="max-w-3xl">
          <div
            className="mb-4 inline-flex rounded-full px-3 py-1 text-sm font-medium text-white"
            style={{ backgroundColor: accent }}
          >
            Available Now
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {tenant.businessName}
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            {tenant.tagline || "Fast answers. Faster lead capture."}
          </p>

          <p className="mt-4 text-sm text-gray-500">
            {tenant.city && tenant.state
              ? `${tenant.city}, ${tenant.state}`
              : "Local contractor"}
          </p>
        </div>
      </div>
    </section>
  );
}