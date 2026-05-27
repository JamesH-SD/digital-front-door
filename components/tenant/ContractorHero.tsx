import { Tenant } from "@/lib/types/tenant";

type Props = {
  tenant: Tenant;
};

export function ContractorHero({ tenant }: Props) {
  const accent = tenant.primaryColor || "#111827";

  return (
    <section className="border-b border-stone-200 bg-[radial-gradient(circle_at_20%_10%,rgba(194,65,12,0.10),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(85,107,47,0.08),transparent_22%),linear-gradient(180deg,#fffaf5_0%,#faf8f4_100%)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <div
            className="saas-accent-pill mb-4 inline-flex px-3 py-1 text-sm font-semibold"
          >
            Available Now
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
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