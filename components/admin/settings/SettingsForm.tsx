"use client";

import { useEffect, useState } from "react";
import type { Tenant } from "@/lib/types/tenant";
import ToastMessage from "@/components/ui/ToastMessage";
import QRCode from "qrcode";

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

type SettingsTab =
  | "businessIdentity"
  | "locationServiceArea"
  | "services"
  | "businessHours"
  | "calendar"
  | "chatSettings"
  | "leadCapture";

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

type CalendarProviderOption = "google" | "outlook" | "apple";

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

function buildHostedPageUrl(tenantSlug: string) {
  if (typeof window === "undefined") {
    return `/${tenantSlug}`;
  }

  return `${window.location.origin}/${tenantSlug}`;
}

function buildQrAutoOpenUrl(tenantSlug: string) {
  if (typeof window === "undefined") {
    return `/${tenantSlug}?source=qr&openChat=1`;
  }

  return `${window.location.origin}/${tenantSlug}?source=qr&openChat=1`;
}

function buildExistingWebsiteQrUrl(websiteUrl?: string | null) {
  if (!websiteUrl?.trim()) {
    return "";
  }

  const normalized = websiteUrl.startsWith("http")
    ? websiteUrl
    : `https://${websiteUrl}`;

  const separator = normalized.includes("?") ? "&" : "?";

  return `${normalized}${separator}source=qr&openChat=1`;
}

function hasWebsiteUrl(value?: string | null) {
  return Boolean(value && value.trim());
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
    bookingType: tenant.bookingType || "consultation",
    nextStepMessage: tenant.nextStepMessage || "",
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
              className="saas-button-accent px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="saas-button-accent px-4 py-2 text-sm font-semibold shadow-sm"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

function CopyableLinkRow({
  label,
  description,
  value,
  disabledMessage,
  fileName,
}: {
  label: string;
  description: string;
  value: string;
  disabledMessage?: string;
  fileName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState("");

  async function handleCopy() {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  async function handleDownloadQr() {
    if (!value) return;

    try {
      setIsGeneratingQr(true);

      const dataUrl = await QRCode.toDataURL(value, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      setQrPreviewUrl(dataUrl);

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Could not generate QR code. Please try again.");
    } finally {
      setIsGeneratingQr(false);
    }
  }

  useEffect(() => {
    async function generatePreview() {
      if (!value) return;
  
      try {
        const dataUrl = await QRCode.toDataURL(value, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "H",
        });
  
        setQrPreviewUrl(dataUrl);
      } catch (error) {
        console.error("Failed generating QR preview:", error);
      }
    }
  
    void generatePreview();
  }, [value]);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
            {description}
          </p>
        </div>
  
        {qrPreviewUrl ? (
          <img
            src={qrPreviewUrl}
            alt={`${label} QR`}
            className="h-20 w-20 shrink-0 rounded-lg border bg-white p-1"
          />
        ) : null}
      </div>
  
      <div className="mt-4 rounded-lg border bg-gray-50 px-3 py-2">
        <p className="truncate text-xs text-gray-700">
          {value || disabledMessage || "Not available"}
        </p>
      </div>
  
      <div className="mt-4 flex gap-2">
      <button
          type="button"
          onClick={() => {
            if (!value) return;
            window.open(value, "_blank", "noopener,noreferrer");
          }}
          disabled={!value}
          className="flex-1 rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Open
        </button>
        
        <button
          type="button"
          onClick={handleCopy}
          disabled={!value}
          className="flex-1 rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
  
        <button
          type="button"
          onClick={handleDownloadQr}
          disabled={!value || isGeneratingQr}
          className="flex-1 rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGeneratingQr ? "Generating..." : "Download"}
        </button>
      </div>
    </div>
  );
}

export default function SettingsForm({ tenant }: SettingsFormProps) {
  const [toast, setToast] = useState<ToastState>(null);

  const [calendarStatus, setCalendarStatus] =
    useState<CalendarStatusState | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [selectedCalendarProvider, setSelectedCalendarProvider] =
  useState<CalendarProviderOption>("google");
  const [isDisconnectingCalendar, setIsDisconnectingCalendar] = useState(false);

  useEffect(() => {
    async function fetchCalendarStatus() {
      try {
        setIsLoadingCalendar(true);
  
        const response = await fetch(
          `/api/admin/tenants/${tenant.slug}/calendar-connections`
        );
  
        const result = await response.json();
  
        if (!response.ok) {
          throw new Error(
            result.error || "Failed to load calendar connection."
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
  
    fetchCalendarStatus();
  
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

  const [activeTab, setActiveTab] =
  useState<SettingsTab>("businessIdentity");

  const [form, setForm] = useState(createInitialFormState(tenant));
  const hostedPageUrl = buildHostedPageUrl(tenant.slug);
  const qrAutoOpenUrl = buildQrAutoOpenUrl(tenant.slug);
  const existingWebsiteQrUrl = buildExistingWebsiteQrUrl(tenant.websiteUrl);
  const tenantHasWebsite = hasWebsiteUrl(tenant.websiteUrl);

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
          bookingType: form.bookingType,
          nextStepMessage: form.nextStepMessage,
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

  function handleConnectCalendar() {
    if (selectedCalendarProvider !== "google") {
      setToast({
        message:
          selectedCalendarProvider === "outlook"
            ? "Outlook Calendar support is coming soon."
            : "Apple Calendar support is coming soon.",
        variant: "error",
      });
  
      return;
    }
  
    window.location.href = `/api/admin/tenants/${tenant.slug}/calendar-connections/google/start`;
  }
  
  async function handleDisconnectCalendar() {
    const confirmed = window.confirm(
      "Disconnect this calendar? Online scheduling will fall back to manual follow-up until a calendar is reconnected."
    );
  
    if (!confirmed) return;
  
    try {
      setIsDisconnectingCalendar(true);
      setToast(null);
  
      const response = await fetch(
        `/api/admin/tenants/${tenant.slug}/calendar-connections`,
        {
          method: "DELETE",
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || "Failed to disconnect calendar.");
      }
  
      window.location.reload();
  
      setToast({
        message: "Calendar disconnected. Online scheduling fallback is now active.",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
  
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to disconnect calendar.",
        variant: "error",
      });
    } finally {
      setIsDisconnectingCalendar(false);
    }
  }

  const settingsTabs: {
  id: SettingsTab;
  label: string;
}[] = [
  {
    id: "businessIdentity",
    label: "Business",
  },
  {
    id: "locationServiceArea",
    label: "Service Area",
  },
  {
    id: "services",
    label: "Services",
  },
  {
    id: "businessHours",
    label: "Hours",
  },
  {
    id: "calendar",
    label: "Calendar",
  },
  {
    id: "chatSettings",
    label: "AI & Chat",
  },
  {
    id: "leadCapture",
    label: "Lead Capture",
  },
];

  return (
    <>
      {toast ? (
        <ToastMessage
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}

      <div className="space-y-6">
        {/* SETTINGS TABS */}
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-2xl border border-stone-200/70 bg-white/70 p-2 backdrop-blur">
            {settingsTabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-orange-700 text-white shadow-sm"
                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        
        {activeTab === "businessIdentity" ? (
        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <SectionHeader
            title="Business Identity"
            description="Core business details used by your website, chat flow, and future Google profile workflow."
            isEditing={editingSections.businessIdentity}
            isSaving={savingSections.businessIdentity}
            isOpen
            onToggle={() => {}}
            onEdit={() => beginEdit("businessIdentity")}
            onCancel={() => cancelEdit("businessIdentity")}
            onSave={() => void saveSection("businessIdentity")}
          />
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
        </section>
        ) : null}
      
      {activeTab === "locationServiceArea" ? (
        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <SectionHeader
            title="Location & Service Area"
            description="These fields support your public site, chat routing, and future Google Business Profile setup."
            isEditing={editingSections.locationServiceArea}
            isSaving={savingSections.locationServiceArea}
            isOpen
            onToggle={() => {}}
            onEdit={() => beginEdit("locationServiceArea")}
            onCancel={() => cancelEdit("locationServiceArea")}
            onSave={() => void saveSection("locationServiceArea")}
          />

            
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
        </section>
        ) : null}

        {activeTab === "services" ? (
        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <SectionHeader
            title="Services"
            description="List the services your business offers. Use one service per line."
            isEditing={editingSections.services}
            isSaving={savingSections.services}
            isOpen
            onToggle={() => {}}
            onEdit={() => beginEdit("services")}
            onCancel={() => cancelEdit("services")}
            onSave={() => void saveSection("services")}
          />
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
        </section>
        ) : null}

        {activeTab === "businessHours" ? (
        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <SectionHeader
            title="Business Hours"
            description="These hours support your future Google Business Profile setup and can also be used by the chatbot to answer availability questions."
            isEditing={editingSections.businessHours}
            isSaving={savingSections.businessHours}
            isOpen
            onToggle={() => {}}
            onEdit={() => beginEdit("businessHours")}
            onCancel={() => cancelEdit("businessHours")}
            onSave={() => void saveSection("businessHours")}
          />
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
        </section>
        ) : null}

      {activeTab === "calendar" ? (
        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <button
              type="button"
              onClick={() => {}}
              className="flex min-w-0 flex-1 items-start gap-3 text-left"
            >
              <span
                className="mt-0.5 text-sm text-gray-400"
                aria-hidden="true"
              >
                →
              </span>

              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Calendar
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Manage the calendar used for scheduling calls, site visits, and customer follow-up.
                </p>
              </div>
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleConnectCalendar}
                className="rounded-xl saas-button-accent px-4 py-2 text-sm font-semibold text-white transition hover:saas-button-accent"
              >
                {calendarStatus?.primaryConnection ? "Reconnect" : "Connect"}
              </button>

              {calendarStatus?.primaryConnection ? (
                <button
                  type="button"
                  onClick={() => void handleDisconnectCalendar()}
                  disabled={isDisconnectingCalendar}
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDisconnectingCalendar ? "Disconnecting..." : "Disconnect"}
                </button>
              ) : null}
            </div>
          </div>
            <div className="space-y-4 rounded-xl border bg-white p-4 text-sm">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Provider
                </label>

                <select
                  value={selectedCalendarProvider}
                  onChange={(e) =>
                    setSelectedCalendarProvider(e.target.value as CalendarProviderOption)
                  }
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  <option value="google">Google Calendar</option>
                  <option value="outlook">Outlook Calendar — Coming soon</option>
                  <option value="apple">Apple Calendar — Coming soon</option>
                </select>
              </div>

              {selectedCalendarProvider !== "google" ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  This calendar provider is coming soon. Google Calendar is currently supported.
                </div>
              ) : null}

              {isLoadingCalendar ? (
                <p className="text-gray-600">Checking calendar connection...</p>
              ) : calendarStatus?.primaryConnection ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                    <p className="font-semibold text-green-800">Connected</p>
                    <p className="mt-1 text-xs text-green-700">
                      Online scheduling is active for this tenant.
                    </p>
                  </div>

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
                    If appointments stop syncing or availability fails, reconnect the calendar to refresh access.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="font-semibold text-amber-800">
                      Calendar disconnected
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Online scheduling fallback is active. Customers can still submit requests, but someone will need to follow up manually to confirm a time.
                    </p>
                  </div>

                  <p className="text-gray-600">
                    Connect Google Calendar so Digital Front Door can check availability and book calls or site visits.
                  </p>
                </div>
              )}
            </div>
        </section>
      ) : null}

      {activeTab === "chatSettings" ? (
        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <SectionHeader
            title="Chat Settings"
            description="Control how the intake chat behaves for this business."
            isEditing={editingSections.chatSettings}
            isSaving={savingSections.chatSettings}
            isOpen
            onToggle={() => {}}
            onEdit={() => beginEdit("chatSettings")}
            onCancel={() => cancelEdit("chatSettings")}
            onSave={() => void saveSection("chatSettings")}
          />
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Greeting Message
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Booking Flow
                    </span>

                    <select
                      value={form.bookingType}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          bookingType: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                    >
                      <option value="consultation">Consultation / estimate</option>
                      <option value="reservation">Reservation / rental</option>
                      <option value="direct_booking">Direct service booking</option>
                      <option value="phone_call">Phone call follow-up</option>
                      <option value="estimate">Quote / estimate request</option>
                    </select>
                  </label>
                </div>

                <label className="mt-4 block space-y-1">
                  <span className="text-sm font-medium text-gray-700">
                    AI Next Step Message
                  </span>

                  <textarea
                    value={form.nextStepMessage}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        nextStepMessage: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Example: The next step is usually confirming trailer type, rental dates, delivery or pickup details, and deposit information."
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />

                  <span className="block text-xs text-gray-500">
                    This tells the AI how to explain the next step after a lead is captured.
                  </span>
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
        </section>
      ) : null}

      {activeTab === "leadCapture" ? (
        <section className="rounded-2xl border bg-gray-50/60 p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <button
              type="button"
              onClick={() => {}}
              className="flex min-w-0 flex-1 items-start gap-3 text-left"
            >
              <span
                className="mt-0.5 text-sm text-gray-400"
                aria-hidden="true"
              >
                →
              </span>

              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Lead Capture
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Copy customer entry links for QR codes, hosted pages, and existing websites.
                </p>
              </div>
            </button>
          </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <CopyableLinkRow
                label="Hosted Contactor Page"
                description="Use this link for a simple AI-first landing page."
                value={hostedPageUrl}
                fileName={`${tenant.slug}-page-qr.png`}
              />

              <CopyableLinkRow
                label="QR Auto-Open Link"
                description="Use this for truck decals, flyers, yard signs, business cards, and other QR codes."
                value={qrAutoOpenUrl}
                fileName={`${tenant.slug}-qr-chat.png`}
              />

              {tenantHasWebsite ? (
                <CopyableLinkRow
                  label="Existing Website QR Link"
                  description="Use this if the business already has a website and wants QR scans to open that site with the chat widget."
                  value={existingWebsiteQrUrl}
                  fileName={`${tenant.slug}-site-chat.png`}
                />
              ) : (
                <div className="rounded-2xl border border-dashed bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">
                    Existing Website QR
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Add a Website URL under Business Identity to generate a QR code that opens
                    the tenant’s existing site with Contactor chat.
                  </p>

                  <div className="mt-4 rounded-lg border bg-gray-50 px-3 py-2">
                    <p className="truncate text-xs text-gray-400">
                      No existing website URL added yet.
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-dashed bg-white p-4 lg:col-span-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Embed Snippet
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Add this snippet to an existing website once the Contactor widget script is active.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `<script src="https://app.contactor.ai/widget.js" data-tenant="${tenant.slug}"></script>`;

                      void navigator.clipboard.writeText(snippet);
                    }}
                    className="rounded-xl saas-button-accent px-4 py-2 text-xs font-semibold text-white transition hover:saas-button-accent"
                  >
                    Copy Snippet
                  </button>
                </div>

                <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100">
              {`<script src="http://localhost:3000/widget.js" data-tenant="hughes-general"></script>`}
                </pre>

                <p className="mt-2 text-xs text-amber-700">
                  Widget script is not active yet. This is the planned embed format.
                </p>
              </div>
            </div>
        </section>
      ) : null}
    </div>
  </>
  );
}
