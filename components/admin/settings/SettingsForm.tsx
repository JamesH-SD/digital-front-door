"use client";

import { useState } from "react";
import type { Tenant } from "@/lib/types/tenant";

type SettingsFormProps = {
  tenant: Tenant;
};

function parseLinesToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SettingsForm({ tenant }: SettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [form, setForm] = useState({
    businessName: tenant.businessName || "",
    primaryPhone: tenant.primaryPhone || "",
    email: tenant.email || "",
    websiteUrl: tenant.websiteUrl || "",
    primaryCategory: tenant.primaryCategory || "",

    isServiceAreaBusiness: tenant.isServiceAreaBusiness ?? true,
    addressLine1: tenant.addressLine1 || "",
    city: tenant.city || "",
    state: tenant.state || "",
    zip: tenant.zip || "",
    serviceAreaSummary: tenant.serviceAreaSummary || "",
    serviceCities: (tenant.serviceCities || []).join("\n"),
    outOfAreaMessage: tenant.outOfAreaMessage || "",

    tagline: tenant.tagline || "",
    aboutUs: tenant.aboutUs || "",
    licenseNumber: tenant.licenseNumber || "",

    servicesOffered: (tenant.servicesOffered || []).join("\n"),

    greetingMessage: tenant.greetingMessage || "",
    askForTimeline: tenant.askForTimeline ?? true,
    askForEmailAfterPhone: tenant.askForEmailAfterPhone ?? true,
    askForImagesAfterCapture: tenant.askForImagesAfterCapture ?? true,
    requirePhoneForLead: tenant.requirePhoneForLead ?? true,
  });

  async function handleSave() {
    try {
      setIsSaving(true);
      setSaveMessage("");

      const response = await fetch(`/api/admin/tenants/${tenant.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          serviceCities: parseLinesToArray(form.serviceCities),
          servicesOffered: parseLinesToArray(form.servicesOffered),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings");
      }

      setSaveMessage("Settings saved.");
    } catch (error) {
      console.error(error);
      setSaveMessage(
        error instanceof Error ? error.message : "Failed to save settings."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-gray-50/60 p-4">
        <h3 className="text-base font-semibold text-gray-900">
          Business Identity
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Core business details used by your website, chat flow, and future
          Google profile workflow.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Business Name
            </label>
            <input
              value={form.businessName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, businessName: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              placeholder="Business name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Primary Phone
            </label>
            <input
              value={form.primaryPhone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, primaryPhone: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              placeholder="Primary business phone"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              placeholder="Business email"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Website URL
            </label>
            <input
              value={form.websiteUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, websiteUrl: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Primary Category
            </label>
            <input
              value={form.primaryCategory}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, primaryCategory: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              placeholder="Roofing Contractor, General Contractor, etc."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              License Number
            </label>
            <input
              value={form.licenseNumber}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, licenseNumber: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              placeholder="License number"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Tagline</label>
            <input
              value={form.tagline}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tagline: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              placeholder="Short business tagline"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">About Us</label>
            <textarea
              value={form.aboutUs}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, aboutUs: e.target.value }))
              }
              rows={4}
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              placeholder="Business description"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-gray-50/60 p-4">
        <h3 className="text-base font-semibold text-gray-900">
          Location & Service Area
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          These fields support your public site, chat routing, and future Google
          Business Profile setup.
        </p>

        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isServiceAreaBusiness}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  isServiceAreaBusiness: e.target.checked,
                }))
              }
            />
            Service area business
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Address Line 1
              </label>
              <input
                value={form.addressLine1}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, addressLine1: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">City</label>
              <input
                value={form.city}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, city: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                placeholder="City"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">State</label>
              <input
                value={form.state}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, state: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                placeholder="State"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">ZIP</label>
              <input
                value={form.zip}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, zip: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                placeholder="ZIP code"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Service Area Summary
              </label>
              <input
                value={form.serviceAreaSummary}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    serviceAreaSummary: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                placeholder="Serving San Diego County"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Service Cities
              </label>
              <textarea
                value={form.serviceCities}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    serviceCities: e.target.value,
                  }))
                }
                rows={5}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                placeholder="One city per line"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Out of Area Message
              </label>
              <textarea
                value={form.outOfAreaMessage}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    outOfAreaMessage: e.target.value,
                  }))
                }
                rows={3}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                placeholder="Message to use when a request is outside the normal service area"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-gray-50/60 p-4">
        <h3 className="text-base font-semibold text-gray-900">Services</h3>
        <p className="mt-1 text-sm text-gray-600">
          List the services your business offers. Use one service per line.
        </p>

        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700">
            Services Offered
          </label>
          <textarea
            value={form.servicesOffered}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                servicesOffered: e.target.value,
              }))
            }
            rows={6}
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
            placeholder="One service per line"
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-gray-50/60 p-4">
        <h3 className="text-base font-semibold text-gray-900">Chat Settings</h3>
        <p className="mt-1 text-sm text-gray-600">
          Control how the intake chat behaves for this business.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Greeting Message
            </label>
            <textarea
              value={form.greetingMessage}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  greetingMessage: e.target.value,
                }))
              }
              rows={3}
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
              placeholder="Greeting shown at the start of chat"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.askForTimeline}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    askForTimeline: e.target.checked,
                  }))
                }
              />
              Ask for timeline
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.askForEmailAfterPhone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    askForEmailAfterPhone: e.target.checked,
                  }))
                }
              />
              Ask for email after phone
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.askForImagesAfterCapture}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    askForImagesAfterCapture: e.target.checked,
                  }))
                }
              />
              Ask for images after capture
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.requirePhoneForLead}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    requirePhoneForLead: e.target.checked,
                  }))
                }
              />
              Require phone for lead
            </label>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>

        {saveMessage ? (
          <p className="text-sm text-gray-600">{saveMessage}</p>
        ) : null}
      </div>
    </div>
  );
}