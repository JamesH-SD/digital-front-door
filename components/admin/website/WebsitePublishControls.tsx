"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  tenantSlug: string;
  initialStatus?: "draft" | "published";
  initialPublishedAt?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function WebsitePublishControls({
  tenantSlug,
  initialStatus = "draft",
  initialPublishedAt,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [publishedAt, setPublishedAt] = useState(initialPublishedAt);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isPublished = status === "published";

  async function updateStatus(action: "publish" | "unpublish") {
    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/website-publish`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update website status.");
      }

      setStatus(result.websiteStatus);
      setPublishedAt(result.websitePublishedAt);
      setMessage(
        action === "publish"
          ? "Website published successfully."
          : "Website unpublished. Public visitors will no longer see it."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update website status."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-stone-200/60 bg-white/90 p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
            Website Status
          </p>

          <h2 className="mt-2 text-xl font-bold text-gray-950">
            {isPublished ? "Published" : "Draft"}
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-600">
            {isPublished
              ? `Your website is live${
                  publishedAt ? ` since ${formatDate(publishedAt)}` : ""
                }.`
              : "Your website is currently in draft mode."}
          </p>

          {message ? (
            <p className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-gray-700">
              {message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${tenantSlug}?preview=true`}
            target="_blank"
            className="saas-button-secondary px-4 py-2 text-sm font-semibold"
          >
            Preview Website
          </Link>

          {isPublished ? (
            <button
              type="button"
              onClick={() => void updateStatus("unpublish")}
              disabled={isSaving}
              className="saas-button-secondary px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {isSaving ? "Updating..." : "Unpublish"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void updateStatus("publish")}
              disabled={isSaving}
              className="saas-button-accent px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {isSaving ? "Publishing..." : "Publish Website"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}