"use client";

import { useMemo, useState } from "react";
import AppointmentSlotPicker from "@/components/leads/AppointmentSlotPicker";
import {
  buildAppointmentDescription,
  type AppointmentLead,
} from "@/lib/calendar/buildAppointmentDescription";

type AppointmentType = "call" | "site_visit";

function formatSelectedSlot(slot: any | null) {
  if (!slot?.startAt || !slot?.endAt) return "No time selected";

  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);

  return `${new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(start)} → ${new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
  }).format(end)}`;
}

export default function ScheduleModal({
  leadId,
  tenantSlug,
  onClose,
  lead,
  initialTitle,
  initialAddress,
}: {
  leadId: string;
  tenantSlug: string;
  onClose: () => void;
  initialTitle?: string;
  lead: AppointmentLead;
  initialAddress?: string;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  const [appointmentType, setAppointmentType] =
    useState<AppointmentType>("site_visit");

  const [address, setAddress] = useState(initialAddress || "");
  const [title, setTitle] = useState(initialTitle || "On-site Estimate");
  const description = buildAppointmentDescription({
    source: "office",
    lead,
    appointmentType,
    address: appointmentType === "site_visit" ? address : null,
  });

  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState("");

  const requiresAddress = appointmentType === "site_visit";

  const canContinue = Boolean(selectedSlot);

  const canBook = useMemo(() => {
    if (!selectedSlot) return false;
    if (!title.trim()) return false;
    if (requiresAddress && !address.trim()) return false;

    return true;
  }, [selectedSlot, title, requiresAddress, address]);

  async function book() {
    if (!canBook || !selectedSlot) return;

    try {
      setIsBooking(true);
      setError("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/appointments/book`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId,
            appointmentType,
            address: requiresAddress ? address : null,
            title,
            description,
            location: requiresAddress ? address : null,
            startAt: selectedSlot.startAt,
            endAt: selectedSlot.endAt,
            timezone: selectedSlot.timezone,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to book appointment");
      }

      onClose();
      window.location.reload();
    } catch (err) {
      console.error("Book appointment error:", err);
      setError(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-[0_24px_70px_rgba(17,24,39,0.22)]">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-950">
              Schedule Appointment
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {step === 1
                ? "Select an available date and time."
                : "Confirm appointment details before booking."}
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

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {step === 1 ? (
            <AppointmentSlotPicker
              tenantSlug={tenantSlug}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                <span className="font-semibold">Selected time:</span>{" "}
                {formatSelectedSlot(selectedSlot)}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Appointment Type
                </label>

                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAppointmentType("call")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm transition ${
                      appointmentType === "call"
                        ? "border-orange-300 bg-orange-50 text-orange-900 ring-2 ring-orange-100"
                        : "border-stone-200 bg-white text-gray-700 hover:bg-stone-50"
                    }`}
                  >
                    Phone Call
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppointmentType("site_visit")}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm transition ${
                      appointmentType === "site_visit"
                        ? "border-orange-300 bg-orange-50 text-orange-900 ring-2 ring-orange-100"
                        : "border-stone-200 bg-white text-gray-700 hover:bg-stone-50"
                    }`}
                  >
                    Site Visit
                  </button>
                </div>
              </div>

              {requiresAddress ? (
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Site Visit Address
                  </label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter the project address"
                    className="saas-input mt-1 w-full px-3 py-2.5 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Required for site visits. Phone calls do not need an address.
                  </p>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Calendar Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: Bathroom Remodel Walkthrough"
                  className="saas-input mt-1 w-full px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Calendar Event Preview
                </label>

                <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-sm leading-6 text-gray-700">
                  {description}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-stone-100 px-5 py-4 sm:px-6">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="saas-button-secondary px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canContinue}
                className="saas-button-primary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="saas-button-secondary px-4 py-2 text-sm font-semibold"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => void book()}
                disabled={!canBook || isBooking}
                className="saas-button-primary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBooking ? "Booking..." : "Book Appointment"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}