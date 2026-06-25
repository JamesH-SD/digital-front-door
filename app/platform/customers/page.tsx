import Link from "next/link";
import { getContactorCustomers } from "@/lib/db/contactor-customers";
import PlatformCustomersTable from "@/components/platform/PlatformCustomersTable";

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StatusBadge({
  value,
  tone = "neutral",
}: {
  value: string;
  tone?: "neutral" | "green" | "amber" | "red" | "orange";
}) {
  const classes = {
    neutral: "bg-stone-100 text-gray-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${classes[tone]}`}
    >
      {value}
    </span>
  );
}

function getBillingTone(status?: string | null) {
  if (status === "active" || status === "trialing") return "green";
  if (status === "past_due") return "amber";
  if (status === "canceled" || status === "unpaid") return "red";
  return "neutral";
}

function getWebsiteTone(status?: string | null) {
  if (status === "published") return "green";
  if (status === "draft") return "amber";
  return "neutral";
}

export default async function ContactorCustomersPage() {
  const customers = await getContactorCustomers();

  const total = customers.length;
  const published = customers.filter((c) => c.websiteStatus === "published").length;
  const trialing = customers.filter((c) => c.subscriptionStatus === "trialing").length;
  const active = customers.filter((c) => c.subscriptionStatus === "active").length;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
          Contactor Admin
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-950">Customers</h1>

        <p className="mt-2 text-sm text-gray-600">
          Internal customer view for soft-launch support.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Tenants</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{total}</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Published</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{published}</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Trialing</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{trialing}</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Active</p>
          <p className="mt-2 text-3xl font-bold text-gray-950">{active}</p>
        </div>
      </section>
      <PlatformCustomersTable customers={customers} />
    </div>
  );
}