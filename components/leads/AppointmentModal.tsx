"use client";

import { useState } from "react";

/**
 * Human-friendly date/time formatter for appointment display.
 *
 * We keep DB values in ISO/UTC, but contractors need readable local time.
 */
function formatDateTime(value?: string | null) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type AppointmentModalProps = {
  appointment: any;
  tenantSlug: string;
  onClose: () => void;
  onUpdated?: () => void;
};

/**
 * View/manage an existing appointment for a lead.
 *
 * Current v1 behavior:
 * - display appointment details
 * - allow reschedule
 * - allow cancel
 *
 * Why this exists:
 * - once a lead has an appointment, the lead screen should switch from
 *   "schedule something new" to "manage what already exists"
 */
export default function AppointmentModal({
  appointment,
  tenantSlug,
  onClose,
  onUpdated,
}: AppointmentModalProps) {
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [startAt, setStartAt] = useState(
    appointment?.confirmedStartAt
      ? new Date(appointment.confirmedStartAt).toISOString().slice(0, 16)
      : ""
  );

  const [endAt, setEndAt] = useState(
    appointment?.confirmedEndAt
      ? new Date(appointment.confirmedEndAt).toISOString().slice(0, 16)
      : ""
  );

  async function handleCancelAppointment() {
    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/appointments/${appointment.id}/cancel`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel appointment");
      }

      onUpdated?.();
      onClose();
      window.location.reload();
    } catch (err) {
      console.error("Cancel appointment error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to cancel appointment"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRescheduleAppointment() {
    try {
      setIsSaving(true);
      setError("");

      if (!startAt || !endAt) {
        throw new Error("Start and end time are required");
      }

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/appointments/${appointment.id}/reschedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startAt: new Date(startAt).toISOString(),
            endAt: new Date(endAt).toISOString(),
            timezone: appointment.timezone || "America/Los_Angeles",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reschedule appointment");
      }

      onUpdated?.();
      onClose();
      window.location.reload();
    } catch (err) {
      console.error("Reschedule appointment error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to reschedule appointment"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Appointment Details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              View or manage the current appointment for this lead.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {mode === "view" ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm">
              <span className="font-semibold text-gray-700">Status:</span>{" "}
              <span className="capitalize">{appointment.status || "Unknown"}</span>
            </div>

            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm">
              <span className="font-semibold text-gray-700">Type:</span>{" "}
              <span className="capitalize">
                {appointment.appointmentType
                  ? appointment.appointmentType.replace("_", " ")
                  : "Not provided"}
              </span>
            </div>

            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm">
              <span className="font-semibold text-gray-700">When:</span>{" "}
              <span>
                {formatDateTime(appointment.confirmedStartAt)} →{" "}
                {formatDateTime(appointment.confirmedEndAt)}
              </span>
            </div>

            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm">
              <span className="font-semibold text-gray-700">Address:</span>{" "}
              <span>{appointment.address || "Not provided"}</span>
            </div>

            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm">
              <span className="font-semibold text-gray-700">Title:</span>{" "}
              <span>{appointment.title || "Not provided"}</span>
            </div>

            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm">
              <span className="font-semibold text-gray-700">Description:</span>{" "}
              <span>{appointment.description || "Not provided"}</span>
            </div>

            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm">
              <span className="font-semibold text-gray-700">Notes:</span>{" "}
              <span>{appointment.notes || "Not provided"}</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                New Start Time
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                New End Time
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {mode === "view" ? (
            <>
              <button
                type="button"
                onClick={() => setMode("reschedule")}
                className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Reschedule
              </button>

              <button
                type="button"
                onClick={() => void handleCancelAppointment()}
                disabled={isSaving}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {isSaving ? "Cancelling..." : "Cancel Appointment"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMode("view")}
                className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => void handleRescheduleAppointment()}
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Reschedule"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}