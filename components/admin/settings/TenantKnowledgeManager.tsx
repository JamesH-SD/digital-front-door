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

          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
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

            <div className="rounded-2xl border bg-gray-50 p-4">
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
