import Link from "next/link";
import type { TenantDeploymentMode } from "@/lib/types/tenant";
import type { ReadinessCategoryResult } from "@/lib/readiness/types";

type WebsiteOperationalStatusProps = {
  tenantSlug: string;
  deploymentMode: TenantDeploymentMode | null;
  websiteReadiness: ReadinessCategoryResult;
};

export default function WebsiteOperationalStatus({
  tenantSlug,
  deploymentMode,
  websiteReadiness,
}: WebsiteOperationalStatusProps) {
  if (!websiteReadiness.applicable) {
    const copy =
      deploymentMode === "existing_site"
        ? "Operational website readiness applies to Contactor-hosted sites. Your customer entry is configured for an existing website — use embed and customer links from AI Receptionist settings when you are ready."
        : "Operational website readiness applies after you choose a Contactor-hosted website in Business settings. Until then, focus on business profile and customer entry setup.";

    return (
      <section className="rounded-3xl border border-stone-200/60 bg-white/90 p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
        <h2 className="text-lg font-bold text-gray-950">Website status</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{copy}</p>
        {deploymentMode !== "existing_site" ? (
          <Link
            href={`/admin/${tenantSlug}/settings`}
            className="mt-3 inline-block text-sm font-semibold text-orange-700 underline-offset-2 hover:underline"
          >
            Business settings
          </Link>
        ) : null}
      </section>
    );
  }

  const isReady = websiteReadiness.status === "complete";
  const missingRequired = websiteReadiness.items.filter(
    (item) => item.tier === "required" && item.status === "needs_attention"
  );

  return (
    <section className="rounded-3xl border border-stone-200/60 bg-white/90 p-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-950">Website status</h2>
          <p className="mt-1 text-sm text-gray-500">
            Can your hosted site serve customers? This is separate from optional
            website setup below.
          </p>
        </div>

        <span
          className={
            isReady
              ? "w-fit shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
              : "w-fit shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"
          }
        >
          {isReady ? "Ready" : "Needs attention"}
        </span>
      </div>

      {!isReady && missingRequired.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm">
          {missingRequired.map((item) => {
            const href =
              item.adminHref ??
              (item.id === "website_published"
                ? `/admin/${tenantSlug}/website`
                : item.id === "website_services"
                  ? `/admin/${tenantSlug}/website/services`
                  : `/admin/${tenantSlug}/settings`);

            return (
              <li key={item.id}>
                <Link
                  href={href}
                  className="font-medium text-orange-700 underline-offset-2 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      {isReady ? (
        <p className="mt-4 text-sm text-gray-600">
          Published with services and contact phone. You can still improve
          branding and content in website setup below — that does not block
          going live.
        </p>
      ) : null}
    </section>
  );
}
