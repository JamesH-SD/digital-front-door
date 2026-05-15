"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    try {
      setIsSubmitting(true);
      setMessage("");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const tenantResponse = await fetch("/api/auth/my-tenant");
      const tenantResult = await tenantResponse.json();

      if (!tenantResponse.ok) {
        throw new Error(tenantResult.error || "Failed to find tenant access.");
      }

      if (tenantResult.tenantSlug) {
        window.location.href = `/admin/${tenantResult.tenantSlug}`;
        return;
      }

      window.location.href = "/create-business";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">
          Sign in
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Access your Digital Front Door admin area.
        </p>

        <p className="text-center text-sm text-gray-600">
          Need an account?{" "}
          <a href="/signup" className="font-semibold text-gray-900 underline">
            Create one
          </a>
        </p>

        <div className="mt-6 space-y-4">
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
            onClick={() => void handleLogin()}
            disabled={isSubmitting || !email || !password}
            className="w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          {message ? (
            <p className="text-sm text-red-600">{message}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}