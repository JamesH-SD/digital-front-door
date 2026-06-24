"use client";

import { useState } from "react";
import type { NotificationPreferences } from "@/lib/db/notification-preferences";

type Props = {
  tenantSlug: string;
  initialPreferences: NotificationPreferences;
};

export default function NotificationPreferencesForm({
  tenantSlug,
  initialPreferences,
}: Props) {
  const [form, setForm] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialPreferences);

  function updateField(key: keyof NotificationPreferences, value: boolean) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function savePreferences() {
    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/notification-preferences`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save notification preferences.");
      }

      setMessage("Notification preferences saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save notification preferences."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const items: {
    key: keyof NotificationPreferences;
    label: string;
    description: string;
  }[] = [
    {
      key: "leadEmailAlerts",
      label: "Lead alerts",
      description: "Email me when a new lead is captured.",
    },
    {
      key: "appointmentEmailAlerts",
      label: "Appointment alerts",
      description: "Email me when an appointment is requested or booked.",
    },
    {
      key: "billingEmailAlerts",
      label: "Billing updates",
      description: "Email me about subscription, trial, and payment updates.",
    },
    {
      key: "weeklySummaryEnabled",
      label: "Weekly summary",
      description: "Send a weekly summary of leads and activity.",
    },
    {
      key: "aiEscalationAlerts",
      label: "AI escalation alerts",
      description: "Email me when the AI needs human follow-up.",
    },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <label
          key={item.key}
          className="flex items-start justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-gray-950">{item.label}</p>
            <p className="mt-1 text-sm text-gray-600">{item.description}</p>
          </div>

          <input
            type="checkbox"
            checked={form[item.key]}
            onChange={(event) => updateField(item.key, event.target.checked)}
            className="mt-1"
          />
        </label>
      ))}

      {message ? <p className="text-sm text-gray-600">{message}</p> : null}

      <button
        type="button"
        onClick={() => void savePreferences()}
        disabled={isSaving || !hasChanges}
        className="saas-button-accent px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving..." : hasChanges ? "Save notification preferences" : "Saved"}
      </button>
    </div>
  );
}