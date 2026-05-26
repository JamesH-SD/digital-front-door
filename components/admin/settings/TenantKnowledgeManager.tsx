"use client";

import { useEffect, useState } from "react";
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

export default function TenantKnowledgeManager({ tenantSlug }: Props) {
  const [items, setItems] = useState<TenantKnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState({
    sourceType: "faq" as TenantKnowledgeSourceType,
    title: "",
    content: "",
    tags: "",
    confidence: "medium" as "low" | "medium" | "high",
    sourceLabel: "Manual Entry",
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
  
  const [isUploading, setIsUploading] = useState(false);

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

  async function createItem() {
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
            sourceType: form.sourceType,
            title: form.title,
            content: form.content,
            tags: form.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            confidence: form.confidence,
            sourceLabel: form.sourceLabel,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create knowledge item.");
      }

      setItems((prev) => [result.item, ...prev]);
      setForm({
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

  useEffect(() => {
    void loadItems();
  }, [tenantSlug]);

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-w-0 w-full items-start gap-3 text-left"
        >
        <span
            className={`mt-1 shrink-0 text-sm text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
        >
            ▼
        </span>

        <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
            Knowledge Base
            </h2>

            <p className="mt-2 text-sm text-gray-600">
            Add business-specific facts, FAQs, services, policies, and notes the
            AI can use when answering customer questions.
            </p>

            <p className="mt-2 text-xs text-gray-500">
            {isLoading
                ? "Loading knowledge items..."
                : `${items.length} knowledge item${
                    items.length === 1 ? "" : "s"
                }`}
            </p>
        </div>
        </button>

      {isOpen ? (
        <div className="mt-5 border-t pt-5">
          {message ? (
            <p className="mb-4 rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {message}
            </p>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Upload Knowledge File
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Upload PDFs, photos, pricing sheets, policies, service lists, or other files
                the AI should know about.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    File
                  </label>

                  <input
                    type="file"
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        file: e.target.files?.[0] || null,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                  />

                  {uploadForm.file ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: {uploadForm.file.name}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </label>

                  <select
                    value={uploadForm.sourceType}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        sourceType: e.target.value as TenantKnowledgeSourceType,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                  >
                    {SOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Title
                  </label>

                  <input
                    value={uploadForm.title}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                    placeholder="Example: Weekend Rental Policy"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Short Summary
                  </label>

                  <textarea
                    value={uploadForm.summary}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        summary: e.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                    placeholder="Briefly explain what this file teaches the AI."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Notes
                  </label>

                  <textarea
                    value={uploadForm.notes}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                    placeholder="Optional extra instructions or context."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tags
                  </label>

                  <input
                    value={uploadForm.tags}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        tags: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                    placeholder="pricing, deposit, cancellation"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Scope
                  </label>

                  <select
                    value={uploadForm.knowledgeScope}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        knowledgeScope: e.target.value as "global" | "campaign",
                      }))
                    }
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                  >
                    <option value="global">Global business knowledge</option>
                    <option value="campaign">Campaign-specific knowledge</option>
                  </select>
                </div>

                {uploadForm.knowledgeScope === "campaign" ? (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Campaign ID
                    </label>

                    <input
                      value={uploadForm.campaignId}
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          campaignId: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                      placeholder="Example: 123-main-st"
                    />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void uploadKnowledgeFile()}
                  disabled={
                    isUploading ||
                    !uploadForm.file ||
                    !uploadForm.title.trim() ||
                    !uploadForm.summary.trim()
                  }
                  className="w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading ? "Uploading..." : "Upload Knowledge File"}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Add Knowledge Item
              </h3>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </label>
                  <select
                    value={form.sourceType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sourceType: e.target.value as TenantKnowledgeSourceType,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                  >
                    {SOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Title
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                    placeholder="Example: Cabinet Samples"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Content
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, content: e.target.value }))
                    }
                    rows={5}
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                    placeholder="Write the fact, policy, FAQ answer, or service detail..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tags
                  </label>
                  <input
                    value={form.tags}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                    placeholder="cabinets, samples, kitchen"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void createItem()}
                  disabled={isSaving || !form.title.trim() || !form.content.trim()}
                  className="w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Adding..." : "Add Knowledge Item"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border bg-gray-50 p-4 xl:col-span-1">
              <h3 className="text-sm font-semibold text-gray-900">
                Current Knowledge
              </h3>

              {isLoading ? (
                <p className="mt-4 text-sm text-gray-500">Loading...</p>
              ) : items.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl border bg-white p-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.sourceType} · {item.confidence || "medium"} ·{" "}
                            {item.sourceLabel || "Unknown source"}
                          </p>
                        </div>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {item.content}
                      </p>

                      {item.summary ? (
                        <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                          {item.summary}
                        </p>
                      ) : null}

                      {item.fileUrl ? (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Open uploaded file
                        </a>
                      ) : null}

                      {item.tags?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  No knowledge items yet.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
