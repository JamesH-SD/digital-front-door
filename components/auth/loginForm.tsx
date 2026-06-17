"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthExperienceShell from "@/components/auth/AuthExperienceShell";

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

      const createTenantResponse = await fetch("/api/auth/create-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const createTenantResult = await createTenantResponse.json();

      if (!createTenantResponse.ok) {
        throw new Error(
          createTenantResult.error || "Failed to create your business workspace."
        );
      }

      window.location.href = `/onboarding/${createTenantResult.tenantSlug}`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthExperienceShell maxWidth="max-w-md">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Sign in to manage your AI receptionist, website, and customer
          conversations.
        </p>

        <p className="mt-4 text-sm font-semibold text-gray-900">
          Never miss another customer.
        </p>

        <p className="mt-1 text-sm text-gray-500">
          AI receptionist • Website • Scheduling • Lead capture
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();

            if (!isSubmitting && email && password) {
              void handleLogin();
            }
          }}
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email address"
            className="saas-input w-full px-3 py-2 text-sm"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="saas-input w-full px-3 py-2 text-sm"
          />

          <button
            type="submit"
            onClick={() => void handleLogin()}
            disabled={isSubmitting || !email || !password}
            className="saas-button-accent w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              Forgot password?
            </Link>
          </div>

          {message ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </p>
          ) : null}
        </form>

        <div className="text-right">
        
        
      </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          New to Contactor?{" "}
          <Link
            href="/signup"
            className="font-semibold text-orange-700 hover:text-orange-800"
          >
            Create account
          </Link>
        </p>
      </div>
    </AuthExperienceShell>
  );
}