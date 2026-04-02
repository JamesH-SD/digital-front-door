"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Lead } from "@/lib/types/lead";

type SortField = "customerName" | "location" | "status" | "createdAt";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "new" | "contacted" | "booked" | "closed";

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getStatusClasses(status: string) {
  switch (status) {
    case "new":
      return "bg-green-100 text-green-700 border-green-200";
    case "contacted":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "booked":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "closed":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function SortableHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
}: {
  label: string;
  field: SortField;
  activeField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = activeField === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 text-left transition hover:text-gray-900"
    >
      <span>{label}</span>
      <span className="text-[10px]">
        {isActive ? (direction === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

export default function AdminLeadListClient({
  tenantSlug,
  leads = [],
}: {
  tenantSlug: string;
  leads?: Lead[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "createdAt" ? "desc" : "asc");
  }

  const filteredAndSortedLeads = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = leads.filter((lead) => {
      const matchesSearch =
        !normalizedQuery ||
        (lead.customerName || "").toLowerCase().includes(normalizedQuery) ||
        (lead.projectType || "").toLowerCase().includes(normalizedQuery) ||
        (lead.location || "").toLowerCase().includes(normalizedQuery) ||
        ((lead.leadNumber || lead.id) || "")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "all" ? true : lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered];

    sorted.sort((a, b) => {
      let valueA: string | number = "";
      let valueB: string | number = "";

      switch (sortField) {
        case "customerName":
          valueA = (a.customerName || "").toLowerCase();
          valueB = (b.customerName || "").toLowerCase();
          break;
        case "location":
          valueA = (a.location || "").toLowerCase();
          valueB = (b.location || "").toLowerCase();
          break;
        case "status":
          valueA = (a.status || "").toLowerCase();
          valueB = (b.status || "").toLowerCase();
          break;
        case "createdAt":
          valueA = new Date(a.createdAt).getTime();
          valueB = new Date(b.createdAt).getTime();
          break;
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [leads, searchQuery, statusFilter, sortField, sortDirection]);

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          No leads captured yet
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Once a visitor completes the chat intake flow, their lead will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="booked">Booked</option>
            <option value="closed">Closed</option>
          </select>

          <div className="whitespace-nowrap text-xs text-gray-500">
            {filteredAndSortedLeads.length} / {leads.length}
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <select
          value={`${sortField}:${sortDirection}`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split(":") as [
              SortField,
              SortDirection
            ];
            setSortField(field);
            setSortDirection(direction);
          }}
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
        >
          <option value="createdAt:desc">Created (Newest)</option>
          <option value="createdAt:asc">Created (Oldest)</option>
          <option value="customerName:asc">Name (A-Z)</option>
          <option value="customerName:desc">Name (Z-A)</option>
          <option value="location:asc">Location (A-Z)</option>
          <option value="location:desc">Location (Z-A)</option>
          <option value="status:asc">Status (A-Z)</option>
          <option value="status:desc">Status (Z-A)</option>
        </select>
      </div>

      {filteredAndSortedLeads.length === 0 ? (
        <div className="rounded-2xl border bg-white px-6 py-16 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            No matching leads
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Try adjusting your search or status filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="hidden grid-cols-6 gap-4 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid">
            <div>Lead</div>
            <div>
              <SortableHeader
                label="Name"
                field="customerName"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div>Project</div>
            <div>
              <SortableHeader
                label="Location"
                field="location"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div>
              <SortableHeader
                label="Status"
                field="status"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div>
              <SortableHeader
                label="Created"
                field="createdAt"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </div>
          </div>

          <div>
            {filteredAndSortedLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/${tenantSlug}/leads/${lead.id}`}
                className="block border-b px-4 py-4 transition hover:bg-gray-50"
              >
                <div className="space-y-2 md:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {lead.leadNumber || lead.id}
                      </p>
                      <h2 className="mt-1 text-sm font-semibold text-gray-900">
                        {lead.customerName}
                      </h2>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>{lead.projectType}</p>
                    <p>{lead.location}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(lead.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="hidden grid-cols-6 gap-4 md:grid">
                  <div className="text-sm text-gray-600">
                    {lead.leadNumber || lead.id}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {lead.customerName}
                  </div>
                  <div className="text-sm text-gray-600">{lead.projectType}</div>
                  <div className="text-sm text-gray-600">{lead.location}</div>
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(lead.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}