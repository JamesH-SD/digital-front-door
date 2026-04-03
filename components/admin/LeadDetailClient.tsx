"use client";

import { useEffect, useRef, useState } from "react";
import type { Lead } from "@/lib/types/lead";

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
 * Convert an ISO timestamp into a local, human-friendly value for display.
 *
 * We keep UTC/Zulu in the database, but display local time in the UI so the
 * admin experience is easier to read.
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
 *
 * Expected stored format:
 * [Customer Update - 2026-04-03T02:15:00.000Z]
 * Message text here
 *
 * Multiple updates are separated by blank lines.
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

  /**
   * Fallback:
   * If the stored content does not match the expected pattern, preserve it as
   * a single entry instead of failing silently.
   */
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

/**
 * Reusable collapsible section for larger lead detail panels.
 *
 * This helps prevent the lead detail view from growing out of control as
 * descriptions, customer updates, contractor notes, and images get longer.
 */
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

export default function LeadDetailClient({ lead }: { lead: Lead }) {
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

  /**
   * Form state used for editable internal lead management.
   *
   * Important separation:
   * - notes: internal company notes
   * - customerUpdates: customer-originated follow-up details captured
   *   after the original chat intake
   */
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

  /**
   * Section expansion state.
   *
   * Default behavior:
   * - Description: open
   * - Contractor Notes: collapsed
   * - Customer Updates: collapsed
   * - Images: collapsed
   */
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isCustomerUpdatesOpen, setIsCustomerUpdatesOpen] = useState(false);
  const [isImagesOpen, setIsImagesOpen] = useState(false);

  const appointmentMissing = !form.appointment.trim();
  const customerUpdateEntries = parseCustomerUpdates(form.customerUpdates);

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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-start md:justify-between">
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
                <option value="new">new</option>
                <option value="contacted">contacted</option>
                <option value="booked">booked</option>
                <option value="closed">closed</option>
              </select>
            </div>
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
              hrefBuilder={(value) => {
                if (!value || !value.trim()) return null;
                return `tel:${value}`;
              }}
            />

            <CompactField
              label="Email"
              value={form.email}
              isEditing={isEditing}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, email: value }))
              }
              hrefBuilder={(value) => {
                if (!value || !value.trim()) return null;
                return `mailto:${value}`;
              }}
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
                    <span>{displayValue(form.appointment)}</span>
                  </div>

                  {appointmentMissing && (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Schedule
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
                  <div
                    key={`${entry.timestamp ?? "no-time"}_${index}`}
                    className="rounded-xl border bg-white p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Customer Update
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestampForDisplay(entry.timestamp)}
                      </p>
                    </div>

                    <p className="whitespace-pre-wrap text-sm text-gray-900">
                      {entry.content || "No details provided."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900">
                Customer follow-up messages will appear here.
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">
              These are follow-up details submitted through chat after the
              original request was captured.
            </p>
          </CollapsibleSection>

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
                  <div
                    key={image.id}
                    className="rounded-xl border bg-gray-50 p-3"
                  >
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

          {saveMessage ? (
            <p className="text-sm text-gray-600">{saveMessage}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white"
        >
          Create Record
        </button>

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
    </div>
  );
}