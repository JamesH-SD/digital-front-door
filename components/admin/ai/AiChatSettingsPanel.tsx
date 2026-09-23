"use client";

import { useEffect, useState } from "react";
import type { Tenant } from "@/lib/types/tenant";
import ToastMessage from "@/components/ui/ToastMessage";
import CopyableLinkRow from "@/components/admin/customer-entry/CopyableLinkRow";
import WidgetEmbedSnippetCard from "@/components/admin/customer-entry/WidgetEmbedSnippetCard";
import {
  buildExistingWebsiteConversationQrUrl,
  buildHostedBrowseUrl,
  buildHostedConversationQrUrl,
} from "@/lib/customer-entry/buildCustomerEntryUrls";

type Props = {
  tenant: Tenant;
};

type ToastState = {
  message: string;
  variant: "success" | "error";
} | null;

function displayValue(value?: string | null) {
  return value && value.trim() ? value : "Not provided";
}

function hasWebsiteUrl(value?: string | null) {
  return Boolean(value && value.trim());
}

export default function AiChatSettingsPanel({ tenant }: Props) {
  const [toast, setToast] = useState<ToastState>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    bookingType: tenant.bookingType || "consultation",
    nextStepMessage: tenant.nextStepMessage || "",
    greetingMessage: tenant.greetingMessage || "",
    askForTimeline: tenant.askForTimeline ?? true,
    askForEmailAfterPhone: tenant.askForEmailAfterPhone ?? true,
    askForImagesAfterCapture: tenant.askForImagesAfterCapture ?? true,
    requirePhoneForLead: tenant.requirePhoneForLead ?? true,
  });

  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const hostedPageUrl = origin
    ? buildHostedBrowseUrl(origin, tenant.slug)
    : `/${tenant.slug}`;

  const qrAutoOpenUrl = origin
    ? buildHostedConversationQrUrl(origin, tenant.slug)
    : `/${tenant.slug}?source=qr&openChat=1`;

  const existingWebsiteQrUrl = buildExistingWebsiteConversationQrUrl(
    tenant.websiteUrl
  );

  const tenantHasWebsite = hasWebsiteUrl(tenant.websiteUrl);

  async function saveAiChatSettings() {
    try {
      setIsSaving(true);
      setToast(null);

      const response = await fetch(`/api/admin/tenants/${tenant.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingType: form.bookingType,
          nextStepMessage: form.nextStepMessage,
          greetingMessage: form.greetingMessage,
          askForTimeline: form.askForTimeline,
          askForEmailAfterPhone: form.askForEmailAfterPhone,
          askForImagesAfterCapture: form.askForImagesAfterCapture,
          requirePhoneForLead: form.requirePhoneForLead,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save AI & Chat settings.");
      }

      setToast({
        message: "AI & Chat settings saved.",
        variant: "success",
      });
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to save AI & Chat settings.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {toast ? (
        <ToastMessage
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}

      <div className="space-y-6">
        <section className="rounded-2xl border border-stone-200/50 bg-white/90 p-4 shadow-[0_8px_24px_rgba(17,24,39,0.045)]">
          <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">
                AI Receptionist Settings
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Control how the intake chat behaves, what information it asks
                for, and how it explains the next step.
              </p>
            </div>

            <button
              type="button"
              onClick={saveAiChatSettings}
              disabled={isSaving}
              className="saas-button-accent px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save AI & Chat Settings"}
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Booking Flow
                </span>

                <select
                  value={form.bookingType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      bookingType: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="consultation">Consultation / estimate</option>
                  <option value="phone_call">Phone call follow-up</option>
                  <option value="estimate">Quote / estimate request</option>
                  <option value="lead_capture">Lead capture only</option>
                  <option value="product_signup">Product signup</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Greeting Message
                </span>

                <input
                  value={form.greetingMessage}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      greetingMessage: e.target.value,
                    }))
                  }
                  className="saas-input w-full px-3 py-2 text-sm"
                  placeholder="Greeting shown at the start of chat"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">
                AI Next Step Message
              </span>

              <textarea
                value={form.nextStepMessage}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nextStepMessage: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Example: Thanks! I have enough information for now. If you have additional questions, I'm here to help."
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />

              <span className="block text-xs text-gray-500">
                This tells the AI what happens after a lead is captured. Examples include scheduling, manual follow-up, or account signup.
              </span>
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                {
                  key: "askForTimeline",
                  label: "Ask for timeline",
                },
                {
                  key: "askForEmailAfterPhone",
                  label: "Ask for email after phone",
                },
                {
                  key: "askForImagesAfterCapture",
                  label: "Ask for images after capture",
                },
                {
                  key: "requirePhoneForLead",
                  label: "Require phone for lead",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form[item.key as keyof typeof form])}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full rounded-2xl border border-stone-200/50 bg-white/90 p-4 shadow-[0_8px_24px_rgba(17,24,39,0.045)]">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-950">
              Lead Capture Links
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Copy customer entry links for QR codes, hosted pages, and existing websites.
            </p>
          </div>

          <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 lg:grid-cols-3">
            <CopyableLinkRow
              label="Hosted Contactor Page"
              description="Use this link for a simple AI-first landing page."
              value={hostedPageUrl}
              fileName={`${tenant.slug}-page-qr.png`}
            />

            <CopyableLinkRow
              label="QR Auto-Open Link"
              description="Use this for truck decals, flyers, yard signs, business cards, and other QR codes."
              value={qrAutoOpenUrl}
              fileName={`${tenant.slug}-qr-chat.png`}
            />

            {tenantHasWebsite ? (
              <CopyableLinkRow
                label="Existing Website QR Link"
                description="Use this if the business already has a website and wants QR scans to open that site with the chat widget."
                value={existingWebsiteQrUrl}
                fileName={`${tenant.slug}-site-chat.png`}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">
                  Existing Website QR
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Add a Website URL under Business Identity to generate a QR code
                  that opens the tenant’s existing site with Contactor chat.
                </p>

                <div className="mt-4 rounded-xl border border-stone-200 bg-gray-50 px-3 py-2">
                  <p className="truncate text-xs text-gray-400">
                    No existing website URL added yet.
                  </p>
                </div>
              </div>
            )}

            <div className="lg:col-span-3">
              <WidgetEmbedSnippetCard
                origin={origin || "http://localhost:3000"}
                tenantSlug={tenant.slug}
                copyButtonLabel="Copy Snippet"
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}