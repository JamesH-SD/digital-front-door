"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthExperienceShell from "@/components/auth/AuthExperienceShell";

export default function ResendConfirmationForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResendConfirmation() {
    try {
      setIsSubmitting(true);
      setMessage("");
      setIsSuccess(false);

      if (!email.trim()) {
        setMessage("Email address is required.");
        return;
      }

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${siteUrl}/login`,
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      setMessage("Confirmation email sent. Please check your inbox.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to send confirmation email."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthExperienceShell maxWidth="max-w-md">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Resend confirmation
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Enter your email and we’ll send another confirmation link.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email address"
            className="saas-input w-full px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={() => void handleResendConfirmation()}
            disabled={isSubmitting || !email.trim()}
            className="saas-button-accent w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send confirmation email"}
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
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already confirmed?{" "}
          <Link
            href="/login"
            className="font-semibold text-orange-700 hover:text-orange-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthExperienceShell>
  );
}