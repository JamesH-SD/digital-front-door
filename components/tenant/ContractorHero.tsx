import { Tenant } from "@/lib/types/tenant";

type Props = {
  tenant: Tenant;
};

function formatPhoneHref(phone?: string) {
  if (!phone) return "";
  return `tel:${phone.replace(/\D/g, "")}`;
}

export function ContractorHero({ tenant }: Props) {
  const phoneHref = formatPhoneHref(tenant.primaryPhone);

  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <div className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700">
            {tenant.primaryCategory || "Local Service Business"}
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
            {tenant.businessName}
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            {tenant.tagline ||
              "Get answers, request a quote, or schedule a visit without waiting for a callback."}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="#chat"
              className="saas-button-accent rounded-xl px-5 py-3 text-center text-sm font-semibold shadow-sm"
            >
              Start Conversation
            </a>

            {tenant.primaryPhone ? (
              <a
                href={phoneHref}
                className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              >
                Call Now
              </a>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-gray-700">
            {tenant.city || tenant.state ? (
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1">
                {tenant.city ? tenant.city : "Local"}
                {tenant.state ? `, ${tenant.state}` : ""}
              </span>
            ) : null}

            {tenant.licenseNumber ? (
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1">
                License {tenant.licenseNumber}
              </span>
            ) : null}

            {tenant.isInsured ? (
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1">
                Insured
              </span>
            ) : null}
          </div>
        </div>

        <div className="saas-card p-5">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
              AI Receptionist
            </p>

            <h2 className="mt-2 text-xl font-semibold text-gray-950">
              Ask questions anytime
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Ask about services, availability, service areas, quotes, or
              scheduling. We’ll collect the right details and help move your
              request forward.
            </p>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>✓ Request a quote</p>
              <p>✓ Ask service questions</p>
              <p>✓ Schedule a call or visit</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}