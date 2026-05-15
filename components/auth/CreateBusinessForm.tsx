"use client";

import { useState } from "react";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreateBusinessForm() {
  const [businessName, setBusinessName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateBusiness() {
    try {
      setIsSubmitting(true);
      setMessage("");

      const tenantSlug = slugify(businessName);

      if (!businessName.trim() || !tenantSlug) {
        setMessage("Business name is required.");
        return;
      }

      const response = await fetch("/api/auth/create-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          tenantSlug,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create business.");
      }

      window.location.href = `/onboarding/${result.tenantSlug}`;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create business."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">
          Create your business
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Set up your Digital Front Door workspace.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business name"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={() => void handleCreateBusiness()}
            disabled={isSubmitting || !businessName.trim()}
            className="w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create business"}
          </button>

          {message ? (
            <p className="text-sm text-red-600">{message}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}