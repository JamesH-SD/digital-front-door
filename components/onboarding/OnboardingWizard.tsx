"use client";

import { useState } from "react";
import type { Tenant } from "@/lib/types/tenant";
import TenantKnowledgeManager from "@/components/admin/settings/TenantKnowledgeManager";

type StepKey =
  | "business"
  | "serviceArea"
  | "services"
  | "hours"
  | "calendar"
  | "knowledge"
  | "finish";

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

type HoursState = Record<DayKey, DayHours>;

const DAYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const STEPS: { key: StepKey; label: string; required: boolean }[] = [
  { key: "business", label: "Business", required: true },
  { key: "serviceArea", label: "Service Area", required: true },
  { key: "services", label: "Services", required: true },
  { key: "hours", label: "Hours", required: false },
  { key: "calendar", label: "Calendar", required: false },
  { key: "knowledge", label: "Knowledge", required: false },
  { key: "finish", label: "Review", required: false },
];

const STEP_HELP: Record<
  StepKey,
  {
    eyebrow: string;
    title: string;
    description: string;
    examples?: string[];
  }
> = {
  business: {
    eyebrow: "Business Profile",
    title: "Tell us who customers are contacting.",
    description:
      "This information appears on your website and helps the AI receptionist answer basic questions correctly.",
    examples: [
      "Business name: Hughes General Contractors",
      "Category: General contractor, plumber, mobile detailer",
      "Tagline: Veteran-owned remodeling specialists",
    ],
  },
  serviceArea: {
    eyebrow: "Service Area",
    title: "Where do you work?",
    description:
      "This helps the AI answer questions like “Do you service Vista?” or “Can you come to Temecula?”",
    examples: [
      "Serving San Diego County",
      "North County, Vista, Oceanside, San Marcos",
      "Within 25 miles of Temecula",
    ],
  },
  services: {
    eyebrow: "Services & Next Step",
    title: "What can customers ask about?",
    description:
      "List the services you want the AI receptionist to understand. Keep it simple — you can improve this later.",
    examples: [
      "Kitchen remodels",
      "Bathroom remodels",
      "Flooring installation",
      "The next step is usually a quick call or site visit.",
    ],
  },
  hours: {
    eyebrow: "Business Hours",
    title: "When should customers expect a response?",
    description:
      "These hours help set expectations. You can still receive leads outside of business hours.",
  },
  calendar: {
    eyebrow: "Scheduling",
    title: "Connect your calendar.",
    description:
      "This lets Contactor check availability and help guide customers toward appointments.",
  },
  knowledge: {
    eyebrow: "Knowledge Base",
    title: "Help the AI answer better.",
    description:
      "Upload FAQs, service details, pricing guidance, or business documents so the AI can answer more accurately.",
    examples: [
      "FAQ document",
      "About us document",
      "Service descriptions",
      "Quote or appointment policies",
    ],
  },
  finish: {
    eyebrow: "Review",
    title: "Review your setup.",
    description:
      "Make sure the basics are correct before entering your admin dashboard.",
  },
};

const DEFAULT_HOURS: HoursState = {
  monday: { open: "08:00", close: "17:00", closed: false },
  tuesday: { open: "08:00", close: "17:00", closed: false },
  wednesday: { open: "08:00", close: "17:00", closed: false },
  thursday: { open: "08:00", close: "17:00", closed: false },
  friday: { open: "08:00", close: "17:00", closed: false },
  saturday: { open: "08:00", close: "17:00", closed: true },
  sunday: { open: "08:00", close: "17:00", closed: true },
};

function parseListInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDayLabel(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatHours(hours: HoursState, day: DayKey) {
  const value = hours[day];

  if (!value || value.closed) return "Closed";

  return `${value.open} - ${value.close}`;
}

function normalizeHours(value: unknown): HoursState {
  if (!value || typeof value !== "object") return DEFAULT_HOURS;

  return {
    ...DEFAULT_HOURS,
    ...(value as Partial<HoursState>),
  };
}

function formatHourForDisplay(value?: string) {
  if (!value) return "";

  const [hourValue, minuteValue] = value.split(":");
  const hour = Number(hourValue);
  const minute = minuteValue || "00";

  if (Number.isNaN(hour)) return value;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function formatHoursForReview(hours: HoursState) {
  const monday = hours.monday;

  if (!monday || monday.closed) {
    return "Monday: Closed";
  }

  return `Monday: ${formatHourForDisplay(monday.open)} - ${formatHourForDisplay(
    monday.close
  )}`;
}

function SummaryRow({
  label,
  value,
  detail,
  onEdit,
}: {
  label: string;
  value: string;
  detail?: string;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
              ✓
            </span>

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {label}
            </p>
          </div>

          <p className="mt-2 text-sm font-semibold text-gray-950">{value}</p>

          {detail ? (
            <p className="mt-1 text-sm leading-6 text-gray-500">{detail}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-orange-700 hover:text-orange-800"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default function OnboardingWizard({ tenant }: { tenant: Tenant }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [returnToReview, setReturnToReview] = useState(false);
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
    country: tenant.country || "United States",
    zip: tenant.zip || "",
    serviceAreaSummary: tenant.serviceAreaSummary || "",
    serviceCities: (tenant.serviceCities || []).join(", "),

    servicesOffered: (tenant.servicesOffered || []).join("\n"),
    bookingType: tenant.bookingType || "consultation",
    nextStepMessage: tenant.nextStepMessage || "",

    hours: normalizeHours(tenant.hours),
  });

  const currentStep = STEPS[stepIndex];
  const progressPercent = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  function editFromReview(index: number) {
    setReturnToReview(true);
    setStepIndex(index);
  }
  
  function goBack() {
    setMessage("");
    setStepIndex((prev) => Math.max(0, prev - 1));
  }

  function skipStep() {
    setMessage("");
    setStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1));
  }

  function updateHoursDay(day: DayKey, updates: Partial<DayHours>) {
    setForm((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          ...updates,
        },
      },
    }));
  }

  function applyMondayToWeekdays() {
    const monday = form.hours.monday;

    setForm((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        monday,
        tuesday: { ...monday },
        wednesday: { ...monday },
        thursday: { ...monday },
        friday: { ...monday },
      },
    }));
  }

  function applyMondayToAllDays() {
    const monday = form.hours.monday;

    setForm((prev) => ({
      ...prev,
      hours: {
        monday: { ...monday },
        tuesday: { ...monday },
        wednesday: { ...monday },
        thursday: { ...monday },
        friday: { ...monday },
        saturday: { ...monday },
        sunday: { ...monday },
      },
    }));
  }

  function generateTagline() {
    const category = form.primaryCategory || "service business";
    setForm((prev) => ({
      ...prev,
      tagline: `Reliable ${category} services made simple.`,
    }));
  }

  function generateAboutUs() {
    const name = form.businessName || "Our business";
    const category = form.primaryCategory || "service";
    const area = form.serviceAreaSummary || "our local community";

    setForm((prev) => ({
      ...prev,
      aboutUs: `${name} provides dependable ${category} services for customers in ${area}. We focus on clear communication, quality work, and helping customers feel confident from the first conversation through the finished result.`,
    }));
  }

  function generateNextStepMessage() {
    setForm((prev) => ({
      ...prev,
      nextStepMessage:
        "The next step is usually a quick conversation so we can better understand the request and recommend the best path forward.",
    }));
  }

  function generateServices() {
    const category = form.primaryCategory || "service business";
  
    setForm((prev) => ({
      ...prev,
      servicesOffered: [
        `${category} consultations`,
        `${category} estimates`,
        `${category} repairs`,
        `${category} maintenance`,
      ].join("\n"),
    }));
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
          country: form.country,
          zip: form.zip,
          serviceAreaSummary: form.serviceAreaSummary,
          serviceCities: parseListInput(form.serviceCities),

          servicesOffered: parseListInput(form.servicesOffered),
          bookingType: form.bookingType,
          nextStepMessage: form.nextStepMessage,

          hours: form.hours,
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

      if (returnToReview) {
        setReturnToReview(false);
        setStepIndex(STEPS.length - 1);
        return;
      }
      
      setStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to save onboarding."
      );
    }
  }

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="w-full">
          <div className="rounded-3xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
              Digital Front Door Setup
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
              Let’s set up {form.businessName || tenant.businessName || "your business"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Complete the essentials now. You can refine everything later from
              Admin Settings.
            </p>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>
                  Step {stepIndex + 1} of {STEPS.length}: {currentStep.label}
                </span>
                <span>{progressPercent}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="mt-4 hidden grid-cols-7 gap-2 text-xs font-semibold text-gray-500 md:grid">
                {STEPS.map((step, index) => (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setStepIndex(index)}
                    className={`rounded-xl px-2 py-2 text-left transition ${
                      index === stepIndex
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                        : index < stepIndex
                        ? "bg-orange-50 text-orange-800"
                        : "bg-white text-gray-500"
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <section className="mt-5 rounded-3xl border border-stone-200 bg-white p-5">
            <div className="mb-5 flex flex-col gap-2 border-b border-stone-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
              <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                {STEP_HELP[currentStep.key].eyebrow}
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-950">
                {STEP_HELP[currentStep.key].title}
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                {STEP_HELP[currentStep.key].description}
              </p>

              {STEP_HELP[currentStep.key].examples ? (
                <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-800">
                    Examples
                  </p>

                  <ul className="mt-2 space-y-1 text-sm text-orange-900">
                    {STEP_HELP[currentStep.key].examples?.map((example) => (
                      <li key={example}>• {example}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              </div>
            </div>

            {currentStep.key === "business" ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={form.businessName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, businessName: e.target.value }))
                    }
                    placeholder="Business name *"
                    className="saas-input w-full px-3 py-2 text-sm"
                  />

                  <input
                    value={form.primaryPhone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, primaryPhone: e.target.value }))
                    }
                    placeholder="Primary business phone *"
                    className="saas-input w-full px-3 py-2 text-sm"
                  />

                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Business email"
                    className="saas-input w-full px-3 py-2 text-sm"
                  />

                  <input
                    value={form.websiteUrl}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, websiteUrl: e.target.value }))
                    }
                    placeholder="Website URL"
                    className="saas-input w-full px-3 py-2 text-sm"
                  />

                  <input
                    value={form.primaryCategory}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        primaryCategory: e.target.value,
                      }))
                    }
                    placeholder="Business type/category"
                    className="saas-input w-full px-3 py-2 text-sm"
                  />

                  <div className="relative">
                    <input
                      value={form.tagline}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, tagline: e.target.value }))
                      }
                      placeholder="Short tagline"
                      className="saas-input w-full px-3 py-2 pr-10 text-sm"
                    />

                    <button
                      type="button"
                      onClick={generateTagline}
                      title="Let AI help"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 text-sm hover:bg-orange-50"
                    >
                      ✨
                    </button>
                  </div>

                  <input
                    value={form.licenseNumber}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        licenseNumber: e.target.value,
                      }))
                    }
                    placeholder="License number, if applicable"
                    className="saas-input w-full px-3 py-2 text-sm"
                  />

                  <label className="saas-input flex items-center gap-2 px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isInsured}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isInsured: e.target.checked,
                        }))
                      }
                    />
                    Insured
                  </label>
                </div>

                <div className="relative">
                  <textarea
                    value={form.aboutUs}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        aboutUs: e.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="About the business"
                    className="saas-input w-full px-3 py-2 pr-10 text-sm"
                  />

                  <button
                    type="button"
                    onClick={generateAboutUs}
                    title="Let AI help"
                    className="absolute right-2 top-2 rounded-full px-2 text-sm hover:bg-orange-50"
                  >
                    ✨
                  </button>
                </div>
              </div>
            ) : null}

            {currentStep.key === "serviceArea" ? (
              <div className="space-y-4">
                <input
                  value={form.serviceAreaSummary}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      serviceAreaSummary: e.target.value,
                    }))
                  }
                  placeholder="Example: Serving San Diego County *"
                  className="saas-input w-full px-3 py-2 text-sm"
                />

                <div className="grid gap-4 md:grid-cols-4">
                  <input
                    value={form.addressLine1}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, addressLine1: e.target.value }))
                    }
                    placeholder="Business address"
                    className="saas-input px-3 py-2 text-sm md:col-span-2"
                  />

                  <input
                    value={form.city}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="City"
                    className="saas-input px-3 py-2 text-sm"
                  />

                  <select
                    value={form.state}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, state: e.target.value }))
                    }
                    className="saas-input px-3 py-2 text-sm"
                  >
                    <option value="">State</option>
                    <option value="CA">CA</option>
                    <option value="AZ">AZ</option>
                    <option value="NV">NV</option>
                    <option value="TX">TX</option>
                    <option value="FL">FL</option>
                    <option value="NY">NY</option>
                  </select>

                  <select
                    value={form.country}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, country: e.target.value }))
                    }
                    className="saas-input px-3 py-2 text-sm"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Mexico">Mexico</option>
                  </select>    

                  <input
                    value={form.zip}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, zip: e.target.value }))
                    }
                    placeholder="ZIP"
                    className="saas-input px-3 py-2 text-sm"
                  />
                </div>

                <textarea
                  value={form.serviceCities}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, serviceCities: e.target.value }))
                  }
                  rows={5}
                  placeholder="Service cities. Separate by commas or put one per line."
                  className="saas-input w-full px-3 py-2 text-sm"
                />
              </div>
            ) : null}

            {currentStep.key === "services" ? (
              <div className="space-y-4">
                <select
                  value={form.bookingType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bookingType: e.target.value }))
                  }
                  className="saas-input w-full px-3 py-2 text-sm"
                >
                  <option value="consultation">Consultation / estimate</option>
                  <option value="reservation">Reservation / rental</option>
                  <option value="direct_booking">Direct service booking</option>
                  <option value="phone_call">Phone call follow-up</option>
                  <option value="estimate">Quote / estimate request</option>
                  <option value="lead_capture">Lead capture only</option>
                  <option value="manual_followup">Manual follow-up</option>
                  <option value="product_signup">Product signup</option>
                </select>

                <textarea
                  value={form.nextStepMessage}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      nextStepMessage: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="AI next step message"
                  className="saas-input w-full px-3 py-2 text-sm"
                />

                <div className="relative">
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
                    className="saas-input w-full px-3 py-2 pr-10 text-sm"
                  />

                  <button
                    type="button"
                    onClick={generateServices}
                    title="Let AI help"
                    className="absolute right-2 top-2 rounded-full px-2 text-sm hover:bg-orange-50"
                  >
                    ✨
                  </button>
                </div>
              </div>
            ) : null}

            {currentStep.key === "hours" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-3">
                  <button
                    type="button"
                    onClick={applyMondayToWeekdays}
                    className="saas-button-secondary px-3 py-2 text-xs font-semibold"
                  >
                    Apply Monday to weekdays
                  </button>

                  <button
                    type="button"
                    onClick={applyMondayToAllDays}
                    className="saas-button-secondary px-3 py-2 text-xs font-semibold"
                  >
                    Apply Monday to all days
                  </button>
                </div>

                {DAYS.map((day) => {
                  const value = form.hours[day];

                  return (
                    <div
                      key={day}
                      className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-3 md:grid-cols-[130px_auto_1fr_1fr]"
                    >
                      <div className="flex items-center text-sm font-semibold text-gray-800">
                        {formatDayLabel(day)}
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={value.closed}
                          onChange={(e) =>
                            updateHoursDay(day, { closed: e.target.checked })
                          }
                        />
                        Closed
                      </label>

                      <input
                        type="time"
                        value={value.open}
                        disabled={value.closed}
                        onChange={(e) =>
                          updateHoursDay(day, { open: e.target.value })
                        }
                        className="saas-input px-3 py-2 text-sm disabled:bg-stone-100"
                      />

                      <input
                        type="time"
                        value={value.close}
                        disabled={value.closed}
                        onChange={(e) =>
                          updateHoursDay(day, { close: e.target.value })
                        }
                        className="saas-input px-3 py-2 text-sm disabled:bg-stone-100"
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}

            {currentStep.key === "calendar" ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="text-sm leading-6 text-gray-700">
                  Connect Google Calendar now, or skip and connect it later from
                  Settings.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      `/api/admin/tenants/${tenant.slug}/calendar-connections/google/start` +
                      `?returnTo=${encodeURIComponent(`/onboarding/${tenant.slug}`)}`;
                  }}
                  className="saas-button-accent mt-4 px-4 py-2 text-sm font-semibold"
                >
                  Connect Google Calendar
                </button>
              </div>
            ) : null}

            {currentStep.key === "knowledge" ? (
              <div className="-mx-2">
                <TenantKnowledgeManager tenantSlug={tenant.slug} />
              </div>
            ) : null}

            {currentStep.key === "finish" ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  <p className="font-semibold">Review your setup before launching.</p>
                  <p className="mt-1 leading-6">
                    This is your launch checklist. You can edit any section now or refine it
                    later from Admin Settings.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <SummaryRow
                    label="Business"
                    value={form.businessName || "Not provided"}
                    detail={form.primaryCategory || "No business category added yet"}
                    onEdit={() => editFromReview(0)}
                  />

                  <SummaryRow
                    label="Contact"
                    value={form.primaryPhone || "No phone added yet"}
                    detail={form.email || "No business email added yet"}
                    onEdit={() => editFromReview(0)}
                  />

                  <SummaryRow
                    label="Service Area"
                    value={form.serviceAreaSummary || "Not provided"}
                    detail={
                      parseListInput(form.serviceCities).length
                        ? parseListInput(form.serviceCities).slice(0, 4).join(", ")
                        : "No specific service cities added yet"
                    }
                    onEdit={() => editFromReview(1)}
                  />

                  <SummaryRow
                    label="Services"
                    value={`${parseListInput(form.servicesOffered).length} service(s) added`}
                    detail={
                      parseListInput(form.servicesOffered).length
                        ? parseListInput(form.servicesOffered).slice(0, 5).join(", ")
                        : "No services added yet"
                    }
                    onEdit={() => editFromReview(2)}
                  />

                  <SummaryRow
                    label="Booking Flow"
                    value={form.bookingType.replaceAll("_", " ")}
                    detail={
                      form.nextStepMessage ||
                      "No custom AI next-step message added yet"
                    }
                    onEdit={() => editFromReview(2)}
                  />

                  <SummaryRow
                    label="Hours"
                    value={formatHoursForReview(form.hours)}
                    detail="You can adjust detailed hours later from Settings."
                    onEdit={() => editFromReview(3)}
                  />

                  <SummaryRow
                    label="Calendar"
                    value="Optional"
                    detail="Google Calendar can be connected now or later."
                    onEdit={() => editFromReview(4)}
                  />

                  <SummaryRow
                    label="Knowledge Base"
                    value="Optional"
                    detail="Upload documents or add FAQs so the AI can answer more accurately."
                    onEdit={() => editFromReview(5)}
                  />
                </div>
              </div>
            ) : null}

            {message ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {message}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={stepIndex === 0}
                className="saas-button-secondary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>

              <div className="flex gap-3">
                {!currentStep.required && currentStep.key !== "finish" ? (
                  <button
                    type="button"
                    onClick={skipStep}
                    className="saas-button-secondary px-4 py-2 text-sm font-semibold"
                  >
                    Skip for now
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => void goNext()}
                  disabled={isSaving}
                  className="saas-button-accent px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : currentStep.key === "finish"
                    ? "Launch Dashboard"
                    : returnToReview
                    ? "Save & Return to Review"
                    : "Save & Continue"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}