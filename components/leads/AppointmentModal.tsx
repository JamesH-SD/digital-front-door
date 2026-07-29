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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-[0_24px_70px_rgba(17,24,39,0.22)]">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-950">
              {mode === "cancel_followup"
                ? "Appointment Cancelled"
                : "Appointment Details"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {mode === "cancel_followup"
                ? "Choose what should happen with this lead next."
                : "View or manage the current appointment for this lead."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-sm text-gray-500 transition hover:bg-stone-50 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="mx-5 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
            {error}
          </div>
        ) : null}

        {mode === "cancel_followup" ? (
          <div className="mx-5 mb-5 mt-5 rounded-2xl border border-stone-200 bg-stone-50/80 p-4 sm:mx-6">
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
                className="saas-button-secondary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Move to Follow-up
              </button>

              <button
                type="button"
                onClick={() => void handleCancelDecision("closed")}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close Lead
              </button>
            </div>
          </div>
        ) : mode === "view" ? (
          <div className="mx-5 mt-5 grid gap-3 sm:mx-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm leading-6 text-gray-700">
              <span className="font-semibold text-gray-700">Status:</span>{" "}
              <span className="capitalize">{appointment.status || "Unknown"}</span>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm leading-6 text-gray-700">
              <span className="font-semibold text-gray-700">Type:</span>{" "}
              <span className="capitalize">
                {appointment.appointmentType
                  ? appointment.appointmentType.replace("_", " ")
                  : "Not provided"}
              </span>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm leading-6 text-gray-700">
              <span className="font-semibold text-gray-700">When:</span>{" "}
              <span>
                {formatDateTime(appointment.confirmedStartAt)} →{" "}
                {formatDateTime(appointment.confirmedEndAt)}
              </span>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm leading-6 text-gray-700">
              <span className="font-semibold text-gray-700">Address:</span>{" "}
              <span>{appointment.address || "Not provided"}</span>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm leading-6 text-gray-700">
              <span className="font-semibold text-gray-700">Title:</span>{" "}
              <span>{appointment.title || "Not provided"}</span>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm leading-6 text-gray-700">
              <span className="font-semibold text-gray-700">Description:</span>{" "}
              <span>{appointment.description || "Not provided"}</span>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm leading-6 text-gray-700">
              <span className="font-semibold text-gray-700">Notes:</span>{" "}
              <span>{appointment.notes || "Not provided"}</span>
            </div>
          </div>
        ) : (
          <div className="mx-5 mt-5 sm:mx-6">
            <p className="mb-3 text-sm font-semibold text-gray-900">
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
          <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-stone-100 px-5 py-4 sm:px-6">
            {mode === "view" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlot(null);
                    setMode("reschedule");
                  }}
                  className="saas-button-secondary px-4 py-2 text-sm font-semibold"
                >
                  Reschedule
                </button>

                <button
                  type="button"
                  onClick={() => void handleCancelAppointment()}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="saas-button-secondary px-4 py-2 text-sm font-semibold"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => void handleRescheduleAppointment()}
                  disabled={isSaving || !selectedSlot}
                  className="saas-button-primary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
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