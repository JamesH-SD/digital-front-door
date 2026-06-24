"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthExperienceShell from "@/components/auth/AuthExperienceShell";

export default function SignupForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup() {
    try {
      setIsSubmitting(true);
      setMessage("");
      setIsSuccess(false);

      if (!fullName.trim() || !businessName.trim() || !email.trim() || !password) {
        setMessage("Full name, business name, email, and password are required.");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: fullName.trim(),
            business_name: businessName.trim(),
          },
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      setMessage(
        "Account created. Please check your email to confirm your account. If you do not see it, you can resend the confirmation email."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthExperienceShell maxWidth="max-w-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create account</h1>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Create your Contactor account. Once your email is confirmed, you'll be
          guided through setting up your business and AI receptionist.
        </p>

        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-900">
            Start growing your business.
          </p>
        </div>

        <div className="mt-7 space-y-4">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            type="text"
            placeholder="Full name"
            className="saas-input w-full px-3 py-2 text-sm"
          />

          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            type="text"
            placeholder="Business name"
            className="saas-input w-full px-3 py-2 text-sm"
          />
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
            onClick={() => void handleSignup()}
            disabled={
              isSubmitting ||
              !fullName.trim() ||
              !businessName.trim() ||
              !email.trim() ||
              !password
            }
            className="saas-button-accent w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
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
          <p className="text-center text-sm text-gray-600">
            Didn’t get the email?{" "}
            <Link
              href="/resend-confirmation"
              className="font-semibold text-orange-700 hover:text-orange-800"
            >
              Resend confirmation
            </Link>
          </p>
        ) : null}
        </div>

        <p className="mt-5 text-center text-sm text-gray-600">
          Already using Contactor?{" "}
          <Link href="/login" className="font-semibold text-orange-700 hover:text-orange-800">
            Sign in
          </Link>
        </p>
        </div>
      </AuthExperienceShell>
    );
}