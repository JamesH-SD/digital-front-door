"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  TenantKnowledgeItem,
  TenantKnowledgeSourceType,
} from "@/lib/types/tenant-knowledge";

const SOURCE_TYPES: TenantKnowledgeSourceType[] = [
  "manual_note",
  "faq",
  "service",
  "policy",
  "pricing",
  "website",
  "document",
  "photo",
  "unknown",
];

type Props = {
  tenantSlug: string;
};

type EntryMode = "upload" | "manual";

type Confidence = "low" | "medium" | "high";

function formatSourceType(type?: string | null) {
  if (!type) return "Unknown";

  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatFileSize(size?: number | null) {
  if (!size) return null;

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileUrl(item: TenantKnowledgeItem) {
  return item.fileUrl || (item as any).file_url || "";
}

function getFileName(item: TenantKnowledgeItem) {
  return item.fileName || (item as any).file_name || "Open uploaded file";
}

function getFileSizeValue(item: TenantKnowledgeItem) {
  return item.fileSize || (item as any).file_size || null;
}

function isManualItem(item: TenantKnowledgeItem) {
  return !item.fileUrl && item.sourceLabel === "Manual Entry";
}

function getPreviewText(item: TenantKnowledgeItem) {
  if (item.summary?.trim()) return item.summary.trim();

  const content = item.content || "";

  if (!content.trim()) return "No preview available.";

  return content.length > 220 ? `${content.slice(0, 220)}...` : content;
}

export default function TenantKnowledgeManager({ tenantSlug }: Props) {
  const [items, setItems] = useState<TenantKnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [entryMode, setEntryMode] = useState<EntryMode>("upload");

  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>(
    {}
  );

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const [manualForm, setManualForm] = useState({
    sourceType: "faq" as TenantKnowledgeSourceType,
    title: "",
    content: "",
    tags: "",
    confidence: "medium" as Confidence,
    sourceLabel: "Manual Entry",
  });

  const [editForm, setEditForm] = useState({
    sourceType: "faq" as TenantKnowledgeSourceType,
    title: "",
    content: "",
    tags: "",
    confidence: "medium" as Confidence,
  });

  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    sourceType: "document" as TenantKnowledgeSourceType,
    title: "",
    summary: "",
    notes: "",
    tags: "",
    knowledgeScope: "global" as "global" | "campaign",
    campaignId: "",
  });

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.createdAt || "").getTime();
      const dateB = new Date(b.createdAt || "").getTime();

      return dateB - dateA;
    });
  }, [items]);

  async function loadItems() {
    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/knowledge`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load knowledge items.");
      }

      setItems(result.items || []);
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Failed to load knowledge."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function createManualItem() {
    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/knowledge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceType: manualForm.sourceType,
            title: manualForm.title,
            content: manualForm.content,
            tags: parseTags(manualForm.tags),
            confidence: manualForm.confidence,
            sourceLabel: "Manual Entry",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create knowledge item.");
      }

      setItems((prev) => [result.item, ...prev]);
      setManualForm({
        sourceType: "faq",
        title: "",
        content: "",
        tags: "",
        confidence: "medium",
        sourceLabel: "Manual Entry",
      });
      setMessage("Knowledge item added.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create knowledge item."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadKnowledgeFile() {
    if (!uploadForm.file) {
      setMessage("Please choose a file to upload.");
      return;
    }

    if (!uploadForm.title.trim() || !uploadForm.summary.trim()) {
      setMessage("Title and summary are required for uploads.");
      return;
    }

    try {
      setIsUploading(true);
      setMessage("");

      const formData = new FormData();

      formData.append("file", uploadForm.file);
      formData.append("sourceType", uploadForm.sourceType);
      formData.append("title", uploadForm.title);
      formData.append("summary", uploadForm.summary);
      formData.append("notes", uploadForm.notes);
      formData.append("tags", uploadForm.tags);
      formData.append("knowledgeScope", uploadForm.knowledgeScope);
      formData.append("campaignId", uploadForm.campaignId);

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/knowledge`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload knowledge file.");
      }

      setItems((prev) => [result.item, ...prev]);
      setUploadForm({
        file: null,
        sourceType: "document",
        title: "",
        summary: "",
        notes: "",
        tags: "",
        knowledgeScope: "global",
        campaignId: "",
      });
      setMessage("Knowledge file uploaded.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload knowledge file."
      );
    } finally {
      setIsUploading(false);
    }
  }

  function beginEdit(item: TenantKnowledgeItem) {
    setEditingItemId(item.id);
    setEditForm({
      sourceType: item.sourceType || "manual_note",
      title: item.title || "",
      content: item.content || "",
      tags: item.tags?.join(", ") || "",
      confidence: (item.confidence as Confidence) || "medium",
    });
  }

  function cancelEdit() {
    setEditingItemId(null);
    setEditForm({
      sourceType: "faq",
      title: "",
      content: "",
      tags: "",
      confidence: "medium",
    });
  }

  async function saveEdit(itemId: string) {
    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/knowledge`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: itemId,
            sourceType: editForm.sourceType,
            title: editForm.title,
            content: editForm.content,
            tags: parseTags(editForm.tags),
            confidence: editForm.confidence,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update knowledge item.");
      }

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? result.item : item))
      );
      cancelEdit();
      setMessage("Knowledge item updated.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update knowledge item."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteItem(item: TenantKnowledgeItem) {
    const confirmed = window.confirm(
      item.fileUrl
        ? "Delete this knowledge item and its uploaded file?"
        : "Delete this knowledge item?"
    );

    if (!confirmed) return;

    try {
      setDeletingItemId(item.id);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/knowledge?id=${encodeURIComponent(
          item.id
        )}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete knowledge item.");
      }

      setItems((prev) => prev.filter((existing) => existing.id !== item.id));
      setMessage("Knowledge item deleted.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete knowledge item."
      );
    } finally {
      setDeletingItemId(null);
    }
  }

  function toggleExpanded(itemId: string) {
    setExpandedItemIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }

  useEffect(() => {
    void loadItems();
  }, [tenantSlug]);

  const entryModeToggle = (
    <div className="inline-flex rounded-2xl border border-stone-200 bg-stone-50 p-1">
      <button
        type="button"
        onClick={() => setEntryMode("upload")}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
          entryMode === "upload"
            ? "bg-orange-700 text-white shadow-sm"
            : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
        }`}
      >
        Upload File
      </button>
  
      <button
        type="button"
        onClick={() => setEntryMode("manual")}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
          entryMode === "manual"
            ? "bg-orange-700 text-white shadow-sm"
            : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
        }`}
      >
        Manual Entry
      </button>
    </div>
  );

  return (
    
    <section className="rounded-2xl border border-stone-200/50 bg-white/90 p-4 shadow-[0_8px_24px_rgba(17,24,39,0.045)]">
      <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">
            Knowledge Base
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload documents or add business-specific facts the AI can use when
            answering customer questions.
          </p>
        </div>

        <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
          {isLoading
            ? "Loading..."
            : `${items.length} knowledge item${items.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-gray-700">
          {message}
        </p>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          {entryMode === "upload" ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Upload Knowledge File
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Upload PDFs, DOCX files, text files, policies, service lists,
                  or pricing sheets.
                </p>
              </div>
              {entryModeToggle}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  File
                </label>

                <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm transition hover:border-orange-300 hover:bg-orange-50/40">
                  <span className="min-w-0 truncate text-gray-700">
                    {uploadForm.file
                      ? uploadForm.file.name
                      : "Choose a PDF, DOCX, TXT, or image file"}
                  </span>

                  <span className="shrink-0 rounded-xl bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                    Browse
                  </span>

                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        file: e.target.files?.[0] || null,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </span>
                  <select
                    value={uploadForm.sourceType}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        sourceType: e.target.value as TenantKnowledgeSourceType,
                      }))
                    }
                    className="saas-input w-full px-3 py-2 text-sm"
                  >
                    {SOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {formatSourceType(type)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Scope
                  </span>
                  <select
                    value={uploadForm.knowledgeScope}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        knowledgeScope: e.target.value as
                          | "global"
                          | "campaign",
                      }))
                    }
                    className="saas-input w-full px-3 py-2 text-sm"
                  >
                    <option value="global">Global Business Knowledge</option>
                    <option value="campaign">Campaign-Specific Knowledge</option>
                  </select>
                </label>
              </div>

              {uploadForm.knowledgeScope === "campaign" ? (
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Campaign ID
                  </span>
                  <input
                    value={uploadForm.campaignId}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        campaignId: e.target.value,
                      }))
                    }
                    className="saas-input w-full px-3 py-2 text-sm"
                    placeholder="Example: spring-roofing-campaign"
                  />
                </label>
              ) : null}

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Title
                </span>
                <input
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="saas-input w-full px-3 py-2 text-sm"
                  placeholder="Example: HG FAQs"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Short Summary
                </span>
                <textarea
                  value={uploadForm.summary}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      summary: e.target.value,
                    }))
                  }
                  rows={3}
                  className="saas-input w-full px-3 py-2 text-sm"
                  placeholder="Briefly explain what this file teaches the AI."
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Notes
                </span>
                <textarea
                  value={uploadForm.notes}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                  className="saas-input w-full px-3 py-2 text-sm"
                  placeholder="Optional extra instructions or context."
                />
              </label>

              <label className="mb-4 block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tags
                </span>
                <input
                  value={uploadForm.tags}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      tags: e.target.value,
                    }))
                  }
                  className="saas-input w-full px-3 py-2 text-sm"
                  placeholder="faq, services, licensing"
                />
              </label>

              <button
                type="button"
                onClick={() => void uploadKnowledgeFile()}
                disabled={
                  isUploading ||
                  !uploadForm.file ||
                  !uploadForm.title.trim() ||
                  !uploadForm.summary.trim()
                }
                className="saas-button-accent w-full px-4 py-2.5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Add Manual Knowledge
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Add a reusable fact, FAQ, service detail, policy, or pricing
                  note.
                </p>
              </div>
              {entryModeToggle}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </span>
                  <select
                    value={manualForm.sourceType}
                    onChange={(e) =>
                      setManualForm((prev) => ({
                        ...prev,
                        sourceType: e.target.value as TenantKnowledgeSourceType,
                      }))
                    }
                    className="saas-input w-full px-3 py-2 text-sm"
                  >
                    {SOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {formatSourceType(type)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Confidence
                  </span>
                  <select
                    value={manualForm.confidence}
                    onChange={(e) =>
                      setManualForm((prev) => ({
                        ...prev,
                        confidence: e.target.value as Confidence,
                      }))
                    }
                    className="saas-input w-full px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Title
                </span>
                <input
                  value={manualForm.title}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="saas-input w-full px-3 py-2 text-sm"
                  placeholder="Example: Service Area Policy"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Content
                </span>
                <textarea
                  value={manualForm.content}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  rows={6}
                  className="saas-input w-full px-3 py-2 text-sm"
                  placeholder="Write the fact, policy, FAQ answer, or service detail..."
                />
              </label>

              <label className="mb-4 block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tags
                </span>
                <input
                  value={manualForm.tags}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      tags: e.target.value,
                    }))
                  }
                  className="saas-input w-full px-3 py-2 text-sm"
                  placeholder="pricing, service area, policy"
                />
              </label>

              <button
                type="button"
                onClick={() => void createManualItem()}
                disabled={
                  isSaving ||
                  !manualForm.title.trim() ||
                  !manualForm.content.trim()
                }
                className="saas-button-accent w-full px-4 py-2.5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Creating..." : "Create Item"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Knowledge Library
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Items are collapsed by default so uploaded documents do not take
                over the page.
              </p>
            </div>
          </div>

          {isLoading ? (
            <p className="mt-4 text-sm text-gray-500">Loading...</p>
          ) : sortedItems.length > 0 ? (
            <div className="mt-4 space-y-3">
              {sortedItems.map((item) => {
                const isExpanded = Boolean(expandedItemIds[item.id]);
                const isEditing = editingItemId === item.id;
                const fileUrl = getFileUrl(item);
                const fileName = getFileName(item);
                const fileSize = formatFileSize(getFileSizeValue(item));
                

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-950">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatSourceType(item.sourceType)} ·{" "}
                          {formatSourceType(item.confidence || "medium")} ·{" "}
                          {item.fileUrl ? "Uploaded File" : "Manual Entry"}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        {isManualItem(item) ? (
                          <button
                            type="button"
                            onClick={() => beginEdit(item)}
                            className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-stone-50"
                          >
                            Edit
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-stone-50"
                        >
                          {isExpanded ? "Hide" : "View"}
                        </button>

                        <button
                          type="button"
                          onClick={() => void deleteItem(item)}
                          disabled={deletingItemId === item.id}
                          className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingItemId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>

                    {!isEditing ? (
                      <>
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {getPreviewText(item)}
                        </p>

                        {fileUrl ? (
                          <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
                            <span className="font-semibold text-gray-700">
                              Uploaded File:
                            </span>{" "}
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-orange-700 hover:underline"
                            >
                              {fileName}
                            </a>

                            {fileSize ? (
                              <span className="ml-2 text-xs text-gray-500">
                                ({fileSize})
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        {item.tags?.length ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {isExpanded ? (
                          <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Full AI Context
                            </p>
                            <p className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-gray-700">
                              {item.content || "No content available."}
                            </p>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="mt-4 space-y-3 rounded-2xl border border-orange-100 bg-orange-50/30 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Type
                            </span>
                            <select
                              value={editForm.sourceType}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  sourceType:
                                    e.target.value as TenantKnowledgeSourceType,
                                }))
                              }
                              className="saas-input w-full px-3 py-2 text-sm"
                            >
                              {SOURCE_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {formatSourceType(type)}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Confidence
                            </span>
                            <select
                              value={editForm.confidence}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  confidence: e.target.value as Confidence,
                                }))
                              }
                              className="saas-input w-full px-3 py-2 text-sm"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </label>
                        </div>

                        <label className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Title
                          </span>
                          <input
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            className="saas-input w-full px-3 py-2 text-sm"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Content
                          </span>
                          <textarea
                            value={editForm.content}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                content: e.target.value,
                              }))
                            }
                            rows={7}
                            className="saas-input w-full px-3 py-2 text-sm"
                          />
                        </label>

                        <label className="mb-4 block space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Tags
                          </span>
                          <input
                            value={editForm.tags}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                tags: e.target.value,
                              }))
                            }
                            className="saas-input w-full px-3 py-2 text-sm"
                          />
                        </label>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-stone-50"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => void saveEdit(item.id)}
                            disabled={
                              isSaving ||
                              !editForm.title.trim() ||
                              !editForm.content.trim()
                            }
                            className="saas-button-accent px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-gray-900">
                No knowledge items yet
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Upload a document or create a manual entry to teach the AI about
                this business.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}