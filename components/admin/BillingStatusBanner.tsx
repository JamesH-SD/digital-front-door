"use client";

import { useState } from "react";
import type { TenantBilling } from "@/lib/db/tenant-billing";
import type { SubscriptionState } from "@/lib/billing/getSubscriptionState";

type Props = {
  billing: TenantBilling | null;
  subscriptionState: SubscriptionState;
};

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function BillingStatusBanner({
  billing,
  subscriptionState,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const isActive = subscriptionState.isActive && !subscriptionState.isTrialing;
  const isTrialing = subscriptionState.isTrialing;
  const isExpired = subscriptionState.isExpired;
  const hasStripeCustomer = Boolean(billing?.stripeCustomerId);

  async function goToCheckout() {
    try {
      setIsLoading(true);

      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to start checkout.");
      }

      window.location.href = result.url;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to start checkout.");
    } finally {
      setIsLoading(false);
    }
  }

  async function goToBillingPortal() {
    try {
      setIsLoading(true);

      const response = await fetch("/api/billing/create-portal-session", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to open billing portal.");
      }

      window.location.href = result.url;
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Unable to open billing portal."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (billing?.cancelAtPeriodEnd) {
    const date = formatDate(billing.trialEndsAt || billing.currentPeriodEnd);
  
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-amber-900">
              Subscription cancellation scheduled
            </p>
  
            <p className="mt-1 text-sm text-amber-800">
              Your access will remain active{date ? ` until ${date}` : ""}.
            </p>
          </div>
  
          {hasStripeCustomer ? (
            <button
              type="button"
              onClick={() => void goToBillingPortal()}
              disabled={isLoading}
              className="saas-button-secondary px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {isLoading ? "Opening..." : "Manage billing"}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (isExpired) {
    return (
      <section className="rounded-3xl border border-orange-200 bg-orange-50 px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-orange-900">
              Your trial has ended
            </p>
  
            <p className="mt-1 text-sm leading-6 text-orange-800">
              Resume your subscription to continue using your AI receptionist,
              website tools, lead capture, scheduling, and knowledge base.
            </p>
          </div>
  
          <button
            type="button"
            onClick={() => void goToCheckout()}
            disabled={isLoading}
            className="inline-flex h-11 min-w-[190px] items-center justify-center rounded-xl bg-orange-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-800 disabled:opacity-60"
          >
            {isLoading ? "Starting..." : "Resume Subscription"}
          </button>
        </div>
      </section>
    );
  }
  
  if (isActive || isTrialing) {
    const date = isTrialing
      ? formatDate(subscriptionState.trialEndsAt)
      : formatDate(billing?.currentPeriodEnd);

    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-900">
              {isTrialing ? "7-day trial active" : "Subscription active"}
            </p>

            <p className="mt-1 text-sm text-emerald-800">
              {isTrialing
                ? `Your free trial is active${date ? ` until ${date}` : ""}.`
                : `Your subscription is active${
                    date ? ` through ${date}` : ""
                  }.`}
            </p>
          </div>

          {hasStripeCustomer ? (
            <button
              type="button"
              onClick={() => void goToBillingPortal()}
              disabled={isLoading}
              className="saas-button-secondary px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {isLoading ? "Opening..." : "Manage billing"}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-orange-200 bg-orange-50 px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-orange-900">
            Activate your 7-day free trial
          </p>

          <p className="mt-1 text-sm leading-6 text-orange-800">
            Start your Contactor subscription to keep your AI receptionist,
            website, lead capture, and scheduling tools active.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void goToCheckout()}
          disabled={isLoading}
          className="saas-button-accent px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isLoading ? "Starting..." : "Start free trial"}
        </button>
      </div>
    </section>
  );
}