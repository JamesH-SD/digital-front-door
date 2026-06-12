"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Lead } from "@/lib/types/lead";

type SortField =
  | "leadNumber"
  | "customerName"
  | "projectType"
  | "location"
  | "status"
  | "createdAt";
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

function toTitleCase(value?: string | null) {
  if (!value) return "Not provided";

  return value
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (!word.length) return word;

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function getStatusClasses(status: string) {
  switch (status) {
    case "new":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "contacted":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "booked":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "closed":
      return "border-stone-200 bg-stone-100 text-stone-600";

    default:
      return "border-stone-200 bg-stone-100 text-stone-600";
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  function resetToFirstPage() {
    setCurrentPage(1);
  }

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
        case "leadNumber":
          valueA = (a.leadNumber || a.id || "").toLowerCase();
          valueB = (b.leadNumber || b.id || "").toLowerCase();
          break;
        
        case "projectType":
          valueA = (a.projectType || "").toLowerCase();
          valueB = (b.projectType || "").toLowerCase();
          break;
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [leads, searchQuery, statusFilter, sortField, sortDirection]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedLeads.length / pageSize)
  );
  
  const paginatedLeads = filteredAndSortedLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
    <div className="space-y-3">
      <div className="flex flex-col gap-4 border-b border-stone-100 pb-4 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search leads..."
            className="w-full rounded-2xl border border-stone-200 bg-white/90 py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#d35400]/40 focus:ring-4 focus:ring-orange-100"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              resetToFirstPage();
            }}
            className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#d35400]/40 focus:ring-4 focus:ring-orange-100"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="booked">Booked</option>
            <option value="closed">Closed</option>
          </select>

          <span className="whitespace-nowrap rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
            {filteredAndSortedLeads.length} / {leads.length}
          </span>
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
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-stone-400"
        >
          <option value="createdAt:desc">Created (Newest)</option>
          <option value="createdAt:asc">Created (Oldest)</option>
          <option value="customerName:asc">Name (A-Z)</option>
          <option value="customerName:desc">Name (Z-A)</option>
          <option value="location:asc">Location (A-Z)</option>
          <option value="location:desc">Location (Z-A)</option>
          <option value="status:asc">Status (A-Z)</option>
          <option value="status:desc">Status (Z-A)</option>
          <option value="leadNumber:asc">Lead (A-Z)</option>
          <option value="leadNumber:desc">Lead (Z-A)</option>
          <option value="projectType:asc">Project (A-Z)</option>
          <option value="projectType:desc">Project (Z-A)</option>
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
      <>
        <div className="overflow-hidden rounded-3xl border border-stone-200/70 bg-white/95 shadow-[0_12px_30px_rgba(17,24,39,0.06)]">
          <div className="hidden grid-cols-6 gap-4 border-b border-stone-200 bg-stone-50/80 px-5 py-3 text-[11px] font-semibold tracking-[0.12em] text-stone-500 md:grid">
            <div>
              <SortableHeader
                label="Lead"
                field="leadNumber"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </div>

            <div>
              <SortableHeader
                label="Name"
                field="customerName"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </div>

            <div>
              <SortableHeader
                label="Project"
                field="projectType"
                activeField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </div>

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
            {paginatedLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/${tenantSlug}/leads/${lead.id}`}
                className="block border-b border-stone-100 px-5 py-4 transition hover:bg-orange-50/40 hover:shadow-[inset_3px_0_0_#c2410c]"
              >
                <div className="space-y-2 md:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium tracking-wide text-gray-500">
                        {lead.leadNumber || lead.id}
                      </p>
                      <h2 className="mt-1 text-sm font-semibold text-gray-900">
                        {lead.customerName}
                      </h2>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide capitalize shadow-sm ${getStatusClasses(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>{toTitleCase(lead.projectType)}</p>
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

                  <div className="text-sm text-gray-600">
                    {toTitleCase(lead.projectType)}
                  </div>

                  <div className="text-sm text-gray-600">
                    {lead.location}
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide capitalize shadow-sm ${getStatusClasses(
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

        {filteredAndSortedLeads.length > pageSize ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * pageSize, filteredAndSortedLeads.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {filteredAndSortedLeads.length}
              </span>{" "}
              leads
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="saas-button-secondary px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="rounded-xl bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="saas-button-secondary px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </>
    )}
    </div>
  );
}