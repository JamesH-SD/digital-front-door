"use client";

import { useState } from "react";
import AuthExperienceShell from "@/components/auth/AuthExperienceShell";

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
        error instanceof Error ? error.message : "Failed to create business."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthExperienceShell maxWidth="max-w-lg">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
          Workspace setup
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-950">
          Create your business
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Set up your Digital Front Door workspace. You’ll be guided through the
          rest of the setup next.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business name"
            className="saas-input w-full px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={() => void handleCreateBusiness()}
            disabled={isSubmitting || !businessName.trim()}
            className="saas-button-accent w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create business"}
          </button>

          {message ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </p>
          ) : null}
        </div>
      </div>
  </AuthExperienceShell>
);
}