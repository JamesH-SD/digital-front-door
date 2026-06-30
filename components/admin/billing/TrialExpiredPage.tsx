import Link from "next/link";

type Props = {
  tenantSlug: string;
  title: string;
  description: string;
};

export default function TrialExpiredPage({
  tenantSlug,
  title,
  description,
}: Props) {
  return (
    <div className="rounded-3xl border border-orange-200 bg-orange-50 p-8 shadow-sm">
     <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
      Continue Growing Your Business
    </p>

    <p className="mt-2 text-sm font-medium text-gray-500">
      Thanks for trying Contactor! Your complimentary trial has ended.
    </p>

    <h1 className="mt-3 text-3xl font-bold text-gray-950">
      Continue using {title}
    </h1>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-700">
        {description}
      </p>

      <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-5">
        <ul className="space-y-3 text-sm font-semibold text-gray-900">
          {[
            "Your website has been saved.",
            "Your AI receptionist settings have been saved.",
            "Your customer leads are still available.",
            "Resume anytime without losing your work.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-5 border-t border-stone-100 pt-4 text-sm text-gray-600">
          Your data has not been deleted. Subscribe to continue editing your website,
          AI receptionist, customer settings, and business knowledge.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/admin/${tenantSlug}/billing`}
          className="inline-flex h-12 min-w-[240px] items-center justify-center rounded-xl bg-orange-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-800"
        >
          Resume Your Subscription
        </Link>

        <Link
          href={`/admin/${tenantSlug}`}
          className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-xl border border-stone-300 bg-white px-6 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-stone-50"
        >
          Not Right Now
        </Link>
      </div>
    </div>
  );
}