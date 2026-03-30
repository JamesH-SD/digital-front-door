"use client";

import { useState } from "react";
import type { Lead } from "@/lib/types/lead";

type LeadStatus = "new" | "contacted" | "booked" | "closed";

function displayValue(value?: string) {
  return value && value.trim() ? value : "Not provided";
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

function CompactField({
  label,
  value,
  isEditing = false,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  isEditing?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  if (isEditing) {
    return (
      <div className="rounded-lg border bg-gray-50 px-3 py-2">
        <label className="text-sm font-semibold text-gray-700">
          {label}:
        </label>
        <input
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-900">
      <span className="font-semibold text-gray-700">{label}:</span>{" "}
      <span>{displayValue(value)}</span>
    </div>
  );
}

export default function LeadDetailClient({ lead }: { lead: Lead }) {
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    phone: lead.phone || "",
    email: lead.email || "",
    address: lead.address || "",
    appointment: lead.appointment || "",
    location: lead.location || "",
    timeline: lead.timeline || "",
    projectType: lead.projectType || "",
    notes: lead.notes || "",
    status: (lead.status || "new") as LeadStatus,
  });

  const appointmentMissing = !form.appointment.trim();

  return (
    <div className="space-y-6">
      {/* Large main container */}
      <div className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-5">
          {/* Header row inside large div */}
          <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Contact & Job Details
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Review and manage lead information.
              </p>
            </div>

            <div className="w-full md:w-56">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as LeadStatus,
                  }))
                }
                className={`mt-1 w-full rounded-full border px-3 py-2 text-sm font-medium capitalize outline-none ${getStatusClasses(
                  form.status
                )}`}
              >
                <option value="new">new</option>
                <option value="contacted">contacted</option>
                <option value="booked">booked</option>
                <option value="closed">closed</option>
              </select>
            </div>
          </div>

          {/* Main fields block */}
          <div className="grid gap-3 md:grid-cols-2">
            <CompactField
              label="Phone"
              value={form.phone}
              isEditing={isEditing}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, phone: value }))
              }
            />

            <CompactField
              label="Email"
              value={form.email}
              isEditing={isEditing}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, email: value }))
              }
            />

            <CompactField
              label="Address"
              value={form.address}
              isEditing={isEditing}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, address: value }))
              }
            />

            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-900">
              {isEditing ? (
                <>
                  <label className="text-sm font-semibold text-gray-700">
                    Appointment:
                  </label>
                  <input
                    value={form.appointment}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        appointment: e.target.value,
                      }))
                    }
                    placeholder="Enter date and time"
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
                  />
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-700">
                      Appointment:
                    </span>{" "}
                    <span>{displayValue(form.appointment)}</span>
                  </div>

                  {appointmentMissing && (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Schedule
                    </button>
                  )}
                </div>
              )}
            </div>

            <CompactField
              label="Location"
              value={form.location}
              isEditing={isEditing}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, location: value }))
              }
            />

            <CompactField
              label="Timeline"
              value={form.timeline}
              isEditing={isEditing}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, timeline: value }))
              }
            />
          </div>

          {/* Description */}
          <div className="rounded-2xl border bg-gray-50/60 p-4">
            <p className="text-sm font-semibold text-gray-700">Description:</p>

            {isEditing ? (
              <textarea
                value={form.projectType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    projectType: e.target.value,
                  }))
                }
                rows={4}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
                placeholder="Enter description"
              />
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                {displayValue(form.projectType)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-2xl border bg-gray-50/60 p-4">
            <p className="text-sm font-semibold text-gray-700">Notes:</p>

            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={5}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="Add contractor notes here"
              disabled={!isEditing}
            />

            {!isEditing && (
              <p className="mt-2 text-xs text-gray-500">
                Click Edit to update notes and lead details.
              </p>
            )}
          </div>

          {/* Images */}
          <div className="rounded-2xl border bg-gray-50/60 p-4">
            <p className="text-sm font-semibold text-gray-700">Images:</p>

            {lead.images && lead.images.length > 0 ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lead.images.map((image) => (
                  <div
                    key={image.id}
                    className="rounded-xl border bg-gray-50 p-3"
                  >
                    <div className="overflow-hidden rounded-lg bg-white">
                      <img
                        src={image.url}
                        alt={image.filename || "Lead image"}
                        className="h-full w-full aspect-video object-cover"
                      />
                    </div>
                    <p className="mt-2 truncate text-xs text-gray-600">
                      {image.filename || image.url}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-900">Not provided</p>
            )}
          </div>
        </div>
      </div>

      {/* Centered bottom buttons */}
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white"
        >
          Create Record
        </button>

        <button
          type="button"
          onClick={() => setIsEditing((prev) => !prev)}
          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>
    </div>
  );
}