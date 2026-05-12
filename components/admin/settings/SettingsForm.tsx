"use client";

import { useEffect, useState } from "react";
import type { Tenant } from "@/lib/types/tenant";
import ToastMessage from "@/components/ui/ToastMessage";

type SettingsFormProps = {
  tenant: Tenant;
};

type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

type HoursState = Record<string, DayHours>;

type EditableSection =
  | "businessIdentity"
  | "locationServiceArea"
  | "services"
  | "businessHours"
  | "chatSettings";

type CollapsibleSettingsSection =
  | "businessIdentity"
  | "locationServiceArea"
  | "services"
  | "businessHours"
  | "calendar"
  | "chatSettings";

type ToastState = {
  message: string;
  variant: "success" | "error";
} | null;

type CalendarConnectionSummary = {
  id: string;
  provider: "google";
  externalAccountEmail?: string | null;
  calendarId: string;
  calendarName?: string | null;
  tokenExpiresAt?: string | null;
  isPrimary: boolean;
  isActive: boolean;
};

type CalendarStatusState = {
  primaryConnection: CalendarConnectionSummary | null;
};

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function parseLinesToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDayLabel(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function displayValue(value?: string | null) {
  return value && value.trim() ? value : "Not provided";
}

function buildDefaultHours(hours?: Record<string, any>): HoursState {
  const result: HoursState = {
    monday: { open: "08:00", close: "17:00", closed: false },
    tuesday: { open: "08:00", close: "17:00", closed: false },
    wednesday: { open: "08:00", close: "17:00", closed: false },
    thursday: { open: "08:00", close: "17:00", closed: false },
    friday: { open: "08:00", close: "17:00", closed: false },
    saturday: { open: "", close: "", closed: true },
    sunday: { open: "", close: "", closed: true },
  };

  if (!hours || typeof hours !== "object") {
    return result;
  }

  for (const day of DAYS) {
    const existing = hours[day];

    if (existing && typeof existing === "object") {
      result[day] = {
        open: existing.open ?? result[day].open,
        close: existing.close ?? result[day].close,
        closed:
          typeof existing.closed === "boolean"
            ? existing.closed
            : result[day].closed,
      };
    }
  }

  return result;
}

function formatHoursForDisplay(hours: HoursState, day: keyof HoursState) {
  const value = hours[day];

  if (!value || value.closed) {
    return "Closed";
  }

  if (!value.open || !value.close) {
    return "Not provided";
  }

  return `${value.open} - ${value.close}`;
}

function createInitialFormState(tenant: Tenant) {
  return {
    businessName: tenant.businessName || "",
    primaryPhone: tenant.primaryPhone || "",
    email: tenant.email || "",
    websiteUrl: tenant.websiteUrl || "",
    primaryCategory: tenant.primaryCategory || "",

    isServiceAreaBusiness: tenant.isServiceAreaBusiness ?? true,
    addressLine1: tenant.addressLine1 || "",
    city: tenant.city || "",
    state: tenant.state || "",
    zip: tenant.zip || "",
    serviceAreaSummary: tenant.serviceAreaSummary || "",
    serviceCities: (tenant.serviceCities || []).join("\n"),
    outOfAreaMessage: tenant.outOfAreaMessage || "",

    tagline: tenant.tagline || "",
    aboutUs: tenant.aboutUs || "",
    licenseNumber: tenant.licenseNumber || "",
    isInsured: tenant.isInsured ?? false,
    shareBusinessAddressInChat: tenant.shareBusinessAddressInChat ?? false,

    servicesOffered: (tenant.servicesOffered || []).join("\n"),

    hours: buildDefaultHours(tenant.hours),

    greetingMessage: tenant.greetingMessage || "",
    askForTimeline: tenant.askForTimeline ?? true,
    askForEmailAfterPhone: tenant.askForEmailAfterPhone ?? true,
    askForImagesAfterCapture: tenant.askForImagesAfterCapture ?? true,
    requirePhoneForLead: tenant.requirePhoneForLead ?? true,
  };
}

function SectionHeader({
  title,
  description,
  isEditing,
  isSaving,
  isOpen,
  onToggle,
  onEdit,
  onCancel,
  onSave,
}: {
  title: string;
  description: string;
  isEditing: boolean;
  isSaving: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <span
          className={`mt-0.5 text-sm text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          ▼
        </span>

        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </button>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

export default function SettingsForm({ tenant }: SettingsFormProps) {
  const [toast, setToast] = useState<ToastState>(null);

  const [calendarStatus, setCalendarStatus] =
    useState<CalendarStatusState | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);

  useEffect(() => {
    async function loadCalendarStatus() {
      try {
        const response = await fetch(
          `/api/admin/tenants/${tenant.slug}/calendar-connections`,
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Failed to load calendar connection.",
          );
        }

        setCalendarStatus({
          primaryConnection: result.primaryConnection ?? null,
        });
      } catch (error) {
        console.error(error);
        setToast({
          message:
            error instanceof Error
              ? error.message
              : "Failed to load calendar connection.",
          variant: "error",
        });
      } finally {
        setIsLoadingCalendar(false);
      }
    }

    void loadCalendarStatus();

    const params = new URLSearchParams(window.location.search);
    const calendarResult = params.get("calendar");

    if (calendarResult === "connected") {
      setToast({
        message: "Google Calendar connected successfully.",
        variant: "success",
      });
    }
  }, [tenant.slug]);

  const [editingSections, setEditingSections] = useState<
    Record<EditableSection, boolean>
  >({
    businessIdentity: false,
    locationServiceArea: false,
    services: false,
    businessHours: false,
    chatSettings: false,
  });

  const [savingSections, setSavingSections] = useState<
    Record<EditableSection, boolean>
  >({
    businessIdentity: false,
    locationServiceArea: false,
    services: false,
    businessHours: false,
    chatSettings: false,
  });

  const [openSections, setOpenSections] = useState<
    Record<CollapsibleSettingsSection, boolean>
  >({
    businessIdentity: true,
    locationServiceArea: false,
    services: false,
    businessHours: false,
    calendar: false,
    chatSettings: false,
  });

  const [form, setForm] = useState(createInitialFormState(tenant));

  function toggleSection(section: CollapsibleSettingsSection) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function updateHoursDay(day: keyof HoursState, updates: Partial<DayHours>) {
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

  function beginEdit(section: EditableSection) {
    setToast(null);
    setEditingSections((prev) => ({
      ...prev,
      [section]: true,
    }));
  }

  function cancelEdit(section: EditableSection) {
    setForm(createInitialFormState(tenant));
    setToast(null);
    setEditingSections((prev) => ({
      ...prev,
      [section]: false,
    }));
  }

  async function saveSection(section: EditableSection) {
    try {
      setSavingSections((prev) => ({
        ...prev,
        [section]: true,
      }));
      setToast(null);

      const response = await fetch(`/api/admin/tenants/${tenant.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          serviceCities: parseLinesToArray(form.serviceCities),
          servicesOffered: parseLinesToArray(form.servicesOffered),
          hours: form.hours,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings");
      }

      setEditingSections((prev) => ({
        ...prev,
        [section]: false,
      }));

      setToast({
        message: "Settings saved.",
        variant: "success",
      });
    } catch (error) {
      console.error(error);

      setToast({
        message:
          error instanceof Error ? error.message : "Failed to save settings.",
        variant: "error",
      });
    } finally {
      setSavingSections((prev) => ({
        ...prev,
        [section]: false,
      }));
    }
  }

  return (
    <>
      {toast ? (
        <ToastMessage
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}

      <div className="space-y-8">
        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <SectionHeader
            title="Business Identity"
            description="Core business details used by your website, chat flow, and future Google profile workflow."
            isEditing={editingSections.businessIdentity}
            isSaving={savingSections.businessIdentity}
            isOpen={openSections.businessIdentity}
            onToggle={() => toggleSection("businessIdentity")}
            onEdit={() => beginEdit("businessIdentity")}
            onCancel={() => cancelEdit("businessIdentity")}
            onSave={() => void saveSection("businessIdentity")}
          />

          {openSections.businessIdentity ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Business Name
                </label>
                {editingSections.businessIdentity ? (
                  <input
                    value={form.businessName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        businessName: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                    placeholder="Business name"
                  />
                ) : (
                  <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                    {displayValue(form.businessName)}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Primary Phone
                </label>
                {editingSections.businessIdentity ? (
                  <input
                    value={form.primaryPhone}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        primaryPhone: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                    placeholder="Primary business phone"
                  />
                ) : (
                  <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                    {displayValue(form.primaryPhone)}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                {editingSections.businessIdentity ? (
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                    placeholder="Business email"
                  />
                ) : (
                  <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                    {displayValue(form.email)}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Website URL
                </label>
                {editingSections.businessIdentity ? (
                  <input
                    value={form.websiteUrl}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        websiteUrl: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                    placeholder="https://example.com"
                  />
                ) : (
                  <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                    {displayValue(form.websiteUrl)}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Primary Category
                </label>
                {editingSections.businessIdentity ? (
                  <input
                    value={form.primaryCategory}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        primaryCategory: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                    placeholder="Roofing Contractor, General Contractor, etc."
                  />
                ) : (
                  <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                    {displayValue(form.primaryCategory)}
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3 md:items-end">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    License Number
                  </label>
                  {editingSections.businessIdentity ? (
                    <input
                      value={form.licenseNumber}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          licenseNumber: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                      placeholder="License number"
                    />
                  ) : (
                    <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                      {displayValue(form.licenseNumber)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Insured
                  </label>
                  {editingSections.businessIdentity ? (
                    <label className="mt-1 flex min-h-[42px] items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-700">
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
                      Yes
                    </label>
                  ) : (
                    <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                      {form.isInsured ? "Yes" : "No"}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Tagline
                </label>
                {editingSections.businessIdentity ? (
                  <input
                    value={form.tagline}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tagline: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                    placeholder="Short business tagline"
                  />
                ) : (
                  <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                    {displayValue(form.tagline)}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  About Us
                </label>
                {editingSections.businessIdentity ? (
                  <textarea
                    value={form.aboutUs}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, aboutUs: e.target.value }))
                    }
                    rows={4}
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                    placeholder="Business description"
                  />
                ) : (
                  <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm whitespace-pre-wrap">
                    {displayValue(form.aboutUs)}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <SectionHeader
            title="Location & Service Area"
            description="These fields support your public site, chat routing, and future Google Business Profile setup."
            isEditing={editingSections.locationServiceArea}
            isSaving={savingSections.locationServiceArea}
            isOpen={openSections.locationServiceArea}
            onToggle={() => toggleSection("locationServiceArea")}
            onEdit={() => beginEdit("locationServiceArea")}
            onCancel={() => cancelEdit("locationServiceArea")}
            onSave={() => void saveSection("locationServiceArea")}
          />

          {openSections.locationServiceArea ? (
            <div className="space-y-4">
              {editingSections.locationServiceArea ? (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isServiceAreaBusiness}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isServiceAreaBusiness: e.target.checked,
                      }))
                    }
                  />
                  Service area business
                </label>
              ) : (
                <div className="rounded-lg border bg-white px-3 py-2 text-sm">
                  <span className="font-medium text-gray-700">
                    Service area business:
                  </span>{" "}
                  <span>{form.isServiceAreaBusiness ? "Yes" : "No"}</span>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <div className="grid gap-4 md:grid-cols-3 md:items-end">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        Address Line 1
                      </label>
                      {editingSections.locationServiceArea ? (
                        <input
                          value={form.addressLine1}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              addressLine1: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                          placeholder="Street address"
                        />
                      ) : (
                        <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                          {displayValue(form.addressLine1)}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Share Address in Chat
                      </label>
                      {editingSections.locationServiceArea ? (
                        <label className="mt-1 flex min-h-[42px] items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={form.shareBusinessAddressInChat}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                shareBusinessAddressInChat: e.target.checked,
                              }))
                            }
                          />
                          Yes
                        </label>
                      ) : (
                        <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                          {form.shareBusinessAddressInChat ? "Yes" : "No"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    City
                  </label>
                  {editingSections.locationServiceArea ? (
                    <input
                      value={form.city}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, city: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                      placeholder="City"
                    />
                  ) : (
                    <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                      {displayValue(form.city)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    State
                  </label>
                  {editingSections.locationServiceArea ? (
                    <input
                      value={form.state}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, state: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                      placeholder="State"
                    />
                  ) : (
                    <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                      {displayValue(form.state)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    ZIP
                  </label>
                  {editingSections.locationServiceArea ? (
                    <input
                      value={form.zip}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, zip: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                      placeholder="ZIP code"
                    />
                  ) : (
                    <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                      {displayValue(form.zip)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Service Area Summary
                  </label>
                  {editingSections.locationServiceArea ? (
                    <input
                      value={form.serviceAreaSummary}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          serviceAreaSummary: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                      placeholder="Serving San Diego County"
                    />
                  ) : (
                    <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm">
                      {displayValue(form.serviceAreaSummary)}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Service Cities
                  </label>
                  {editingSections.locationServiceArea ? (
                    <textarea
                      value={form.serviceCities}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          serviceCities: e.target.value,
                        }))
                      }
                      rows={5}
                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                      placeholder="One city per line"
                    />
                  ) : (
                    <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm whitespace-pre-wrap">
                      {displayValue(form.serviceCities)}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Out of Area Message
                  </label>
                  {editingSections.locationServiceArea ? (
                    <textarea
                      value={form.outOfAreaMessage}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          outOfAreaMessage: e.target.value,
                        }))
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                      placeholder="Message to use when a request is outside the normal service area"
                    />
                  ) : (
                    <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm whitespace-pre-wrap">
                      {displayValue(form.outOfAreaMessage)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <SectionHeader
            title="Services"
            description="List the services your business offers. Use one service per line."
            isEditing={editingSections.services}
            isSaving={savingSections.services}
            isOpen={openSections.services}
            onToggle={() => toggleSection("services")}
            onEdit={() => beginEdit("services")}
            onCancel={() => cancelEdit("services")}
            onSave={() => void saveSection("services")}
          />

          {openSections.services ? (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Services Offered
              </label>
              {editingSections.services ? (
                <textarea
                  value={form.servicesOffered}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      servicesOffered: e.target.value,
                    }))
                  }
                  rows={6}
                  className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  placeholder="One service per line"
                />
              ) : (
                <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm whitespace-pre-wrap">
                  {displayValue(form.servicesOffered)}
                </div>
              )}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <SectionHeader
            title="Business Hours"
            description="These hours support your future Google Business Profile setup and can also be used by the chatbot to answer availability questions."
            isEditing={editingSections.businessHours}
            isSaving={savingSections.businessHours}
            isOpen={openSections.businessHours}
            onToggle={() => toggleSection("businessHours")}
            onEdit={() => beginEdit("businessHours")}
            onCancel={() => cancelEdit("businessHours")}
            onSave={() => void saveSection("businessHours")}
          />

          {openSections.businessHours ? (
            <div className="space-y-3">
              {DAYS.map((day) => {
                const dayHours = form.hours[day];

                return (
                  <div
                    key={day}
                    className="grid gap-3 rounded-xl border bg-white p-3 md:grid-cols-[140px_1fr_1fr_120px]"
                  >
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-800">
                        {formatDayLabel(day)}
                      </p>
                    </div>

                    {editingSections.businessHours ? (
                      <>
                        <div>
                          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Open
                          </label>
                          <input
                            type="time"
                            value={dayHours.open}
                            onChange={(e) =>
                              updateHoursDay(day, { open: e.target.value })
                            }
                            disabled={dayHours.closed}
                            className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm disabled:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Close
                          </label>
                          <input
                            type="time"
                            value={dayHours.close}
                            onChange={(e) =>
                              updateHoursDay(day, { close: e.target.value })
                            }
                            disabled={dayHours.closed}
                            className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm disabled:bg-gray-100"
                          />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={dayHours.closed}
                            onChange={(e) =>
                              updateHoursDay(day, {
                                closed: e.target.checked,
                                open: e.target.checked
                                  ? ""
                                  : dayHours.open || "08:00",
                                close: e.target.checked
                                  ? ""
                                  : dayHours.close || "17:00",
                              })
                            }
                          />
                          Closed
                        </label>
                      </>
                    ) : (
                      <div className="md:col-span-3 flex items-center rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-900">
                        {formatHoursForDisplay(form.hours, day)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <button
              type="button"
              onClick={() => toggleSection("calendar")}
              className="flex min-w-0 flex-1 items-start gap-3 text-left"
            >
              <span
                className={`mt-0.5 text-sm text-gray-500 transition-transform ${
                  openSections.calendar ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              >
                ▼
              </span>

              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Google Calendar
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Connect or reconnect the calendar used for appointment
                  availability and booking.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = `/api/admin/tenants/${tenant.slug}/calendar-connections/google/start`;
              }}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {calendarStatus?.primaryConnection
                ? "Reconnect Google Calendar"
                : "Connect Google Calendar"}
            </button>
          </div>

          {openSections.calendar ? (
            <div className="rounded-xl border bg-white p-4 text-sm">
              {isLoadingCalendar ? (
                <p className="text-gray-600">Checking calendar connection...</p>
              ) : calendarStatus?.primaryConnection ? (
                <div className="space-y-2">
                  <p className="font-medium text-green-700">Connected</p>
                  <p>
                    <span className="font-medium text-gray-700">Calendar:</span>{" "}
                    {calendarStatus.primaryConnection.calendarName ||
                      calendarStatus.primaryConnection.calendarId}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Account:</span>{" "}
                    {calendarStatus.primaryConnection.externalAccountEmail ||
                      "Google account connected"}
                  </p>
                  <p className="text-xs text-gray-500">
                    If appointments stop syncing or availability fails,
                    reconnect Google Calendar to refresh access.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-amber-700">
                    Google Calendar is not connected or needs reconnection.
                  </p>
                  <p className="text-gray-600">
                    Connect Google Calendar so Digital Front Door can check
                    availability and book appointments.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <SectionHeader
            title="Chat Settings"
            description="Control how the intake chat behaves for this business."
            isEditing={editingSections.chatSettings}
            isSaving={savingSections.chatSettings}
            isOpen={openSections.chatSettings}
            onToggle={() => toggleSection("chatSettings")}
            onEdit={() => beginEdit("chatSettings")}
            onCancel={() => cancelEdit("chatSettings")}
            onSave={() => void saveSection("chatSettings")}
          />

          {openSections.chatSettings ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Greeting Message
                </label>
                {editingSections.chatSettings ? (
                  <textarea
                    value={form.greetingMessage}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        greetingMessage: e.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                    placeholder="Greeting shown at the start of chat"
                  />
                ) : (
                  <div className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm whitespace-pre-wrap">
                    {displayValue(form.greetingMessage)}
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  {
                    key: "askForTimeline",
                    label: "Ask for timeline",
                  },
                  {
                    key: "askForEmailAfterPhone",
                    label: "Ask for email after phone",
                  },
                  {
                    key: "askForImagesAfterCapture",
                    label: "Ask for images after capture",
                  },
                  {
                    key: "requirePhoneForLead",
                    label: "Require phone for lead",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="rounded-lg border bg-white px-3 py-2 text-sm"
                  >
                    {editingSections.chatSettings ? (
                      <label className="flex items-center gap-2 text-gray-700">
                        <input
                          type="checkbox"
                          checked={Boolean(form[item.key as keyof typeof form])}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              [item.key]: e.target.checked,
                            }))
                          }
                        />
                        {item.label}
                      </label>
                    ) : (
                      <>
                        <span className="font-medium text-gray-700">
                          {item.label}:
                        </span>{" "}
                        <span>
                          {Boolean(form[item.key as keyof typeof form])
                            ? "Yes"
                            : "No"}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
