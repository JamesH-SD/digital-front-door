"use client";

import Link from "next/link";
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
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200/60 bg-white/90 p-6 shadow-[0_8px_24px_rgba(17,24,39,0.045)]">
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

        <div className="mt-6 space-y-4">
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
            type="button"
            onClick={() => void handleLogin()}
            disabled={isSubmitting || !email || !password}
            className="saas-button-accent w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          {message ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </p>
          ) : null}
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          New to Contactor?{" "}
          <Link href="/signup" className="font-semibold text-orange-700 hover:text-orange-800">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}