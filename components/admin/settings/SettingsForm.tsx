"use client";

import { useEffect, useState } from "react";
import type { Tenant } from "@/lib/types/tenant";
import ToastMessage from "@/components/ui/ToastMessage";
import QRCode from "qrcode";
import ServicesSettingsSection from "./ServicesSettingsSection";
import BusinessHoursSettingsSection from "./BusinessHoursSettingsSection";
import ServiceAreaSettingsSection from "./ServiceAreaSettingsSection";

type SettingsFormProps = {
  tenant: Tenant;
  initialTab?: SettingsTab;
  showTabs?: boolean;
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
  | "calendar";

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
    addressLine2: tenant.addressLine2 || "",
    country: tenant.country || "United States",
    serviceRadiusMiles: tenant.serviceRadiusMiles || 25,
    excludedServiceCities: (tenant.excludedServiceCities || []).join("\n"),

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
  isEditing,
  isSaving,
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
    <div className="mb-3 flex justify-end">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="saas-button-secondary px-4 py-2 text-sm font-semibold"
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
        </div>
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
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>
  
        {qrPreviewUrl ? (
          <img
            src={qrPreviewUrl}
            alt={`${label} QR`}
            className="h-20 w-20 shrink-0 rounded-xl border border-stone-200 bg-white p-1"
          />
        ) : null}
      </div>
  
      <div className="mt-4 min-h-[56px] min-w-0 rounded-xl border border-stone-200 bg-gray-50 px-3 py-2 flex items-center">
        <p className="line-clamp-2 break-all text-xs text-gray-700">
          {value || disabledMessage || "Not available"}
        </p>
      </div>
  
      <div className="mt-4 grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            if (!value) return;
            window.open(value, "_blank", "noopener,noreferrer");
          }}
          disabled={!value}
          className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
        >
          Open
        </button>
  
        <button
          type="button"
          onClick={handleCopy}
          disabled={!value}
          className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
        >
          {copied ? "Copied" : "Copy"}
        </button>
  
        <button
          type="button"
          onClick={handleDownloadQr}
          disabled={!value || isGeneratingQr}
          className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
        >
          {isGeneratingQr ? "Generating..." : "Download"}
        </button>
      </div>
    </div>
  );
}

export default function SettingsForm({
  tenant,
  initialTab = "businessIdentity",
  showTabs = true,
}: SettingsFormProps) {
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

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

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
          excludedServiceCities: parseLinesToArray(form.excludedServiceCities),
          serviceRadiusMiles: Number(form.serviceRadiusMiles || 25),
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

      <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden">
        {/* SETTINGS TABS */}
        {showTabs ? (
        <div className="w-full min-w-0 max-w-full overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-2xl border border-stone-200/50 bg-white/85 p-2 shadow-sm backdrop-blur">
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
      ) : null}
        
        {activeTab === "businessIdentity" ? (
        <section className="rounded-2xl border border-stone-200/50 bg-white/90 p-5 shadow-[0_8px_24px_rgba(17,24,39,0.045)]">
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
                    className="saas-input mt-1 w-full px-3 py-2 text-sm"
                    placeholder="Business name"
                  />
                ) : (
                  <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
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
                    className="saas-input mt-1 w-full px-3 py-2 text-sm"
                    placeholder="Primary business phone"
                  />
                ) : (
                  <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
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
                    className="saas-input mt-1 w-full px-3 py-2 text-sm"
                    placeholder="Business email"
                  />
                ) : (
                  <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
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
                    className="saas-input mt-1 w-full px-3 py-2 text-sm"
                    placeholder="https://example.com"
                  />
                ) : (
                  <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
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
                    className="saas-input mt-1 w-full px-3 py-2 text-sm"
                    placeholder="Roofing Contractor, General Contractor, etc."
                  />
                ) : (
                  <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
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
                      className="saas-input mt-1 w-full px-3 py-2 text-sm"
                      placeholder="License number"
                    />
                  ) : (
                    <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
                      {displayValue(form.licenseNumber)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Insured
                  </label>
                  {editingSections.businessIdentity ? (
                    <label className="mt-1 flex min-h-[42px] items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-gray-700">
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
                    <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
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
                    className="saas-input mt-1 w-full px-3 py-2 text-sm"
                    placeholder="Short business tagline"
                  />
                ) : (
                  <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgba(17,24,39,0.03)]">
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
                    className="saas-input mt-1 w-full px-3 py-2 text-sm"
                    placeholder="Business description"
                  />
                ) : (
                  <div className="mt-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm whitespace-pre-wrap">
                    {displayValue(form.aboutUs)}
                  </div>
                )}
              </div>
            </div>
        </section>
        ) : null}
      
      {activeTab === "locationServiceArea" ? (
        <ServiceAreaSettingsSection
          form={{
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: form.country,
            serviceAreaSummary: form.serviceAreaSummary,
            serviceRadiusMiles: form.serviceRadiusMiles,
            serviceCities: form.serviceCities,
            excludedServiceCities: form.excludedServiceCities,
            outOfAreaMessage: form.outOfAreaMessage,
            shareBusinessAddressInChat: form.shareBusinessAddressInChat,
          }}
          isEditing={editingSections.locationServiceArea}
          isSaving={savingSections.locationServiceArea}
          onChange={(updates) =>
            setForm((prev) => ({
              ...prev,
              ...updates,
            }))
          }
          onEdit={() => beginEdit("locationServiceArea")}
          onCancel={() => cancelEdit("locationServiceArea")}
          onSave={() => void saveSection("locationServiceArea")}
        />
      ) : null}

      {activeTab === "services" ? (
        <ServicesSettingsSection
          value={form.servicesOffered}
          isEditing={editingSections.services}
          isSaving={savingSections.services}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              servicesOffered: value,
            }))
          }
          onEdit={() => beginEdit("services")}
          onCancel={() => cancelEdit("services")}
          onSave={() => void saveSection("services")}
        />
      ) : null}

      {activeTab === "businessHours" ? (
        <BusinessHoursSettingsSection
          hours={form.hours}
          isEditing={editingSections.businessHours}
          isSaving={savingSections.businessHours}
          onChangeDay={updateHoursDay}
          onEdit={() => beginEdit("businessHours")}
          onCancel={() => cancelEdit("businessHours")}
          onSave={() => void saveSection("businessHours")}
        />
      ) : null}

      {activeTab === "calendar" ? (
        <section className="rounded-2xl border border-stone-200/50 bg-white/90 p-5 shadow-[0_8px_24px_rgba(17,24,39,0.045)]">
          <div className="mb-4 flex justify-end">
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
                  className="saas-button-danger px-4 py-2 text-sm font-semibold"
                >
                  {isDisconnectingCalendar ? "Disconnecting..." : "Disconnect"}
                </button>
              ) : null}
            </div>
          </div>
            <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 text-sm">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Provider
                </label>

                <select
                  value={selectedCalendarProvider}
                  onChange={(e) =>
                    setSelectedCalendarProvider(e.target.value as CalendarProviderOption)
                  }
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="google">Google Calendar</option>
                  <option value="outlook">Outlook Calendar — Coming soon</option>
                  <option value="apple">Apple Calendar — Coming soon</option>
                </select>
              </div>

              {selectedCalendarProvider !== "google" ? (
                <div className="rounded-xl border border-stone-200 border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  This calendar provider is coming soon. Google Calendar is currently supported.
                </div>
              ) : null}

              {isLoadingCalendar ? (
                <p className="text-gray-600">Checking calendar connection...</p>
              ) : calendarStatus?.primaryConnection ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-stone-200 border-green-200 bg-green-50 px-3 py-2">
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
                  <div className="rounded-xl border border-stone-200 border-amber-200 bg-amber-50 px-3 py-2">
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
    </div>
  </>
  );
}
