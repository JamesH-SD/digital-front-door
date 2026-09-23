import Link from "next/link";
import type {
  ReadinessCategoryResult,
  TenantSetupReadiness,
} from "@/lib/readiness/types";

const CATEGORY_ORDER = [
  "business_profile",
  "ai_receptionist",
  "knowledge_base",
  "calendar",
  "website",
] as const;

type TenantSetupProgressProps = {
  tenantSlug: string;
  readiness: TenantSetupReadiness;
  variant?: "dashboard" | "review";
};

function statusBadge(category: ReadinessCategoryResult) {
  if (!category.applicable) {
    return {
      label: "Not applicable",
      className: "bg-stone-100 text-stone-600",
    };
  }

  if (!category.contributesToOverall && category.status === "needs_attention") {
    return {
      label: "Recommended",
      className: "bg-sky-50 text-sky-800",
    };
  }

  if (category.status === "complete") {
    return {
      label: "Ready",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Needs attention",
    className: "bg-amber-50 text-amber-800",
  };
}

function orderedCategories(readiness: TenantSetupReadiness) {
  const byKey = new Map(readiness.categories.map((category) => [category.key, category]));

  return CATEGORY_ORDER.map((key) => byKey.get(key)).filter(
    (category): category is ReadinessCategoryResult => Boolean(category)
  );
}

export default function TenantSetupProgress({
  tenantSlug,
  readiness,
  variant = "dashboard",
}: TenantSetupProgressProps) {
  const categories = orderedCategories(readiness);
  const isReview = variant === "review";

  return (
    <section className="rounded-3xl border border-stone-200/60 bg-white/90 p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-950">
            {isReview ? "Contactor setup readiness" : "Contactor setup"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            {isReview
              ? "Operational readiness before you open the Dashboard. Recommendations improve Contactor but do not block finishing."
              : "Operational readiness across Business, AI, Calendar, and Website. Optional improvements are listed separately."}
          </p>
        </div>

        <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
          {readiness.overallPercent}% operational
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {categories.map((category) => {
          const badge = statusBadge(category);
          const requiredGaps = category.items.filter(
            (item) => item.tier === "required" && item.status === "needs_attention"
          );
          const recommendedGaps = category.items.filter(
            (item) =>
              item.tier === "recommended" && item.status === "needs_attention"
          );
          const href =
            category.adminHref ??
            (category.key === "business_profile"
              ? `/admin/${tenantSlug}/settings`
              : undefined);

          return (
            <div
              key={category.key}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-950">
                    {category.label}
                  </p>
                  {!category.applicable ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Not part of your current setup path.
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  {href && category.applicable ? (
                    <Link
                      href={href}
                      className="text-xs font-semibold text-orange-700 hover:text-orange-800"
                    >
                      Open
                    </Link>
                  ) : null}
                </div>
              </div>

              {category.applicable && requiredGaps.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-900">
                  {requiredGaps.map((item) => (
                    <li key={item.id}>
                      {item.adminHref ? (
                        <Link
                          href={item.adminHref}
                          className="font-medium underline-offset-2 hover:underline"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        item.label
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}

              {category.applicable && recommendedGaps.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  {recommendedGaps.map((item) => (
                    <li key={item.id}>
                      <span className="text-gray-400">Suggested: </span>
                      {item.adminHref ? (
                        <Link
                          href={item.adminHref}
                          className="font-medium text-gray-600 underline-offset-2 hover:underline"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        item.label
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
