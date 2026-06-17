"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthExperienceShell from "@/components/auth/AuthExperienceShell";

export default function ResetPasswordForm() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleUpdatePassword() {
    try {
      setIsSubmitting(true);
      setMessage("");
      setIsSuccess(false);

      if (!password || !confirmPassword) {
        setMessage("Both password fields are required.");
        return;
      }

      if (password.length < 6) {
        setMessage("Password must be at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setIsSuccess(true);
      setMessage("Password updated. You can now sign in.");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthExperienceShell maxWidth="max-w-md">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create new password</h1>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Enter a new password for your Contactor account.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="New password"
            className="saas-input w-full px-3 py-2 text-sm"
          />

          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            placeholder="Confirm new password"
            className="saas-input w-full px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={() => void handleUpdatePassword()}
            disabled={isSubmitting || !password || !confirmPassword}
            className="saas-button-accent w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Updating..." : "Update password"}
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
      </div>
    </AuthExperienceShell>
  );
}