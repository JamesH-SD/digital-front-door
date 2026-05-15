"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup() {
    try {
      setIsSubmitting(true);
      setMessage("");
      setIsSuccess(false);

      if (!email.trim() || !password) {
        setMessage("Email and password are required.");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      setMessage(
        "Account created. Please check your email to confirm your account, then sign in."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">
          Create account
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Create your Digital Front Door account. After confirming your email,
          you’ll sign in and set up your business.
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
            onClick={() => void handleSignup()}
            disabled={isSubmitting || !email.trim() || !password}
            className="w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create account"}
          </button>

          {message ? (
            <p
              className={`rounded-xl border px-3 py-2 text-sm ${
                isSuccess
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </p>
          ) : null}

          {isSuccess ? (
            <Link
              href="/login"
              className="block text-center text-sm font-semibold text-gray-900 underline"
            >
              Go to sign in
            </Link>
          ) : (
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-gray-900 underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}