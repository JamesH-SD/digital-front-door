import Link from "next/link";


export default function ContactorAdminHomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
          Platform Admin
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-950">
          Contactor Admin
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Manage tenants, subscriptions, websites, and customer support.
        </p>
      </section>

      <Link
        href="/platform/customers"
        className="block rounded-3xl border border-stone-200 bg-white p-5 shadow-sm hover:border-orange-200 hover:bg-orange-50/40"
      >
        <h2 className="font-bold text-gray-950">Customers</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          View tenants, billing status, and website status.
        </p>
      </Link>
    </div>
  );
}