"use client";

import { useEffect, useRef, useState } from "react";
import type { Lead } from "@/lib/types/lead";
import type { LeadActivity } from "@/lib/types/lead-activity";
import AppointmentModal from "@/components/leads/AppointmentModal";
import ScheduleModal from "@/components/leads/ScheduleModal";

type LeadStatus = "new" | "contacted" | "booked" | "closed";

type CustomerUpdateEntry = {
  timestamp: string | null;
  content: string;
};

function displayValue(value?: string) {
  return value && value.trim() ? value : "Not provided";
}

/**
 * Format normalized US phone numbers for display.
 *
 * Examples:
 * - +16195490891 -> (619) 549-0891
 * - 6195490891   -> (619) 549-0891
 *
 * If the value does not match a simple US pattern, return it unchanged so
 * we do not accidentally hide or corrupt unexpected data.
 */
function formatPhoneForDisplay(value?: string) {
  if (!value || !value.trim()) return "Not provided";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7, 11);
    return `(${area}) ${prefix}-${line}`;
  }

  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6, 10);
    return `(${area}) ${prefix}-${line}`;
  }

  return value;
}

/**
 * Normalize a phone number for use in tel: and sms: links.
 *
 * We keep this intentionally lightweight:
 * - strips formatting characters
 * - preserves a leading + when present
 * - returns null when no usable value exists
 */
function normalizePhoneForLink(value?: string) {
  if (!value || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith("+")) {
    const normalized = `+${trimmed.slice(1).replace(/\D/g, "")}`;
    return normalized.length > 1 ? normalized : null;
  }

  const digitsOnly = trimmed.replace(/\D/g, "");
  return digitsOnly || null;
}

function buildTelHref(value?: string) {
  const normalized = normalizePhoneForLink(value);
  return normalized ? `tel:${normalized}` : null;
}

function buildSmsHref(value?: string) {
  const normalized = normalizePhoneForLink(value);
  return normalized ? `sms:${normalized}` : null;
}

function buildMailtoHref(value?: string) {
  if (!value || !value.trim()) {
    return null;
  }

  return `mailto:${value.trim()}`;
}

/**
 * Convert an ISO timestamp into a local, human-friendly value for display.
 */
function formatTimestampForDisplay(value?: string | null) {
  if (!value) return "Time unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Parse the raw customer_updates text into timestamped display blocks.
 */
function parseCustomerUpdates(raw?: string): CustomerUpdateEntry[] {
  if (!raw || !raw.trim()) {
    return [];
  }

  const normalized = raw.trim();

  const pattern =
    /\[Customer Update - ([^\]]+)\]\s*([\s\S]*?)(?=\n{2}\[Customer Update - |\s*$)/g;

  const entries: CustomerUpdateEntry[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(normalized)) !== null) {
    entries.push({
      timestamp: match[1]?.trim() || null,
      content: match[2]?.trim() || "",
    });
  }

  if (entries.length === 0) {
    entries.push({
      timestamp: null,
      content: normalized,
    });
  }

  return entries;
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

function getActivityLabel(activity: LeadActivity) {
  switch (activity.eventType) {
    case "lead.created":
      return "Lead created";
    case "lead.viewed":
      return "Lead viewed";
    case "lead.status_changed":
      return "Status changed";
    case "lead.customer_update_added":
      return "Customer added details";
    case "lead.email_added":
      return "Email added";
    case "lead.email_updated":
      return "Email updated";
    case "lead.address_updated":
      return "Address updated";
    case "lead.location_updated":
      return "Location updated";
    case "lead.timeline_updated":
      return "Timeline updated";
    case "lead.appointment_updated":
      return "Appointment updated";
    case "lead.image_uploaded":
      return "Photo uploaded";
    default:
      return activity.eventType;
  }
}

function getActivityDescription(activity: LeadActivity) {
  const metadata = activity.metadata || {};

  if (metadata.message) {
    return String(metadata.message);
  }

  if (metadata.fieldName && metadata.newValue) {
    if (metadata.previousValue) {
      return `${metadata.fieldName} changed from "${metadata.previousValue}" to "${metadata.newValue}"`;
    }

    return `${metadata.fieldName} set to "${metadata.newValue}"`;
  }

  if (activity.eventType === "lead.image_uploaded" && metadata.filename) {
    return `Uploaded ${metadata.filename}`;
  }

  return "Activity recorded.";
}

function getActivityDotClasses(activity: LeadActivity) {
  switch (activity.eventType) {
    case "lead.created":
      return "bg-green-600";
    case "lead.email_added":
    case "lead.email_updated":
      return "bg-blue-600";
    case "lead.image_uploaded":
      return "bg-purple-600";
    case "lead.customer_update_added":
      return "bg-amber-500";
    case "lead.status_changed":
      return "bg-indigo-600";
    case "lead.timeline_updated":
      return "bg-cyan-600";
    case "lead.address_updated":
    case "lead.location_updated":
    case "lead.appointment_updated":
      return "bg-slate-600";
    default:
      return "bg-gray-900";
  }
}

function getActivityGroupLabel(dateString: string) {
  const activityDate = new Date(dateString);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const activityDay = new Date(
    activityDate.getFullYear(),
    activityDate.getMonth(),
    activityDate.getDate()
  );

  if (activityDay.getTime() === today.getTime()) {
    return "Today";
  }

  if (activityDay.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return "Earlier";
}

function groupActivitiesForDisplay(activities: LeadActivity[]) {
  const grouped: Record<string, LeadActivity[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const activity of activities) {
    const group = getActivityGroupLabel(activity.createdAt);
    grouped[group].push(activity);
  }

  return grouped;
}

function CompactField({
  label,
  value,
  isEditing = false,
  onChange,
  placeholder,
  displayFormatter,
  hrefBuilder,
}: {
  label: string;
  value?: string;
  isEditing?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  displayFormatter?: (value?: string) => string;
  hrefBuilder?: (value?: string) => string | null;
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

  const formattedValue = displayFormatter
    ? displayFormatter(value)
    : displayValue(value);

  const href = hrefBuilder ? hrefBuilder(value) : null;

  return (
    <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-900">
      <span className="font-semibold text-gray-700">{label}:</span>{" "}
      {href && value && value.trim() ? (
        <a
          href={href}
          className="text-blue-700 underline underline-offset-2 hover:text-blue-800"
        >
          {formattedValue}
        </a>
      ) : (
        <span>{formattedValue}</span>
      )}
    </div>
  );
}

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  rightLabel,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  rightLabel?: string;
}) {
  return (
    <div className="rounded-2xl border bg-gray-50/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-700">{title}</p>
          {rightLabel ? (
            <p className="mt-1 text-xs text-gray-500">{rightLabel}</p>
          ) : null}
        </div>

        <span
          className={`shrink-0 text-sm text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {isOpen ? <div className="border-t px-4 py-4">{children}</div> : null}
    </div>
  );
}

export default function LeadDetailClient({
  lead,
  activities,
}: {
  lead: Lead;
  activities: LeadActivity[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<{
    id: string;
    url: string;
    filename?: string;
  } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    phone: lead.phone || "",
    email: lead.email || "",
    address: lead.address || "",
    appointment: lead.appointment || "",
    location: lead.location || "",
    timeline: lead.timeline || "",
    projectType: lead.projectType || "",
    notes: lead.notes || "",
    customerUpdates: lead.customerUpdates || "",
    status: (lead.status || "new") as LeadStatus,
    images: lead.images || [],
  });

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isCustomerUpdatesOpen, setIsCustomerUpdatesOpen] = useState(false);
  const [isImagesOpen, setIsImagesOpen] = useState(false);

  const [aiSummary, setAiSummary] = useState<string | null>(
    lead.aiSummary || null
  );
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const [suggestedReply, setSuggestedReply] = useState<string | null>(
    lead.aiSuggestedReply || null
  );
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isAiToolsOpen, setIsAiToolsOpen] = useState(false);

  const [missingInfo, setMissingInfo] = useState<string[]>(
    Array.isArray(lead.aiMissingInfo) ? lead.aiMissingInfo : []
  );
  const [suggestedNextStep, setSuggestedNextStep] = useState<string | null>(
    lead.aiNextStep || null
  );
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const [showSchedule, setShowSchedule] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [latestAppointment, setLatestAppointment] = useState<any | null>(null);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(false);

  useEffect(() => {
    void loadLatestAppointment();
  }, [lead.id]);

  const appointmentMissing = !form.appointment.trim();
  const customerUpdateEntries = parseCustomerUpdates(form.customerUpdates);

  const visibleActivities = activities.filter(
    (activity) =>
      !["lead.viewed", "lead.customer_update_added"].includes(activity.eventType)
  );
  
  const groupedActivities = groupActivitiesForDisplay(visibleActivities);
  const orderedGroups = ["Today", "Yesterday", "Earlier"].filter(
    (group) => groupedActivities[group].length > 0
  );

  function showNextImage() {
    if (selectedIndex === null) return;

    const nextIndex = (selectedIndex + 1) % form.images.length;
    setSelectedIndex(nextIndex);
    setSelectedImage(form.images[nextIndex]);
  }

  function showPrevImage() {
    if (selectedIndex === null) return;

    const prevIndex =
      (selectedIndex - 1 + form.images.length) % form.images.length;

    setSelectedIndex(prevIndex);
    setSelectedImage(form.images[prevIndex]);
  }

  function sentenceCase(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  
  function toTitleCase(value: string) {
    return value
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  
  function buildAppointmentTitle(input: {
    projectType?: string;
    customerName?: string;
  }) {
    const project = input.projectType?.trim()
      ? toTitleCase(input.projectType.trim())
      : "Project";
  
    return input.customerName?.trim()
      ? `${project} Appointment – ${input.customerName.trim()}`
      : `${project} Appointment`;
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!selectedImage) return;

      if (event.key === "Escape") {
        setSelectedImage(null);
        setSelectedIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevImage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImage, selectedIndex, form.images]);

  async function loadLeadCopilot(forceRegenerate = false) {
    try {
      setIsGeneratingSummary(true);
      setIsGeneratingReply(true);
      setIsGeneratingInsights(true);

      const response = await fetch("/api/ai/lead-copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead,
          forceRegenerate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load lead copilot");
      }

      if (result.status === "generated") {
        setAiSummary(result.summary || null);
        setSuggestedReply(result.suggestedReply || null);
        setMissingInfo(Array.isArray(result.missingInfo) ? result.missingInfo : []);
        setSuggestedNextStep(result.nextStep || null);
      }
    } catch (error) {
      console.error("Lead copilot error:", error);
    } finally {
      setIsGeneratingSummary(false);
      setIsGeneratingReply(false);
      setIsGeneratingInsights(false);
    }
  }

  async function saveLead() {
    try {
      setIsSaving(true);
      setSaveMessage("");

      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save lead");
      }

      setIsEditing(false);
      setSaveMessage("Changes saved.");
    } catch (error) {
      console.error(error);
      setSaveMessage(
        error instanceof Error ? error.message : "Failed to save changes."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(status: LeadStatus) {
    const nextForm = { ...form, status };
    setForm(nextForm);

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update status");
      }

      setSaveMessage("Status updated.");
    } catch (error) {
      console.error(error);
      setSaveMessage(
        error instanceof Error ? error.message : "Failed to update status."
      );
    }
  }

  function buildSmsReplyHref() {
    const phone = buildSmsHref(form.phone);

    if (!phone || !suggestedReply) {
      return null;
    }

    return `${phone}?body=${encodeURIComponent(suggestedReply)}`;
  }

  function buildEmailReplyHref() {
    const email = buildMailtoHref(form.email);

    if (!email || !suggestedReply) {
      return null;
    }

    const subject = encodeURIComponent(
      `Re: ${form.projectType || "Your project request"}`
    );

    const body = encodeURIComponent(suggestedReply);

    return `${email}?subject=${subject}&body=${body}`;
  }

  async function handleCopyReply() {
    if (!suggestedReply) return;

    try {
      await navigator.clipboard.writeText(suggestedReply);
      setSaveMessage("Reply copied.");
    } catch (error) {
      console.error("Failed to copy reply:", error);
      setSaveMessage("Failed to copy reply.");
    }
  }

  async function handleMarkContacted() {
    if (form.status === "contacted") {
      setSaveMessage("Lead is already marked for follow-up.");
      return;
    }

    await updateStatus("contacted");
  }

  async function uploadImage(file: File) {
    try {
      setIsUploading(true);
      setSaveMessage("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantSlug", lead.tenantSlug);

      const response = await fetch(`/api/leads/${lead.id}/images`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload image");
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, result.image],
      }));

      setSaveMessage("Image uploaded.");
    } catch (error) {
      console.error("uploadImage error:", error);
      setSaveMessage(
        error instanceof Error ? error.message : "Failed to upload image."
      );
    } finally {
      setIsUploading(false);
    }
  }

    /**
   * Load the latest appointment for this lead.
   *
   * Why:
   * - allows the UI to switch from "Schedule" to "View"
   * - keeps appointment details current after booking/rescheduling/canceling
   */
    async function loadLatestAppointment() {
      try {
        setIsLoadingAppointment(true);
  
        const response = await fetch(`/api/leads/${lead.id}/appointment`);
        const result = await response.json();
  
        if (!response.ok) {
          throw new Error(result.error || "Failed to load appointment");
        }
  
        setLatestAppointment(result.appointment || null);
      } catch (error) {
        console.error("loadLatestAppointment error:", error);
        setLatestAppointment(null);
      } finally {
        setIsLoadingAppointment(false);
      }
    }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-5">
        <div className="mb-4 rounded-2xl border bg-gray-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                Lead Copilot
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                AI summary, suggested reply, missing info, and next step.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadLeadCopilot(true)}
                disabled={isGeneratingSummary || isGeneratingReply || isGeneratingInsights}
                className="inline-flex items-center justify-center rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGeneratingSummary || isGeneratingReply || isGeneratingInsights
                  ? "Generating..."
                  : aiSummary || suggestedReply || missingInfo.length > 0 || suggestedNextStep
                  ? "Regenerate Lead Copilot"
                  : "Generate Lead Copilot"}
              </button>

              <button
                type="button"
                onClick={() => setIsAiToolsOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {isAiToolsOpen ? "Hide AI Tools" : "Show AI Tools"}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Summary
            </p>

            {isGeneratingSummary ? (
              <p className="mt-2 text-sm text-gray-500">
                Generating summary...
              </p>
            ) : aiSummary ? (
              <p className="mt-2 text-sm text-gray-700">
                {aiSummary}
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-400">
                No summary available.
              </p>
            )}
          </div>

          {isAiToolsOpen ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Suggested Reply
                </p>

                {isGeneratingReply ? (
                  <p className="mt-2 text-sm text-gray-500">
                    Generating reply...
                  </p>
                ) : suggestedReply ? (
                  <div className="mt-2 space-y-3">
                    <p className="text-sm text-gray-700">
                      {suggestedReply}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {buildSmsReplyHref() ? (
                        <a
                          href={buildSmsReplyHref() || undefined}
                          className="inline-flex items-center justify-center rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:hidden"
                        >
                          Text Reply
                        </a>
                      ) : null}

                      {buildEmailReplyHref() ? (
                        <a
                          href={buildEmailReplyHref() || undefined}
                          className="inline-flex items-center justify-center rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Email Reply
                        </a>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void handleCopyReply()}
                        className="inline-flex items-center justify-center rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Copy Reply
                      </button>
                    </div>

                    <p className="text-xs text-gray-500">
                      Text Reply is shown on smaller screens where contractors are most
                      likely using their native texting app. Email Reply and Copy Reply
                      remain available more broadly.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">
                    Generate a reply to help the contractor respond quickly.
                  </p>
                )}
              </div>

              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Missing Info
                </p>

                {isGeneratingInsights ? (
                  <p className="mt-2 text-sm text-gray-500">
                    Analyzing missing info...
                  </p>
                ) : missingInfo.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {missingInfo.map((item) => (
                      <li key={item}>• {sentenceCase(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">
                    Generate insights to see what information may still be missing.
                  </p>
                )}
              </div>

              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Suggested Next Step
                </p>

                {isGeneratingInsights ? (
                  <p className="mt-2 text-sm text-gray-500">
                    Generating next step...
                  </p>
                ) : suggestedNextStep ? (
                  <p className="mt-2 text-sm text-gray-700">
                    {suggestedNextStep}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">
                    Generate insights to see the recommended next move.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-4 border-b pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
                  onChange={(e) => updateStatus(e.target.value as LeadStatus)}
                  className={`mt-1 w-full rounded-full border px-3 py-2 text-sm font-medium capitalize outline-none ${getStatusClasses(
                    form.status
                  )}`}
                >
                  <option value="new">New</option>
                  <option value="contacted">Follow-up</option>
                  <option value="booked">Booked</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {buildTelHref(form.phone) ? (
                <a
                  href={buildTelHref(form.phone) || undefined}
                  className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Call
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-xl border bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400"
                >
                  Call
                </button>
              )}
              {buildSmsHref(form.phone) ? (
                <a
                  href={buildSmsHref(form.phone) || undefined}
                  className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Text
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-xl border bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400"
                >
                  Text
                </button>
              )}
              {buildMailtoHref(form.email) ? (
                <a
                  href={buildMailtoHref(form.email) || undefined}
                  className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Email
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-xl border bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400"
                >
                  Email
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              On mobile, Call, Text, and Email will usually open the device’s
              native apps. On desktop, behavior depends on the machine’s app
              setup.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CompactField
              label="Phone"
              value={form.phone}
              isEditing={isEditing}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, phone: value }))
              }
              displayFormatter={formatPhoneForDisplay}
              hrefBuilder={buildTelHref}
            />

            <CompactField
              label="Email"
              value={form.email}
              isEditing={isEditing}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, email: value }))
              }
              hrefBuilder={buildMailtoHref}
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
                    <span>
                      {isLoadingAppointment
                        ? "Loading..."
                        : latestAppointment?.confirmedStartAt
                        ? formatTimestampForDisplay(
                            latestAppointment.confirmedStartAt
                          )
                        : displayValue(form.appointment)}
                    </span>
                  </div>

                  {latestAppointment &&
                  latestAppointment.status !== "cancelled" ? (
                    <button
                      type="button"
                      onClick={() => setShowAppointmentModal(true)}
                      className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      View Appointment
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSchedule(true)}
                      className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Schedule Appointment
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

          {/* DESCRIPTION */}
            <CollapsibleSection
              title="Description"
              isOpen={isDescriptionOpen}
              onToggle={() => setIsDescriptionOpen((prev) => !prev)}
            >
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
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
                  placeholder="Enter description"
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm text-gray-900">
                  {displayValue(form.projectType)}
                </p>
              )}
            </CollapsibleSection>

            {/* IMAGES (moved up) */}
            <CollapsibleSection
              title="Images"
              isOpen={isImagesOpen}
              onToggle={() => setIsImagesOpen((prev) => !prev)}
              rightLabel={`${form.images.length} image${
                form.images.length === 1 ? "" : "s"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-700">Images:</p>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void uploadImage(file);
                      }
                      e.currentTarget.value = "";
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </button>
                </div>
              </div>

              {form.images.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {form.images.map((image, index) => (
                    <div key={image.id} className="rounded-xl border bg-gray-50 p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(image);
                          setSelectedIndex(index);
                        }}
                        className="block w-full overflow-hidden rounded-lg bg-white text-left"
                      >
                        <img
                          src={image.url}
                          alt={image.filename || "Lead image"}
                          className="aspect-video w-full cursor-zoom-in object-cover transition hover:scale-105"
                        />
                      </button>
                      <p className="mt-2 truncate text-xs text-gray-600">
                        {image.filename || image.url}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-900">Not provided</p>
              )}
            </CollapsibleSection>

            {/* CUSTOMER UPDATES */}
            <CollapsibleSection
              title="Customer Updates"
              isOpen={isCustomerUpdatesOpen}
              onToggle={() => setIsCustomerUpdatesOpen((prev) => !prev)}
              rightLabel={`${customerUpdateEntries.length} update${
                customerUpdateEntries.length === 1 ? "" : "s"
              }`}
            >
              {customerUpdateEntries.length > 0 ? (
                <div className="space-y-3">
                  {customerUpdateEntries.map((entry, index) => (
                    <div key={`${entry.timestamp || "update"}-${index}`} className="rounded-xl border bg-white p-3">
                      {entry.timestamp ? (
                        <p className="mb-1 text-xs font-medium text-gray-500">
                          {formatTimestampForDisplay(entry.timestamp)}
                        </p>
                      ) : null}

                      <p className="whitespace-pre-wrap text-sm text-gray-800">
                        {entry.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No customer updates yet.</p>
              )}
            </CollapsibleSection>

            {/* CONTRACTOR NOTES */}
            <CollapsibleSection
              title="Contractor Notes"
              isOpen={isNotesOpen}
              onToggle={() => setIsNotesOpen((prev) => !prev)}
              rightLabel="Internal company notes"
            >
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={5}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="Add contractor notes here"
                disabled={!isEditing}
              />

              {!isEditing && (
                <p className="mt-2 text-xs text-gray-500">
                  Click Edit to update contractor notes and lead details.
                </p>
              )}
            </CollapsibleSection>

            {/* ACTIVITY TIMELINE (moved to bottom) */}
            <CollapsibleSection
              title="Activity Timeline"
              isOpen={isTimelineOpen}
              onToggle={() => setIsTimelineOpen((prev) => !prev)}
              rightLabel={`${visibleActivities.length} event${
                visibleActivities.length === 1 ? "" : "s"
              }`}
            >
              {visibleActivities.length > 0 ? (
                <div className="rounded-xl border bg-white px-4 py-2">
                  <div className="space-y-4">
                    {orderedGroups.map((group) => (
                      <div key={group}>
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-px flex-1 bg-gray-200" />
                          <p className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            {group}
                          </p>
                          <div className="h-px flex-1 bg-gray-200" />
                        </div>

                        <div className="space-y-0">
                          {groupedActivities[group].map((activity, index, arr) => {
                            const label = getActivityLabel(activity);
                            const description = getActivityDescription(activity);
                            const showDescription =
                              description !== "Activity recorded." &&
                              activity.eventType !== "lead.viewed";

                            return (
                              <div key={activity.id} className="relative flex gap-3 py-3">
                                {index < arr.length - 1 ? (
                                  <div className="absolute left-[7px] top-7 bottom-0 w-px bg-gray-200" />
                                ) : null}

                                <div
                                  className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow-sm ${getActivityDotClasses(
                                    activity
                                  )}`}
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900">
                                        {label}
                                      </p>

                                      {showDescription ? (
                                        <p className="mt-0.5 whitespace-pre-wrap text-xs text-gray-600">
                                          {description}
                                        </p>
                                      ) : null}
                                    </div>

                                    <div className="shrink-0 sm:pl-4">
                                      <p className="text-xs text-gray-500">
                                        {formatTimestampForDisplay(activity.createdAt)}
                                      </p>
                                      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">
                                        {activity.eventSource}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900">
                  No activity recorded yet.
                </div>
              )}
            </CollapsibleSection>

          {saveMessage ? (
            <p className="text-sm text-gray-600">{saveMessage}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        {/* <button
          type="button"
          className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white"
        >
          Create Record
        </button> */}

        <button
          type="button"
          onClick={() => {
            if (isEditing) {
              void saveLead();
            } else {
              setIsEditing(true);
            }
          }}
          disabled={isSaving}
          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
        </button>
      </div>

      {selectedImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => {
            setSelectedImage(null);
            setSelectedIndex(null);
          }}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={showPrevImage}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 text-white hover:bg-black"
            >
              ←
            </button>

            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 text-white hover:bg-black"
            >
              →
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setSelectedIndex(null);
              }}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white transition hover:bg-black"
            >
              ✕
            </button>

            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
              <img
                src={selectedImage.url}
                alt={selectedImage.filename || "Lead image"}
                className="max-h-[80vh] w-full bg-black object-contain"
              />

              <div className="border-t bg-white px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="truncate text-sm text-gray-700">
                    {selectedImage.filename || selectedImage.url}
                  </p>
                  <p className="text-xs text-gray-500">
                    Use ← → to browse, Esc to close
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
            {showSchedule && (
        <ScheduleModal
          leadId={lead.id}
          tenantSlug={lead.tenantSlug}
          initialTitle={buildAppointmentTitle({
            projectType: form.projectType,
            customerName: lead.customerName,
          })}
          initialDescription={
            aiSummary ||
            [
              form.projectType ? `Project: ${form.projectType}` : null,
              form.location ? `Location: ${form.location}` : null,
              form.timeline ? `Timeline: ${form.timeline}` : null,
              form.customerUpdates ? `Customer updates: ${form.customerUpdates}` : null,
            ]
              .filter(Boolean)
              .join("\n\n")
          }
          initialAddress={form.address || ""}
          onClose={() => setShowSchedule(false)}
        />
      )}

      {showAppointmentModal && latestAppointment ? (
        <AppointmentModal
          appointment={latestAppointment}
          tenantSlug={lead.tenantSlug}
          leadId={lead.id}
          onClose={() => setShowAppointmentModal(false)}
          onUpdated={() => void loadLatestAppointment()}
        />
      ) : null}
    </div>
  );
}