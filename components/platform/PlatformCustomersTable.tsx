"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ContactorCustomer } from "@/lib/db/contactor-customers";

type SortKey =
  | "businessName"
  | "email"
  | "phone"
  | "websiteStatus"
  | "subscriptionStatus"
  | "createdAt"
  | "trialEndsAt";

type Props = {
  customers: ContactorCustomer[];
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatPhone(value?: string | null) {
  if (!value) return "—";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return value;
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
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${classes[tone]}`}>
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

export default function PlatformCustomersTable({ customers }: Props) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }

    setPage(1);
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return customers
      .filter((customer) => {
        if (!normalized) return true;

        return [
          customer.businessName,
          customer.slug,
          customer.email,
          customer.phone,
          customer.websiteStatus,
          customer.subscriptionStatus,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        const aValue = String(a[sortKey] || "").toLowerCase();
        const bValue = String(b[sortKey] || "").toLowerCase();

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [customers, query, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const headers: { label: string; key: SortKey; className?: string }[] = [
    { label: "Business", key: "businessName" },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone" },
    { label: "Website", key: "websiteStatus" },
    { label: "Billing", key: "subscriptionStatus" },
    { label: "Created", key: "createdAt" },
    { label: "Trial Ends", key: "trialEndsAt", className: "whitespace-nowrap" },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-stone-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-bold text-gray-950">Tenant Accounts</h2>
          <p className="mt-1 text-sm text-gray-500">
            Search and review customer accounts.
          </p>
        </div>

        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search customers..."
          className="saas-input w-full px-3 py-2 text-sm md:max-w-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {headers.map((header) => (
                <th key={header.key} className={`px-4 py-3 ${header.className || ""}`}>
                  <button
                    type="button"
                    onClick={() => toggleSort(header.key)}
                    className="font-bold hover:text-orange-700"
                  >
                    {header.label}
                    {sortKey === header.key ? (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100">
            {pageItems.map((customer) => (
              <tr key={customer.id} className="hover:bg-orange-50/40">
                <td className="px-4 py-4">
                  <Link
                    href={`/platform/customers/${customer.slug}`}
                    className="font-semibold text-gray-950 hover:text-orange-700"
                  >
                    {customer.businessName}
                  </Link>
                  <p className="mt-1 text-xs text-gray-500">{customer.slug}</p>
                </td>

                <td className="px-4 py-4 text-gray-700">
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="hover:text-orange-700 hover:underline">
                      {customer.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="px-4 py-4 text-gray-700">
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`} className="whitespace-nowrap hover:text-orange-700 hover:underline">
                      {formatPhone(customer.phone)}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="px-4 py-4">
                  <StatusBadge
                    value={customer.websiteStatus || "unknown"}
                    tone={getWebsiteTone(customer.websiteStatus)}
                  />
                </td>

                <td className="px-4 py-4">
                  <StatusBadge
                    value={customer.subscriptionStatus || "none"}
                    tone={getBillingTone(customer.subscriptionStatus)}
                  />
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                  {formatDate(customer.createdAt)}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                  {formatDate(customer.trialEndsAt)}
                </td>
              </tr>
            ))}

            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-stone-200 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {pageItems.length} of {filtered.length} customers
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="saas-button-secondary px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Previous
          </button>

          <span className="px-2 text-sm font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="saas-button-secondary px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}