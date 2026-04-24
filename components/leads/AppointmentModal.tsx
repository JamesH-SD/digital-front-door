"use client";

import { useState } from "react";
import AppointmentSlotPicker from "@/components/leads/AppointmentSlotPicker";

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
  leadId: string;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function AppointmentModal({
  appointment,
  tenantSlug,
  leadId,
  onClose,
  onUpdated,
}: AppointmentModalProps) {
  const [mode, setMode] = useState<"view" | "reschedule" | "cancel_followup">(
    "view"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  async function updateLeadStatus(status: "contacted" | "closed") {
    const response = await fetch(`/api/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to update lead status");
    }

    return result;
  }

  async function handleCancelAppointment() {
    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/appointments/${appointment.id}/cancel`,
        { method: "POST" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel appointment");
      }

      /**
       * Keep this modal open after cancellation so the contractor can decide
       * what should happen to the lead next.
       *
       * Do NOT call onUpdated here. If we refresh the parent appointment state now,
       * latestAppointment becomes null and the modal unmounts before the contractor
       * can choose Follow-up or Close Lead.
       */
      setMode("cancel_followup");
    } catch (err) {
      console.error("Cancel appointment error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to cancel appointment"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancelDecision(status: "contacted" | "closed") {
    try {
      setIsSaving(true);
      setError("");

      await updateLeadStatus(status);

      onUpdated?.();
      onClose();
      window.location.reload();
    } catch (err) {
      console.error("Cancel follow-up decision error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update lead status"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRescheduleAppointment() {
    try {
      setIsSaving(true);
      setError("");

      if (!selectedSlot) {
        throw new Error("Please select a new appointment time.");
      }

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/appointments/${appointment.id}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startAt: selectedSlot.startAt,
            endAt: selectedSlot.endAt,
            timezone: selectedSlot.timezone,
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
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === "cancel_followup"
                ? "Appointment Cancelled"
                : "Appointment Details"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "cancel_followup"
                ? "Choose what should happen with this lead next."
                : "View or manage the current appointment for this lead."}
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

        {mode === "cancel_followup" ? (
          <div className="mt-4 rounded-xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              The appointment was removed from Google Calendar and marked
              cancelled. Should this lead stay active for follow-up, or should it
              be closed?
            </p>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => void handleCancelDecision("contacted")}
                disabled={isSaving}
                className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white disabled:opacity-50"
              >
                Move to Follow-up
              </button>

              <button
                type="button"
                onClick={() => void handleCancelDecision("closed")}
                disabled={isSaving}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Close Lead
              </button>
            </div>
          </div>
        ) : mode === "view" ? (
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
          <div className="mt-4">
            <p className="mb-3 text-sm font-semibold text-gray-800">
              Select a new available time
            </p>

            <AppointmentSlotPicker
              tenantSlug={tenantSlug}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
          </div>
        )}

        {mode !== "cancel_followup" ? (
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            {mode === "view" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlot(null);
                    setMode("reschedule");
                  }}
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
                  onClick={() => {
                    setSelectedSlot(null);
                    setMode("view");
                  }}
                  className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => void handleRescheduleAppointment()}
                  disabled={isSaving || !selectedSlot}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Reschedule"}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}