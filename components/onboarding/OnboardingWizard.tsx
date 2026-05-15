"use client";

import { useState } from "react";
import type { Tenant } from "@/lib/types/tenant";

type StepKey =
  | "business"
  | "serviceArea"
  | "services"
  | "hours"
  | "calendar"
  | "knowledge"
  | "finish";

const STEPS: { key: StepKey; label: string; required: boolean }[] = [
  { key: "business", label: "Business Identity", required: true },
  { key: "serviceArea", label: "Service Area", required: true },
  { key: "services", label: "Services", required: true },
  { key: "hours", label: "Business Hours", required: false },
  { key: "calendar", label: "Calendar", required: false },
  { key: "knowledge", label: "Knowledge Base", required: false },
  { key: "finish", label: "Finish", required: false },
];

function parseListInput(value: string) {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

export default function OnboardingWizard({ tenant }: { tenant: Tenant }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    businessName: tenant.businessName || "",
    primaryPhone: tenant.primaryPhone || "",
    email: tenant.email || "",
    websiteUrl: tenant.websiteUrl || "",
    primaryCategory: tenant.primaryCategory || "",
    tagline: tenant.tagline || "",
    aboutUs: tenant.aboutUs || "",
    licenseNumber: tenant.licenseNumber || "",
    isInsured: tenant.isInsured ?? false,
  
    addressLine1: tenant.addressLine1 || "",
    city: tenant.city || "",
    state: tenant.state || "",
    zip: tenant.zip || "",
    serviceAreaSummary: tenant.serviceAreaSummary || "",
    serviceCities: (tenant.serviceCities || []).join(", "),
  
    servicesOffered: (tenant.servicesOffered || []).join("\n"),
  });

  const currentStep = STEPS[stepIndex];

  function goBack() {
    setMessage("");
    setStepIndex((prev) => Math.max(0, prev - 1));
  }

  async function saveProgress() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/tenants/${tenant.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            businessName: form.businessName,
            primaryPhone: form.primaryPhone,
            email: form.email,
            websiteUrl: form.websiteUrl,
            primaryCategory: form.primaryCategory,
            tagline: form.tagline,
            aboutUs: form.aboutUs,
            licenseNumber: form.licenseNumber,
            isInsured: form.isInsured,
          
            addressLine1: form.addressLine1,
            city: form.city,
            state: form.state,
            zip: form.zip,
            serviceAreaSummary: form.serviceAreaSummary,
            serviceCities: parseListInput(form.serviceCities),
          
            servicesOffered: parseListInput(form.servicesOffered),
          }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save onboarding step.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function goNext() {
    try {
      if (currentStep.key === "business") {
        if (!form.businessName.trim() || !form.primaryPhone.trim()) {
          setMessage("Business name and primary phone are required.");
          return;
        }
      }

      if (currentStep.key === "serviceArea") {
        if (!form.serviceAreaSummary.trim()) {
          setMessage("Service area summary is required.");
          return;
        }
      }

      if (currentStep.key === "services") {
        if (parseListInput(form.servicesOffered).length === 0) {
          setMessage("Please add at least one service.");
          return;
        }
      }

      await saveProgress();

      if (currentStep.key === "finish") {
        window.location.href = `/admin/${tenant.slug}/settings`;
        return;
      }

      setStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to save onboarding."
      );
    }
  }

  function skipStep() {
    setMessage("");
    setStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1));
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-3xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            Digital Front Door Setup
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            Let’s set up {form.businessName || tenant.businessName || "your business"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Required steps get your AI ready to capture leads. Optional steps can
            be completed now or adjusted later in Settings.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-7">
            {STEPS.map((step, index) => (
              <div
                key={step.key}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  index === stepIndex
                    ? "bg-gray-900 text-white"
                    : index < stepIndex
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                <p className="font-semibold">{index + 1}. {step.label}</p>
                <p>{step.required ? "Required" : "Optional"}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentStep.label}
          </h2>

          {currentStep.key === "business" ? (
            <div className="mt-5 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                <input
                    value={form.businessName}
                    onChange={(e) =>
                    setForm((prev) => ({ ...prev, businessName: e.target.value }))
                    }
                    placeholder="Business name *"
                    className="rounded-xl border px-3 py-2 text-sm"
                />

                <input
                    value={form.primaryPhone}
                    onChange={(e) =>
                    setForm((prev) => ({ ...prev, primaryPhone: e.target.value }))
                    }
                    placeholder="Primary business phone *"
                    className="rounded-xl border px-3 py-2 text-sm"
                />

                <input
                    value={form.email}
                    onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Business email"
                    className="rounded-xl border px-3 py-2 text-sm"
                />

                <input
                    value={form.websiteUrl}
                    onChange={(e) =>
                    setForm((prev) => ({ ...prev, websiteUrl: e.target.value }))
                    }
                    placeholder="Website URL"
                    className="rounded-xl border px-3 py-2 text-sm"
                />

                <input
                    value={form.primaryCategory}
                    onChange={(e) =>
                    setForm((prev) => ({ ...prev, primaryCategory: e.target.value }))
                    }
                    placeholder="Business type/category"
                    className="rounded-xl border px-3 py-2 text-sm"
                />

                <input
                    value={form.tagline}
                    onChange={(e) =>
                    setForm((prev) => ({ ...prev, tagline: e.target.value }))
                    }
                    placeholder="Short tagline"
                    className="rounded-xl border px-3 py-2 text-sm"
                />

                <input
                    value={form.licenseNumber}
                    onChange={(e) =>
                    setForm((prev) => ({ ...prev, licenseNumber: e.target.value }))
                    }
                    placeholder="License number, if applicable"
                    className="rounded-xl border px-3 py-2 text-sm"
                />

                <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-gray-700">
                    <input
                    type="checkbox"
                    checked={form.isInsured}
                    onChange={(e) =>
                        setForm((prev) => ({ ...prev, isInsured: e.target.checked }))
                    }
                    />
                    Insured
                </label>
                </div>

                <textarea
                value={form.aboutUs}
                onChange={(e) =>
                    setForm((prev) => ({ ...prev, aboutUs: e.target.value }))
                }
                rows={4}
                placeholder="About the business"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                />

                <p className="text-sm text-gray-500">
                Primary phone is the main number customers see. SMS notification numbers
                can be configured later when notification preferences are added.
                </p>
            </div>
            ) : null}

        {currentStep.key === "serviceArea" ? (
            <div className="mt-5 space-y-4">
                <input
                value={form.serviceAreaSummary}
                onChange={(e) =>
                    setForm((prev) => ({
                    ...prev,
                    serviceAreaSummary: e.target.value,
                    }))
                }
                placeholder="Example: Serving San Diego County *"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                />

                <div className="grid gap-4 md:grid-cols-4">
                <input
                    value={form.addressLine1}
                    onChange={(e) =>
                    setForm((prev) => ({ ...prev, addressLine1: e.target.value }))
                    }
                    placeholder="Business address"
                    className="rounded-xl border px-3 py-2 text-sm md:col-span-2"
                />

                <input
                    value={form.city}
                    onChange={(e) =>
                    setForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="City"
                    className="rounded-xl border px-3 py-2 text-sm"
                />

                <input
                    value={form.state}
                    onChange={(e) =>
                    setForm((prev) => ({ ...prev, state: e.target.value }))
                    }
                    placeholder="State"
                    className="rounded-xl border px-3 py-2 text-sm"
                />

                <input
                    value={form.zip}
                    onChange={(e) =>
                    setForm((prev) => ({ ...prev, zip: e.target.value }))
                    }
                    placeholder="ZIP"
                    className="rounded-xl border px-3 py-2 text-sm"
                />
                </div>

                <textarea
                value={form.serviceCities}
                onChange={(e) =>
                    setForm((prev) => ({ ...prev, serviceCities: e.target.value }))
                }
                rows={5}
                placeholder="Service cities. You can separate by commas or put one per line."
                className="w-full rounded-xl border px-3 py-2 text-sm"
                />

                <p className="text-sm text-gray-500">
                For now, enter cities or areas manually. Later this can become a map,
                radius, ZIP-code, or service-area selector.
                </p>
            </div>
            ) : null}

          {currentStep.key === "services" ? (
            <div className="mt-5 space-y-4">
              <textarea
                value={form.servicesOffered}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    servicesOffered: e.target.value,
                  }))
                }
                rows={8}
                placeholder="Add one service per line. Example: Bathroom remodel, Kitchen remodel, Flooring"
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />

              <p className="text-sm text-gray-500">
                This keeps the first version simple. Later this step can become a
                full service catalog with pricing, duration, and bookable service
                options.
              </p>
            </div>
          ) : null}

          {currentStep.key === "hours" ? (
            <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-700">
                Business hours can be configured from Settings after setup. We’ll
                use default weekday hours for now.
              </p>
            </div>
          ) : null}

          {currentStep.key === "calendar" ? (
            <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-700">
                Google Calendar can be connected now or later from Settings.
              </p>

              <button
                type="button"
                onClick={() => {
                  window.location.href = `/api/admin/tenants/${tenant.slug}/calendar-connections/google/start`;
                }}
                className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Connect Google Calendar
              </button>
            </div>
          ) : null}

          {currentStep.key === "knowledge" ? (
            <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
              <p className="text-sm text-gray-700">
                You can add FAQs, policies, pricing notes, and service details
                later from the Knowledge Base in Settings.
              </p>
            </div>
          ) : null}

          {currentStep.key === "finish" ? (
            <div className="mt-5 rounded-2xl border bg-green-50 p-4">
              <p className="text-sm text-green-800">
                Your Digital Front Door workspace is ready. You can continue
                refining setup from Admin Settings.
              </p>
            </div>
          ) : null}

          {message ? (
            <p className="mt-4 rounded-xl border bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              Back
            </button>

            <div className="flex gap-3">
              {!currentStep.required && currentStep.key !== "finish" ? (
                <button
                  type="button"
                  onClick={skipStep}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  Skip for now
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => void goNext()}
                disabled={isSaving}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : currentStep.key === "finish"
                  ? "Go to Settings"
                  : "Save & Continue"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}