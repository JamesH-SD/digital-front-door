"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SignupForm() {
  const supabase = createClient();

  const [businessName, setBusinessName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleBusinessNameChange(value: string) {
    setBusinessName(value);

    if (!tenantSlug.trim()) {
      setTenantSlug(slugify(value));
    }
  }

  async function handleSignup() {
    try {
      setIsSubmitting(true);
      setMessage("");

      const cleanSlug = slugify(tenantSlug || businessName);

      if (!businessName.trim() || !cleanSlug || !email.trim() || !password) {
        setMessage("Business name, slug, email, and password are required.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Signup succeeded, but no user was returned.");
      }

      const response = await fetch("/api/auth/create-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          tenantSlug: cleanSlug,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create tenant.");
      }

      window.location.href = `/admin/${cleanSlug}/settings`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">
          Create your Digital Front Door
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Set up your account and business workspace.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={businessName}
            onChange={(e) => handleBusinessNameChange(e.target.value)}
            placeholder="Business name"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />

          <input
            value={tenantSlug}
            onChange={(e) => setTenantSlug(slugify(e.target.value))}
            placeholder="Business URL slug"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={() => void handleSignup()}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create account"}
          </button>

          {message ? <p className="text-sm text-red-600">{message}</p> : null}
        </div>
      </div>
    </main>
  );
}